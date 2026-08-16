from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from datetime import date
import io
import time
import pandas as pd
from typing import List, Optional

from backend.app.core.database import get_db
from backend.app.api.auth import get_current_user
from backend.app.models.models import User, BankUpload, Transaction, UserCategoryCorrection
from backend.app.schemas.schemas import TransactionResponse, BankUploadResponse, TransactionUpdateCategory
from backend.app.services.preprocessing import process_transaction_row, parse_date
from backend.app.services.classifier import classifier

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
    transaction_type: Optional[str] = None,
    merchant: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve transactions for the authenticated user, with optional filters."""
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    if category:
        query = query.filter(Transaction.category == category)
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type.upper())
    if merchant:
        query = query.filter(Transaction.merchant.ilike(f"%{merchant}%"))
        
    return query.order_by(Transaction.transaction_date.desc(), Transaction.id.desc()).offset(offset).limit(limit).all()

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get details of a specific transaction."""
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id, 
        Transaction.user_id == current_user.id
    ).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    return transaction

@router.patch("/{transaction_id}/category", response_model=TransactionResponse)
def update_transaction_category(
    transaction_id: int,
    category_update: TransactionUpdateCategory,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allow user to manually correct a transaction category, logging feedback for model retraining."""
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id, 
        Transaction.user_id == current_user.id
    ).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
        
    old_category = transaction.category
    new_category = category_update.category
    
    # Update transaction
    transaction.category = new_category
    transaction.classification_method = "manual"
    
    # Store user category correction for retraining feedback
    correction = UserCategoryCorrection(
        user_id=current_user.id,
        transaction_id=transaction.id,
        raw_description=transaction.raw_description,
        original_category=old_category,
        corrected_category=new_category
    )
    db.add(correction)
    db.commit()
    db.refresh(transaction)
    return transaction

@router.post("/upload", response_model=BankUploadResponse)
def upload_bank_statement(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ingest, parse, preprocess, and classify a CSV bank statement.
    Deduplicates entries and saves processing analytics.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only CSV statements are supported."
        )
        
    start_time = time.time()
    
    # Read file content
    contents = file.file.read()
    file_size = len(contents)
    
    # Try parsing CSV
    try:
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read CSV file: {str(e)}"
        )
        
    total_rows = len(df)
    if total_rows == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded statement is empty."
        )
        
    # Standardize column names (case-insensitive fuzzy matching)
    columns_map = {}
    cols = [str(c).strip().lower() for c in df.columns]
    
    date_patterns = ["date", "transaction date", "value date", "txn date"]
    desc_patterns = ["description", "narration", "transaction details", "particulars", "remarks"]
    debit_patterns = ["debit", "withdrawal", "dr", "withdrawal (dr)"]
    credit_patterns = ["credit", "deposit", "cr", "deposit (cr)"]
    amount_patterns = ["amount", "txn amount", "value", "transaction amount"]
    balance_patterns = ["balance", "running balance", "bal"]
    
    for df_col in df.columns:
        col_clean = str(df_col).strip().lower()
        if any(p in col_clean for p in date_patterns):
            columns_map["date"] = df_col
        elif any(p in col_clean for p in desc_patterns):
            columns_map["description"] = df_col
        elif any(p in col_clean for p in debit_patterns):
            columns_map["debit"] = df_col
        elif any(p in col_clean for p in credit_patterns):
            columns_map["credit"] = df_col
        elif any(p in col_clean for p in amount_patterns):
            columns_map["amount"] = df_col
        elif any(p in col_clean for p in balance_patterns):
            columns_map["balance"] = df_col
            
    # Verify we have at least Date and Description, and some money field
    if "date" not in columns_map or "description" not in columns_map:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not detect required columns (Date, Description) in statement. Ensure headers match common names."
        )
        
    if "amount" not in columns_map and "debit" not in columns_map and "credit" not in columns_map:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not detect any transaction value columns (Amount, Debit, Credit) in statement."
        )
        
    # Write the BankUpload record
    db_upload = BankUpload(
        user_id=current_user.id,
        filename=file.filename,
        file_size=file_size,
    )
    db.add(db_upload)
    db.commit()
    db.refresh(db_upload)
    
    valid_rows = 0
    duplicate_rows = 0
    rejected_rows = 0
    
    for _, row in df.iterrows():
        # Get raw values
        raw_row = {}
        for std_col, df_col in columns_map.items():
            raw_row[std_col] = row[df_col]
            
        try:
            # 1. Preprocess row
            processed = process_transaction_row(raw_row)
            
            # Skip rows where amount is 0 or negative
            if processed["amount"] <= 0:
                rejected_rows += 1
                continue
                
            # 2. Check for duplicates in DB for this user
            duplicate_exists = db.query(Transaction).filter(
                Transaction.user_id == current_user.id,
                Transaction.transaction_date == processed["transaction_date"],
                Transaction.amount == processed["amount"],
                Transaction.raw_description == processed["raw_description"],
                Transaction.transaction_type == processed["transaction_type"]
            ).first()
            
            if duplicate_exists:
                duplicate_rows += 1
                continue
                
            # 3. Classify transaction category using hybrid classifier
            category, confidence, method, version = classifier.classify(
                raw_desc=processed["raw_description"],
                clean_desc=processed["clean_description"],
                amount=processed["amount"],
                merchant=processed["merchant"]
            )
            
            # 4. Insert transaction
            db_transaction = Transaction(
                user_id=current_user.id,
                upload_id=db_upload.id,
                transaction_date=processed["transaction_date"],
                raw_description=processed["raw_description"],
                clean_description=processed["clean_description"],
                amount=processed["amount"],
                balance=processed["balance"],
                transaction_type=processed["transaction_type"],
                category=category,
                confidence=confidence,
                classification_method=method,
                model_version=version,
                weekend_indicator=processed["weekend_indicator"],
                merchant=processed["merchant"]
            )
            db.add(db_transaction)
            valid_rows += 1
            
        except Exception as e:
            # Row parsing error
            rejected_rows += 1
            continue
            
    db.commit()
    
    processing_time = int((time.time() - start_time) * 1000) # In ms
    
    # Update upload summary
    db_upload.total_rows = total_rows
    db_upload.valid_rows = valid_rows
    db_upload.duplicate_rows = duplicate_rows
    db_upload.rejected_rows = rejected_rows
    db_upload.processing_time_ms = processing_time
    db.commit()
    db.refresh(db_upload)
    
    return db_upload

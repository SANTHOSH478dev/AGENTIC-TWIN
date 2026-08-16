import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List

from backend.app.models.models import Transaction, RecurringPayment
from backend.app.schemas.schemas import RecurringPaymentResponse

def detect_recurring_payments(user_id: int, db: Session) -> List[RecurringPayment]:
    """
    Analyzes merchant descriptions, amounts, and dates to identify recurring subscription patterns.
    Populates and updates the recurring_payments table.
    """
    # Fetch all debits for user
    txns = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "DEBIT",
        Transaction.merchant.isnot(None)
    ).order_by(Transaction.transaction_date.asc()).all()
    
    if len(txns) < 5:
        return []
        
    df = pd.DataFrame([
        {
            "id": t.id,
            "merchant": t.merchant,
            "amount": t.amount,
            "date": pd.to_datetime(t.transaction_date)
        }
        for t in txns
    ])
    
    detected = []
    
    # Group by merchant
    for merchant, group in df.groupby("merchant"):
        # We need at least 3 occurrences to establish a recurring monthly interval
        if len(group) < 3:
            continue
            
        # Calculate intervals between dates
        dates = group["date"].sort_values().values
        intervals = np.diff(dates) / np.timedelta64(1, 'D') # in days
        
        avg_interval = np.mean(intervals)
        std_interval = np.std(intervals)
        
        avg_amount = group["amount"].mean()
        std_amount = group["amount"].std()
        
        # Criteria:
        # 1. Average interval should be close to 30 days (e.g., 25-35 days for monthly subscriptions/rent)
        # 2. Standard deviation of interval should be low (e.g. < 6 days, meaning date is consistent)
        # 3. Amount volatility should be low (e.g. std dev < 15% of average, or it is a flat rate)
        is_monthly = (25.0 <= avg_interval <= 35.0) and (std_interval <= 6.0)
        is_stable_amount = (std_amount / avg_amount < 0.15) if avg_amount > 0 else False
        
        if is_monthly and is_stable_amount:
            # Estimate next expected date
            last_date = pd.to_datetime(dates[-1])
            next_date = (last_date + timedelta(days=int(round(avg_interval)))).date()
            
            # Confidence score calculation
            confidence = min(1.0, max(0.5, 1.0 - (std_interval / 30.0) - (std_amount / avg_amount)))
            
            # Check if this merchant is already in recurring table
            existing = db.query(RecurringPayment).filter(
                RecurringPayment.user_id == user_id,
                RecurringPayment.merchant == merchant
            ).first()
            
            if existing:
                existing.average_amount = float(avg_amount)
                existing.frequency_days = int(round(avg_interval))
                existing.next_expected_date = next_date
                existing.confidence = float(confidence)
                db.commit()
                detected.append(existing)
            else:
                db_recurring = RecurringPayment(
                    user_id=user_id,
                    merchant=merchant,
                    average_amount=float(avg_amount),
                    frequency_days=int(round(avg_interval)),
                    next_expected_date=next_date,
                    confidence=float(confidence),
                    is_active=True
                )
                db.add(db_recurring)
                db.commit()
                db.refresh(db_recurring)
                detected.append(db_recurring)
                
            # Update transaction records to reflect they are recurring
            txn_ids = group["id"].tolist()
            db.query(Transaction).filter(Transaction.id.in_(txn_ids)).update({"is_recurring": True}, synchronize_session=False)
            db.commit()
            
    return db.query(RecurringPayment).filter(
        RecurringPayment.user_id == user_id,
        RecurringPayment.is_active == True
    ).all()

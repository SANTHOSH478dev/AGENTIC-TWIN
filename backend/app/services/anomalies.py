import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from backend.app.models.models import Transaction, AnomalyResult
from backend.app.schemas.schemas import AnomalyResponse

def detect_and_log_anomalies(user_id: int, db: Session) -> List[AnomalyResult]:
    """
    Perform anomaly detection using category-level statistical Interquartile Range (IQR) limits.
    Populates the anomaly_results table with flagged outliers.
    """
    # Fetch all debit transactions for user
    txns = db.query(Transaction).filter(
        Transaction.user_id == user_id, 
        Transaction.transaction_type == "DEBIT"
    ).all()
    
    if len(txns) < 5:
        # Not enough data to compute quantiles/IQR
        return []
        
    df = pd.DataFrame([
        {
            "id": t.id,
            "category": t.category,
            "amount": t.amount,
            "merchant": t.merchant or "Unknown",
            "date": t.transaction_date
        }
        for t in txns
    ])
    
    anomalous_ids = []
    anomaly_reasons = {}
    anomaly_scores = {}
    
    # Analyze outliers per category
    for cat, group in df.groupby("category"):
        if len(group) < 3:
            continue
            
        amounts = group["amount"].values
        q1 = np.percentile(amounts, 25)
        q3 = np.percentile(amounts, 75)
        iqr = q3 - q1
        
        # Define outlier threshold: Q3 + 2.0 * IQR (slightly sensitive for alerts)
        upper_limit = q3 + (2.0 * iqr)
        
        # Check Z-score as a secondary comparison
        mean = np.mean(amounts)
        std = np.std(amounts) or 1.0
        
        for _, row in group.iterrows():
            # If transaction exceeds upper IQR limit or has a Z-score > 2.5
            z_score = (row["amount"] - mean) / std
            
            if row["amount"] > upper_limit or z_score > 2.5:
                txn_id = int(row["id"])
                anomalous_ids.append(txn_id)
                
                # Deviation factor
                ratio = row["amount"] / mean if mean > 0 else 1.0
                anomaly_reasons[txn_id] = (
                    f"₹{row['amount']:.2f} spent at {row['merchant']} is unusual because "
                    f"it is approximately {ratio:.1f}x higher than your typical {cat} spending."
                )
                anomaly_scores[txn_id] = float(z_score)
                
    # Persist detected anomalies to the DB if they don't already exist
    results = []
    for txn_id in anomalous_ids:
        # Check if already logged
        existing = db.query(AnomalyResult).filter(AnomalyResult.transaction_id == txn_id).first()
        if not existing:
            db_anomaly = AnomalyResult(
                user_id=user_id,
                transaction_id=txn_id,
                anomaly_score=anomaly_scores[txn_id],
                reason=anomaly_reasons[txn_id]
            )
            db.add(db_anomaly)
            db.commit()
            db.refresh(db_anomaly)
            results.append(db_anomaly)
        else:
            results.append(existing)
            
    # Return all anomalies for user sorted by score (highest deviation first)
    return db.query(AnomalyResult).join(Transaction).filter(
        AnomalyResult.user_id == user_id
    ).order_by(AnomalyResult.anomaly_score.desc()).all()

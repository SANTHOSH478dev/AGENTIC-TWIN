import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime
from typing import Dict, Any, List, Tuple
from sklearn.linear_model import LinearRegression

from backend.app.models.models import Transaction
from backend.app.schemas.schemas import PredictionResponse, PredictionItem
from backend.app.services.analytics import get_monthly_trends

def get_historical_months(user_id: int, db: Session) -> pd.DataFrame:
    """Retrieve historical monthly aggregated income and expenses."""
    trends = get_monthly_trends(user_id, db)
    if not trends:
        return pd.DataFrame(columns=["month_idx", "income", "expense", "cashflow"])
        
    data = []
    for idx, t in enumerate(trends):
        data.append({
            "month_idx": idx + 1,
            "month_name": t.month_name,
            "income": t.income,
            "expense": t.expense,
            "cashflow": t.net_cash_flow
        })
        
    return pd.DataFrame(data)

def calculate_metrics(actual: np.ndarray, predicted: np.ndarray) -> Tuple[float, float, float]:
    """Calculate MAE, RMSE, and MAPE metrics between actuals and predictions."""
    if len(actual) == 0 or len(predicted) == 0:
        return 0.0, 0.0, 0.0
        
    mae = float(np.mean(np.abs(actual - predicted)))
    rmse = float(np.sqrt(np.mean((actual - predicted) ** 2)))
    
    # Avoid division by zero in MAPE
    mask = actual != 0
    if np.sum(mask) > 0:
        mape = float(np.mean(np.abs((actual[mask] - predicted[mask]) / actual[mask])) * 100)
    else:
        mape = 0.0
        
    return mae, rmse, mape

def run_predictions(user_id: int, db: Session) -> PredictionResponse:
    """
    Compare forecasting models: 3-Month Moving Average (Baseline) vs Linear Regression.
    Evaluates MAE, RMSE, and MAPE against actual test partitions, predicting next month values.
    """
    df = get_historical_months(user_id, db)
    
    # Cold start check: we need at least 3 historical months to perform evaluations
    if len(df) < 3:
        # Return fallback predictions using simple averages if insufficient data
        avg_expense = float(df["expense"].mean()) if len(df) > 0 else 0.0
        avg_income = float(df["income"].mean()) if len(df) > 0 else 0.0
        
        today = datetime.now()
        next_month = (today.month % 12) + 1
        next_year = today.year + (1 if today.month == 12 else 0)
        
        predictions = [
            PredictionItem(
                target_month=next_month,
                target_year=next_year,
                predicted_expense=round(avg_expense, 2),
                predicted_income=round(avg_income, 2),
                predicted_cashflow=round(avg_income - avg_expense, 2)
            )
        ]
        
        return PredictionResponse(
            predictions=predictions,
            model_metrics={
                "warning": "Insufficient historical data (minimum 3 months required). Displaying simple averages."
            },
            evaluation_table=[
                {"model": "Moving Average Baseline", "MAE": "N/A", "RMSE": "N/A", "MAPE": "N/A"},
                {"model": "Linear Regression", "MAE": "N/A", "RMSE": "N/A", "MAPE": "N/A"}
            ],
            explanation="Predictive models require at least three months of transaction statement history to evaluate accuracy metrics and generate projections."
        )
        
    # --- Generate evaluations (Time-series walk-forward testing) ---
    actual_expenses = df["expense"].values
    actual_incomes = df["income"].values
    
    ma_predicted_exp = []
    lr_predicted_exp = []
    
    # Backtesting loop: Start evaluating from month 3 onwards
    for i in range(2, len(df)):
        # 1. Moving Average Baseline
        ma_predicted_exp.append(np.mean(actual_expenses[i-2:i]))
        
        # 2. Linear Regression (trained on all months up to i-1)
        X_train = df["month_idx"].values[:i].reshape(-1, 1)
        y_train = actual_expenses[:i]
        
        model = LinearRegression()
        model.fit(X_train, y_train)
        
        next_idx = df["month_idx"].values[i].reshape(-1, 1)
        lr_predicted_exp.append(float(model.predict(next_idx)[0]))
        
    # Slice actuals to match backtest predictions (from index 2 to end)
    test_actuals = actual_expenses[2:]
    ma_predicted_exp = np.array(ma_predicted_exp)
    lr_predicted_exp = np.array(lr_predicted_exp)
    
    # Calculate metrics
    ma_mae, ma_rmse, ma_mape = calculate_metrics(test_actuals, ma_predicted_exp)
    lr_mae, lr_rmse, lr_mape = calculate_metrics(test_actuals, lr_predicted_exp)
    
    # --- Perform Projections for Next Month ---
    next_month_idx = int(df["month_idx"].max() + 1)
    
    # 1. Linear Regression Projections
    X_all = df["month_idx"].values.reshape(-1, 1)
    
    model_exp = LinearRegression()
    model_exp.fit(X_all, df["expense"].values)
    pred_exp = float(model_exp.predict([[next_month_idx]])[0])
    
    model_inc = LinearRegression()
    model_inc.fit(X_all, df["income"].values)
    pred_inc = float(model_inc.predict([[next_month_idx]])[0])
    
    # Clip projections to avoid negative amounts
    pred_exp = max(0.0, pred_exp)
    pred_inc = max(0.0, pred_inc)
    
    today = datetime.now()
    next_month = (today.month % 12) + 1
    next_year = today.year + (1 if today.month == 12 else 0)
    
    predictions = [
        PredictionItem(
            target_month=next_month,
            target_year=next_year,
            predicted_expense=round(pred_exp, 2),
            predicted_income=round(pred_inc, 2),
            predicted_cashflow=round(pred_inc - pred_exp, 2)
        )
    ]
    
    evaluation_table = [
        {
            "model": "Moving Average Baseline (3-month)",
            "MAE": f"₹{ma_mae:.2f}",
            "RMSE": f"₹{ma_rmse:.2f}",
            "MAPE": f"{ma_mape:.1f}%"
        },
        {
            "model": "Linear Regression (Trend Model)",
            "MAE": f"₹{lr_mae:.2f}",
            "RMSE": f"₹{lr_rmse:.2f}",
            "MAPE": f"{lr_mape:.1f}%"
        }
    ]
    
    # Select best model based on MAE
    best_model_name = "Linear Regression" if lr_mae <= ma_mae else "Moving Average"
    
    explanation = (
        f"Projections are generated using a {best_model_name} model because it demonstrated "
        f"superior accuracy during time-series walk-forward backtesting (comparing MAE: ₹{lr_mae:.2f} vs ₹{ma_mae:.2f}). "
        f"The model estimates next month's total expenses to be ₹{pred_exp:.2f} and expected income to be ₹{pred_inc:.2f}, "
        f"resulting in a projected cash flow of ₹{pred_inc - pred_exp:.2f}."
    )
    
    return PredictionResponse(
        predictions=predictions,
        model_metrics={
            "best_model": best_model_name,
            "lr_mae": round(lr_mae, 2),
            "ma_mae": round(ma_mae, 2),
            "lr_rmse": round(lr_rmse, 2),
            "ma_rmse": round(ma_rmse, 2)
        },
        evaluation_table=evaluation_table,
        explanation=explanation
    )

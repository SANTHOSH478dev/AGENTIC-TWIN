from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
import pandas as pd
from typing import Dict, Any, List
from backend.app.models.models import Transaction, Budget, User
from backend.app.schemas.schemas import DashboardSummaryResponse, CategorySpending, MerchantSpending, MonthlyTrend, HealthScoreResponse, FactorScore

def calculate_current_balance(user_id: int, db: Session) -> float:
    """Calculate the net balance of all transaction credits and debits."""
    # Find last balance in database or compute sum
    last_txn = db.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.transaction_date.desc(), Transaction.id.desc()).first()
    if last_txn and last_txn.balance is not None:
        return last_txn.balance
        
    credits = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == user_id, Transaction.transaction_type == "CREDIT").scalar() or 0.0
    debits = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == user_id, Transaction.transaction_type == "DEBIT").scalar() or 0.0
    return credits - debits

def get_dashboard_summary(user_id: int, db: Session) -> DashboardSummaryResponse:
    """Calculate and compile overall dashboard summary metrics."""
    # Calculate Income and Expenses
    total_income = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == user_id, Transaction.transaction_type == "CREDIT").scalar() or 0.0
    total_expenses = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == user_id, Transaction.transaction_type == "DEBIT").scalar() or 0.0
    
    net_cash_flow = total_income - total_expenses
    savings_rate = (net_cash_flow / total_income * 100) if total_income > 0 else 0.0
    if savings_rate < 0:
        savings_rate = 0.0
        
    # Get active date range for average daily spend
    date_range = db.query(func.min(Transaction.transaction_date), func.max(Transaction.transaction_date)).filter(Transaction.user_id == user_id).first()
    days = 30
    if date_range[0] and date_range[1]:
        delta = date_range[1] - date_range[0]
        days = max(1, delta.days)
        
    avg_daily = total_expenses / days if days > 0 else 0.0
    
    # Highest spending category
    highest_cat_query = db.query(
        Transaction.category, func.sum(Transaction.amount).label("total")
    ).filter(
        Transaction.user_id == user_id, Transaction.transaction_type == "DEBIT"
    ).group_by(
        Transaction.category
    ).order_by(
        func.sum(Transaction.amount).desc()
    ).first()
    
    highest_category = highest_cat_query[0] if highest_cat_query else "None"
    
    # Predict next month expense (simple 3-month moving average baseline if no predictive runs exist)
    predicted_expense = total_expenses / (days / 30.0) if days > 0 else 0.0
    
    # Get financial health score
    health = calculate_health_score(user_id, db)
    
    balance = calculate_current_balance(user_id, db)
    
    return DashboardSummaryResponse(
        current_balance=balance,
        total_income=total_income,
        total_expenses=total_expenses,
        net_cash_flow=net_cash_flow,
        savings_rate=round(savings_rate, 2),
        avg_daily_spending=round(avg_daily, 2),
        highest_spending_category=highest_category,
        predicted_next_month_expense=round(predicted_expense, 2),
        health_score=health.overall_score
    )

def get_category_spending(user_id: int, db: Session, start_date: date = None, end_date: date = None) -> List[CategorySpending]:
    """Calculate spending and percentage share grouped by transaction category."""
    query = db.query(
        Transaction.category, func.sum(Transaction.amount).label("total")
    ).filter(
        Transaction.user_id == user_id, Transaction.transaction_type == "DEBIT"
    )
    
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
        
    results = query.group_by(Transaction.category).order_by(func.sum(Transaction.amount).desc()).all()
    
    total_debits = sum(r[1] for r in results) or 1.0
    
    return [
        CategorySpending(
            category=r[0],
            amount=round(r[1], 2),
            percentage=round((r[1] / total_debits) * 100, 2)
        )
        for r in results
    ]

def get_top_merchants(user_id: int, db: Session, limit: int = 10) -> List[MerchantSpending]:
    """Identify the top merchants by spending volume."""
    results = db.query(
        Transaction.merchant, func.sum(Transaction.amount).label("total"), func.count(Transaction.id).label("count")
    ).filter(
        Transaction.user_id == user_id, Transaction.transaction_type == "DEBIT", Transaction.merchant.isnot(None)
    ).group_by(
        Transaction.merchant
    ).order_by(
        func.sum(Transaction.amount).desc()
    ).limit(limit).all()
    
    return [
        MerchantSpending(
            merchant=r[0],
            amount=round(r[1], 2),
            count=r[2]
        )
        for r in results
    ]

def get_monthly_trends(user_id: int, db: Session) -> List[MonthlyTrend]:
    """Aggregate income and expenses grouped by month-year."""
    # SQLAlchemy extracts month and year
    # Support SQLite and PostgreSQL date conversion
    db_type = db.bind.dialect.name
    
    if db_type == "sqlite":
        month_expr = func.strftime("%m", Transaction.transaction_date)
        year_expr = func.strftime("%Y", Transaction.transaction_date)
    else:
        month_expr = func.to_char(Transaction.transaction_date, "MM")
        year_expr = func.to_char(Transaction.transaction_date, "YYYY")
        
    credits_query = db.query(
        year_expr.label("year"), month_expr.label("month"), func.sum(Transaction.amount).label("total")
    ).filter(
        Transaction.user_id == user_id, Transaction.transaction_type == "CREDIT"
    ).group_by("year", "month").all()
    
    debits_query = db.query(
        year_expr.label("year"), month_expr.label("month"), func.sum(Transaction.amount).label("total")
    ).filter(
        Transaction.user_id == user_id, Transaction.transaction_type == "DEBIT"
    ).group_by("year", "month").all()
    
    trends_map = {}
    
    month_names = {
        "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun",
        "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"
    }
    
    for r in credits_query:
        key = f"{r[0]}-{r[1]}"
        month_name = f"{month_names.get(r[1], r[1])} {r[0]}"
        trends_map[key] = {"month_name": month_name, "income": float(r[2]), "expense": 0.0}
        
    for r in debits_query:
        key = f"{r[0]}-{r[1]}"
        month_name = f"{month_names.get(r[1], r[1])} {r[0]}"
        if key in trends_map:
            trends_map[key]["expense"] = float(r[2])
        else:
            trends_map[key] = {"month_name": month_name, "income": 0.0, "expense": float(r[2])}
            
    # Sort chronologically
    sorted_keys = sorted(trends_map.keys())
    
    return [
        MonthlyTrend(
            month_name=trends_map[k]["month_name"],
            income=round(trends_map[k]["income"], 2),
            expense=round(trends_map[k]["expense"], 2),
            net_cash_flow=round(trends_map[k]["income"] - trends_map[k]["expense"], 2)
        )
        for k in sorted_keys
    ]

def calculate_health_score(user_id: int, db: Session) -> HealthScoreResponse:
    """
    Formulates a transparent financial health score from 0 to 100 based on five key dimensions:
    1. Savings Behaviour (30%)
    2. Expense-to-Income Ratio (25%)
    3. Budget Adherence (20%)
    4. Cash Flow Stability (15%)
    5. Spending Volatility (10%)
    """
    total_income = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == user_id, Transaction.transaction_type == "CREDIT").scalar() or 0.0
    total_expenses = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == user_id, Transaction.transaction_type == "DEBIT").scalar() or 0.0
    
    # 1. Savings Behaviour (Savings Rate target: 20%)
    savings_rate = ((total_income - total_expenses) / total_income * 100) if total_income > 0 else 0.0
    savings_score = min(100.0, max(0.0, (savings_rate / 20.0) * 100.0))
    savings_eval = f"Savings rate is {savings_rate:.1f}% (target: 20%)"
    
    # 2. Expense-to-Income Ratio (Target: < 70%)
    exp_inc_ratio = (total_expenses / total_income * 100) if total_income > 0 else 150.0
    if exp_inc_ratio <= 50.0:
        ratio_score = 100.0
    elif exp_inc_ratio >= 100.0:
        ratio_score = 0.0
    else:
        ratio_score = (100.0 - exp_inc_ratio) / 50.0 * 100.0
    ratio_eval = f"Spending accounts for {exp_inc_ratio:.1f}% of income (ideal: < 70%)"
    
    # 3. Budget Adherence (Actual vs Budget limit)
    budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
    budget_score = 100.0
    budget_eval = "No active budgets defined."
    if budgets:
        exceeded_count = sum(1 for b in budgets if b.spent > b.amount)
        budget_score = max(0.0, 100.0 - (exceeded_count / len(budgets) * 100.0))
        budget_eval = f"{exceeded_count} out of {len(budgets)} budgets exceeded."
        
    # 4. Cash Flow Stability (Negative vs positive months)
    trends = get_monthly_trends(user_id, db)
    stability_score = 100.0
    stability_eval = "Inception month or no cash flow history."
    if len(trends) > 0:
        negative_months = sum(1 for t in trends if t.net_cash_flow < 0)
        stability_score = max(0.0, 100.0 - (negative_months / len(trends) * 100.0))
        stability_eval = f"{negative_months} out of {len(trends)} months with negative cash flow."
        
    # 5. Spending Volatility (Standard deviation of daily expenses)
    # Target: Volatility <= 30% of average daily spending
    txns = db.query(Transaction.transaction_date, func.sum(Transaction.amount).label("daily_sum")).filter(
        Transaction.user_id == user_id, Transaction.transaction_type == "DEBIT"
    ).group_by(Transaction.transaction_date).all()
    
    volatility_score = 100.0
    volatility_eval = "Insufficient transaction date history."
    if len(txns) > 2:
        df = pd.DataFrame(txns, columns=["date", "amount"])
        avg_spend = df["amount"].mean()
        std_spend = df["amount"].std()
        coef_var = (std_spend / avg_spend) if avg_spend > 0 else 0.0
        
        # Lower coefficient of variation is better. Coef of 1.0 means high volatility.
        volatility_score = max(0.0, 100.0 - (coef_var * 50.0))
        volatility_eval = f"Spending volatility coefficient: {coef_var:.2f}"
        
    # Weighted Average Score
    overall_score = (
        (savings_score * 0.30) +
        (ratio_score * 0.25) +
        (budget_score * 0.20) +
        (stability_score * 0.15) +
        (volatility_score * 0.10)
    )
    
    score = round(overall_score, 1)
    if score >= 80:
        cat = "Excellent"
    elif score >= 60:
        cat = "Good"
    elif score >= 40:
        cat = "Fair"
    else:
        cat = "Critical"
        
    # Health tips
    improvements = []
    if savings_score < 75:
        improvements.append("Increase your monthly savings by aiming to set aside at least 20% of your earnings.")
    if ratio_score < 75:
        improvements.append("Lower your monthly expense-to-income ratio below 70% by minimizing non-essential purchases.")
    if budget_score < 100:
        improvements.append("Refine and adhere to your category-specific budgets to avoid budget-exceeded overrides.")
    if stability_score < 100:
        improvements.append("Build an emergency reserve to smooth out months where expenses exceed incoming salary.")
    if volatility_score < 70:
        improvements.append("Pace your weekly expenditures to avoid sudden high-volume transactional spikes.")
        
    if not improvements:
        improvements.append("Your financial habits are excellent. Maintain your savings rates and SIP investments.")
        
    return HealthScoreResponse(
        overall_score=score,
        score_category=cat,
        factors={
            "savings": FactorScore(score=round(savings_score, 1), max_score=100.0, evaluation=savings_eval),
            "ratio": FactorScore(score=round(ratio_score, 1), max_score=100.0, evaluation=ratio_eval),
            "budgets": FactorScore(score=round(budget_score, 1), max_score=100.0, evaluation=budget_eval),
            "stability": FactorScore(score=round(stability_score, 1), max_score=100.0, evaluation=stability_eval),
            "volatility": FactorScore(score=round(volatility_score, 1), max_score=100.0, evaluation=volatility_eval)
        },
        explanation="This health score is a comprehensive personal financial wellness indicator calculated using your savings rates, spending ratios, budget compliance records, month-over-month cash flow stability, and day-to-day spending volatility. Note: This is an analytical score and does not constitute a formal banking credit score.",
        improvement_areas=improvements
    )

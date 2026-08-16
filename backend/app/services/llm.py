import os
import json
import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, Tuple, Optional, List
from sqlalchemy.orm import Session
import google.generativeai as genai

from backend.app.core.config import settings
from backend.app.services import tools
from backend.app.models.models import AIToolLog

logger = logging.getLogger(__name__)

# Predefined standard list of categories for matching
CATEGORIES = [
    "Food & Dining", "Groceries", "Transportation", "Shopping", 
    "Entertainment", "Utilities", "Rent", "Healthcare", "Education", 
    "Travel", "Subscriptions", "EMI / Loans", "Insurance", "Investment", 
    "Salary", "Business Income", "Transfer", "Cash Withdrawal", "Other"
]

def parse_date_range_from_text(text: str) -> Tuple[Optional[str], Optional[str], str]:
    """
    Parses textual references to dates (e.g. 'last month', 'this month', 'last 3 months')
    and returns (start_date_iso, end_date_iso, description_label).
    """
    text_lower = text.lower()
    today = date.today()
    
    if "last month" in text_lower:
        # Get first and last day of previous month
        first_day_this_month = today.replace(day=1)
        last_day_last_month = first_day_this_month - timedelta(days=1)
        first_day_last_month = last_day_last_month.replace(day=1)
        return first_day_last_month.isoformat(), last_day_last_month.isoformat(), "previous month"
        
    elif "this month" in text_lower:
        first_day = today.replace(day=1)
        return first_day.isoformat(), today.isoformat(), "current month"
        
    elif "last 3 months" in text_lower or "three months" in text_lower:
        first_day = (today - timedelta(days=90)).replace(day=1)
        return first_day.isoformat(), today.isoformat(), "last three months"
        
    elif "last 6 months" in text_lower or "six months" in text_lower:
        first_day = (today - timedelta(days=180)).replace(day=1)
        return first_day.isoformat(), today.isoformat(), "last six months"
        
    # Default to past 12 months for general queries
    first_day = (today - timedelta(days=365)).replace(day=1)
    return first_day.isoformat(), today.isoformat(), "past year"

def extract_category_from_text(text: str) -> Optional[str]:
    """Finds matching categories from transaction list in the query text."""
    text_lower = text.lower()
    for cat in CATEGORIES:
        if cat.lower() in text_lower:
            return cat
            
    # Fuzzy regex matches for categories
    if "food" in text_lower or "dining" in text_lower or "restaurant" in text_lower or "zomato" in text_lower or "swiggy" in text_lower:
        return "Food & Dining"
    if "grocery" in text_lower or "supermarket" in text_lower or "groceries" in text_lower:
        return "Groceries"
    if "travel" in text_lower or "transport" in text_lower or "cab" in text_lower or "uber" in text_lower or "ola" in text_lower:
        return "Transportation"
    if "shop" in text_lower or "shopping" in text_lower or "amazon" in text_lower:
        return "Shopping"
    if "utility" in text_lower or "bill" in text_lower or "recharge" in text_lower or "electricity" in text_lower:
        return "Utilities"
    if "rent" in text_lower:
        return "Rent"
    if "sub" in text_lower or "subscription" in text_lower or "netflix" in text_lower or "spotify" in text_lower:
        return "Subscriptions"
    if "loan" in text_lower or "emi" in text_lower:
        return "EMI / Loans"
    if "insurance" in text_lower or "lic" in text_lower:
        return "Insurance"
    if "invest" in text_lower or "sip" in text_lower or "mutual" in text_lower:
        return "Investment"
    if "salary" in text_lower or "paycheck" in text_lower:
        return "Salary"
        
    return None

def nlp_intent_router(message: str) -> Tuple[str, Dict[str, Any]]:
    """
    Fallback deterministic parser matching queries to backend tools and extracts parameters.
    Used offline or in the absence of a Gemini API key.
    """
    msg_clean = message.lower()
    start_date, end_date, date_label = parse_date_range_from_text(msg_clean)
    
    # 1. Unusual Transactions
    if any(w in msg_clean for w in ["unusual", "anomaly", "anomalies", "outlier", "weird", "strange"]):
        return "unusual_transactions", {}
        
    # 2. Predictions
    if any(w in msg_clean for w in ["predict", "forecast", "projection", "projections", "next month"]):
        return "expense_prediction", {}
        
    # 3. Recurring Payments
    if any(w in msg_clean for w in ["recurring", "subscription", "subscriptions", "netflix", "spotify", "monthly bill"]):
        return "recurring_payments", {}
        
    # 4. Savings rate & Financial score
    if any(w in msg_clean for w in ["savings rate", "save money", "saving score", "health score", "wellness"]):
        return "savings_rate", {}
        
    # 5. Budget Status
    if any(w in msg_clean for w in ["budget", "budgets", "spent limit", "limit", "exceeded"]):
        return "budget_status", {}
        
    # 6. Weekend spending
    if any(w in msg_clean for w in ["weekend", "weekends", "saturday", "sunday"]):
        return "weekend_spending", {"start_date": start_date, "end_date": end_date}
        
    # 7. Top Merchants
    if any(w in msg_clean for w in ["merchant", "merchants", "vendor", "shops", "where did i buy"]):
        return "top_merchants", {"limit": 5}
        
    # 8. Category spending
    category = extract_category_from_text(msg_clean)
    if category and any(w in msg_clean for w in ["spend", "spent", "spent on", "expense", "cost"]):
        return "category_spending", {"category": category, "start_date": start_date, "end_date": end_date}
        
    # 9. Income queries
    if any(w in msg_clean for w in ["income", "salary", "earned", "deposit", "credits"]):
        return "total_income", {"start_date": start_date, "end_date": end_date}
        
    # 10. General expense queries
    if any(w in msg_clean for w in ["spend", "spent", "expense", "expenses", "debits"]):
        return "total_expense", {"start_date": start_date, "end_date": end_date}
        
    # Fallback to monthly cashflow trend
    return "monthly_cashflow", {}

def format_explanation_for_tool(tool_name: str, result: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
    """
    Format database tools query results into a grounded, explainable user-friendly response.
    Returns: (MarkdownAnswerText, ResponseMetadataJSON)
    """
    explanation_body = ""
    metadata = {"tool_used": tool_name, "result_summary": result}
    
    if tool_name == "total_expense":
        total = result["total_expense"]
        label = "selected period"
        if result["start_date"] and result["end_date"]:
            label = f"period between {result['start_date']} and {result['end_date']}"
        explanation_body = (
            f"You spent a total of **₹{total:,.2f}** on expenses during the {label}. "
            f"This encompasses all debit-type transactions recorded in your uploaded bank statement."
        )
        metadata["why_insight"] = "This calculation is directly compiled from all DEBIT records within the requested date limits."
        
    elif tool_name == "total_income":
        total = result["total_income"]
        label = "selected period"
        if result["start_date"] and result["end_date"]:
            label = f"period between {result['start_date']} and {result['end_date']}"
        explanation_body = (
            f"You earned a total of **₹{total:,.2f}** in income during the {label}. "
            f"This captures your monthly salary deposits, cash inputs, and other incoming transfers."
        )
        metadata["why_insight"] = "This figure aggregates all CREDIT-type transactions found during the queried time range."
        
    elif tool_name == "category_spending":
        cat = result["category"]
        total = result["total_spent"]
        label = "selected period"
        if result["start_date"] and result["end_date"]:
            label = f"period between {result['start_date']} and {result['end_date']}"
        explanation_body = (
            f"Your total spending on **{cat}** during the {label} was **₹{total:,.2f}**. "
            f"Please review your transaction ledger to confirm individual charges in this category."
        )
        metadata["why_insight"] = f"Calculated dynamically by isolating DEBIT transactions whose category was predicted as '{cat}'."
        
    elif tool_name == "monthly_cashflow":
        trends = result["trends"]
        if not trends:
            explanation_body = "No monthly cash flow trends were found. Please upload a bank statement statement first."
        else:
            explanation_body = "Here is your month-over-month cash flow breakdown:\n\n"
            for t in trends:
                explanation_body += f"- **{t['month_name']}**: Income: ₹{t['income']:,.2f} | Expense: ₹{t['expense']:,.2f} | Net: **₹{t['net_cash_flow']:,.2f}**\n"
        metadata["why_insight"] = "Aggregates credit and debit transaction types, grouped by calendar month and year."
        
    elif tool_name == "top_merchants":
        merchants = result["merchants"]
        if not merchants:
            explanation_body = "No merchant spendings were recorded. Please upload a transaction statement."
        else:
            explanation_body = "Your top spending merchants are:\n\n"
            for m in merchants:
                explanation_body += f"1. **{m['merchant']}**: spent **₹{m['amount']:,.2f}** across {m['count']} transaction(s).\n"
        metadata["why_insight"] = "Debit transactions are parsed, merchant text is normalized, and rows are ordered by total spent amounts."
        
    elif tool_name == "recurring_payments":
        payments = result["recurring_payments"]
        if not payments:
            explanation_body = "No recurring payments or subscriptions were detected. This requires multiple months of regular transaction intervals."
        else:
            explanation_body = "I detected the following recurring billings/subscriptions in your bank statement history:\n\n"
            for p in payments:
                explanation_body += (
                    f"- **{p['merchant']}**: average amount **₹{p['average_amount']:,.2f}** recurring every {p['frequency_days']} days. "
                    f"Next billing estimated around **{p['next_expected_date']}** (Confidence: {int(p['confidence']*100)}%).\n"
                )
        metadata["why_insight"] = "Discovered by identifying transactions that recur at regular intervals (25-35 days) with minimal amount variation."
        
    elif tool_name == "unusual_transactions":
        unusual = result["unusual_transactions"]
        if not unusual:
            explanation_body = "Excellent! No unusual outliers or high-spending spikes were detected in your statement logs."
        else:
            explanation_body = "I flagged the following transactions as unusual or potential outliers:\n\n"
            for u in unusual:
                explanation_body += f"- **{u['date']}**: **₹{u['amount']:,.2f}** at **{u['merchant']}** ({u['category']}). *Reason: {u['reason']}*\n"
            explanation_body += "\n*Note: Anomaly detection is an analytical indicator and does not represent credit fraud determination.*"
        metadata["why_insight"] = "Transactions are marked if their value exceeds category statistical IQR fences (Q3 + 2.0*IQR) or has Z-score > 2.5."
        
    elif tool_name == "weekend_spending":
        wk = result["weekend_spending"]
        wd = result["weekday_spending"]
        ratio = result["weekend_ratio"]
        explanation_body = (
            f"You spent **₹{wk:,.2f}** on weekends (Saturday & Sunday) compared with **₹{wd:,.2f}** on weekdays. "
            f"Weekend spending represents **{ratio}%** of your total monthly expenditures."
        )
        metadata["why_insight"] = "Calculated by filtering debit records whose date falls on a Saturday or Sunday."
        
    elif tool_name == "budget_status":
        budgets = result["budgets"]
        if not budgets:
            explanation_body = "You have no active budgets configured. Go to the **Budgets** page to set target spending limits."
        else:
            explanation_body = "Your current monthly budgets status:\n\n"
            for b in budgets:
                explanation_body += (
                    f"- **{b['category']}**: spent **₹{b['spent']:,.2f}** / **₹{b['limit']:,.2f}** "
                    f"({b['percentage_used']}% used). Status: **{b['status']}** (Remaining: ₹{b['remaining']:,.2f})\n"
                )
        metadata["why_insight"] = "Compares actual category spending sums in the current month against your active budget configurations."
        
    elif tool_name == "expense_prediction":
        preds = result["predictions"]
        explanation_body = f"{result['explanation']}\n\n"
        explanation_body += "**Model Comparison Backtesting metrics:**\n"
        for row in result["evaluation"]:
            explanation_body += f"- **{row['model']}**: MAE: {row['MAE']} | RMSE: {row['RMSE']} | MAPE: {row['MAPE']}\n"
        metadata["why_insight"] = "Forecasting model comparison built from your past monthly cash flow aggregates using time-series walk-forward backtests."
        
    elif tool_name == "savings_rate":
        explanation_body = (
            f"Your overall Financial Health Score is **{result['financial_health_score']}/100**. "
            f"Your current savings rate score is **{result['savings_rate']}/100**. "
            f"Evaluation: *{result['income_vs_expense_evaluation']}*"
        )
        metadata["why_insight"] = "Synthesized from monthly net cash flow balances, savings percentages, and budget utilization."
        
    else:
        explanation_body = "I analyzed your transaction records but was unable to compile specific tool aggregations. Please rephrase."
        
    return explanation_body, metadata

def execute_chat_query(user_id: int, message: str, db: Session) -> Tuple[str, str, Dict[str, Any], Dict[str, Any]]:
    """
    Orchestrate AI chatbot processing loop:
    1. Parse intent & select tool (via Gemini function calling or local NLP fallback).
    2. Securely execute python tool with user context.
    3. Feed result to explanation template (local) or LLM generation layer.
    4. Log tool execution.
    Returns: (GroundedResponseString, DetectedIntent, ToolsCalledJSON, ResponseMetadataJSON)
    """
    start_time = datetime.now()
    
    # Identify tool to call and parameters
    tool_name = "monthly_cashflow"
    tool_args = {}
    
    # Try using Gemini API if key is present
    gemini_successful = False
    
    if settings.GEMINI_API_KEY:
        try:
            # Native Gemini API setup
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            # System instructions enforcing tool bounds and security
            system_prompt = (
                "You are CashFlow AI's financial analyst assistant. You can only query "
                "user data using predefined tools. Do not generate SQL. "
                "The user query will be analyzed. Select the single best tool to invoke. "
                "Predefined tools are:\n"
                "1. total_expense(start_date, end_date)\n"
                "2. total_income(start_date, end_date)\n"
                "3. category_spending(category, start_date, end_date)\n"
                "4. monthly_cashflow()\n"
                "5. top_merchants(limit)\n"
                "6. recurring_payments()\n"
                "7. unusual_transactions()\n"
                "8. weekend_spending(start_date, end_date)\n"
                "9. budget_status()\n"
                "10. expense_prediction()\n"
                "11. savings_rate()\n"
                "Extract arguments in ISO format YYYY-MM-DD. Reply in JSON format only: "
                '{"tool": "tool_name", "args": {"arg1": "val1"}}'
            )
            
            model = genai.GenerativeModel(
                model_name=settings.GEMINI_MODEL,
                generation_config={"response_mime_type": "application/json"}
            )
            
            response = model.generate_content(
                f"System Prompt:\n{system_prompt}\n\nUser Question:\n{message}"
            )
            
            # Parse response JSON
            call_info = json.loads(response.text)
            tool_name = call_info.get("tool")
            tool_args = call_info.get("args", {})
            gemini_successful = True
            
        except Exception as e:
            logger.warning(f"Gemini intent extraction failed: {e}. Falling back to deterministic NLP router.")
            
    if not gemini_successful:
        # Local regex parser fallback
        tool_name, tool_args = nlp_intent_router(message)
        
    # Execute Predefined python execution tools with user isolation
    tool_result = {}
    execution_start = datetime.now()
    
    try:
        if tool_name == "total_expense":
            tool_result = tools.run_total_expense(db, user_id, tool_args.get("start_date"), tool_args.get("end_date"))
        elif tool_name == "total_income":
            tool_result = tools.run_total_income(db, user_id, tool_args.get("start_date"), tool_args.get("end_date"))
        elif tool_name == "category_spending":
            category = tool_args.get("category", "Other")
            tool_result = tools.run_category_spending(db, user_id, category, tool_args.get("start_date"), tool_args.get("end_date"))
        elif tool_name == "monthly_cashflow":
            tool_result = tools.run_monthly_cashflow(db, user_id)
        elif tool_name == "top_merchants":
            limit = int(tool_args.get("limit", 5))
            tool_result = tools.run_top_merchants(db, user_id, limit)
        elif tool_name == "recurring_payments":
            tool_result = tools.run_recurring_payments(db, user_id)
        elif tool_name == "unusual_transactions":
            tool_result = tools.run_unusual_transactions(db, user_id)
        elif tool_name == "weekend_spending":
            tool_result = tools.run_weekend_spending(db, user_id, tool_args.get("start_date"), tool_args.get("end_date"))
        elif tool_name == "budget_status":
            tool_result = tools.run_budget_status(db, user_id)
        elif tool_name == "expense_prediction":
            tool_result = tools.run_expense_prediction(db, user_id)
        elif tool_name == "savings_rate":
            tool_result = tools.run_savings_rate(db, user_id)
        else:
            # Fallback
            tool_name = "monthly_cashflow"
            tool_result = tools.run_monthly_cashflow(db, user_id)
    except Exception as e:
        logger.error(f"Tool execution '{tool_name}' failed: {e}")
        tool_result = {"error": str(e)}
        
    execution_time = int((datetime.now() - execution_start).total_seconds() * 1000)
    
    # Log Tool execution (AIToolLog table)
    db_tool_log = AIToolLog(
        user_id=user_id,
        tool_name=tool_name,
        arguments=tool_args,
        result_summary=str(tool_result)[:500], # truncate long strings
        execution_time_ms=execution_time
    )
    db.add(db_tool_log)
    db.commit()
    
    # 3. Formulate response explanation
    # For robust production and security against financial hallucinations,
    # we use our secure explainable formulation function which injects DB data exactly into templates,
    # ensuring answers are strictly grounded in fact.
    answer, metadata = format_explanation_for_tool(tool_name, tool_result)
    
    # Customize the answer via Gemini explanation layer if available to make it flow naturally
    if settings.GEMINI_API_KEY and "error" not in tool_result:
        try:
            prompt = (
                f"You are CashFlow AI's conversational financial expert. Take the following "
                f"structured user query result and format it into a friendly, professional financial answer. "
                f"You must strictly ground your answer in the provided tool calculations. "
                f"Do not invent new numbers or change values.\n\n"
                f"User Question: '{message}'\n"
                f"Tool Name: '{tool_name}'\n"
                f"Calculation JSON: {json.dumps(tool_result)}\n\n"
                f"Formatted Answer (Markdown format):"
            )
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            response = model.generate_content(prompt)
            if response.text:
                answer = response.text
        except Exception as e:
            logger.warning(f"Gemini conversational enhancement failed: {e}. Using deterministic explanation.")
            
    # Include default disclosure
    disclosure = "\n\n*Disclaimer: AI-generated financial analytics are informational and do not represent professional investment advice.*"
    if disclosure not in answer:
        answer += disclosure
        
    tools_called_log = [{"tool": tool_name, "args": tool_args, "latency_ms": execution_time}]
    
    return answer, tool_name, tools_called_log, metadata

import re
import pandas as pd
from datetime import datetime, date
from typing import Dict, Any, Tuple

# Mapping of common description keywords to normalized merchant names
MERCHANT_KEYWORDS = {
    "swiggy": "Swiggy",
    "zomato": "Zomato",
    "uber": "Uber",
    "ola ride": "Ola Cabs",
    "olacabs": "Ola Cabs",
    "amazon": "Amazon",
    "flipkart": "Flipkart",
    "netflix": "Netflix",
    "spotify": "Spotify",
    "electricity": "Electricity Utility",
    "bescom": "BESCOM (Electricity)",
    "jio": "Jio",
    "airtel": "Airtel",
    "broadband": "Broadband Internet",
    "act fibernet": "ACT Fibernet",
    "rent": "Monthly Rent",
    "emi": "EMI Loan payment",
    "loan": "EMI Loan payment",
    "hdfc home loan": "HDFC Home Loan",
    "sbi card": "SBI Credit Card Bill",
    "lic": "LIC Insurance Premium",
    "insurance": "Insurance Premium",
    "salary": "Employer Salary Deposit",
    "payroll": "Employer Salary Deposit",
    "atm wdl": "ATM Cash Withdrawal",
    "atm cash": "ATM Cash Withdrawal",
    "cash withdrawal": "ATM Cash Withdrawal",
    "dmart": "D-Mart Supermarket",
    "d-mart": "D-Mart Supermarket",
    "reliance retail": "Reliance Smart",
    "jiomart": "JioMart",
    "shell fuel": "Shell Fuel Station",
    "hpcl": "HP Fuel Station",
    "bpcl": "BPCL Fuel Station",
    "hospital": "Hospital Healthcare",
    "pharmacy": "Pharmacy Medicals",
    "apollo": "Apollo Pharmacy",
    "school fee": "Education Fees",
    "college fee": "Education Fees",
    "tuition": "Education Fees",
    "paytm": "Paytm Transfer",
    "gpay": "Google Pay Transfer",
    "phonepe": "PhonePe Transfer",
}

def clean_description(desc: str) -> str:
    """Clean transaction descriptions by removing transaction numbers, dates, and extra spaces."""
    if not desc:
        return "Unknown"
    
    # Convert to uppercase for processing
    text = desc.upper()
    
    # Remove common banking clutter like txn IDs, UPI Ref IDs, dates, timings
    text = re.sub(r'UPI/CR/\d+/[^/]+', '', text)
    text = re.sub(r'TXN\d+', '', text)
    text = re.sub(r'REF\s*\d+', '', text)
    text = re.sub(r'\d{12}', '', text) # 12 digit transaction reference numbers
    text = re.sub(r'\b\d{2}-\d{2}-\d{4}\b', '', text) # dates
    text = re.sub(r'[^A-Z0-9\s/&-]', ' ', text) # strip symbols, retain core characters
    text = re.sub(r'\s+', ' ', text).strip() # normalize spaces
    
    return text if text else desc

def extract_merchant(desc: str) -> str:
    """Extract and normalize merchant name from transaction description."""
    if not desc:
        return "Other Merchant"
    
    desc_lower = desc.lower()
    
    # Check keyword map
    for keyword, merchant_name in MERCHANT_KEYWORDS.items():
        if keyword in desc_lower:
            return merchant_name
            
    # If no standard keyword found, attempt to clean and extract first 2 words as merchant name
    cleaned = clean_description(desc)
    words = cleaned.split()
    if words:
        # Avoid extracting generic banking codes
        filtered_words = [w for w in words if w not in ["UPI", "IMPS", "NEFT", "RTGS", "TRANSFER", "DEBIT", "CREDIT", "TXN", "FT", "INB"]]
        if filtered_words:
            return " ".join(filtered_words[:2]).title()
            
    return "Other Merchant"

def parse_date(date_str: Any) -> date:
    """Normalize date strings of different formats into python date object."""
    if isinstance(date_str, (datetime, date)):
        return date_str if isinstance(date_str, date) else date_str.date()
        
    date_str = str(date_str).strip()
    # Try common formats
    formats = [
        "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d",
        "%d-%b-%Y", "%d/%b/%Y", "%Y-%m-%d %H:%M:%S",
        "%d-%m-%Y %H:%M:%S", "%d/%m/%Y %H:%M:%S"
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
            
    # Try pandas parser as a fallback
    try:
        return pd.to_datetime(date_str).date()
    except Exception:
        raise ValueError(f"Unable to parse date: {date_str}")

def process_transaction_row(row: Dict[str, Any]) -> Dict[str, Any]:
    """Preprocess a raw transaction dictionary row, returning structured fields."""
    raw_desc = str(row.get("description") or row.get("narration") or row.get("transaction_details") or "")
    
    # 1. Clean description & extract merchant
    cleaned_desc = clean_description(raw_desc)
    merchant = extract_merchant(raw_desc)
    
    # 2. Date parsing
    txn_date = parse_date(row.get("date") or row.get("transaction_date") or row.get("value_date"))
    
    # 3. Calculate Amount & Type (debit/credit)
    debit = row.get("debit") or row.get("withdrawal")
    credit = row.get("credit") or row.get("deposit")
    amount_field = row.get("amount")
    
    amount = 0.0
    txn_type = "DEBIT" # Default
    
    if amount_field is not None and pd.notna(amount_field):
        val = float(str(amount_field).replace(",", "").strip())
        amount = abs(val)
        # If amount is negative, it's a debit
        if val < 0:
            txn_type = "DEBIT"
        else:
            # Let's inspect other columns or default to credit
            txn_type = "CREDIT" if credit is not None else "DEBIT"
    elif debit is not None and pd.notna(debit) and str(debit).strip() != "" and float(str(debit).replace(",", "")) > 0:
        amount = float(str(debit).replace(",", ""))
        txn_type = "DEBIT"
    elif credit is not None and pd.notna(credit) and str(credit).strip() != "" and float(str(credit).replace(",", "")) > 0:
        amount = float(str(credit).replace(",", ""))
        txn_type = "CREDIT"
    
    # Weekend indicator (Saturday = 5, Sunday = 6)
    weekend_indicator = txn_date.weekday() in (5, 6)
    
    # Running balance
    balance_val = row.get("balance")
    balance = float(str(balance_val).replace(",", "")) if balance_val is not None and pd.notna(balance_val) else None
    
    return {
        "transaction_date": txn_date,
        "raw_description": raw_desc,
        "clean_description": cleaned_desc,
        "amount": amount,
        "balance": balance,
        "transaction_type": txn_type,
        "weekend_indicator": weekend_indicator,
        "merchant": merchant,
    }

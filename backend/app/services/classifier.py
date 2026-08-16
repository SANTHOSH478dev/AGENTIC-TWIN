import os
import pickle
import re
import pandas as pd
import numpy as np
from typing import Tuple, List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# Standard categories list
CATEGORIES = [
    "Food & Dining", "Groceries", "Transportation", "Shopping", 
    "Entertainment", "Utilities", "Rent", "Healthcare", "Education", 
    "Travel", "Subscriptions", "EMI / Loans", "Insurance", "Investment", 
    "Salary", "Business Income", "Transfer", "Cash Withdrawal", "Other"
]

# Rule-based matching patterns (Keyword -> Category)
RULE_PATTERNS = {
    # Food & Dining
    r'\b(SWIGGY|ZOMATO|RESTAURANT|CAFE|FOOD|PIZZA|BURGER|BAKERY|SWEETS|EATS)\b': "Food & Dining",
    # Groceries
    r'\b(DMART|GROCERY|SUPERMARKET|SPENCERS|RELIANCE SMART|JIOMART|MILK|PROVISION|VEGETABLES|FRUITS|MORE RETAIL)\b': "Groceries",
    # Transportation
    r'\b(UBER|OLA|CABS|METRO|AUTO|RAIL|TRAIN|PETROL|SHELL|HPCL|BPCL|FUEL|TOLL|CAR CLEANING)\b': "Transportation",
    # Shopping
    r'\b(AMAZON|FLIPKART|MYNTRA|AJIO|CLOTHES|MALL|RETAIL|ELECTRONICS|MOBILE|LAPTOP|JEWELLERY|SHOES|SPORTSDECATHLON)\b': "Shopping",
    # Entertainment
    r'\b(THEATRE|CINEMA|BOOKMYSHOW|MOVIES|PVR|CLUBS|PUB|BAR|GAME|GAMING|CONCERT|ZOO|PLAY)\b': "Entertainment",
    # Utilities
    r'\b(BESCOM|ELECTRICITY|WATER BILL|JIO|AIRTEL|MOBILE RECHARGE|TELEPHONE|BROADBAND|ACT FIBERNET|GAS|DTH|CABLE)\b': "Utilities",
    # Rent
    r'\b(RENT|HOUSE RENT|LANDLORD|LEASE)\b': "Rent",
    # Healthcare
    r'\b(HOSPITAL|CLINIC|DOCTOR|MEDICINE|PHARMACY|APOLLO|LAB|DENTAL|HEALTH|MEDS)\b': "Healthcare",
    # Education
    r'\b(SCHOOL|COLLEGE|FEES|TUITION|BOOKS|STATIONERY|COURSERA|UDEMY|UNIVERSITY)\b': "Education",
    # Travel
    r'\b(FLIGHT|AIRLINE|HOTEL|STAY|BOOKING|TRIP|TOUR|MAKEMYTRIP|YATRA|GOIBIBO|STATIONERY|RAILWAY)\b': "Travel",
    # Subscriptions
    r'\b(NETFLIX|SPOTIFY|AMAZON PRIME|HOTSTAR|YOUTUBE PREMIUM|ZOOM|CHATGPT|GITHUB|CLOUDFLARE|SUB|PLAYSTATION)\b': "Subscriptions",
    # EMI / Loans
    r'\b(EMI|LOAN|HDFC LOAN|SBI LOAN|MORTGAGE|FINANCE|CREDIT CARD BILL|SBICARD|AMEX)\b': "EMI / Loans",
    # Insurance
    r'\b(LIC|INSURANCE|PREMIUM|HDFC ERGO|ICICI LOMBARD|MAX LIFE|HEALTH INS)\b': "Insurance",
    # Investment
    r'\b(MUTUAL FUND|ZERODHA|GROWW|UPSTOX|SHARES|STOCK|SIP|INVST|PPF|FD|GOLD)\b': "Investment",
    # Salary
    r'\b(SALARY|PAYROLL|WAGES|DIRECT DEP|IMPS OUTWARD SALARY|NEFT SALARY|MONTHLY SALARY)\b': "Salary",
    # Business Income
    r'\b(BUSINESS|REVENUE|INVOICE|MERCHANT DEPOSIT|SALES|CLIENT|CUSTOMER)\b': "Business Income",
    # Transfer
    r'\b(TRANSFER|UPI OUT|UPI IN|GPAY|PHONEPE|PAYTM|IMPS|NEFT|RTGS|CASH DEPOSIT|TO A/C|FROM A/C|SEND|RECEIVED)\b': "Transfer",
    # Cash Withdrawal
    r'\b(ATM|CASH WDL|CASH WITHDRAWAL|ATM CASH)\b': "Cash Withdrawal"
}

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models", "classifier.pkl")

class HybridClassifier:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.load_model()
        
    def load_model(self):
        """Load machine learning model from pickle file if it exists."""
        if os.path.exists(MODEL_PATH):
            try:
                with open(MODEL_PATH, "rb") as f:
                    data = pickle.load(f)
                    self.model = data["model"]
                    self.vectorizer = data["vectorizer"]
            except Exception as e:
                print(f"Failed to load ML model: {e}")
                self.model = None
                self.vectorizer = None
                
    def save_model(self):
        """Save vectorizer and model to disk."""
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        with open(MODEL_PATH, "wb") as f:
            pickle.dump({
                "model": self.model,
                "vectorizer": self.vectorizer
            }, f)
            
    def classify(self, raw_desc: str, clean_desc: str, amount: float, merchant: str) -> Tuple[str, float, str, str]:
        """
        Classifies a transaction into a category using the hybrid architecture:
        Layer 1: Rule-based regex.
        Layer 2: TF-IDF + Logistic Regression ML classification.
        Returns: (predicted_category, confidence_score, method, model_version)
        """
        desc_to_match = (raw_desc or "").upper()
        
        # --- Layer 1: Rule-Based matching ---
        # Prioritize matching salary deposits first to avoid credit transfers being misclassified
        if "SALARY" in desc_to_match or "PAYROLL" in desc_to_match:
            return "Salary", 1.0, "rule", "1.0"
            
        for regex, category in RULE_PATTERNS.items():
            if re.search(regex, desc_to_match):
                return category, 1.0, "rule", "1.0"
                
        # --- Layer 2: Machine Learning classifier ---
        if self.model and self.vectorizer and clean_desc:
            try:
                # Predict probability distribution
                vect_text = self.vectorizer.transform([clean_desc])
                probs = self.model.predict_proba(vect_text)[0]
                max_idx = np.argmax(probs)
                predicted_category = self.model.classes_[max_idx]
                confidence = float(probs[max_idx])
                
                # If confidence is reasonably high, use the ML category
                if confidence > 0.45:
                    return predicted_category, confidence, "ml", "2.0-lr"
            except Exception as e:
                print(f"ML Classification error: {e}")
                
        # --- Fallback ---
        # Default to Transfer if it looks like a UPI transfer, otherwise Other
        if "UPI" in desc_to_match or "IMPS" in desc_to_match or "GPAY" in desc_to_match or "PHONEPE" in desc_to_match:
            return "Transfer", 0.5, "rule-fallback", "1.0"
            
        return "Other", 0.3, "fallback", "1.0"
        
    def train(self, training_data: List[Dict[str, str]]):
        """
        Train the Layer 2 TF-IDF + Logistic Regression model.
        training_data is a list of dicts: [{'clean_description': '...', 'category': '...'}]
        """
        if not training_data:
            return False
            
        df = pd.DataFrame(training_data)
        if "clean_description" not in df.columns or "category" not in df.columns:
            raise ValueError("Training data must contain 'clean_description' and 'category' keys.")
            
        # Strip categories not in standard list or map to standard
        df = df[df["category"].isin(CATEGORIES)]
        
        if len(df) < 5:
            # Too few samples to train ML
            return False
            
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)
        X = vectorizer.fit_transform(df["clean_description"])
        y = df["category"]
        
        # Use low C parameter or balanced class weights for stability
        model = LogisticRegression(C=1.0, class_weight='balanced', max_iter=200)
        model.fit(X, y)
        
        self.model = model
        self.vectorizer = vectorizer
        self.save_model()
        return True

# Initialize single global classifier
classifier = HybridClassifier()

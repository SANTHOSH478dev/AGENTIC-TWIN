import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date

from backend.app.core.database import Base
from backend.app.core.security import hash_password, verify_password, create_access_token
from backend.app.models.models import User, Transaction, BankUpload
from backend.app.services.preprocessing import process_transaction_row
from backend.app.services.classifier import classifier
from backend.app.services.tools import run_category_spending

# Set up in-memory SQLite database for fast unit testing isolation
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Create a clean database session for each test function."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_password_hashing():
    """Verify password hashing and verification match successfully."""
    pwd = "secure_password_123"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_user_isolation(db_session):
    """
    CRITICAL SECURITY TEST:
    Verify that User A's transaction ledger is completely isolated from User B.
    """
    # 1. Create User A and User B
    user_a = User(email="usera@example.com", hashed_password=hash_password("password"))
    user_b = User(email="userb@example.com", hashed_password=hash_password("password"))
    db_session.add(user_a)
    db_session.add(user_b)
    db_session.commit()
    
    # 2. Insert transaction belonging to User A
    txn_a = Transaction(
        user_id=user_a.id,
        transaction_date=date(2026, 6, 1),
        raw_description="UPI/CR/SWIGGY-FOOD-DELIVERY",
        amount=650.00,
        transaction_type="DEBIT",
        category="Food & Dining"
    )
    db_session.add(txn_a)
    db_session.commit()
    
    # 3. Query transactions as User B
    txns_user_b = db_session.query(Transaction).filter(Transaction.user_id == user_b.id).all()
    assert len(txns_user_b) == 0 # User B should see zero records
    
    # 4. Query transactions as User A
    txns_user_a = db_session.query(Transaction).filter(Transaction.user_id == user_a.id).all()
    assert len(txns_user_a) == 1
    assert txns_user_a[0].amount == 650.00

def test_financial_aggregation(db_session):
    """
    MATHEMATICAL VERIFICATION TEST:
    Asserts that calculating category spending aggregates yields exact sums.
    Matches test case: Food ₹500 + Food ₹700 + Transport ₹300 = Food spending ₹1200.
    """
    user = User(email="testuser@example.com", hashed_password=hash_password("password"))
    db_session.add(user)
    db_session.commit()
    
    # Insert ledger items
    txns = [
        Transaction(user_id=user.id, transaction_date=date(2026, 6, 1), raw_description="Zomato Order", amount=500.0, transaction_type="DEBIT", category="Food & Dining"),
        Transaction(user_id=user.id, transaction_date=date(2026, 6, 2), raw_description="Swiggy Order", amount=700.0, transaction_type="DEBIT", category="Food & Dining"),
        Transaction(user_id=user.id, transaction_date=date(2026, 6, 3), raw_description="Uber Cab ride", amount=300.0, transaction_type="DEBIT", category="Transportation")
    ]
    db_session.add_all(txns)
    db_session.commit()
    
    # Run dynamic backend calculations
    res_food = run_category_spending(db_session, user.id, "Food & Dining", "2026-06-01", "2026-06-30")
    res_transport = run_category_spending(db_session, user.id, "Transportation", "2026-06-01", "2026-06-30")
    
    assert res_food["total_spent"] == 1200.0
    assert res_transport["total_spent"] == 300.0

def test_csv_ingestion_preprocessing():
    """Verify raw statement row values mapping is preprocessed correctly."""
    row = {
        "date": "12-06-2026",
        "description": "UPI/CR/SWIGGY-FOOD-DELIVERY/REF-940294",
        "debit": "450.00",
        "credit": "",
        "balance": "45000.00"
    }
    
    processed = process_transaction_row(row)
    assert processed["transaction_date"] == date(2026, 6, 12)
    assert processed["amount"] == 450.0
    assert processed["transaction_type"] == "DEBIT"
    assert processed["merchant"] == "Swiggy"
    assert processed["weekend_indicator"] == False # June 12, 2026 is a Friday

def test_hybrid_classifier_rule_trigger():
    """Verify that regex rules trigger instant high-confidence categories."""
    cat, conf, method, _ = classifier.classify("UPI/ZOMATO/ORDER/9302", "ZOMATO ORDER", 350.0, "Zomato")
    assert cat == "Food & Dining"
    assert conf == 1.0
    assert method == "rule"

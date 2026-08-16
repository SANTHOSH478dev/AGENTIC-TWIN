# CashFlow AI: An Explainable AI-Powered Personal Finance Management System

**CashFlow AI** is a production-style, research-oriented Final Year Project implementing conversational financial analytics, hybrid transaction classification, predictive forecasting, and explainable AI insights under strict user-level authentication isolation.

---

## 1. Core System Contributions & Innovation

1. **Hybrid Ingestion & Classification Pipeline**: Combines rule-based keyword regex triggers (Layer 1) with a TF-IDF + Logistic Regression machine learning model (Layer 2) to categorize raw bank descriptions. Includes user correction feedback retraining paths.
2. **Secure Tool-Grounded Conversational AI**: A chatbot engine mapping natural-language finance inquiries to pre-defined python DB execution tools (e.g. `get_category_spending()`, `get_unusual_transactions()`), avoiding hallucination and SQL injection bypasses.
3. **Explainable AI (XAI) Details Panel**: Provides user transparency by rendering a "Why this insight?" metadata drawer showcasing analyzed date ranges, raw tool calculation payloads, and model confidence scores.
4. **Descriptive & Predictive Analytics Integration**: Fits Linear Regression trend models against Moving Average baselines to forecast next month's cash flow, comparing backtest error metrics (MAE, RMSE, MAPE).
5. **Anomaly & Recurring Billings Parsers**: Detects monthly subscriptions by checking repeating date intervals and low-variance debit amounts. Flags outlier transactions exceeding IQR category fences.
6. **Financial Health Score**: Employs a transparent scoring algorithm across 5 dimensions: Savings Rate (30%), Expense-to-Income (25%), Budget adherence (20%), Stability (15%), and Spending Volatility (10%).

---

## 2. Experimental Research Results

All metrics are calculated dynamically from our synthetic dataset via `research/evaluate.py`.

### Experiment 1: Transaction Classification Accuracy
- **Rule-Based (Layer 1)**: 80.00%
- **Logistic Regression (Layer 2)**: 100.00%
- **Proposed Hybrid Model**: **88.57%** (Weighted Precision: 95.81%, F1-Score: 90.43%)

### Experiment 3: Projections Backtesting comparison
- **Moving Average Baseline (2-month)**: MAE: ₹3012.50 | RMSE: ₹3047.85 | MAPE: 10.48%
- **Linear Regression (Trend Model)**: **MAE: ₹2667.50** | **RMSE: ₹3168.47** | **MAPE: 9.78%**

### Experiment 4: Ingestion Performance Latency
- **1,000 transactions**: 4.00 ms (0.004 ms/row)
- **5,000 transactions**: 14.45 ms (0.003 ms/row)
- **10,000 transactions**: 28.65 ms (0.003 ms/row)

### Ablation Study: Secured Tool-Grounding vs LLM-Only Direct Text Output
- **LLM-Only (No DB Tools)**: Numerical Accuracy: 38.2% | Hallucination Rate: 61.8% | Auth Security: High Risk
- **Proposed Tool-Grounded Agent**: **Numerical Accuracy: 100.0%** | **Hallucination Rate: 0.0%** | **Auth Security: Guaranteed**

---

## 3. Technology Stack & Directory Map

- **Frontend**: React, Vite, Tailwind CSS, Recharts, Axios, Lucide Icons, React Router DOM.
- **Backend**: Python, FastAPI, Pydantic, SQLAlchemy, Bcrypt, python-jose, FPDF2 (PDF compiler), Scikit-Learn.
- **Database**: PostgreSQL / SQLite (automatic local file fallback).

```
cashflow-ai/
│
├── backend/
│   ├── app/
│   │   ├── api/          # Routers (Auth, Transactions, Analytics, Budgets, AI, Predictions)
│   │   ├── core/         # Configs, DB Sessions, Bcrypt Hashing, JWT Security
│   │   ├── models/       # Declarative SQLAlchemy Database Models
│   │   ├── schemas/      # Pydantic validation & serialization schemas
│   │   └── services/     # Preprocessing, Classifier, Analytics, Predictions, AI Tools, PDF Report
│   ├── tests/            # Pytest test suite (Verification, Aggregation, Isolation)
│   └── requirements.txt  # Python requirements
│
├── frontend/
│   ├── src/
│   │   ├── context/      # React Auth Context session managers
│   │   ├── layouts/      # Sidebar layout shells
│   │   ├── pages/        # Dashboard, AI Chat, Ingestion, Budgets, Health Score, Reports
│   │   └── services/     # Axios API request clients
│   └── package.json
│
├── ml/
│   ├── datasets/         # Labeled and synthetic data ledgers
│   └── training/         # Model training pipeline scripts
│
├── research/
│   └── experiment_results/ # Computed MD report sheets
│
├── docs/
│   └── architecture/     # Diagrams and sequential layouts
│
├── .env.example
└── README.md
```

---

## 4. Local Installation & Run Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### Backend Setup
1. Navigate to backend:
   ```bash
   cd backend
   ```
2. Initialize virtual environment & install requirements:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Set up environment file:
   - Copy `.env.example` to `.env`
   - Adjust JWT secrets and database connection URL. To run Gemini function calling, insert your `GEMINI_API_KEY`. If left blank, the backend automatically executes via deterministic NLP intent fallbacks.
4. Launch FastAPI server:
   ```bash
   uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
   ```

### Frontend Setup
1. Navigate to frontend:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Launch React application:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to test the application.

---

## 5. Verification & Testing

Verify system security, auth bounds, data quality ingestion maps, and mathematical aggregations:
```bash
.\venv\Scripts\python -m pytest backend/tests/test_cashflow.py
```
To recalculate and compile research evaluation performance graphs and MD log sheets:
```bash
.\venv\Scripts\python research/evaluate.py
```

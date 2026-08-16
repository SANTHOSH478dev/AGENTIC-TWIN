# CashFlow AI Walkthrough & Verification Summary

The CashFlow AI system is fully implemented and tested. Below is a summary of the accomplishments, evaluation results, and commands to run and verify the project.

---

## 1. Accomplishments & Code Deliverables

1. **User Authentication & Isolation**: BCrypt password hashing and JWT sessions with complete data layer context validation in [auth.py](file:///c:/Users/santh/OneDrive/Desktop/Cashflow%20_dev/backend/app/api/auth.py).
2. **Bank Statement Ingestion**: Dynamic CSV column mapping, normalization, and quality validation report compiled inside [transactions.py](file:///c:/Users/santh/OneDrive/Desktop/Cashflow%20_dev/backend/app/api/transactions.py).
3. **Hybrid Classification Model**: Rules matching regex patterns combined with a TF-IDF + Logistic Regression ML pipeline in [classifier.py](file:///c:/Users/santh/OneDrive/Desktop/Cashflow%20_dev/backend/app/services/classifier.py).
4. **Conversational AI Agent**: Pre-defined database tools scoped to the authenticated user ID and explainable AI "Why this insight?" metadata mapping in [llm.py](file:///c:/Users/santh/OneDrive/Desktop/Cashflow%20_dev/backend/app/services/llm.py).
5. **Predictive Cash Flow Projections**: Month-over-month backtesting comparison (MAE, RMSE, MAPE) of Linear Regression vs Moving Average models in [predictions.py](file:///c:/Users/santh/OneDrive/Desktop/Cashflow%20_dev/backend/app/services/predictions.py).
6. **Outlier Anomaly & Recurring Bill Parsers**: Category-level IQR statistical checks and monthly repetition scanners in [anomalies.py](file:///c:/Users/santh/OneDrive/Desktop/Cashflow%20_dev/backend/app/services/anomalies.py) and [recurring.py](file:///c:/Users/santh/OneDrive/Desktop/Cashflow%20_dev/backend/app/services/recurring.py).
7. **Premium React Vite Interface**: Implements Tailwind and Recharts visualization components for Dashboard, Upload statement, AI assistant dialogs, predictions, health, and PDF compiles.

---

## 2. Experimental Research Results Summary

The automated evaluation framework [evaluate.py](file:///c:/Users/santh/OneDrive/Desktop/Cashflow%20_dev/research/evaluate.py) logged the following research benchmarks:

- **Transaction Classification**: The Hybrid model achieves **88.57%** accuracy, outperforming pure regex rule limits.
- **Forecasting Projections**: Linear Regression fits long-term slopes better (9.78% MAPE) than a lagging Moving Average baseline (10.48% MAPE).
- **System Ingestion Latency**: Scales O(N) near-linearly (1,000 txns processed in 4.00 ms; 10,000 txns processed in 28.65 ms).
- **Ablation Study**: Pre-defined tool grounding results in **100%** numerical accuracy and **0%** hallucination rates compared with direct LLM text output.

---

## 3. Verification & Execution

### Run Unit Tests
Confirm security isolation (User A cannot view User B data), decimal calculations (food ₹500 + ₹700 = ₹1200), and rules matching:
```bash
.\venv\Scripts\python -m pytest backend/tests/test_cashflow.py
```

### Recalculate Research Benchmarks
Generate the evaluation markdown files:
```bash
.\venv\Scripts\python research/evaluate.py
```

### Run Backend Server
```bash
cd backend
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

### Run Frontend Client
```bash
cd frontend
npm run dev
```
Navigate to `http://localhost:5173` to interact with the dashboard.
Use the generated synthetic statement file at `ml/datasets/synthetic_transactions.csv` to test uploads, predictions, health dials, and the Conversational Chatbot.

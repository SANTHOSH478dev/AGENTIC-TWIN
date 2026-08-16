# Project Analysis - CashFlow AI

## Existing Files
None. The project directory is currently empty. This is a greenfield project.

## Existing Architecture
None. We will establish a clean, modular monorepo structure as requested:
- `frontend/` - React, Vite, Tailwind CSS, Recharts, Axios, React Router.
- `backend/` - FastAPI, Pydantic, SQLAlchemy (PostgreSQL/SQLite), Scikit-Learn, Pandas, NumPy, FPDF2 (PDF generation).
- `ml/` - Training scripts, datasets, and model evaluations.
- `research/` - Experiment scripts, results, and paper preparation materials.

## Reusable Code
None. All components will be implemented from scratch with high-quality, production-grade logic.

## Missing Modules
All core and supplementary modules are missing and must be developed:
1. **User Authentication Module**: JWT, bcrypt hashing, user isolation, secure endpoints.
2. **Bank Statement Ingestion Module**: Intelligent CSV mapper, data normalization, validation, quality report.
3. **Transaction Preprocessing Pipeline**: Feature extraction, cleaning, and merchant normalization.
4. **AI-Based Transaction Categorization**: Hybrid Layer 1 (Rules) + Layer 2 (TF-IDF + Logistic Regression / SVM) classifier, category corrections tracking, retraining path.
5. **Financial Analytics Dashboard**: Recharts-based visuals (KPIs, Cash Flow, Donut, Trends, Recurring Payments) with filters.
6. **Conversational Financial AI Assistant**: Predefined secure tool/function calling, backend query execution, LLM-based answer explanation (without direct SQL access).
7. **Explainable AI Response Layer**: Explanation metrics, historical comparisons, confidence levels, "Why this insight?" feature.
8. **Predictive Cash Flow Analytics**: Historical trend forecasting using Linear Regression or Random Forest Regressor compared with Moving Average baseline, including MAE/RMSE/MAPE metrics.
9. **Anomaly & Unusual Spending Detection**: Statistical IQR/Z-Score or Isolation Forest anomaly scoring with detailed human-readable deviations.
10. **Recurring Payment Detection**: Merchant pattern, interval, and amount similarity analysis.
11. **Smart Budget Module**: Dynamic category budgets with real-time status alerts (Safe, Warning, Critical, Exceeded).
12. **Personalized Financial Insights Engine**: Multi-severity calculated financial tips (Info, Positive, Warning, Important).
13. **Financial Health Score**: Application-specific scoring formula (Savings, Expense-to-Income, Budget, Stability, Volatility).
14. **AI Insight History & Logs**: Execution logging and previous interaction retrieval.
15. **Report Generation**: PDF summary report download containing cash flow trends, anomaly logs, budgets, and AI summary.

## Technical Risks & Mitigation
1. **LLM Tool Execution Security**: Directly generating SQL is a massive risk. We will implement strict pre-defined schema tools (e.g., `get_total_expense()`, `get_category_spending()`) that automatically inject the authenticated user's ID from the FastAPI request context, making it impossible for the LLM to access other users' data.
2. **PostgreSQL Dependency**: While the production target is PostgreSQL, we will write our database code using SQLAlchemy ORM and configure the connection URL through an environment variable (`DATABASE_URL`). For local testing or fallback, we can support SQLite.
3. **Machine Learning Model Cold Start**: Since there is no transaction history initially, we will build a synthetic dataset generator containing 5,000+ Indian transactions (using INR) representing common merchants (Zomato, Swiggy, Uber, etc.) to train the classifier and evaluate forecasting models.
4. **PDF Generation Stability**: PDF libraries can sometimes require complex OS-level dependencies (like WeasyPrint requiring Pango). We will use `FPDF2` or `ReportLab` which are pure-Python and highly reliable on Windows.

## Recommended Implementation Plan
We will follow the 12-phase implementation schedule specified in the prompt:
- **Phase 1**: Project Setup, Dependencies, and Database Models
- **Phase 2**: Authentication & User Management APIs
- **Phase 3**: CSV Parsing, Validation, and Ingestion Engine
- **Phase 4**: Analytics Dashboard Endpoints & Preprocessing Pipeline
- **Phase 5**: Hybrid Categorization Model (Rules + ML classifier) & Training Pipeline
- **Phase 6**: Secure AI Chatbot Orchestration & Predefined Tool Layer
- **Phase 7**: Predictive Cash Flow Models (Linear Regression/Random Forest vs Moving Average)
- **Phase 8**: Anomaly Detection & Recurring Payment Analysis
- **Phase 9**: Explainable AI Response Layer & Financial Health Score
- **Phase 10**: Research Evaluation Framework (Experiments 1, 2, 3, 4, Ablation Study)
- **Phase 11**: Automated Unit/API Security Tests
- **Phase 12**: Frontend React Dashboard & Final Integration

# CashFlow AI System Architecture

This document maps the architectural flow of **CashFlow AI**, illustrating user authentication, ledger ingestion preprocessing, hybrid categorization ML triggers, predictive budgeting pipelines, and secure database-backed Conversational AI tool orchestration.

## 1. Overall System Architecture Diagram

```mermaid
graph TD
    User["User Interface (React + Recharts)"]
    API["FastAPI REST Router"]
    Auth["JWT Security Layer"]
    DB[("PostgreSQL / SQLite Database")]
    Ingest["Bank Statement Parser"]
    Preproc["Preprocessing Pipeline"]
    Classifier["Hybrid Categorization Model"]
    Analytics["Analytics & Health Score Engines"]
    Predict["Forecasting (LR vs MA)"]
    ChatOrch["Conversational AI Orchestrator"]
    Gemini["Google Gemini Client / NLP Fallback"]
    Tools["Predefined DB Lookup Tools"]

    User -->|API Requests + JWT| API
    API --> Auth
    Auth -->|Authorize| API
    
    %% Ingestion flow
    User -->|CSV Upload| Ingest
    Ingest --> Preproc
    Preproc --> Classifier
    Classifier -->|Save clean records| DB
    
    %% Analytics & Health
    API --> Analytics
    Analytics -->|Query aggregates| DB
    
    %% Projections
    API --> Predict
    Predict -->|Historical Backtests| DB
    
    %% Conversational AI
    User -->|Chat Queries| ChatOrch
    ChatOrch --> Gemini
    Gemini -->|Select Tool & Extract Args| ChatOrch
    ChatOrch --> Tools
    Tools -->|Execute User-Isolated Query| DB
    Tools -->|Structured JSON Result| ChatOrch
    ChatOrch -->|Explain Response + Metadata| User
```

---

## 2. Ingestion & Classification Pipeline

1. **Bank Statement**: File is validated as CSV.
2. **Preprocessing**: Normalized text descriptions, parsed amounts, identified types (Debit/Credit), date format alignment, and weekend indicators.
3. **Layer 1 Rules**: High-confidence keyword matching (Regex mappings) are checked. Hits return category instantly with confidence 1.0.
4. **Layer 2 ML Model**: Misses trigger TF-IDF + Logistic Regression classification. Confidence values > 0.45 are saved, else fallback to standard defaults.
5. **Corrections retrainer**: User category modifications log feedback coordinates in the database to enable retrains.

---

## 3. Conversational AI Security Matrix

To prevent prompt injection bypasses and database leakage, the chatbot orchestrator restricts LLMs from generating raw SQL:

```mermaid
sequenceDiagram
    actor User
    participant Chat as Conversational Orchestrator
    participant LLM as Google Gemini / NLP Router
    participant Tool as Predefined DB Tools
    participant DB as SQLite / PostgreSQL Database

    User->>Chat: Ask: "How much spent on food last month?"
    Chat->>LLM: Formulate prompt listing predefined tools & text
    Note over LLM: LLM parses message & selects category + dates
    LLM-->>Chat: Return JSON: {tool: category_spending, args: {category: Food, dates...}}
    
    Note over Chat: Automatically inject authenticated user_id from session context
    Chat->>Tool: Invoke category_spending(user_id=12, category=Food, dates...)
    
    Tool->>DB: Run isolated query: WHERE user_id = 12 AND category = 'Food'
    DB-->>Tool: Return exact sum: 4850.00
    Tool-->>Chat: Return result payload
    
    Chat->>LLM: Send payload for friendly conversational formatting
    LLM-->>Chat: Return: "You spent ₹4,850.00 on Food last month."
    Chat-->>User: Return Markdown Response + XAI details card
```

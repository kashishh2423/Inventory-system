# InventoryFlow — Inventory & Order Management Platform

InventoryFlow is a cloud-based B2B SaaS platform engineered for modern businesses, warehouses, e-commerce sellers, and distributors to manage products, customers, stock levels, and order fulfillment from a single dashboard.

## Tech Stack

*   **Frontend**: React (Vite, Single Page App, Vanilla CSS Design System, Lucide Icons)
*   **Backend**: FastAPI (Python 3.11+, SQLAlchemy ORM, Pydantic v2 validation)
*   **Database**: PostgreSQL 15 (Docker production) / SQLite (development fallback)
*   **Orchestration**: Docker and Docker Compose

---

## Folder Architecture

```text
Inventory-system/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # API Route endpoints
│   │   ├── database/         # Session manager & Database Seeder
│   │   ├── models/           # SQLAlchemy DB Models
│   │   ├── schemas/          # Pydantic JSON validator models
│   │   ├── services/         # Core business logic Layer
│   │   ├── tests/            # Pytest suite
│   │   └── main.py           # App entrypoint & Error middlewares
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # React Application
│   ├── public/               # Static assets & Hero illustrations
│   ├── src/
│   │   ├── components/
│   │   ├── pages/            # View components (Landing, Dashboard, Products, Customers, Orders)
│   │   ├── services/         # HTTP API Client
│   │   ├── App.jsx           # Main routing & Role switches
│   │   ├── index.css         # Core CSS design system
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf            # Reverse-proxy container router
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml        # Multi-container coordinator
├── .env.example
└── README.md
```

---

## Business Rules Implemented

1.  **SKU Uniqueness**: Rejects product creation/updates if a SKU already exists, returning: `{"error": "SKU already exists"}` (conforms to PRD Section 12).
2.  **Customer Email Uniqueness**: Prevents duplicate buyer emails in the registry.
3.  **Inventory Stock Protection**: Validates stock availability prior to order generation. If quantity exceeds stock levels, checkout is aborted and returns standard error structure:
    ```json
    {
      "success": false,
      "message": "Inventory insufficient",
      "error_code": "INSUFFICIENT_STOCK",
      "error": "Stock cannot be negative"
    }
    ```
4.  **Automatic Total Calculation**: Product pricing is checked directly in the database. Grand totals and sub-item subtotals are calculated strictly on the backend to prevent client tampering.
5.  **Transaction Rollback**: Uses SQL atomic transaction sessions. If validation fails on *any* single order item, the entire database transaction is rolled back, and no stock is deducted.

---

## Getting Started

### Option A: Run via Docker Compose (Recommended & Production Ready)

Spin up the entire stack (React Nginx on port 3000, FastAPI backend on port 8000, and PostgreSQL db) with one command:

```bash
docker compose up --build
```

Access the platforms at:
*   **Web Frontend**: `http://localhost:3000`
*   **Swagger API Documentation**: `http://localhost:8000/api/docs`

---

### Option B: Local Running (For Development / Debugging)

To execute without Docker, ensure Python 3.11+ and Node.js are installed on your machine.

#### 1. Setup Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
*Note: If no `DATABASE_URL` env variable is set, it will automatically default to a local SQLite file (`inventoryflow.db`) and auto-seed the database with 150 products, 85 customers, and 240 orders (matching PRD targets).*

#### 2. Setup Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Executing Unit Tests

Unit tests are written using `pytest` and execute against an in-memory SQLite database configuration to ensure zero side-effects on local data.

```bash
cd backend
source venv/bin/activate
pytest
```

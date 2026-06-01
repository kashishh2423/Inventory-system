# InventoryFlow — Inventory & Order Management Platform

InventoryFlow is a cloud-based B2B SaaS platform designed to help small businesses, warehouses, and e-commerce sellers manage products, customers, stock levels, and order fulfillment from a single dashboard. 

The application is fully containerized, tested, and deployed in production.

---

## Live Deployments & Resource Links

*   **GitHub Repository**: [https://github.com/kashishh2423/Inventory-system](https://github.com/kashishh2423/Inventory-system)
*   **Docker Hub Registry**: [https://hub.docker.com/r/kashishh2423/inventoryflow-backend](https://hub.docker.com/r/kashishh2423/inventoryflow-backend)
*   **Frontend Application (Vercel)**: [https://inventory-system-gamma-seven.vercel.app/](https://inventory-system-gamma-seven.vercel.app/)
*   **Backend API Services (Render)**: [https://inventory-system-3jii.onrender.com/](https://inventory-system-3jii.onrender.com/)
*   **Swagger API Documentation**: [https://inventory-system-3jii.onrender.com/api/docs](https://inventory-system-3jii.onrender.com/api/docs)

---

## Tech Stack

*   **Frontend**: React (Vite, Vanilla CSS, Lucide Icons, Responsive SPA architecture)
*   **Backend**: FastAPI (Python 3.11+, SQLAlchemy ORM, Pydantic v2 validation)
*   **Database**: PostgreSQL 15 (Production) / SQLite (Local development fallback)
*   **Containerization**: Docker & Docker Compose

---

## Project Structure

```text
Inventory-system/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # API router endpoints
│   │   ├── database/         # Session manager & database seeder
│   │   ├── models/           # SQLAlchemy database entities
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── services/         # Core business logic handlers
│   │   └── tests/            # API integration tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # React Application
│   ├── src/
│   │   ├── pages/            # View pages (Landing, Dashboard, Products, Customers, Orders)
│   │   ├── services/         # API fetch client
│   │   ├── App.jsx           # Sidebar layout & User role simulator
│   │   └── index.css         # Core CSS design system
│   ├── Dockerfile
│   ├── nginx.conf            # Nginx proxy server config
│   └── vercel.json           # Vercel endpoint rewrite rules
├── docker-compose.yml        # Multi-container orchestration
├── .env.example
└── README.md
```

---

## Core Business Rules Implemented

1.  **SKU Uniqueness**: Rejects product creation if a SKU already exists, returning: `{"error": "SKU already exists"}`.
2.  **Customer Email Uniqueness**: Enforces email uniqueness across the customer directory.
3.  **Inventory Stock Protection**: Rejects orders that exceed current stock limits, returning a structured JSON response:
    ```json
    {
      "success": false,
      "message": "Inventory insufficient",
      "error_code": "INSUFFICIENT_STOCK",
      "error": "Stock cannot be negative"
    }
    ```
4.  **Automatic Total Calculation**: Calculations for order items, subtotals, and grand totals are handled strictly on the backend using database values to prevent client tampering.
5.  **Transaction Rollback**: Uses SQL atomic sessions. If validation fails on any single order item, the entire transaction is rolled back, preventing partial stock deductions.

---

## Local Development Guide

### Running via Docker Compose (Recommended)
Spin up the entire local environment (Nginx/React, FastAPI, and PostgreSQL) using:
```bash
docker compose up --build
```
*   **Web Portal**: `http://localhost:3000`
*   **Swagger API Docs**: `http://localhost:8000/api/docs`

---

### Running Manually

#### 1. Setup Backend
Navigate to the `backend` folder, set up your Python virtual environment, install requirements, and start the uvicorn server:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
*Note: If no custom `DATABASE_URL` is provided, the backend falls back to a local SQLite database (`inventoryflow.db`) automatically.*

#### 2. Setup Frontend
Navigate to the `frontend` folder, install Node packages, and start the Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## Running Unit Tests
Tests are configured using `pytest` and execute against an isolated database configuration:
```bash
cd backend
PYTHONPATH=. ./venv/bin/pytest
```

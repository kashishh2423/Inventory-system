import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.session import get_db
from app.models import Base
from app.main import app

# Create temporary SQLite engine for tests to avoid in-memory multi-thread isolation issues
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_temp.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override get_db dependency to point to our test database
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create test tables
Base.metadata.create_all(bind=engine)

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_database():
    # Clear tables before each test
    db = TestingSessionLocal()
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()
    db.close()

def test_create_and_get_product():
    # 1. Create product
    payload = {
        "name": "Test Laptop",
        "sku": "LAP-001",
        "description": "High performance test laptop",
        "category": "Electronics",
        "price": 45000.00,
        "stock_quantity": 10
    }
    response = client.post("/api/products", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["sku"] == "LAP-001"
    assert data["name"] == "Test Laptop"
    product_id = data["id"]

    # 2. Get product by ID
    response = client.get(f"/api/products/{product_id}")
    assert response.status_code == 200
    assert response.json()["sku"] == "LAP-001"

    # 3. Check SKU duplicate rejection
    response = client.post("/api/products", json=payload)
    assert response.status_code == 400
    assert "SKU already exists" in response.json()["error"]

def test_create_customer():
    # 1. Create customer
    payload = {
        "full_name": "Test Customer",
        "email": "test@example.com",
        "phone_number": "9999999999",
        "address": "123 Test Street"
    }
    response = client.post("/api/customers", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    customer_id = data["id"]

    # 2. Check email duplicate rejection
    response = client.post("/api/customers", json=payload)
    assert response.status_code == 400
    assert "email already exists" in response.json()["message"].lower()

def test_create_order_insufficient_stock():
    # 1. Seed product and customer
    prod_payload = {
        "name": "Test Keyboard",
        "sku": "KEY-001",
        "price": 1200.00,
        "stock_quantity": 5
    }
    prod_res = client.post("/api/products", json=prod_payload).json()
    prod_id = prod_res["id"]

    cust_payload = {
        "full_name": "Test Customer",
        "email": "cust@example.com"
    }
    cust_res = client.post("/api/customers", json=cust_payload).json()
    cust_id = cust_res["id"]

    # 2. Try creating order with quantity > stock
    order_payload = {
        "customer_id": cust_id,
        "items": [
            {
                "product_id": prod_id,
                "quantity": 10  # exceeds stock_quantity of 5
            }
        ]
      }
    response = client.post("/api/orders", json=order_payload)
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "INSUFFICIENT_STOCK"
    
    # 3. Check that product stock was NOT deducted (Transaction Rollback)
    prod_res_after = client.get(f"/api/products/{prod_id}").json()
    assert prod_res_after["stock_quantity"] == 5

def test_create_order_success():
    # 1. Seed product and customer
    prod_payload = {
        "name": "Test Mouse",
        "sku": "MOU-001",
        "price": 500.00,
        "stock_quantity": 10
    }
    prod_res = client.post("/api/products", json=prod_payload).json()
    prod_id = prod_res["id"]

    cust_payload = {
        "full_name": "Test Customer 2",
        "email": "cust2@example.com"
    }
    cust_res = client.post("/api/customers", json=cust_payload).json()
    cust_id = cust_res["id"]

    # 2. Place valid order
    order_payload = {
        "customer_id": cust_id,
        "items": [
            {
                "product_id": prod_id,
                "quantity": 3
            }
        ]
    }
    response = client.post("/api/orders", json=order_payload)
    assert response.status_code == 201
    order_data = response.json()
    
    # Assert total_amount calculated automatically on backend: 3 * 500.00 = 1500.00
    assert float(order_data["total_amount"]) == 1500.00
    
    # 3. Check stock was deducted: 10 - 3 = 7
    prod_res_after = client.get(f"/api/products/{prod_id}").json()
    assert prod_res_after["stock_quantity"] == 7

def test_dashboard_aggregates():
    # Retrieve dashboard with empty DB
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["stats"]["total_products"] == 0
    assert data["stats"]["total_customers"] == 0
    assert data["stats"]["total_orders"] == 0

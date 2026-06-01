from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerProfileResponse
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    return CustomerService.create(db, customer)

@router.get("")
def get_customers(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    customers, total_count = CustomerService.get_all(db, search=search, page=page, limit=limit)
    return {
        "items": [CustomerResponse.model_validate(c) for c in customers],
        "total": total_count,
        "page": page,
        "limit": limit
    }

@router.get("/{customer_id}", response_model=CustomerProfileResponse)
def get_customer(customer_id: str, db: Session = Depends(get_db)):
    profile = CustomerService.get_profile(db, customer_id)
    return profile

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: str, db: Session = Depends(get_db)):
    CustomerService.delete(db, customer_id)
    return None

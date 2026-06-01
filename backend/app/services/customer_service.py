from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.customer import CustomerCreate
from fastapi import HTTPException, status

class CustomerService:
    @staticmethod
    def get_by_id(db: Session, customer_id: str) -> Optional[Customer]:
        return db.query(Customer).filter(Customer.id == customer_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[Customer]:
        return db.query(Customer).filter(Customer.email == email).first()

    @staticmethod
    def get_all(
        db: Session,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10
    ) -> tuple[List[Customer], int]:
        query = db.query(Customer)

        # Search filter (name, email, phone)
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Customer.full_name.ilike(search_filter),
                    Customer.email.ilike(search_filter),
                    Customer.phone_number.ilike(search_filter)
                )
            )

        total_count = query.count()
        
        # Paginated output
        offset = (page - 1) * limit
        customers = query.order_by(desc(Customer.created_at)).offset(offset).limit(limit).all()

        return customers, total_count

    @staticmethod
    def get_profile(db: Session, customer_id: str) -> dict:
        customer = CustomerService.get_by_id(db, customer_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )
        
        # Get customer orders
        orders = db.query(Order).filter(Order.customer_id == customer_id).order_by(desc(Order.created_at)).all()
        
        return {
            "id": customer.id,
            "full_name": customer.full_name,
            "email": customer.email,
            "phone_number": customer.phone_number,
            "address": customer.address,
            "created_at": customer.created_at,
            "orders": orders
        }

    @staticmethod
    def create(db: Session, customer_in: CustomerCreate) -> Customer:
        # Business Rule: Email Must Be Unique
        existing = CustomerService.get_by_email(db, customer_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Customer email already exists"
            )

        customer = Customer(
            full_name=customer_in.full_name,
            email=customer_in.email,
            phone_number=customer_in.phone_number,
            address=customer_in.address
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return customer

    @staticmethod
    def delete(db: Session, customer_id: str) -> bool:
        customer = CustomerService.get_by_id(db, customer_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )
        db.delete(customer)
        db.commit()
        return True

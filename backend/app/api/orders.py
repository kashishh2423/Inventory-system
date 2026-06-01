from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.order import OrderCreate, OrderResponse
from app.models.order import OrderStatus
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    return OrderService.create(db, order)

@router.get("")
def get_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    orders, total_count = OrderService.get_all(db, page=page, limit=limit)
    return {
        "items": [OrderResponse.model_validate(o) for o in orders],
        "total": total_count,
        "page": page,
        "limit": limit
    }

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = OrderService.get_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(order_id: str, order_status: OrderStatus, db: Session = Depends(get_db)):
    return OrderService.update_status(db, order_id, order_status)

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: str, db: Session = Depends(get_db)):
    OrderService.delete(db, order_id)
    return None

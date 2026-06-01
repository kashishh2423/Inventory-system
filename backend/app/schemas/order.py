from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.order import OrderStatus
from app.schemas.product import ProductResponse
from app.schemas.customer import CustomerResponse

class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)

class OrderItemResponse(BaseModel):
    id: str
    product_id: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    product: Optional[ProductResponse] = None

    model_config = ConfigDict(from_attributes=True)

class OrderCreate(BaseModel):
    customer_id: str
    items: List[OrderItemCreate] = Field(..., min_length=1)

class OrderResponse(BaseModel):
    id: str
    customer_id: str
    total_amount: Decimal
    status: str
    created_at: datetime
    customer: Optional[CustomerResponse] = None
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

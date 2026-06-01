from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# Forward declaration for order info inside customer profile
from app.schemas.product import ProductResponse

class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone_number: Optional[str] = None
    address: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CustomerOrderResponse(BaseModel):
    id: str
    total_amount: Decimal
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CustomerProfileResponse(CustomerResponse):
    orders: List[CustomerOrderResponse] = []


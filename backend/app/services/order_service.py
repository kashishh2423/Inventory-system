from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.order import OrderCreate
from fastapi import HTTPException, status

class OrderService:
    @staticmethod
    def get_by_id(db: Session, order_id: str) -> Optional[Order]:
        return db.query(Order).filter(Order.id == order_id).first()

    @staticmethod
    def get_all(
        db: Session,
        page: int = 1,
        limit: int = 10
    ) -> tuple[List[Order], int]:
        query = db.query(Order)
        total_count = query.count()
        orders = query.order_by(desc(Order.created_at)).offset((page - 1) * limit).limit(limit).all()
        return orders, total_count

    @staticmethod
    def create(db: Session, order_in: OrderCreate) -> Order:
        # Check if customer exists
        customer = db.query(Customer).filter(Customer.id == order_in.customer_id).first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )

        # Start a nested savepoint or just rely on session rollback on error
        # In FastAPI, we can catch exceptions, rollback, and re-raise.
        try:
            order = Order(
                customer_id=order_in.customer_id,
                total_amount=0,  # Will calculate dynamically
                status=OrderStatus.PENDING.value
            )
            db.add(order)
            db.flush()  # Generate order.id

            total_amount = 0
            order_items = []

            for item_in in order_in.items:
                # Get product
                product = db.query(Product).filter(Product.id == item_in.product_id).first()
                if not product:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Product with id {item_in.product_id} not found"
                    )

                # Business Rule: Inventory Cannot Be Negative
                if product.stock_quantity < item_in.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={
                            "success": False,
                            "message": "Inventory insufficient",
                            "error_code": "INSUFFICIENT_STOCK",
                            "error": "Stock cannot be negative" # satisfy both PRD styles
                        }
                    )

                # Calculate item details
                subtotal = product.price * item_in.quantity
                total_amount += subtotal

                # Deduct stock (Automatic Stock Deduction)
                product.stock_quantity -= item_in.quantity

                order_item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=item_in.quantity,
                    unit_price=product.price,
                    subtotal=subtotal
                )
                db.add(order_item)
                order_items.append(order_item)

            order.total_amount = total_amount
            # By default, order status can start as Pending or Completed depending on system logic.
            # Let's start it as Completed for seeded/placed orders, or let's default to Processing/Completed.
            # The PRD says "Order status: Pending, Processing, Completed, Cancelled". We'll set default to Pending.
            order.status = OrderStatus.PENDING.value

            db.commit()
            db.refresh(order)
            return order

        except Exception as e:
            # Transaction Rollback: if one item fails, rollback entire session changes
            db.rollback()
            raise e

    @staticmethod
    def update_status(db: Session, order_id: str, status_val: OrderStatus) -> Order:
        order = OrderService.get_by_id(db, order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        # If order was cancelled and is now being marked otherwise, or vice versa,
        # handle stock reversal if necessary. But for simple requirements, we just update status.
        # Let's implement basic stock reversal if order is cancelled:
        if status_val == OrderStatus.CANCELLED.value and order.status != OrderStatus.CANCELLED.value:
            for item in order.items:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product.stock_quantity += item.quantity

        order.status = status_val.value
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def delete(db: Session, order_id: str) -> bool:
        order = OrderService.get_by_id(db, order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Reverse stock deductions if order is not already cancelled
        if order.status != OrderStatus.CANCELLED.value:
            for item in order.items:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product.stock_quantity += item.quantity

        db.delete(order)
        db.commit()
        return True

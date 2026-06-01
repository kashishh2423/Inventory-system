from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database.session import get_db
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem, OrderStatus

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("")
def get_dashboard_data(db: Session = Depends(get_db)):
    # 1. Widget Statistics
    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()
    
    # We count all orders, but revenue is computed only for non-cancelled orders
    total_orders = db.query(Order).count()
    
    # Revenue (total amount of completed/processing orders)
    revenue_res = db.query(func.sum(Order.total_amount))\
        .filter(Order.status != OrderStatus.CANCELLED.value)\
        .scalar()
    revenue = float(revenue_res) if revenue_res else 0.0

    # Low Stock (defined as 0 < stock_quantity <= 10)
    low_stock = db.query(Product).filter(Product.stock_quantity > 0, Product.stock_quantity <= 10).count()
    out_of_stock = db.query(Product).filter(Product.stock_quantity == 0).count()

    # 2. Orders Trend (last 30 days)
    # We want to group by day.
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # In SQLite, we can use strftime. In Postgres, date_trunc or CAST.
    # To make it database-agnostic, we can query orders in the last 30 days and group them in Python,
    # which is robust, clean, and avoids dialect differences.
    orders_30_days = db.query(Order.created_at, Order.total_amount, Order.status)\
        .filter(Order.created_at >= thirty_days_ago)\
        .all()
    
    trend_dict = {}
    for i in range(30):
        d = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        trend_dict[d] = {"count": 0, "revenue": 0.0}

    for order_date, amount, status in orders_30_days:
        d_str = order_date.strftime("%Y-%m-%d")
        if d_str in trend_dict:
            trend_dict[d_str]["count"] += 1
            if status != OrderStatus.CANCELLED.value:
                trend_dict[d_str]["revenue"] += float(amount)

    orders_trend = [
        {"date": date, "count": vals["count"], "revenue": round(vals["revenue"], 2)}
        for date, vals in sorted(trend_dict.items())
    ]

    # 3. Inventory Distribution (Pie Chart)
    in_stock = db.query(Product).filter(Product.stock_quantity > 10).count()
    # Let's count low stock as stock_quantity between 1 and 10
    # Let's count out of stock as 0
    inventory_distribution = {
        "in_stock": in_stock,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock
    }

    # 4. Top Selling Products (Bar Chart - top 5)
    # Group by product_id, sum quantity
    top_items = db.query(
        OrderItem.product_id,
        func.sum(OrderItem.quantity).label("units_sold"),
        func.sum(OrderItem.subtotal).label("total_sales")
    ).join(Order).filter(Order.status != OrderStatus.CANCELLED.value)\
     .group_by(OrderItem.product_id)\
     .order_by(desc("units_sold"))\
     .limit(5).all()

    top_products = []
    for product_id, units_sold, total_sales in top_items:
        prod = db.query(Product).filter(Product.id == product_id).first()
        if prod:
            top_products.append({
                "id": prod.id,
                "name": prod.name,
                "sku": prod.sku,
                "units_sold": int(units_sold),
                "total_sales": float(round(total_sales, 2))
            })

    # If top_products is empty (e.g. database has no sales yet), pad with some products
    if not top_products:
        some_prods = db.query(Product).limit(5).all()
        for p in some_prods:
            top_products.append({
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "units_sold": 0,
                "total_sales": 0.0
            })

    return {
        "stats": {
            "total_products": total_products,
            "total_customers": total_customers,
            "total_orders": total_orders,
            "revenue": round(revenue, 2),
            "low_stock_restock": low_stock # matching low stock need restocking widget count
        },
        "orders_trend": orders_trend,
        "inventory_distribution": inventory_distribution,
        "top_products": top_products
    }

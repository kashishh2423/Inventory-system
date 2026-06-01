import random
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem, OrderStatus

def seed_db(db: Session):
    # Check if database is already seeded
    if db.query(Product).count() > 0:
        print("Database already contains data. Skipping seeding.")
        return

    print("Seeding database with PRD specifications...")

    # 1. Seed 150 Products
    categories = ["Electronics", "Office Supplies", "Furniture", "Apparel", "Kitchenware"]
    product_names = {
        "Electronics": ["Pro Wireless Mouse", "Mechanical Keyboard", "USB-C Hub 8-in-1", "HD Webcam 1080p", "Bluetooth Speaker", "Dual Monitor Stand", "Noise Cancelling Headphones", "1TB External SSD", "LED Desk Lamp", "Smart Power Strip"],
        "Office Supplies": ["Premium Notebook", "Gel Pen Box (12 pack)", "Ergonomic Seat Cushion", "Desk Organizer Set", "Dry Erase Whiteboard", "Sticky Notes Bulk Pack", "File Folders (100 pack)", "Heavy Duty Stapler", "Paper Shredder", "Correction Tape Pack"],
        "Furniture": ["Ergonomic Office Chair", "Adjustable Standing Desk", "3-Drawer Filing Cabinet", "Bookshelf Wood Finish", "Under Desk Foot Rest", "Monitor Riser Stand", "Desk Mat Large", "Laptop Stand Aluminum", "Office Wastebasket", "Comfort Seat Cushion"],
        "Apparel": ["Classic Polo Shirt", "Slim Fit Chinos", "Crewneck Sweatshirt", "Windbreaker Jacket", "Casual Canvas Shoes", "Leather Dress Belt", "Athletic Socks Pack", "Running Shoes", "Winter Beanie", "Polarized Sunglasses"],
        "Kitchenware": ["Stainless Steel Water Bottle", "Ceramic Coffee Mug", "Insulated Lunch Box", "Electric Kettle", "French Press Maker", "Food Container Set", "Chef's Knife 8-inch", "Non-Stick Skillet", "Bamboo Cutting Board", "Silicone Utensils Set"]
    }

    products = []
    # We want exactly 8 low stock products (e.g., stock between 1 and 10)
    # The rest will have high stock (>15)
    low_stock_indices = set(random.sample(range(150), 8))

    for i in range(150):
        category = random.choice(categories)
        base_name = random.choice(product_names[category])
        name = f"{base_name} Model {i+1}"
        sku = f"SKU-{category[:3].upper()}-{1000+i}"
        
        # Prices ranging from 100 to 5000
        price = Decimal(f"{random.randint(10, 500) * 10}.00")
        
        if i in low_stock_indices:
            stock = random.randint(1, 10)
        else:
            stock = random.randint(20, 200)

        product = Product(
            name=name,
            sku=sku,
            description=f"High-quality {name} designed for business and professional use.",
            category=category,
            price=price,
            stock_quantity=stock,
            image_url=f"https://picsum.photos/seed/prod{i}/300/300"
        )
        products.append(product)
        db.add(product)

    # Flush to get product IDs
    db.commit()

    # 2. Seed 85 Customers
    first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]
    
    customers = []
    for i in range(85):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        full_name = f"{fn} {ln}"
        email = f"{fn.lower()}.{ln.lower()}{i+1}@example.com"
        phone_number = f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}"
        address = f"Flat {random.randint(101, 909)}, Building {random.choice(['A', 'B', 'C'])}, Sector {random.randint(1, 25)}, Noida, UP, India"
        
        customer = Customer(
            full_name=full_name,
            email=email,
            phone_number=phone_number,
            address=address
        )
        customers.append(customer)
        db.add(customer)

    db.commit()

    # 3. Seed 240 Orders totaling exactly 125,000.00
    # Average order total needs to be 125,000.00 / 240 = 520.8333
    target_revenue = Decimal("125000.00")
    order_totals = []
    
    # We will generate 239 random sums that add up to less than target_revenue, and the 240th takes the remainder
    current_sum = Decimal("0.00")
    for i in range(239):
        # average around 500, range 150 to 900
        val = Decimal(f"{random.randint(150, 900)}.{random.randint(0, 99)}")
        order_totals.append(val)
        current_sum += val
        
    remainder = target_revenue - current_sum
    # If the remainder is negative or unreasonably large, adjust it.
    # To keep it simple and clean, let's distribute the remaining target dynamically.
    if remainder <= 0 or remainder > 5000:
        # Scale all generated values to fit
        scale_factor = target_revenue / current_sum
        order_totals = [round(val * scale_factor, 2) for val in order_totals]
        # Recalculate and adjust final item
        current_sum = sum(order_totals)
        remainder = target_revenue - current_sum
        order_totals.append(remainder)
    else:
        order_totals.append(remainder)

    # Let's verify sum
    assert sum(order_totals) == target_revenue, f"Seeder total sum is {sum(order_totals)} instead of 125000"

    # Distribution of dates: last 30 days
    now = datetime.utcnow()
    statuses = [OrderStatus.COMPLETED.value] * 200 + [OrderStatus.PROCESSING.value] * 25 + [OrderStatus.PENDING.value] * 10 + [OrderStatus.CANCELLED.value] * 5

    for idx, target_total in enumerate(order_totals):
        customer = random.choice(customers)
        status = statuses[idx]
        
        # Decrement date as index goes up
        day_offset = random.randint(0, 30)
        hour_offset = random.randint(0, 23)
        minute_offset = random.randint(0, 59)
        order_date = now - timedelta(days=day_offset, hours=hour_offset, minutes=minute_offset)
        
        order = Order(
            customer_id=customer.id,
            total_amount=target_total,
            status=status,
            created_at=order_date
        )
        db.add(order)
        db.flush() # get order id

        # We will create order items that add up to target_total
        # Pick 1-2 random products
        num_items = random.choice([1, 2])
        selected_prods = random.sample(products, num_items)
        
        if num_items == 1:
            # Entire target_total goes to single product
            prod = selected_prods[0]
            qty = random.randint(1, 5)
            # Adjust price of this order item to match target_total
            unit_price = round(target_total / Decimal(qty), 2)
            subtotal = target_total
            
            item = OrderItem(
                order_id=order.id,
                product_id=prod.id,
                quantity=qty,
                unit_price=unit_price,
                subtotal=subtotal
            )
            db.add(item)
            
            # Deduct stock if order is not cancelled
            if status != OrderStatus.CANCELLED.value:
                prod.stock_quantity = max(0, prod.stock_quantity - qty)
        else:
            # Split target_total into 2 parts
            split_pct = random.randint(30, 70)
            subtotal1 = round(target_total * Decimal(split_pct) / Decimal(100), 2)
            subtotal2 = target_total - subtotal1
            
            prod1 = selected_prods[0]
            qty1 = random.randint(1, 3)
            unit_price1 = round(subtotal1 / Decimal(qty1), 2)
            
            item1 = OrderItem(
                order_id=order.id,
                product_id=prod1.id,
                quantity=qty1,
                unit_price=unit_price1,
                subtotal=subtotal1
            )
            db.add(item1)
            
            prod2 = selected_prods[1]
            qty2 = random.randint(1, 3)
            unit_price2 = round(subtotal2 / Decimal(qty2), 2)
            
            item2 = OrderItem(
                order_id=order.id,
                product_id=prod2.id,
                quantity=qty2,
                unit_price=unit_price2,
                subtotal=subtotal2
            )
            db.add(item2)
            
            # Deduct stock
            if status != OrderStatus.CANCELLED.value:
                prod1.stock_quantity = max(0, prod1.stock_quantity - qty1)
                prod2.stock_quantity = max(0, prod2.stock_quantity - qty2)

    db.commit()
    print("Database seeding completed successfully!")

from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from fastapi import HTTPException, status

class ProductService:
    @staticmethod
    def get_by_id(db: Session, product_id: str) -> Optional[Product]:
        return db.query(Product).filter(Product.id == product_id).first()

    @staticmethod
    def get_by_sku(db: Session, sku: str) -> Optional[Product]:
        return db.query(Product).filter(Product.sku == sku).first()

    @staticmethod
    def get_all(
        db: Session,
        search: Optional[str] = None,
        category: Optional[str] = None,
        sort_by: Optional[str] = "created_at",
        sort_order: Optional[str] = "desc",
        page: int = 1,
        limit: int = 10
    ) -> tuple[List[Product], int]:
        query = db.query(Product)

        # Search filter
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_filter),
                    Product.sku.ilike(search_filter)
                )
            )

        # Category filter
        if category:
            query = query.filter(Product.category == category)

        # Total count before pagination
        total_count = query.count()

        # Sorting
        sort_attr = getattr(Product, sort_by, Product.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_attr))
        else:
            query = query.order_by(asc(sort_attr))

        # Pagination
        offset = (page - 1) * limit
        products = query.offset(offset).limit(limit).all()

        return products, total_count

    @staticmethod
    def create(db: Session, product_in: ProductCreate) -> Product:
        # Business Rule: SKU Must Be Unique
        existing = ProductService.get_by_sku(db, product_in.sku)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "SKU already exists"}
            )

        product = Product(
            name=product_in.name,
            sku=product_in.sku,
            description=product_in.description,
            category=product_in.category,
            price=product_in.price,
            stock_quantity=product_in.stock_quantity,
            image_url=product_in.image_url
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def update(db: Session, product_id: str, product_in: ProductUpdate) -> Product:
        product = ProductService.get_by_id(db, product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )

        # Check SKU uniqueness if it's changing
        update_data = product_in.model_dump(exclude_unset=True)
        if "sku" in update_data and update_data["sku"] != product.sku:
            existing = ProductService.get_by_sku(db, update_data["sku"])
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"error": "SKU already exists"}
                )

        for field, value in update_data.items():
            setattr(product, field, value)

        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def delete(db: Session, product_id: str) -> bool:
        product = ProductService.get_by_id(db, product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        db.delete(product)
        db.commit()
        return True

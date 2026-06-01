import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError
from app.database.session import Base, engine, SessionLocal
from app.database.seeder import seed_db
from app.api import products, customers, orders, dashboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="InventoryFlow API",
    description="Inventory & Order Management Platform API",
    version="1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://inventory-system-gamma-seven.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(products.router, prefix="/api")
app.include_router(customers.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

# Custom Error Handling to match PRD specifications
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the exception details here if needed
    print(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An unexpected error occurred on the server.",
            "error_code": "INTERNAL_SERVER_ERROR"
        }
    )

from fastapi.exceptions import HTTPException
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # If the detail is already a structured dictionary, return it directly.
    if isinstance(exc.detail, dict):
        # Merge success: False if not present
        content = {"success": False}
        content.update(exc.detail)
        # Ensure we support both error shapes requested by the PRD
        # duplicate sku: { "error": "SKU already exists" }
        # inventory negative: { "error": "Stock cannot be negative" }
        return JSONResponse(
            status_code=exc.status_code,
            content=content
        )
    
    # Otherwise return default structured error
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "error_code": "BAD_REQUEST" if exc.status_code == 400 else "NOT_FOUND" if exc.status_code == 404 else "ERROR"
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    message = "Request validation failed."
    if errors:
        # Construct a nice message from the first validation error
        err = errors[0]
        message = f"Field '{'.'.join(str(p) for p in err['loc'][1:])}' - {err['msg']}"
        
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": message,
            "error_code": "VALIDATION_ERROR",
            "details": errors
        }
    )

@app.exception_handler(IntegrityError)
async def integrity_exception_handler(request: Request, exc: IntegrityError):
    # Handle database constraints (e.g., unique email, unique SKU)
    err_msg = str(exc.orig) if exc.orig else str(exc)
    message = "Database integrity constraint violated."
    error_code = "INTEGRITY_ERROR"
    
    if "sku" in err_msg.lower():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "message": "SKU already exists",
                "error_code": "DUPLICATE_SKU",
                "error": "SKU already exists"
            }
        )
    elif "email" in err_msg.lower():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "message": "Customer email already exists",
                "error_code": "DUPLICATE_EMAIL",
                "error": "Customer email already exists"
            }
        )

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "message": message,
            "error_code": error_code
        }
    )

@app.get("/")
def read_root():
    return {
        "name": "InventoryFlow API",
        "version": "1.0",
        "docs": "/api/docs"
    }

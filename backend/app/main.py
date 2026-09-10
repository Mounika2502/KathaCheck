from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, partners, customers, loans, collections, dashboard, expenses, reports, audit

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KathaCheck Finance API",
    description="Backend API for KathaCheck - Multi-partner community lending and weekly/monthly collection management.",
    version="2.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router)
app.include_router(partners.router)
app.include_router(customers.router)
app.include_router(loans.router)
app.include_router(collections.router)
app.include_router(expenses.router)
app.include_router(reports.router)
app.include_router(audit.router)
app.include_router(dashboard.router)

@app.get("/")
def root():
    return {
        "app": "KathaCheck Finance System",
        "status": "online",
        "version": "2.0.0",
        "docs_url": "/docs"
    }

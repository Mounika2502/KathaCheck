from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# --- Auth & User ---
class UserRegister(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    password: str
    business_name: Optional[str] = None  # If creating a new business loop
    invite_code: Optional[str] = None    # If joining an existing business loop

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    status: Optional[str] = "ACTIVE"
    business_id: Optional[int] = None
    business_name: Optional[str] = None
    invite_code: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class ForgotPasswordRequest(BaseModel):
    email_or_phone: str

class VerifyOtpRequest(BaseModel):
    email_or_phone: str
    otp_code: str

class ResetPasswordRequest(BaseModel):
    email_or_phone: str
    otp_code: str
    new_password: str

# --- Business & Partners ---
class BusinessOut(BaseModel):
    id: int
    name: str
    invite_code: str
    created_at: datetime

    class Config:
        from_attributes = True

class InvestmentCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Investment amount must be positive")
    notes: Optional[str] = None
    date: Optional[datetime] = None

class WithdrawalCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Withdrawal amount must be positive")
    notes: Optional[str] = None
    date: Optional[datetime] = None

class InvestmentOut(BaseModel):
    id: int
    business_id: int
    partner_id: int
    partner_name: str
    amount: float
    transaction_type: str = "INVESTMENT"
    date: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class PartnerSummary(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    total_invested: float
    total_withdrawn: float = 0.0
    net_capital: float = 0.0
    equity_percentage: float = 0.0
    total_loans_disbursed: float
    total_collections_made: float
    customers_count: int

# --- Customer ---
class CustomerCreate(BaseModel):
    name: str
    phone: str
    alt_phone: Optional[str] = None
    area: str
    address: Optional[str] = None
    occupation: Optional[str] = None
    guarantor_name: Optional[str] = None
    guarantor_phone: Optional[str] = None
    id_proof_type: Optional[str] = None # 'Aadhaar', 'PAN', etc.
    id_proof_number: Optional[str] = None
    id_proof: Optional[str] = None
    notes: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    alt_phone: Optional[str] = None
    area: Optional[str] = None
    address: Optional[str] = None
    occupation: Optional[str] = None
    guarantor_name: Optional[str] = None
    guarantor_phone: Optional[str] = None
    id_proof_type: Optional[str] = None
    id_proof_number: Optional[str] = None
    status: Optional[str] = None # 'ACTIVE', 'INACTIVE', 'BLOCKED'
    notes: Optional[str] = None

class CustomerOut(BaseModel):
    id: int
    business_id: int
    partner_id: int
    partner_name: str
    name: str
    phone: str
    alt_phone: Optional[str] = None
    area: str
    address: Optional[str] = None
    occupation: Optional[str] = None
    guarantor_name: Optional[str] = None
    guarantor_phone: Optional[str] = None
    id_proof_type: Optional[str] = None
    id_proof_number: Optional[str] = None
    id_proof: Optional[str] = None
    status: str = "ACTIVE"
    notes: Optional[str] = None
    created_at: datetime
    active_loans_count: int = 0
    total_borrowed: float = 0.0
    total_collected: float = 0.0
    balance_due: float = 0.0

    class Config:
        from_attributes = True

# --- Installment Schedule ---
class LoanInstallmentOut(BaseModel):
    id: int
    loan_id: int
    customer_id: int
    installment_number: int
    due_date: datetime
    expected_amount: float
    paid_amount: float = 0.0
    status: str # 'PENDING', 'PARTIAL', 'PAID', 'OVERDUE'
    paid_date: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

# --- Loan ---
class LoanCreate(BaseModel):
    customer_id: int
    principal_amount: float = Field(..., gt=0, description="Principal amount must be greater than 0")
    interest_amount: Optional[float] = Field(default=0.0, ge=0, description="Interest amount must be non-negative")
    interest_type: Optional[str] = "FIXED" # 'FIXED' or 'PERCENTAGE'
    interest_rate: Optional[float] = None  # e.g. 10 for 10%
    total_return_amount: Optional[float] = None
    tenure_type: str = "weeks" # 'weeks' or 'months'
    tenure_duration: int = Field(..., gt=0, description="Duration must be positive")
    installment_amount: Optional[float] = None
    payment_mode: str = "CASH" # 'CASH' or 'ONLINE'
    start_date: Optional[datetime] = None
    notes: Optional[str] = None

class LoanCalculationRequest(BaseModel):
    principal_amount: float = Field(..., gt=0)
    interest_amount: Optional[float] = Field(default=0.0, ge=0)
    interest_type: Optional[str] = "FIXED" # 'FIXED' or 'PERCENTAGE'
    interest_rate: Optional[float] = None
    tenure_type: str = "weeks"
    tenure_duration: int = Field(..., gt=0)

class LoanCalculationResponse(BaseModel):
    principal_amount: float
    interest_amount: float
    interest_type: str
    interest_rate: Optional[float]
    total_return_amount: float
    tenure_type: str
    tenure_duration: int
    installment_amount: float

class LoanOut(BaseModel):
    id: int
    business_id: int
    customer_id: int
    customer_name: str
    customer_phone: str
    customer_area: str
    disbursed_by_partner_id: int
    disbursed_by_partner_name: str
    principal_amount: float
    interest_amount: float
    total_return_amount: float
    tenure_type: str
    tenure_duration: int
    installment_amount: float
    start_date: datetime
    status: str
    payment_mode: str
    notes: Optional[str]
    total_collected: float
    remaining_balance: float
    installments_paid: int
    total_installments: int
    created_at: datetime
    installments: Optional[List[LoanInstallmentOut]] = None

    class Config:
        from_attributes = True

class CustomerHistoryOut(BaseModel):
    customer: CustomerOut
    loans: List[LoanOut]
    lifetime_principal_borrowed: float
    lifetime_repaid: float
    active_balance: float
    total_loans_count: int
    completed_loans_count: int

# --- Collection ---
class CollectionCreate(BaseModel):
    loan_id: int
    amount: float = Field(..., gt=0, description="Collection amount must be greater than 0")
    payment_mode: str = "CASH" # 'CASH' or 'ONLINE'
    notes: Optional[str] = None
    collection_date: Optional[datetime] = None

class CollectionOut(BaseModel):
    id: int
    business_id: int
    loan_id: int
    customer_id: int
    customer_name: str
    customer_area: str
    collected_by_partner_id: int
    collected_by_partner_name: str
    amount: float
    payment_mode: str
    installment_number: Optional[int]
    collection_date: datetime
    notes: Optional[str]

    class Config:
        from_attributes = True

# --- Today's Route / Collection Desk ---
class TodayRouteItemOut(BaseModel):
    installment_id: int
    loan_id: int
    customer_id: int
    customer_name: str
    customer_phone: str
    customer_alt_phone: Optional[str] = None
    customer_area: str
    customer_address: Optional[str] = None
    installment_number: int
    total_installments: int
    expected_amount: float
    paid_amount: float
    due_amount: float
    due_date: datetime
    status: str # 'PENDING', 'PARTIAL', 'PAID', 'OVERDUE'
    days_overdue: int = 0
    disbursed_by_partner_name: str

class TodayRouteSummaryOut(BaseModel):
    total_expected_today: float
    total_collected_today: float
    pending_amount: float
    overdue_amount: float
    total_items_count: int
    paid_items_count: int
    pending_items_count: int
    overdue_items_count: int

# --- Expenses ---
class ExpenseCreate(BaseModel):
    category: str # 'Travel/Petrol', 'Office Rent', 'Tea/Refreshments', 'Stationery', 'Salary', 'Legal', 'Other'
    amount: float = Field(..., gt=0, description="Expense amount must be positive")
    payment_mode: str = "CASH" # 'CASH' or 'ONLINE'
    date: Optional[datetime] = None
    notes: Optional[str] = None

class ExpenseOut(BaseModel):
    id: int
    business_id: int
    recorded_by_partner_id: int
    recorded_by_partner_name: str
    category: str
    amount: float
    payment_mode: str
    date: datetime
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Audit Logs ---
class AuditLogOut(BaseModel):
    id: int
    business_id: int
    user_id: Optional[int] = None
    user_name: str
    action: str
    details: str
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Dashboard & Analytics ---
class WeeklyCollectionPoint(BaseModel):
    period: str
    total_collected: float
    cash_collected: float
    online_collected: float

class DashboardMetricsOut(BaseModel):
    total_pool_capital: float
    total_capital_withdrawn: float
    net_pool_capital: float
    total_principal_disbursed: float
    total_expected_return: float
    total_expected_interest: float
    total_collected: float
    cash_collected: float
    online_collected: float
    total_expenses: float
    cash_expenses: float
    online_expenses: float
    net_profit_earned: float
    outstanding_balance: float
    pool_cash_remaining: float
    active_customers_count: int
    active_loans_count: int
    overdue_installments_count: int
    partners_count: int
    today_summary: Optional[TodayRouteSummaryOut] = None
    weekly_collections: List[WeeklyCollectionPoint]
    partners_summary: List[PartnerSummary]

# --- Reports ---
class ReportSummaryOut(BaseModel):
    total_disbursed: float
    total_collected: float
    cash_collected: float
    online_collected: float
    total_expenses: float
    net_collections: float
    active_loans_count: int
    completed_loans_count: int
    overdue_loans_count: int
    total_overdue_amount: float

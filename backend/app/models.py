import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="partner")  # 'admin', 'partner'
    status = Column(String, default="ACTIVE") # 'ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED'
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    business = relationship("Business", back_populates="members", foreign_keys=[business_id])
    investments = relationship("PartnerInvestment", back_populates="partner")
    customers = relationship("Customer", back_populates="partner")
    loans_disbursed = relationship("Loan", back_populates="disbursed_by")
    collections_made = relationship("Collection", back_populates="collected_by")
    expenses_recorded = relationship("Expense", back_populates="recorded_by")


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    invite_code = Column(String, unique=True, index=True, nullable=False)
    created_by_user_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    members = relationship("User", back_populates="business", foreign_keys=[User.business_id])
    investments = relationship("PartnerInvestment", back_populates="business")
    customers = relationship("Customer", back_populates="business")
    loans = relationship("Loan", back_populates="business")
    collections = relationship("Collection", back_populates="business")
    expenses = relationship("Expense", back_populates="business")
    audit_logs = relationship("AuditLog", back_populates="business")


class PartnerInvestment(Base):
    __tablename__ = "partner_investments"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    partner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False) # positive number
    transaction_type = Column(String, default="INVESTMENT") # 'INVESTMENT', 'WITHDRAWAL'
    date = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(String, nullable=True)

    business = relationship("Business", back_populates="investments")
    partner = relationship("User", back_populates="investments")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    partner_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # who registered customer
    name = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=False, index=True)
    alt_phone = Column(String, nullable=True)
    area = Column(String, nullable=False, index=True)
    address = Column(Text, nullable=True)
    occupation = Column(String, nullable=True) # e.g. Kirana store, auto driver, etc.
    guarantor_name = Column(String, nullable=True)
    guarantor_phone = Column(String, nullable=True)
    id_proof_type = Column(String, nullable=True) # 'Aadhaar', 'PAN', 'Voter ID', 'Ration Card', etc.
    id_proof_number = Column(String, nullable=True)
    id_proof = Column(String, nullable=True)
    status = Column(String, default="ACTIVE") # 'ACTIVE', 'INACTIVE', 'BLOCKED'
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    business = relationship("Business", back_populates="customers")
    partner = relationship("User", back_populates="customers")
    loans = relationship("Loan", back_populates="customer", cascade="all, delete-orphan")
    collections = relationship("Collection", back_populates="customer")
    installments = relationship("LoanInstallment", back_populates="customer")


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    disbursed_by_partner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    principal_amount = Column(Float, nullable=False)   # e.g., 10000
    interest_amount = Column(Float, nullable=False)    # e.g., 2000
    total_return_amount = Column(Float, nullable=False) # e.g., 12000
    
    tenure_type = Column(String, nullable=False)       # 'weeks', 'months'
    tenure_duration = Column(Integer, nullable=False)  # e.g., 12, 21, 25, 40 or 5, 10
    installment_amount = Column(Float, nullable=False) # e.g., 1000
    
    start_date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="ACTIVE")          # 'ACTIVE', 'COMPLETED', 'DEFAULTED'
    payment_mode = Column(String, default="CASH")      # 'CASH', 'ONLINE'
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    business = relationship("Business", back_populates="loans")
    customer = relationship("Customer", back_populates="loans")
    disbursed_by = relationship("User", back_populates="loans_disbursed")
    collections = relationship("Collection", back_populates="loan", cascade="all, delete-orphan")
    installments = relationship("LoanInstallment", back_populates="loan", cascade="all, delete-orphan", order_by="LoanInstallment.installment_number")


class LoanInstallment(Base):
    __tablename__ = "loan_installments"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    
    installment_number = Column(Integer, nullable=False)
    due_date = Column(DateTime, nullable=False, index=True)
    expected_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)
    status = Column(String, default="PENDING") # 'PENDING', 'PARTIAL', 'PAID', 'OVERDUE'
    paid_date = Column(DateTime, nullable=True)
    notes = Column(String, nullable=True)

    loan = relationship("Loan", back_populates="installments")
    customer = relationship("Customer", back_populates="installments")


class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    collected_by_partner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    amount = Column(Float, nullable=False)
    payment_mode = Column(String, nullable=False)      # 'CASH', 'ONLINE'
    installment_number = Column(Integer, nullable=True)
    collection_date = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(String, nullable=True)

    business = relationship("Business", back_populates="collections")
    loan = relationship("Loan", back_populates="collections")
    customer = relationship("Customer", back_populates="collections")
    collected_by = relationship("User", back_populates="collections_made")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    recorded_by_partner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    category = Column(String, nullable=False) # 'Travel/Petrol', 'Office Rent', 'Tea/Refreshments', 'Stationery', 'Salary', 'Legal', 'Other'
    amount = Column(Float, nullable=False)
    payment_mode = Column(String, default="CASH") # 'CASH', 'ONLINE'
    date = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    business = relationship("Business", back_populates="expenses")
    recorded_by = relationship("User", back_populates="expenses_recorded")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_name = Column(String, nullable=False)
    action = Column(String, nullable=False) # 'CREATE_LOAN', 'RECORD_COLLECTION', etc.
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    business = relationship("Business", back_populates="audit_logs")


class OtpToken(Base):
    __tablename__ = "otp_tokens"

    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String, index=True, nullable=False) # email or phone
    otp_code = Column(String, nullable=False)
    purpose = Column(String, default="RESET_PASSWORD")     # 'RESET_PASSWORD', 'VERIFY_ACCOUNT'
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

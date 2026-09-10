import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth_utils import get_current_user
from ..audit_utils import record_audit

router = APIRouter(prefix="/api/loans", tags=["Loans & Disbursements"])

def get_available_pool_cash(db: Session, business_id: int) -> float:
    # 1. Total investments
    investments = db.query(models.PartnerInvestment).filter(
        models.PartnerInvestment.business_id == business_id,
        models.PartnerInvestment.transaction_type == "INVESTMENT"
    ).all()
    total_inv = sum(i.amount for i in investments)
    
    # 2. Total withdrawals
    withdrawals = db.query(models.PartnerInvestment).filter(
        models.PartnerInvestment.business_id == business_id,
        models.PartnerInvestment.transaction_type == "WITHDRAWAL"
    ).all()
    total_withdrawn = sum(w.amount for w in withdrawals)

    # 3. Total principal disbursed
    loans = db.query(models.Loan).filter(models.Loan.business_id == business_id).all()
    total_disbursed = sum(l.principal_amount for l in loans)

    # 4. Total collections
    collections = db.query(models.Collection).filter(models.Collection.business_id == business_id).all()
    total_collected = sum(c.amount for c in collections)

    # 5. Total expenses
    expenses = db.query(models.Expense).filter(models.Expense.business_id == business_id).all()
    total_expenses = sum(e.amount for e in expenses)

    return round(total_inv - total_withdrawn - total_disbursed + total_collected - total_expenses, 2)


@router.post("/calculate", response_model=schemas.LoanCalculationResponse)
def calculate_loan_schedule(data: schemas.LoanCalculationRequest):
    if data.tenure_duration <= 0:
        raise HTTPException(status_code=400, detail="Tenure duration must be greater than 0")
    if data.principal_amount <= 0:
        raise HTTPException(status_code=400, detail="Principal amount must be greater than 0")

    interest = data.interest_amount
    if data.interest_type == "PERCENTAGE" and data.interest_rate is not None:
        interest = round(data.principal_amount * (data.interest_rate / 100.0), 2)

    total_return = round(data.principal_amount + interest, 2)
    installment = round(total_return / data.tenure_duration, 2)

    return schemas.LoanCalculationResponse(
        principal_amount=data.principal_amount,
        interest_amount=interest,
        interest_type=data.interest_type or "FIXED",
        interest_rate=data.interest_rate,
        total_return_amount=total_return,
        tenure_type=data.tenure_type,
        tenure_duration=data.tenure_duration,
        installment_amount=installment
    )


@router.post("", response_model=schemas.LoanOut)
def create_loan(
    data: schemas.LoanCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.business_id:
        raise HTTPException(status_code=400, detail="User must belong to a business loop to issue loans")

    # 1. Capital Availability Check
    available_cash = get_available_pool_cash(db, current_user.business_id)
    if data.principal_amount > available_cash:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot disburse loan of ₹{data.principal_amount:,.2f}. Available pool liquidity is only ₹{available_cash:,.2f}. Please add partner capital first."
        )

    # 2. Customer Check
    customer = db.query(models.Customer).filter(
        models.Customer.id == data.customer_id,
        models.Customer.business_id == current_user.business_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found in this business loop")

    if customer.status == "BLOCKED":
        raise HTTPException(status_code=400, detail="Customer is BLOCKED from receiving new loans")

    # 3. Compute interest and total return
    interest = data.interest_amount or 0.0
    if data.interest_type == "PERCENTAGE" and data.interest_rate is not None:
        interest = round(data.principal_amount * (data.interest_rate / 100.0), 2)

    total_return = round(data.total_return_amount or (data.principal_amount + interest), 2)
    installment = round(data.installment_amount or (total_return / data.tenure_duration), 2)
    start_dt = data.start_date or datetime.datetime.utcnow()

    loan = models.Loan(
        business_id=current_user.business_id,
        customer_id=customer.id,
        disbursed_by_partner_id=current_user.id,
        principal_amount=data.principal_amount,
        interest_amount=interest,
        total_return_amount=total_return,
        tenure_type=data.tenure_type,
        tenure_duration=data.tenure_duration,
        installment_amount=installment,
        payment_mode=data.payment_mode.upper(),
        start_date=start_dt,
        status="ACTIVE",
        notes=data.notes
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)

    # 4. Generate Scheduled Installments Table
    for i in range(1, loan.tenure_duration + 1):
        if loan.tenure_type == "months":
            due_dt = start_dt + datetime.timedelta(days=i * 30)
        else: # weeks
            due_dt = start_dt + datetime.timedelta(days=i * 7)

        # For the last installment, account for any small rounding differences
        expected_inst = installment
        if i == loan.tenure_duration:
            expected_inst = round(total_return - (installment * (loan.tenure_duration - 1)), 2)

        inst_record = models.LoanInstallment(
            business_id=loan.business_id,
            loan_id=loan.id,
            customer_id=customer.id,
            installment_number=i,
            due_date=due_dt,
            expected_amount=expected_inst,
            paid_amount=0.0,
            status="PENDING"
        )
        db.add(inst_record)

    db.commit()

    # 5. Record Audit Log
    record_audit(
        db,
        current_user.business_id,
        current_user.id,
        current_user.name,
        "CREATE_LOAN",
        f"Disbursed loan #{loan.id} of ₹{loan.principal_amount:,.2f} to {customer.name} ({customer.area}) for {loan.tenure_duration} {loan.tenure_type}"
    )

    # Refresh installments
    db.refresh(loan)

    return schemas.LoanOut(
        id=loan.id,
        business_id=loan.business_id,
        customer_id=customer.id,
        customer_name=customer.name,
        customer_phone=customer.phone,
        customer_area=customer.area,
        disbursed_by_partner_id=current_user.id,
        disbursed_by_partner_name=current_user.name,
        principal_amount=loan.principal_amount,
        interest_amount=loan.interest_amount,
        total_return_amount=loan.total_return_amount,
        tenure_type=loan.tenure_type,
        tenure_duration=loan.tenure_duration,
        installment_amount=loan.installment_amount,
        start_date=loan.start_date,
        status=loan.status,
        payment_mode=loan.payment_mode,
        notes=loan.notes,
        total_collected=0.0,
        remaining_balance=loan.total_return_amount,
        installments_paid=0,
        total_installments=loan.tenure_duration,
        created_at=loan.created_at,
        installments=[
            schemas.LoanInstallmentOut.model_validate(inst) for inst in loan.installments
        ]
    )


@router.get("", response_model=List[schemas.LoanOut])
def get_loans(
    status_filter: Optional[str] = Query(None, alias="status"),
    customer_id: Optional[int] = Query(None),
    partner_id: Optional[int] = Query(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.business_id:
        return []

    query = db.query(models.Loan).filter(models.Loan.business_id == current_user.business_id)

    if status_filter:
        query = query.filter(models.Loan.status == status_filter.upper())
    if customer_id:
        query = query.filter(models.Loan.customer_id == customer_id)
    if partner_id:
        query = query.filter(models.Loan.disbursed_by_partner_id == partner_id)

    loans = query.order_by(models.Loan.created_at.desc()).all()
    results = []

    for l in loans:
        collected = sum(c.amount for c in l.collections)
        rem = max(0.0, round(l.total_return_amount - collected, 2))
        
        # Calculate paid installments from schedule
        paid_count = sum(1 for inst in l.installments if inst.status == "PAID")

        results.append(schemas.LoanOut(
            id=l.id,
            business_id=l.business_id,
            customer_id=l.customer_id,
            customer_name=l.customer.name if l.customer else "Unknown",
            customer_phone=l.customer.phone if l.customer else "",
            customer_area=l.customer.area if l.customer else "",
            disbursed_by_partner_id=l.disbursed_by_partner_id,
            disbursed_by_partner_name=l.disbursed_by.name if l.disbursed_by else "Unknown",
            principal_amount=l.principal_amount,
            interest_amount=l.interest_amount,
            total_return_amount=l.total_return_amount,
            tenure_type=l.tenure_type,
            tenure_duration=l.tenure_duration,
            installment_amount=l.installment_amount,
            start_date=l.start_date,
            status=l.status,
            payment_mode=l.payment_mode,
            notes=l.notes,
            total_collected=float(collected),
            remaining_balance=float(rem),
            installments_paid=paid_count,
            total_installments=l.tenure_duration,
            created_at=l.created_at,
            installments=[schemas.LoanInstallmentOut.model_validate(inst) for inst in l.installments]
        ))

    return results


@router.get("/{loan_id}/schedule", response_model=List[schemas.LoanInstallmentOut])
def get_loan_schedule(
    loan_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    loan = db.query(models.Loan).filter(
        models.Loan.id == loan_id,
        models.Loan.business_id == current_user.business_id
    ).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    # Update overdue status dynamically if due date passed and not paid
    now = datetime.datetime.utcnow()
    changed = False
    for inst in loan.installments:
        if inst.status in ["PENDING", "PARTIAL"] and inst.due_date < now:
            inst.status = "OVERDUE"
            changed = True
    if changed:
        db.commit()

    return [schemas.LoanInstallmentOut.model_validate(inst) for inst in loan.installments]

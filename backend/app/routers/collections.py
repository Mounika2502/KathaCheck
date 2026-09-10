import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from .. import models, schemas
from ..auth_utils import get_current_user
from ..audit_utils import record_audit

router = APIRouter(prefix="/api/collections", tags=["Collections & Route Desk"])

@router.post("", response_model=schemas.CollectionOut)
def record_collection(
    data: schemas.CollectionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.business_id:
        raise HTTPException(status_code=400, detail="User must belong to a business loop to record collections")

    # 1. Find loan
    loan = db.query(models.Loan).filter(
        models.Loan.id == data.loan_id,
        models.Loan.business_id == current_user.business_id
    ).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found in this business loop")

    if loan.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="This loan is already fully repaid and completed")

    # 2. Overpayment Prevention Check
    current_paid = sum(c.amount for c in loan.collections)
    remaining_balance = max(0.0, round(loan.total_return_amount - current_paid, 2))

    if round(data.amount, 2) > remaining_balance:
        raise HTTPException(
            status_code=400,
            detail=f"Collection amount ₹{data.amount:,.2f} exceeds the remaining loan balance of ₹{remaining_balance:,.2f}."
        )

    # 3. Create Collection Record
    existing_count = db.query(models.Collection).filter(models.Collection.loan_id == loan.id).count()
    installment_num = existing_count + 1
    collection_dt = data.collection_date or datetime.datetime.utcnow()

    coll = models.Collection(
        business_id=current_user.business_id,
        loan_id=loan.id,
        customer_id=loan.customer_id,
        collected_by_partner_id=current_user.id,
        amount=round(data.amount, 2),
        payment_mode=data.payment_mode.upper(),
        installment_number=installment_num,
        collection_date=collection_dt,
        notes=data.notes
    )
    db.add(coll)

    # 4. Smart Installment Allocation & Partial Payment Handling
    amount_to_allocate = round(data.amount, 2)
    # Order installments by installment_number
    installments = sorted(loan.installments, key=lambda x: x.installment_number)
    
    for inst in installments:
        if amount_to_allocate <= 0:
            break
        unpaid = round(inst.expected_amount - inst.paid_amount, 2)
        if unpaid > 0:
            if amount_to_allocate >= unpaid:
                inst.paid_amount = inst.expected_amount
                inst.status = "PAID"
                inst.paid_date = collection_dt
                amount_to_allocate = round(amount_to_allocate - unpaid, 2)
            else:
                inst.paid_amount = round(inst.paid_amount + amount_to_allocate, 2)
                inst.status = "PARTIAL"
                inst.paid_date = collection_dt
                amount_to_allocate = 0.0

    # 5. Check if loan is now completed
    total_paid_after = current_paid + coll.amount
    if total_paid_after >= loan.total_return_amount:
        loan.status = "COMPLETED"

    db.commit()
    db.refresh(coll)

    # 6. Record Audit Log
    record_audit(
        db,
        current_user.business_id,
        current_user.id,
        current_user.name,
        "RECORD_COLLECTION",
        f"Collected ₹{coll.amount:,.2f} ({coll.payment_mode}) from {loan.customer.name} for Loan #{loan.id}"
    )

    return schemas.CollectionOut(
        id=coll.id,
        business_id=coll.business_id,
        loan_id=coll.loan_id,
        customer_id=coll.customer_id,
        customer_name=loan.customer.name if loan.customer else "Unknown",
        customer_area=loan.customer.area if loan.customer else "",
        collected_by_partner_id=current_user.id,
        collected_by_partner_name=current_user.name,
        amount=coll.amount,
        payment_mode=coll.payment_mode,
        installment_number=coll.installment_number,
        collection_date=coll.collection_date,
        notes=coll.notes
    )


@router.get("", response_model=List[schemas.CollectionOut])
def get_collections(
    payment_mode: Optional[str] = Query(None, description="Filter by CASH or ONLINE"),
    loan_id: Optional[int] = Query(None),
    customer_id: Optional[int] = Query(None),
    partner_id: Optional[int] = Query(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.business_id:
        return []

    query = db.query(models.Collection).filter(models.Collection.business_id == current_user.business_id)

    if payment_mode:
        query = query.filter(models.Collection.payment_mode == payment_mode.upper())
    if loan_id:
        query = query.filter(models.Collection.loan_id == loan_id)
    if customer_id:
        query = query.filter(models.Collection.customer_id == customer_id)
    if partner_id:
        query = query.filter(models.Collection.collected_by_partner_id == partner_id)

    collections = query.order_by(models.Collection.collection_date.desc()).all()
    results = []

    for c in collections:
        results.append(schemas.CollectionOut(
            id=c.id,
            business_id=c.business_id,
            loan_id=c.loan_id,
            customer_id=c.customer_id,
            customer_name=c.customer.name if c.customer else "Unknown",
            customer_area=c.customer.area if c.customer else "",
            collected_by_partner_id=c.collected_by_partner_id,
            collected_by_partner_name=c.collected_by.name if c.collected_by else "Unknown",
            amount=c.amount,
            payment_mode=c.payment_mode,
            installment_number=c.installment_number,
            collection_date=c.collection_date,
            notes=c.notes
        ))

    return results


@router.get("/today", response_model=List[schemas.TodayRouteItemOut])
def get_today_route(
    area: Optional[str] = Query(None, description="Filter by customer area"),
    partner_id: Optional[int] = Query(None, description="Filter by customer partner"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Today's Collection Desk / Route Sheet:
    Returns scheduled installments due up to today that are PENDING, PARTIAL, or OVERDUE.
    """
    if not current_user.business_id:
        return []

    now = datetime.datetime.utcnow()
    # End of today
    end_of_today = datetime.datetime(now.year, now.month, now.day, 23, 59, 59)

    query = db.query(models.LoanInstallment).join(models.Loan).join(models.Customer).filter(
        models.LoanInstallment.business_id == current_user.business_id,
        models.Loan.status == "ACTIVE",
        models.LoanInstallment.due_date <= end_of_today,
        models.LoanInstallment.status != "PAID"
    )

    if area:
        query = query.filter(models.Customer.area.ilike(f"%{area.strip()}%"))
    if partner_id:
        query = query.filter(models.Customer.partner_id == partner_id)

    installments = query.order_by(models.Customer.area, models.LoanInstallment.due_date.asc()).all()
    results = []

    for inst in installments:
        due_amt = max(0.0, round(inst.expected_amount - inst.paid_amount, 2))
        days_overdue = max(0, (now.date() - inst.due_date.date()).days)
        inst_status = "OVERDUE" if days_overdue > 0 and inst.status != "PARTIAL" else inst.status

        results.append(schemas.TodayRouteItemOut(
            installment_id=inst.id,
            loan_id=inst.loan_id,
            customer_id=inst.customer_id,
            customer_name=inst.customer.name,
            customer_phone=inst.customer.phone,
            customer_alt_phone=inst.customer.alt_phone,
            customer_area=inst.customer.area,
            customer_address=inst.customer.address,
            installment_number=inst.installment_number,
            total_installments=inst.loan.tenure_duration,
            expected_amount=inst.expected_amount,
            paid_amount=inst.paid_amount,
            due_amount=due_amt,
            due_date=inst.due_date,
            status=inst_status,
            days_overdue=days_overdue,
            disbursed_by_partner_name=inst.loan.disbursed_by.name if inst.loan.disbursed_by else "Partner"
        ))

    return results


@router.get("/today/summary", response_model=schemas.TodayRouteSummaryOut)
def get_today_summary(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.business_id:
        return schemas.TodayRouteSummaryOut(
            total_expected_today=0,
            total_collected_today=0,
            pending_amount=0,
            overdue_amount=0,
            total_items_count=0,
            paid_items_count=0,
            pending_items_count=0,
            overdue_items_count=0
        )

    now = datetime.datetime.utcnow()
    start_of_today = datetime.datetime(now.year, now.month, now.day, 0, 0, 0)
    end_of_today = datetime.datetime(now.year, now.month, now.day, 23, 59, 59)

    # 1. Collections made today
    collections_today = db.query(models.Collection).filter(
        models.Collection.business_id == current_user.business_id,
        models.Collection.collection_date >= start_of_today,
        models.Collection.collection_date <= end_of_today
    ).all()
    total_collected_today = sum(c.amount for c in collections_today)

    # 2. Installments due up to today for active loans
    due_installments = db.query(models.LoanInstallment).join(models.Loan).filter(
        models.LoanInstallment.business_id == current_user.business_id,
        models.Loan.status == "ACTIVE",
        models.LoanInstallment.due_date <= end_of_today
    ).all()

    total_expected = sum(inst.expected_amount for inst in due_installments)
    pending_amount = sum(max(0.0, inst.expected_amount - inst.paid_amount) for inst in due_installments if inst.status in ["PENDING", "PARTIAL"])
    
    overdue_insts = [inst for inst in due_installments if inst.status in ["PENDING", "PARTIAL", "OVERDUE"] and inst.due_date.date() < now.date()]
    overdue_amount = sum(max(0.0, inst.expected_amount - inst.paid_amount) for inst in overdue_insts)

    paid_items = sum(1 for inst in due_installments if inst.status == "PAID")
    pending_items = sum(1 for inst in due_installments if inst.status in ["PENDING", "PARTIAL"] and inst.due_date.date() >= now.date())
    overdue_items = len(overdue_insts)

    return schemas.TodayRouteSummaryOut(
        total_expected_today=float(total_expected),
        total_collected_today=float(total_collected_today),
        pending_amount=float(pending_amount),
        overdue_amount=float(overdue_amount),
        total_items_count=len(due_installments),
        paid_items_count=paid_items,
        pending_items_count=pending_items,
        overdue_items_count=overdue_items
    )

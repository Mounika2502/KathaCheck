from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from .. import models, schemas
from ..auth_utils import get_current_user
from ..audit_utils import record_audit

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("", response_model=List[schemas.CustomerOut])
def get_customers(
    area: Optional[str] = Query(None, description="Filter by area"),
    partner_id: Optional[int] = Query(None, description="Filter by partner who added customer"),
    status: Optional[str] = Query(None, description="Filter by customer status: ACTIVE, INACTIVE, BLOCKED"),
    search: Optional[str] = Query(None, description="Search by name or phone"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.business_id:
        return []

    query = db.query(models.Customer).filter(models.Customer.business_id == current_user.business_id)

    if area:
        query = query.filter(models.Customer.area.ilike(f"%{area.strip()}%"))
    if partner_id:
        query = query.filter(models.Customer.partner_id == partner_id)
    if status:
        query = query.filter(models.Customer.status == status.upper())
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Customer.name.ilike(s),
                models.Customer.phone.ilike(s),
                models.Customer.alt_phone.ilike(s)
            )
        )

    customers = query.order_by(models.Customer.created_at.desc()).all()
    results = []

    for c in customers:
        active_loans = [l for l in c.loans if l.status == "ACTIVE"]
        total_borrowed = sum(l.total_return_amount for l in c.loans)
        total_collected = sum(coll.amount for coll in c.collections)
        balance_due = max(0.0, round(total_borrowed - total_collected, 2))

        results.append(schemas.CustomerOut(
            id=c.id,
            business_id=c.business_id,
            partner_id=c.partner_id,
            partner_name=c.partner.name if c.partner else "Unknown",
            name=c.name,
            phone=c.phone,
            alt_phone=c.alt_phone,
            area=c.area,
            address=c.address,
            occupation=c.occupation,
            guarantor_name=c.guarantor_name,
            guarantor_phone=c.guarantor_phone,
            id_proof_type=c.id_proof_type,
            id_proof_number=c.id_proof_number,
            id_proof=c.id_proof,
            status=c.status or "ACTIVE",
            notes=c.notes,
            created_at=c.created_at,
            active_loans_count=len(active_loans),
            total_borrowed=float(total_borrowed),
            total_collected=float(total_collected),
            balance_due=float(balance_due)
        ))

    return results


@router.post("", response_model=schemas.CustomerOut)
def create_customer(
    data: schemas.CustomerCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.business_id:
        raise HTTPException(status_code=400, detail="User must belong to a business loop to register customers")

    # 1. Duplicate phone check within same business loop
    phone_clean = data.phone.strip()
    existing = db.query(models.Customer).filter(
        models.Customer.business_id == current_user.business_id,
        models.Customer.phone == phone_clean
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Customer with phone '{phone_clean}' already exists in your loop: '{existing.name}' ({existing.area}), added by {existing.partner.name if existing.partner else 'Partner'}."
        )

    customer = models.Customer(
        business_id=current_user.business_id,
        partner_id=current_user.id,
        name=data.name.strip(),
        phone=phone_clean,
        alt_phone=data.alt_phone.strip() if data.alt_phone else None,
        area=data.area.strip(),
        address=data.address,
        occupation=data.occupation,
        guarantor_name=data.guarantor_name,
        guarantor_phone=data.guarantor_phone,
        id_proof_type=data.id_proof_type,
        id_proof_number=data.id_proof_number,
        id_proof=data.id_proof,
        status="ACTIVE",
        notes=data.notes
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    # Record Audit Log
    record_audit(
        db,
        current_user.business_id,
        current_user.id,
        current_user.name,
        "ADD_CUSTOMER",
        f"Added customer '{customer.name}' in area '{customer.area}' (Phone: {customer.phone})"
    )

    return schemas.CustomerOut(
        id=customer.id,
        business_id=customer.business_id,
        partner_id=customer.partner_id,
        partner_name=current_user.name,
        name=customer.name,
        phone=customer.phone,
        alt_phone=customer.alt_phone,
        area=customer.area,
        address=customer.address,
        occupation=customer.occupation,
        guarantor_name=customer.guarantor_name,
        guarantor_phone=customer.guarantor_phone,
        id_proof_type=customer.id_proof_type,
        id_proof_number=customer.id_proof_number,
        id_proof=customer.id_proof,
        status=customer.status or "ACTIVE",
        notes=customer.notes,
        created_at=customer.created_at,
        active_loans_count=0,
        total_borrowed=0.0,
        total_collected=0.0,
        balance_due=0.0
    )


@router.put("/{customer_id}", response_model=schemas.CustomerOut)
def update_customer(
    customer_id: int,
    data: schemas.CustomerUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.business_id == current_user.business_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if data.name is not None:
        customer.name = data.name.strip()
    if data.phone is not None:
        new_phone = data.phone.strip()
        # Duplicate check if phone changed
        if new_phone != customer.phone:
            dup = db.query(models.Customer).filter(
                models.Customer.business_id == current_user.business_id,
                models.Customer.phone == new_phone,
                models.Customer.id != customer.id
            ).first()
            if dup:
                raise HTTPException(status_code=400, detail=f"Phone number '{new_phone}' is already registered to '{dup.name}'.")
            customer.phone = new_phone
    if data.alt_phone is not None:
        customer.alt_phone = data.alt_phone.strip() or None
    if data.area is not None:
        customer.area = data.area.strip()
    if data.address is not None:
        customer.address = data.address.strip() or None
    if data.occupation is not None:
        customer.occupation = data.occupation.strip() or None
    if data.guarantor_name is not None:
        customer.guarantor_name = data.guarantor_name.strip() or None
    if data.guarantor_phone is not None:
        customer.guarantor_phone = data.guarantor_phone.strip() or None
    if data.id_proof_type is not None:
        customer.id_proof_type = data.id_proof_type
    if data.id_proof_number is not None:
        customer.id_proof_number = data.id_proof_number.strip() or None
    if data.status is not None:
        customer.status = data.status.upper()
    if data.notes is not None:
        customer.notes = data.notes

    db.commit()
    db.refresh(customer)

    record_audit(
        db,
        current_user.business_id,
        current_user.id,
        current_user.name,
        "EDIT_CUSTOMER",
        f"Updated profile for customer '{customer.name}' (ID: {customer.id})"
    )

    active_loans = [l for l in customer.loans if l.status == "ACTIVE"]
    total_borrowed = sum(l.total_return_amount for l in customer.loans)
    total_collected = sum(coll.amount for coll in customer.collections)
    balance_due = max(0.0, round(total_borrowed - total_collected, 2))

    return schemas.CustomerOut(
        id=customer.id,
        business_id=customer.business_id,
        partner_id=customer.partner_id,
        partner_name=customer.partner.name if customer.partner else "Unknown",
        name=customer.name,
        phone=customer.phone,
        alt_phone=customer.alt_phone,
        area=customer.area,
        address=customer.address,
        occupation=customer.occupation,
        guarantor_name=customer.guarantor_name,
        guarantor_phone=customer.guarantor_phone,
        id_proof_type=customer.id_proof_type,
        id_proof_number=customer.id_proof_number,
        id_proof=customer.id_proof,
        status=customer.status or "ACTIVE",
        notes=customer.notes,
        created_at=customer.created_at,
        active_loans_count=len(active_loans),
        total_borrowed=float(total_borrowed),
        total_collected=float(total_collected),
        balance_due=float(balance_due)
    )


@router.get("/{customer_id}/history", response_model=schemas.CustomerHistoryOut)
def get_customer_history(
    customer_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.business_id == current_user.business_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    lifetime_principal = sum(l.principal_amount for l in customer.loans)
    lifetime_total_return = sum(l.total_return_amount for l in customer.loans)
    lifetime_repaid = sum(coll.amount for coll in customer.collections)
    active_bal = max(0.0, round(lifetime_total_return - lifetime_repaid, 2))

    completed_count = sum(1 for l in customer.loans if l.status == "COMPLETED")
    active_loans_list = [l for l in customer.loans if l.status == "ACTIVE"]

    customer_out = schemas.CustomerOut(
        id=customer.id,
        business_id=customer.business_id,
        partner_id=customer.partner_id,
        partner_name=customer.partner.name if customer.partner else "Unknown",
        name=customer.name,
        phone=customer.phone,
        alt_phone=customer.alt_phone,
        area=customer.area,
        address=customer.address,
        occupation=customer.occupation,
        guarantor_name=customer.guarantor_name,
        guarantor_phone=customer.guarantor_phone,
        id_proof_type=customer.id_proof_type,
        id_proof_number=customer.id_proof_number,
        id_proof=customer.id_proof,
        status=customer.status or "ACTIVE",
        notes=customer.notes,
        created_at=customer.created_at,
        active_loans_count=len(active_loans_list),
        total_borrowed=float(lifetime_total_return),
        total_collected=float(lifetime_repaid),
        balance_due=float(active_bal)
    )

    loans_out = []
    for l in sorted(customer.loans, key=lambda x: x.created_at, reverse=True):
        colls = sum(c.amount for c in l.collections)
        rem = max(0.0, round(l.total_return_amount - colls, 2))
        paid_count = sum(1 for inst in l.installments if inst.status == "PAID")

        loans_out.append(schemas.LoanOut(
            id=l.id,
            business_id=l.business_id,
            customer_id=l.customer_id,
            customer_name=customer.name,
            customer_phone=customer.phone,
            customer_area=customer.area,
            disbursed_by_partner_id=l.disbursed_by_partner_id,
            disbursed_by_partner_name=l.disbursed_by.name if l.disbursed_by else "Partner",
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
            total_collected=float(colls),
            remaining_balance=float(rem),
            installments_paid=paid_count,
            total_installments=l.tenure_duration,
            created_at=l.created_at,
            installments=[schemas.LoanInstallmentOut.model_validate(inst) for inst in l.installments]
        ))

    return schemas.CustomerHistoryOut(
        customer=customer_out,
        loans=loans_out,
        lifetime_principal_borrowed=float(lifetime_principal),
        lifetime_repaid=float(lifetime_repaid),
        active_balance=float(active_bal),
        total_loans_count=len(customer.loans),
        completed_loans_count=completed_count
    )

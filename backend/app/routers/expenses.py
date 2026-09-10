import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth_utils import get_current_user
from ..audit_utils import record_audit

router = APIRouter(prefix="/api/expenses", tags=["Business Expenses"])

@router.post("", response_model=schemas.ExpenseOut)
def record_expense(
    data: schemas.ExpenseCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.business_id:
        raise HTTPException(status_code=400, detail="User must belong to a business loop to record expenses")

    expense = models.Expense(
        business_id=current_user.business_id,
        recorded_by_partner_id=current_user.id,
        category=data.category.strip(),
        amount=round(data.amount, 2),
        payment_mode=data.payment_mode.upper(),
        date=data.date or datetime.datetime.utcnow(),
        notes=data.notes
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    record_audit(
        db,
        current_user.business_id,
        current_user.id,
        current_user.name,
        "RECORD_EXPENSE",
        f"Recorded expense of ₹{expense.amount:,.2f} under '{expense.category}' ({expense.payment_mode})"
    )

    return schemas.ExpenseOut(
        id=expense.id,
        business_id=expense.business_id,
        recorded_by_partner_id=expense.recorded_by_partner_id,
        recorded_by_partner_name=current_user.name,
        category=expense.category,
        amount=expense.amount,
        payment_mode=expense.payment_mode,
        date=expense.date,
        notes=expense.notes,
        created_at=expense.created_at
    )


@router.get("", response_model=List[schemas.ExpenseOut])
def get_expenses(
    category: Optional[str] = Query(None),
    payment_mode: Optional[str] = Query(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.business_id:
        return []

    query = db.query(models.Expense).filter(models.Expense.business_id == current_user.business_id)

    if category:
        query = query.filter(models.Expense.category.ilike(f"%{category.strip()}%"))
    if payment_mode:
        query = query.filter(models.Expense.payment_mode == payment_mode.upper())

    expenses = query.order_by(models.Expense.date.desc()).all()

    return [
        schemas.ExpenseOut(
            id=e.id,
            business_id=e.business_id,
            recorded_by_partner_id=e.recorded_by_partner_id,
            recorded_by_partner_name=e.recorded_by.name if e.recorded_by else "Partner",
            category=e.category,
            amount=e.amount,
            payment_mode=e.payment_mode,
            date=e.date,
            notes=e.notes,
            created_at=e.created_at
        )
        for e in expenses
    ]


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.business_id == current_user.business_id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense record not found")

    amt = expense.amount
    cat = expense.category
    db.delete(expense)
    db.commit()

    record_audit(
        db,
        current_user.business_id,
        current_user.id,
        current_user.name,
        "DELETE_EXPENSE",
        f"Deleted expense of ₹{amt:,.2f} ({cat})"
    )

    return {"message": "Expense record deleted successfully"}

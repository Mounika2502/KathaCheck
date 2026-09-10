import io
import csv
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth_utils import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports & Exports"])

@router.get("/summary", response_model=schemas.ReportSummaryOut)
def get_report_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    area: Optional[str] = Query(None),
    partner_id: Optional[int] = Query(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.business_id:
        return schemas.ReportSummaryOut(
            total_disbursed=0,
            total_collected=0,
            cash_collected=0,
            online_collected=0,
            total_expenses=0,
            net_collections=0,
            active_loans_count=0,
            completed_loans_count=0,
            overdue_loans_count=0,
            total_overdue_amount=0
        )

    b_id = current_user.business_id

    # Parse dates if provided
    start_dt = datetime.datetime.fromisoformat(start_date) if start_date else datetime.datetime(2020, 1, 1)
    end_dt = datetime.datetime.fromisoformat(end_date) if end_date else datetime.datetime(2099, 12, 31, 23, 59, 59)

    # Collections
    coll_q = db.query(models.Collection).join(models.Customer).filter(
        models.Collection.business_id == b_id,
        models.Collection.collection_date >= start_dt,
        models.Collection.collection_date <= end_dt
    )
    if area:
        coll_q = coll_q.filter(models.Customer.area.ilike(f"%{area.strip()}%"))
    if partner_id:
        coll_q = coll_q.filter(models.Collection.collected_by_partner_id == partner_id)

    collections = coll_q.all()
    tot_coll = sum(c.amount for c in collections)
    cash_coll = sum(c.amount for c in collections if c.payment_mode == "CASH")
    online_coll = sum(c.amount for c in collections if c.payment_mode == "ONLINE")

    # Expenses
    exp_q = db.query(models.Expense).filter(
        models.Expense.business_id == b_id,
        models.Expense.date >= start_dt,
        models.Expense.date <= end_dt
    )
    if partner_id:
        exp_q = exp_q.filter(models.Expense.recorded_by_partner_id == partner_id)
    expenses = exp_q.all()
    tot_exp = sum(e.amount for e in expenses)

    # Loans
    loan_q = db.query(models.Loan).join(models.Customer).filter(models.Loan.business_id == b_id)
    if area:
        loan_q = loan_q.filter(models.Customer.area.ilike(f"%{area.strip()}%"))
    if partner_id:
        loan_q = loan_q.filter(models.Loan.disbursed_by_partner_id == partner_id)

    loans = loan_q.all()
    tot_disbursed = sum(l.principal_amount for l in loans)
    active_count = sum(1 for l in loans if l.status == "ACTIVE")
    completed_count = sum(1 for l in loans if l.status == "COMPLETED")

    # Overdue Installments
    now = datetime.datetime.utcnow()
    inst_q = db.query(models.LoanInstallment).join(models.Loan).join(models.Customer).filter(
        models.LoanInstallment.business_id == b_id,
        models.Loan.status == "ACTIVE",
        models.LoanInstallment.due_date < now,
        models.LoanInstallment.status != "PAID"
    )
    if area:
        inst_q = inst_q.filter(models.Customer.area.ilike(f"%{area.strip()}%"))
    if partner_id:
        inst_q = inst_q.filter(models.Customer.partner_id == partner_id)

    overdue_insts = inst_q.all()
    overdue_amt = sum(max(0.0, inst.expected_amount - inst.paid_amount) for inst in overdue_insts)
    overdue_loans_count = len(set(inst.loan_id for inst in overdue_insts))

    return schemas.ReportSummaryOut(
        total_disbursed=float(tot_disbursed),
        total_collected=float(tot_coll),
        cash_collected=float(cash_coll),
        online_collected=float(online_coll),
        total_expenses=float(tot_exp),
        net_collections=float(tot_coll - tot_exp),
        active_loans_count=active_count,
        completed_loans_count=completed_count,
        overdue_loans_count=overdue_loans_count,
        total_overdue_amount=float(overdue_amt)
    )


@router.get("/export/collections.csv")
def export_collections_csv(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.business_id:
        return Response(content="", media_type="text/csv")

    collections = db.query(models.Collection).filter(
        models.Collection.business_id == current_user.business_id
    ).order_by(models.Collection.collection_date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Collection ID", "Date", "Customer Name", "Customer Area",
        "Installment Number", "Amount (INR)", "Payment Mode",
        "Collected By Partner", "Notes"
    ])

    for c in collections:
        writer.writerow([
            c.id,
            c.collection_date.strftime("%Y-%m-%d %H:%M"),
            c.customer.name if c.customer else "Unknown",
            c.customer.area if c.customer else "",
            c.installment_number,
            c.amount,
            c.payment_mode,
            c.collected_by.name if c.collected_by else "",
            c.notes or ""
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=collections_{datetime.date.today()}.csv"}
    )


@router.get("/export/overdue.csv")
def export_overdue_csv(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.business_id:
        return Response(content="", media_type="text/csv")

    now = datetime.datetime.utcnow()
    overdue_insts = db.query(models.LoanInstallment).join(models.Loan).join(models.Customer).filter(
        models.LoanInstallment.business_id == current_user.business_id,
        models.Loan.status == "ACTIVE",
        models.LoanInstallment.due_date < now,
        models.LoanInstallment.status != "PAID"
    ).order_by(models.LoanInstallment.due_date.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Installment ID", "Loan ID", "Customer Name", "Phone", "Area",
        "Installment #", "Due Date", "Expected Amount", "Paid Amount",
        "Due Balance", "Days Overdue", "Partner In Charge"
    ])

    for inst in overdue_insts:
        due_bal = max(0.0, round(inst.expected_amount - inst.paid_amount, 2))
        days = max(0, (now.date() - inst.due_date.date()).days)
        writer.writerow([
            inst.id,
            inst.loan_id,
            inst.customer.name if inst.customer else "",
            inst.customer.phone if inst.customer else "",
            inst.customer.area if inst.customer else "",
            inst.installment_number,
            inst.due_date.strftime("%Y-%m-%d"),
            inst.expected_amount,
            inst.paid_amount,
            due_bal,
            days,
            inst.loan.disbursed_by.name if inst.loan and inst.loan.disbursed_by else ""
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=overdue_{datetime.date.today()}.csv"}
    )

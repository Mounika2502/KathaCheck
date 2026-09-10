import datetime
from typing import List
from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth_utils import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/metrics", response_model=schemas.DashboardMetricsOut)
def get_dashboard_metrics(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.business_id:
        return schemas.DashboardMetricsOut(
            total_pool_capital=0,
            total_capital_withdrawn=0,
            net_pool_capital=0,
            total_principal_disbursed=0,
            total_expected_return=0,
            total_expected_interest=0,
            total_collected=0,
            cash_collected=0,
            online_collected=0,
            total_expenses=0,
            cash_expenses=0,
            online_expenses=0,
            net_profit_earned=0,
            outstanding_balance=0,
            pool_cash_remaining=0,
            active_customers_count=0,
            active_loans_count=0,
            overdue_installments_count=0,
            partners_count=0,
            today_summary=None,
            weekly_collections=[],
            partners_summary=[]
        )

    b_id = current_user.business_id

    # 1. Partner investments & withdrawals
    investments_records = db.query(models.PartnerInvestment).filter(models.PartnerInvestment.business_id == b_id).all()
    total_inv = sum(i.amount for i in investments_records if getattr(i, 'transaction_type', 'INVESTMENT') == "INVESTMENT")
    total_withdrawn = sum(i.amount for i in investments_records if getattr(i, 'transaction_type', 'INVESTMENT') == "WITHDRAWAL")
    net_pool_cap = max(0.0, total_inv - total_withdrawn)

    # 2. Loans
    loans = db.query(models.Loan).filter(models.Loan.business_id == b_id).all()
    total_principal_disbursed = sum(l.principal_amount for l in loans)
    total_expected_return = sum(l.total_return_amount for l in loans)
    total_expected_interest = sum(l.interest_amount for l in loans)
    active_loans = [l for l in loans if l.status == "ACTIVE"]

    # 3. Collections
    collections = db.query(models.Collection).filter(models.Collection.business_id == b_id).all()
    total_collected = sum(c.amount for c in collections)
    cash_collected = sum(c.amount for c in collections if c.payment_mode == "CASH")
    online_collected = sum(c.amount for c in collections if c.payment_mode == "ONLINE")

    # 4. Expenses
    expenses = db.query(models.Expense).filter(models.Expense.business_id == b_id).all()
    total_expenses = sum(e.amount for e in expenses)
    cash_expenses = sum(e.amount for e in expenses if e.payment_mode == "CASH")
    online_expenses = sum(e.amount for e in expenses if e.payment_mode == "ONLINE")

    # Outstanding balance
    outstanding_balance = max(0.0, round(total_expected_return - total_collected, 2))

    # Available Loop Pool Liquidity
    pool_cash_remaining = round(total_inv - total_withdrawn - total_principal_disbursed + total_collected - total_expenses, 2)

    # Net profit projected vs realized (Interest expected - expenses)
    net_profit = round(total_expected_interest - total_expenses, 2)

    # Customers
    customers = db.query(models.Customer).filter(models.Customer.business_id == b_id).all()

    # Overdue installments
    now = datetime.datetime.utcnow()
    overdue_count = db.query(models.LoanInstallment).join(models.Loan).filter(
        models.LoanInstallment.business_id == b_id,
        models.Loan.status == "ACTIVE",
        models.LoanInstallment.due_date < now,
        models.LoanInstallment.status != "PAID"
    ).count()

    # Today's Route Summary
    start_of_today = datetime.datetime(now.year, now.month, now.day, 0, 0, 0)
    end_of_today = datetime.datetime(now.year, now.month, now.day, 23, 59, 59)
    colls_today = [c for c in collections if c.collection_date and start_of_today <= c.collection_date <= end_of_today]
    tot_coll_today = sum(c.amount for c in colls_today)

    due_today_insts = db.query(models.LoanInstallment).join(models.Loan).filter(
        models.LoanInstallment.business_id == b_id,
        models.Loan.status == "ACTIVE",
        models.LoanInstallment.due_date <= end_of_today
    ).all()
    tot_exp_today = sum(inst.expected_amount for inst in due_today_insts)
    pending_today = sum(max(0.0, inst.expected_amount - inst.paid_amount) for inst in due_today_insts if inst.status in ["PENDING", "PARTIAL"])
    overdue_insts = [inst for inst in due_today_insts if inst.status in ["PENDING", "PARTIAL", "OVERDUE"] and inst.due_date.date() < now.date()]
    overdue_amt = sum(max(0.0, inst.expected_amount - inst.paid_amount) for inst in overdue_insts)

    today_summary = schemas.TodayRouteSummaryOut(
        total_expected_today=float(tot_exp_today),
        total_collected_today=float(tot_coll_today),
        pending_amount=float(pending_today),
        overdue_amount=float(overdue_amt),
        total_items_count=len(due_today_insts),
        paid_items_count=sum(1 for i in due_today_insts if i.status == "PAID"),
        pending_items_count=sum(1 for i in due_today_insts if i.status in ["PENDING", "PARTIAL"] and i.due_date.date() >= now.date()),
        overdue_items_count=len(overdue_insts)
    )

    # Partners summary
    partners = db.query(models.User).filter(models.User.business_id == b_id).all()
    partners_summary = []
    for p in partners:
        p_inv = sum(i.amount for i in p.investments if getattr(i, 'transaction_type', 'INVESTMENT') == "INVESTMENT")
        p_withd = sum(i.amount for i in p.investments if getattr(i, 'transaction_type', 'INVESTMENT') == "WITHDRAWAL")
        p_net = max(0.0, p_inv - p_withd)
        p_eq = round((p_net / net_pool_cap) * 100, 1) if net_pool_cap > 0 else 0.0

        p_disbursed = sum(l.principal_amount for l in p.loans_disbursed)
        p_collected = sum(c.amount for c in p.collections_made)

        partners_summary.append(schemas.PartnerSummary(
            id=p.id,
            name=p.name,
            email=p.email,
            phone=p.phone,
            total_invested=float(p_inv),
            total_withdrawn=float(p_withd),
            net_capital=float(p_net),
            equity_percentage=float(p_eq),
            total_loans_disbursed=float(p_disbursed),
            total_collections_made=float(p_collected),
            customers_count=len(p.customers)
        ))

    # Weekly collection history
    weekly_map = defaultdict(lambda: {"total": 0.0, "cash": 0.0, "online": 0.0})
    for c in collections:
        dt = c.collection_date or datetime.datetime.utcnow()
        year, week, _ = dt.isocalendar()
        key = f"Wk {week} ({year})"
        weekly_map[key]["total"] += c.amount
        if c.payment_mode == "CASH":
            weekly_map[key]["cash"] += c.amount
        else:
            weekly_map[key]["online"] += c.amount

    if not weekly_map:
        current_year, current_wk, _ = datetime.datetime.utcnow().isocalendar()
        key = f"Wk {current_wk} ({current_year})"
        weekly_map[key] = {"total": 0.0, "cash": 0.0, "online": 0.0}

    weekly_points = [
        schemas.WeeklyCollectionPoint(
            period=k,
            total_collected=v["total"],
            cash_collected=v["cash"],
            online_collected=v["online"]
        )
        for k, v in weekly_map.items()
    ]

    return schemas.DashboardMetricsOut(
        total_pool_capital=float(total_inv),
        total_capital_withdrawn=float(total_withdrawn),
        net_pool_capital=float(net_pool_cap),
        total_principal_disbursed=float(total_principal_disbursed),
        total_expected_return=float(total_expected_return),
        total_expected_interest=float(total_expected_interest),
        total_collected=float(total_collected),
        cash_collected=float(cash_collected),
        online_collected=float(online_collected),
        total_expenses=float(total_expenses),
        cash_expenses=float(cash_expenses),
        online_expenses=float(online_expenses),
        net_profit_earned=float(net_profit),
        outstanding_balance=float(outstanding_balance),
        pool_cash_remaining=float(pool_cash_remaining),
        active_customers_count=len(customers),
        active_loans_count=len(active_loans),
        overdue_installments_count=overdue_count,
        partners_count=len(partners),
        today_summary=today_summary,
        weekly_collections=weekly_points,
        partners_summary=partners_summary
    )

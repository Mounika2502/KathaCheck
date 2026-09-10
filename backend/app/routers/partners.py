import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth_utils import get_current_user
from ..audit_utils import record_audit
from .loans import get_available_pool_cash

router = APIRouter(prefix="/api/partners", tags=["Partners & Capital Pool"])

@router.get("", response_model=List[schemas.PartnerSummary])
def get_partners(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.business_id:
        return []

    partners = db.query(models.User).filter(models.User.business_id == current_user.business_id).all()
    
    # Calculate pool net capital first for equity percentage
    partner_nets = {}
    for p in partners:
        inv = sum(i.amount for i in p.investments if getattr(i, 'transaction_type', 'INVESTMENT') == "INVESTMENT")
        withd = sum(i.amount for i in p.investments if getattr(i, 'transaction_type', 'INVESTMENT') == "WITHDRAWAL")
        partner_nets[p.id] = max(0.0, inv - withd)

    total_pool_net = sum(partner_nets.values())
    results = []

    for partner in partners:
        inv_sum = sum(i.amount for i in partner.investments if getattr(i, 'transaction_type', 'INVESTMENT') == "INVESTMENT")
        withd_sum = sum(i.amount for i in partner.investments if getattr(i, 'transaction_type', 'INVESTMENT') == "WITHDRAWAL")
        net_cap = partner_nets[partner.id]
        equity_pct = round((net_cap / total_pool_net) * 100, 1) if total_pool_net > 0 else 0.0

        disbursed_sum = sum(l.principal_amount for l in partner.loans_disbursed)
        coll_sum = sum(c.amount for c in partner.collections_made)
        cust_count = len(partner.customers)

        results.append(schemas.PartnerSummary(
            id=partner.id,
            name=partner.name,
            email=partner.email,
            phone=partner.phone,
            total_invested=float(inv_sum),
            total_withdrawn=float(withd_sum),
            net_capital=float(net_cap),
            equity_percentage=float(equity_pct),
            total_loans_disbursed=float(disbursed_sum),
            total_collections_made=float(coll_sum),
            customers_count=cust_count
        ))

    return results


@router.get("/investments", response_model=List[schemas.InvestmentOut])
def get_investments(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.business_id:
        return []

    investments = db.query(models.PartnerInvestment).filter(
        models.PartnerInvestment.business_id == current_user.business_id
    ).order_by(models.PartnerInvestment.date.desc()).all()

    return [
        schemas.InvestmentOut(
            id=inv.id,
            business_id=inv.business_id,
            partner_id=inv.partner_id,
            partner_name=inv.partner.name if inv.partner else "Unknown",
            amount=inv.amount,
            transaction_type=getattr(inv, 'transaction_type', 'INVESTMENT') or "INVESTMENT",
            date=inv.date,
            notes=inv.notes
        )
        for inv in investments
    ]


@router.post("/investments", response_model=schemas.InvestmentOut)
def add_investment(
    data: schemas.InvestmentCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.business_id:
        raise HTTPException(status_code=400, detail="User must belong to a business loop to invest capital")

    inv = models.PartnerInvestment(
        business_id=current_user.business_id,
        partner_id=current_user.id,
        amount=round(data.amount, 2),
        transaction_type="INVESTMENT",
        notes=data.notes,
        date=data.date or datetime.datetime.utcnow()
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    record_audit(
        db,
        current_user.business_id,
        current_user.id,
        current_user.name,
        "CAPITAL_INJECTION",
        f"Injected capital of ₹{inv.amount:,.2f} into pool"
    )

    return schemas.InvestmentOut(
        id=inv.id,
        business_id=inv.business_id,
        partner_id=inv.partner_id,
        partner_name=current_user.name,
        amount=inv.amount,
        transaction_type="INVESTMENT",
        date=inv.date,
        notes=inv.notes
    )


@router.post("/withdrawals", response_model=schemas.InvestmentOut)
def record_withdrawal(
    data: schemas.WithdrawalCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.business_id:
        raise HTTPException(status_code=400, detail="User must belong to a business loop to withdraw capital")

    # 1. Verify partner's net capital
    partner_inv = sum(i.amount for i in current_user.investments if getattr(i, 'transaction_type', 'INVESTMENT') == "INVESTMENT")
    partner_withd = sum(i.amount for i in current_user.investments if getattr(i, 'transaction_type', 'INVESTMENT') == "WITHDRAWAL")
    partner_net = partner_inv - partner_withd

    if data.amount > partner_net:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot withdraw ₹{data.amount:,.2f}. Your current net capital contribution is only ₹{partner_net:,.2f}."
        )

    # 2. Verify available pool liquidity
    available_cash = get_available_pool_cash(db, current_user.business_id)
    if data.amount > available_cash:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot withdraw ₹{data.amount:,.2f}. Available loop liquidity is only ₹{available_cash:,.2f}."
        )

    withd = models.PartnerInvestment(
        business_id=current_user.business_id,
        partner_id=current_user.id,
        amount=round(data.amount, 2),
        transaction_type="WITHDRAWAL",
        notes=data.notes,
        date=data.date or datetime.datetime.utcnow()
    )
    db.add(withd)
    db.commit()
    db.refresh(withd)

    record_audit(
        db,
        current_user.business_id,
        current_user.id,
        current_user.name,
        "CAPITAL_WITHDRAWAL",
        f"Withdrew capital of ₹{withd.amount:,.2f} from pool"
    )

    return schemas.InvestmentOut(
        id=withd.id,
        business_id=withd.business_id,
        partner_id=withd.partner_id,
        partner_name=current_user.name,
        amount=withd.amount,
        transaction_type="WITHDRAWAL",
        date=withd.date,
        notes=withd.notes
    )

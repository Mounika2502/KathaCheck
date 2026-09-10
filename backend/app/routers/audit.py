from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth_utils import get_current_user

router = APIRouter(prefix="/api/audit", tags=["Audit Logs"])

@router.get("", response_model=List[schemas.AuditLogOut])
def get_audit_logs(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.business_id:
        return []

    logs = db.query(models.AuditLog).filter(
        models.AuditLog.business_id == current_user.business_id
    ).order_by(models.AuditLog.timestamp.desc()).limit(100).all()

    return [
        schemas.AuditLogOut(
            id=log.id,
            business_id=log.business_id,
            user_id=log.user_id,
            user_name=log.user_name,
            action=log.action,
            details=log.details,
            timestamp=log.timestamp
        )
        for log in logs
    ]

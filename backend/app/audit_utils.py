import datetime
from sqlalchemy.orm import Session
from . import models

def record_audit(
    db: Session,
    business_id: int,
    user_id: int,
    user_name: str,
    action: str,
    details: str
):
    try:
        log = models.AuditLog(
            business_id=business_id,
            user_id=user_id,
            user_name=user_name,
            action=action,
            details=details,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Failed to record audit log: {e}")

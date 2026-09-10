import datetime
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth_utils import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    generate_otp, 
    get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register", response_model=schemas.TokenOut)
def register(data: schemas.UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    business = None
    role = "partner"

    if data.invite_code:
        # Join existing business
        business = db.query(models.Business).filter(models.Business.invite_code == data.invite_code.strip().upper()).first()
        if not business:
            raise HTTPException(status_code=404, detail="Invalid business invite code. Please verify with your partner.")
    elif data.business_name:
        # Create a new business loop
        invite_code = f"KC-{secrets.token_hex(2).upper()}"
        business = models.Business(name=data.business_name.strip(), invite_code=invite_code)
        db.add(business)
        db.commit()
        db.refresh(business)
        role = "admin"

    user = models.User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        hashed_password=get_password_hash(data.password),
        role=role,
        business_id=business.id if business else None
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if business and role == "admin" and not business.created_by_user_id:
        business.created_by_user_id = user.id
        db.commit()

    token = create_access_token({"sub": str(user.id)})
    
    user_out = schemas.UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        business_id=user.business_id,
        business_name=user.business.name if user.business else None,
        invite_code=user.business.invite_code if user.business else None,
        created_at=user.created_at
    )
    return {"access_token": token, "token_type": "bearer", "user": user_out}


@router.post("/login", response_model=schemas.TokenOut)
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    token = create_access_token({"sub": str(user.id)})
    user_out = schemas.UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        business_id=user.business_id,
        business_name=user.business.name if user.business else None,
        invite_code=user.business.invite_code if user.business else None,
        created_at=user.created_at
    )
    return {"access_token": token, "token_type": "bearer", "user": user_out}


@router.post("/forgot-password")
def forgot_password(data: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    ident = data.email_or_phone.strip()
    user = db.query(models.User).filter(
        (models.User.email == ident) | (models.User.phone == ident)
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="No account registered with this email or phone number")

    otp = generate_otp()
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)

    otp_record = models.OtpToken(
        identifier=ident,
        otp_code=otp,
        purpose="RESET_PASSWORD",
        expires_at=expires_at,
        is_used=False
    )
    db.add(otp_record)
    db.commit()

    return {
        "message": "OTP has been generated successfully. Valid for 10 minutes.",
        "identifier": ident,
        "dev_otp": otp # Provided for quick and direct testing without SMS/SMTP gateway
    }


@router.post("/verify-otp")
def verify_otp(data: schemas.VerifyOtpRequest, db: Session = Depends(get_db)):
    ident = data.email_or_phone.strip()
    now = datetime.datetime.utcnow()
    
    otp_record = db.query(models.OtpToken).filter(
        models.OtpToken.identifier == ident,
        models.OtpToken.otp_code == data.otp_code.strip(),
        models.OtpToken.is_used == False,
        models.OtpToken.expires_at > now
    ).order_by(models.OtpToken.id.desc()).first()

    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    return {"message": "OTP verified successfully", "verified": True}


@router.post("/reset-password")
def reset_password(data: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    ident = data.email_or_phone.strip()
    now = datetime.datetime.utcnow()

    otp_record = db.query(models.OtpToken).filter(
        models.OtpToken.identifier == ident,
        models.OtpToken.otp_code == data.otp_code.strip(),
        models.OtpToken.is_used == False,
        models.OtpToken.expires_at > now
    ).order_by(models.OtpToken.id.desc()).first()

    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user = db.query(models.User).filter(
        (models.User.email == ident) | (models.User.phone == ident)
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    user.hashed_password = get_password_hash(data.new_password)
    otp_record.is_used = True
    db.commit()

    return {"message": "Password has been successfully updated. You can now login."}


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return schemas.UserOut(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role,
        business_id=current_user.business_id,
        business_name=current_user.business.name if current_user.business else None,
        invite_code=current_user.business.invite_code if current_user.business else None,
        created_at=current_user.created_at
    )

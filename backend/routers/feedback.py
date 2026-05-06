from fastapi import APIRouter, HTTPException,Depends
from schemas import SupportRequest
from email_utils import send_support_email_to_admins
from models import DBAppUser
from auth_utils import get_current_user


router = APIRouter(tags = ["Support"])


@router.post("/support/contact")
async def contact_support(
    payload: SupportRequest,
    user: DBAppUser = Depends(get_current_user)
):
    try:
        send_support_email_to_admins(
            user_email=user.email,
            user_message=payload.message
        )
        return {"detail": "Дякуємо! Ми отримали ваше повідомлення."}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Помилка відправки")

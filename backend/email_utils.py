import smtplib
import os
from email.message import EmailMessage

def send_verification_email(email_to: str, token: str):
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 465
    SENDER_EMAIL = os.getenv("SMTP_EMAIL")
    SENDER_PASSWORD = os.getenv("SMTP_PASSWORD")
    BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000")

    verify_link = f"{BASE_URL}/auth/verify?token={token}"

    msg = EmailMessage()
    msg["Subject"] = "Підтвердження реєстрації"
    msg["From"] = SENDER_EMAIL
    msg["To"] = email_to

    body = f"""
    <html>
        <body>
            <h2>Вітаємо!</h2>
            <p>Для завершення реєстрації та підтвердження email, будь ласка, натисніть на кнопку нижче:</p>
            <a href="{verify_link}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Підтвердити Email</a>
            <br><br>
            <p>Або скопіюйте це посилання у браузер:</p>
            <p><a href="{verify_link}">{verify_link}</a></p>
        </body>
    </html>
    """
    msg.set_content(body, subtype="html")

    try:
        server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Емейл успішно відправлено на {email_to}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Помилка відправки емейлу: {e}")
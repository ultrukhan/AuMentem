import smtplib
import os
import base64


def send_verification_email(email_to: str, token: str):
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    SENDER_EMAIL = os.getenv("SMTP_EMAIL")
    SENDER_PASSWORD = os.getenv("SMTP_PASSWORD")
    BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000")
    verify_link = f"{BASE_URL}/auth/verify?token={token}"

    subject = "Підтвердження реєстрації"
    encoded_subject = f"=?utf-8?b?{base64.b64encode(subject.encode('utf-8')).decode('ascii')}?="

    headers = (
        f"From: {SENDER_EMAIL}\r\n"
        f"To: {email_to}\r\n"
        f"Subject: {encoded_subject}\r\n"
        f"MIME-Version: 1.0\r\n"
        f"Content-Type: text/html; charset=utf-8\r\n\r\n"
    )

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

    raw_message = (headers + body).encode('utf-8')

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)

        server.sendmail(SENDER_EMAIL, email_to, raw_message)

        server.quit()
        print(f"Емейл успішно відправлено на {email_to}")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Помилка відправки емейлу: {e}")
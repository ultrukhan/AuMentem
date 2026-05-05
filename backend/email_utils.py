import os
import requests


def send_verification_email(email_to: str, token: str):
    BREVO_API_KEY = os.getenv("BREVO_API_KEY")
    SENDER_EMAIL = os.getenv("SMTP_EMAIL")
    BASE_URL = os.getenv("BASE_URL", "https://altera-v8cl.onrender.com")

    verify_link = f"{BASE_URL}/auth/verify?token={token}"

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }

    html_content = f"""
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

    payload = {
        "sender": {"name": "Altera", "email": SENDER_EMAIL},
        "to": [{"email": email_to}],
        "subject": "Підтвердження реєстрації",
        "htmlContent": html_content
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        print(f"Емейл успішно відправлено на {email_to} через Brevo")
    except Exception as e:
        print(f"Помилка відправки емейлу (Brevo): {e}")
        if isinstance(e, requests.exceptions.HTTPError):
            print(f"Деталі помилки: {e.response.text}")
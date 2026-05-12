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


def send_support_email_to_admins(user_email: str, user_message: str):
    BREVO_API_KEY = os.getenv("BREVO_API_KEY")
    SENDER_EMAIL = os.getenv("SMTP_EMAIL")
    ADMIN_EMAIL = os.getenv("SMTP_EMAIL")

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }

    html_content = f"""
    <html>
        <body>
            <h2>Нове звернення в підтримку!</h2>
            <p><strong>Від користувача:</strong> {user_email}</p>
            <p><strong>Повідомлення:</strong></p>
            <blockquote style="background: #f9f9f9; padding: 15px; border-left: 5px solid #ccc;">
                {user_message}
            </blockquote>
        </body>
    </html>
    """

    payload = {
        "sender": {"name": "Altera Support Form", "email": SENDER_EMAIL},
        "to": [{"email": ADMIN_EMAIL}],
        "replyTo": {"email": user_email},
        "subject": "Нове повідомлення з додатку",
        "htmlContent": html_content
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        print("Повідомлення в підтримку успішно переслано адмінам")
    except Exception as e:
        print(f"Помилка відправки підтримки: {e}")


def send_password_reset_email(email_to: str, token: str):
    BREVO_API_KEY = os.getenv("BREVO_API_KEY")
    SENDER_EMAIL = os.getenv("SMTP_EMAIL")
    BASE_URL = os.getenv("BASE_URL", "https://altera-v8cl.onrender.com")

    reset_link = f"{BASE_URL}/auth/reset-password?token={token}"

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }

    html_content = f"""
    <html>
        <body>
            <h2>Відновлення пароля</h2>
            <p>Ви отримали цей лист, бо хтось запитав скидання пароля для вашого акаунта у додатку Altera.</p>
            <p>Щоб встановити новий пароль, натисніть на кнопку нижче:</p>
            <a href="{reset_link}" style="display: inline-block; padding: 10px 20px; background-color: #f57c00; color: white; text-decoration: none; border-radius: 5px;">Змінити пароль</a>
            <br><br>
            <p>Якщо це були не ви, просто проігноруйте цей лист.</p>
        </body>
    </html>
    """

    payload = {
        "sender": {"name": "Altera", "email": SENDER_EMAIL},
        "to": [{"email": email_to}],
        "subject": "Відновлення пароля",
        "htmlContent": html_content
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
    except Exception as e:
        print(f"Помилка відправки емейлу (Brevo): {e}")


def send_weekly_stats_email(
    email_to: str,
    geo_count: int,
    mini_count: int,
    active_days: int,
    top_hobby: str,
    unique_locs: int,
    global_geo: str,
    global_mini: str
):
    """
    Відправляє користувачу лист із тижневою статистикою.
    """
    BREVO_API_KEY = os.getenv("BREVO_API_KEY")
    SENDER_EMAIL = os.getenv("SMTP_EMAIL")

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }

    hobby_text = f"🎨 Ваше улюблене хобі тижня: <b>{top_hobby}</b>" if top_hobby else "🎨 Ви пробували різні активності!"

    html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #f57c00;">Ваші підсумки тижня в Altera 🏆</h2>
                <p>Ви круто попрацювали над собою за останні 7 днів!</p>

                <div style="background-color: #f4f7f6; padding: 20px; border-radius: 8px;">
                    <p>🔥 Активних днів: <b>{active_days} з 7</b></p>
                    <p>🌍 Пройдено гео-квестів: <b>{geo_count}</b> (у <b>{unique_locs}</b> місцях)</p>
                    <p>🎯 Виконано міні-квестів: <b>{mini_count}</b></p>
                    <p>{hobby_text}</p>
                </div>

                <h3 style="color: #2e7d32;">Що відбувалося в спільноті:</h3>
                <p>🏆 Найпопулярніший гео-квест: <b>{global_geo}</b></p>
                <p>⚡️ Хіт тижня серед міні-квестів: <b>{global_mini}</b></p>

                <p>Заходьте в додаток, щоб побити свої рекорди!</p>
                <br>
                <p style="color: #777; font-size: 12px;"><i>З любов'ю, команда Altera 🧡</i></p>
            </body>
        </html>
        """

    payload = {
        "sender": {"name": "Altera", "email": SENDER_EMAIL},
        "to": [{"email": email_to}],
        "subject": "Ваші підсумки тижня в Altera 🏆",
        "htmlContent": html_content
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        print(f"Статистика успішно відправлена на {email_to}")
    except Exception as e:
        print(f"Помилка відправки статистики (Brevo) для {email_to}: {e}")

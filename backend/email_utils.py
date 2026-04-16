def send_verification_email(email_to: str, token: str):
    # Це посилання, по якому клікне користувач
    verify_link = f"http://127.0.0.1:8000/auth/verify?token={token}"

    print(f"\nСимуляція відправи емейлу")
    print(f"Кому: {email_to}")
    print(f"Текст: Вітаємо! Для підтвердження реєстрації перейдіть за посиланням:")
    print(f"{verify_link}")
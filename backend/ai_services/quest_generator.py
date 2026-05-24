import os
import json
from google import genai
from google.genai.errors import APIError
from typing import List, Dict

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

async def generate_quests_by_hobbies(hobbies: List[str]) -> List[Dict[str, str]]:
    """
    Асинхронно генерує 3 міні-квести.
    Повертає список словників у форматі: [{"title": "...", "hobby_name": "..."}]
    """
    if not GEMINI_API_KEY:
        print("Помилка: Не знайдено GEMINI_API_KEY")
        return []

    client = genai.Client(api_key=GEMINI_API_KEY)
    hobbies_str = ", ".join(hobbies)

    prompt = f"""
        Ти — креативний геймдизайнер мобільного додатку Altera. Твоя задача — генерувати цікаві міні-квести на основі хобі користувача.

        Доступні хобі користувача: {hobbies_str}

        Придумай рівно 3 лаконічні міні-квести. Кожен квест має відповідати ЛИШЕ ОДНОМУ КОНКРЕТНОМУ хобі зі списку вище.

        Жорсткі правила для квестів:
        1. Абсолютно безкоштовні (не вимагають покупок чи витрат).
        2. Максимально прості та легкі на підйом (займають 10-30 хвилин, без надзусиль чи складної підготовки).
        3. Лаконічні (одне коротке речення).
        4. Квести мають бути в реальному світі (не просто "погугли щось").

        ВАЖЛИВО: Твоя відповідь має бути ТІЛЬКИ у форматі валідного JSON-масиву об'єктів. Жодних вступних чи завершальних слів, без коментарів і без Markdown-тегів (без ```json).
        Кожен об'єкт повинен мати два поля:
        - "title": текст квесту.
        - "hobby_name": точна назва хобі зі списку користувача (регістр має значення), якому відповідає цей квест.
        """

    models_to_try = ['gemini-3.1-flash-lite', 'gemini-2.5-flash']

    for model_name in models_to_try:
        try:
            print(f"Генерація квестів через {model_name}...")
            response = await client.aio.models.generate_content(
                model=model_name,
                contents=prompt
            )
            raw_text = response.text.strip()

            if raw_text.startswith("```json"):
                raw_text = raw_text[7:-3]
            elif raw_text.startswith("```"):
                raw_text = raw_text[3:-3]

            quests_data = json.loads(raw_text.strip())
            print(f"Успішно згенеровано через {model_name}!")
            return quests_data

        except APIError as e:
            print(f" Модель {model_name} недоступна (Помилка {e.code}). Перемикаюсь...")
            continue
        except json.JSONDecodeError as e:
            print(f"ШІ повернув кривий JSON через {model_name}, пробую наступну...")
            continue
        except Exception as e:
            print(f"Непередбачувана помилка з {model_name}: {e}")
            continue

    print("[CRITICAL] Всі моделі ШІ недоступні. Переходимо на локальну базу даних.")
    return []
import os
import json
import google.generativeai as genai
from typing import List, Dict

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)


async def generate_quests_by_hobbies(hobbies: List[str]) -> List[str]:
    """
    Асинхронно генерує 3 міні-квести на основі списку хобі за допомогою Gemini API.
    Повертає список словників (JSON).
    """
    if not GEMINI_API_KEY:
        print("Помилка: Не знайдено GEMINI_API_KEY")
        return []

    model = genai.GenerativeModel('gemini-1.5-flash')

    hobbies_str = ", ".join(hobbies)

    prompt = f"""
        Ти — креативний генератор завдань для мобільного додатку Altera. 
        Мета додатку: допомагати людям боротися із соціальною ізоляцією через цікаві мікро-завдання в реальному світі.

        Користувач має такі хобі: {hobbies_str}.

        Придумай 3 коротких, нескладних міні-квести, які витягнуть користувача з дому або допоможуть спробувати щось нове, пов'язане з його хобі.
        Завдання не повинні вимагати багато грошей або складної підготовки.
        
        ВАЖЛИВО: Твоя відповідь має бути ТІЛЬКИ у форматі валідного JSON-масиву, без жодних додаткових пояснень чи форматування Markdown. 
        Структура: ["title1", "title2", "title3"]
        
        """

    try:
        response = await model.generate_content_async(prompt)
        raw_text = response.text.strip()

        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3]
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3]

        quests_data = json.loads(raw_text.strip())
        return quests_data

    except json.JSONDecodeError as e:
        print(f"ШІ повернув невалідний JSON: {raw_text}\nПомилка: {e}")
        return []
    except Exception as e:
        print(f"Помилка при генерації квестів: {e}")
        return []
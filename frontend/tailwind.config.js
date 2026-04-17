// tailwind.config.js
/** @type {import('tailwindcss').Config} */

module.exports = {
  // 1. Вказуємо шляхи до всіх файлів, де використовуємо класи
  content: [
    "./App.{js,jsx,ts,tsx}", 
    "./app/**/*.{js,jsx,ts,tsx}", 
    "./components/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}"
  ],
  
  // 2. Обов'язково для перемикання тем через стан
  darkMode: 'class', 

  theme: {
    extend: {
      // 3. Кастомні шрифти (Nunito)
      fontFamily: {
        sans: ['Nunito-Regular', 'sans-serif'],
        'nunito-bold': ['Nunito-Bold', 'sans-serif'],
        'nunito-black': ['Nunito-Black', 'sans-serif'],
      },

      // 4. Твоя магічна палітра кольорів
      colors: {
        // ☀️ Світла тема
        bgCream: '#FFFDF7',      // Головний фон
        cardWhite: '#FFFFFF',    // Фон карток
        textMain: '#2D1B08',     // Основний текст (коричневий)
        textMuted: 'rgba(45, 27, 8, 0.7)', // Другорядний текст (70%)
        accentOrange: '#F97316', // Акцент (кнопки, активні елементи)
        iconBg: '#FEF3C7',       // Фон під іконками

        // 🌙 Темна тема
        bgDark: '#0F111A',        // Головний фон
        cardDark: '#1A1C29',      // Фон карток
        textDarkMain: '#EFF6FF',  // Основний текст (білий)
        textDarkMuted: '#BFDBFE', // Другорядний текст (блакитний)
        iconBgDark: 'rgba(37, 99, 235, 0.2)', // Синій фон під іконками
        iconColorDark: '#93C5FD', // Колір самих іконок у темній темі
      },

      // 5. Радіуси заокруглення (згідно з ТЗ)
      borderRadius: {
        '2xl': '16px', // Для інпутів та кнопок
        '3xl': '24px', // Для основних карток
      },

      // 6. Тіні (Важливо: NativeWind v2 обмежено транслює boxShadow в Native)
      // Ми додаємо їх сюди для структури, але для Android краще використовувати 
      // Shadow-об'єкти в StyleSheet або окремі класи.
      boxShadow: {
        'soft': '0 12px 24px rgba(212, 175, 55, 0.15)',
        'glow': '0 0 20px rgba(250, 204, 21, 0.4)',
        'dark-soft': '0 12px 24px rgba(0, 0, 0, 0.6)',
        'dark-glow': '0 0 20px rgba(37, 99, 235, 0.3)',
      }
    },
  },
  plugins: [],
};
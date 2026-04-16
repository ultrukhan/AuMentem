export const Colors = {
  light: {
    background: '#FFFDF7',   
    card: '#FFFFFF',         
    text: '#2D1B08',         
    textMuted: 'rgba(45, 27, 8, 0.7)', 
    accent: '#F97316',       
    iconBg: '#FEF3C7',       
    iconColor: '#F97316',
    border: 'rgba(255, 255, 255, 0.8)', 
    overlay: 'rgba(255, 251, 235, 0.15)',     // ← Додав
    navIconActive: '#F97316',                 // ← Додав
    navIconInactive: 'rgba(45, 27, 8, 0.4)',  // ← Додав
  },
  dark: {
    background: '#0F111A',   
    card: '#1A1C29',         
    text: '#EFF6FF',         
    textMuted: '#BFDBFE',    
    accent: '#F97316',       
    iconBg: 'rgba(37, 99, 235, 0.2)', 
    iconColor: '#93C5FD',    
    border: 'rgba(59, 130, 246, 0.2)',
    overlay: 'rgba(2, 6, 23, 0.45)',          // ← Додав
    navIconActive: '#BFDBFE',                 // ← Додав
    navIconInactive: 'rgba(191, 219, 254, 0.5)', // ← Додав
  },
} as const;

// ... далі Typography, Radii і Shadows залишаються без змін
export const Typography = {
  // Nunito шрифти за твоїм ТЗ
  titleXl: { fontFamily: 'Nunito_800ExtraBold', fontSize: 32 },
  titleLg: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20 }, // Заголовок довгої картки
  titleMd: { fontFamily: 'Nunito_700Bold', fontSize: 18 },      // Заголовки карток
  body:    { fontFamily: 'Nunito_600SemiBold', fontSize: 16 },  // Звичайний текст
  muted:   { fontFamily: 'Nunito_600SemiBold', fontSize: 14 },  // Опис під заголовком
  nav:     { fontFamily: 'Nunito_800ExtraBold', fontSize: 11 }, // Текст меню
};

export const Radii = {
  sm: 12,
  md: 16,    // rounded-2xl (інпути, іконки)
  lg: 24,    // rounded-3xl (картки)
  full: 999, // rounded-full (кнопки CTA)
};

export const Shadows = {
  light: {
    soft: { shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 },
    glow: { shadowColor: '#FACC15', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 5 },
    nav:  { shadowColor: '#D4AF37', shadowOffset: { width: 0, height: -12 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 10 },
  },
  dark: {
    soft: { shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 12 },
    glow: { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 5 },
    nav:  { shadowColor: '#000000', shadowOffset: { width: 0, height: -12 }, shadowOpacity: 0.8, shadowRadius: 30, elevation: 15 },
  },
};
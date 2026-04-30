import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#FFFDF7',               // bgCream
    cardBg: 'rgba(255, 253, 247, 0.85)', // bg-cardWhite/85
    textMain: '#431407',                 // text-orange-950
    textMuted: 'rgba(124, 45, 18, 0.7)', // textMuted
    accent: '#F97316',                   // accentOrange
    iconBg: 'rgba(254, 240, 138, 0.6)',  // bg-iconBg/60
    iconColor: '#EA580C',                // text-orange-600
    
    // Плоский бордер замість граней
    border: 'rgba(212, 212, 216, 0.4)',  // border-[#d4d4d8]/40
    
    overlay: 'rgba(255, 251, 235, 0.2)', // bg-[#fffbeb]/20
    navBg: 'rgba(255, 253, 247, 0.95)',  // bg-[#fffdf7]/95
    navIconActive: '#EA580C',            // text-orange-600
    navIconInactive: 'rgba(124, 45, 18, 0.4)',
    petOutline: '#78350F',
    petFill: '#FDBA74',
  },
  dark: {
    background: '#020617',               // bgDark
    cardBg: 'rgba(26, 28, 41, 0.85)',    // bg-cardDark/85
    textMain: '#EFF6FF',                 // textDarkMain
    textMuted: '#BFDBFE',                // textDarkMuted
    accent: '#F97316',                   // accentOrange
    iconBg: 'rgba(37, 99, 235, 0.2)',    // bg-iconBgDark/20
    iconColor: '#93C5FD',                // iconColorDark
    
    // Плоский бордер замість граней
    border: 'rgba(59, 130, 246, 0.2)',   // border-[#3b82f6]/20
    
    overlay: 'rgba(2, 6, 23, 0.5)',      // bg-[#020617]/50
    navBg: 'rgba(26, 28, 41, 0.95)',     // bg-[#1a1c29]/95
    navIconActive: '#DBEAFE',            // text-blue-100
    navIconInactive: 'rgba(147, 197, 253, 0.5)',
    petOutline: '#1E293B',
    petFill: '#475569',
  },
} as const;

export const Typography = {
  titleXl: { fontFamily: 'Nunito_800ExtraBold', fontSize: 32 }, 
  titleLg: { fontFamily: 'Nunito_700Bold', fontSize: 20 },
  titleMd: { fontFamily: 'Nunito_700Bold', fontSize: 18 },
  button:  { fontFamily: 'Nunito_700Bold', fontSize: 16 },
  body:    { fontFamily: 'Nunito_600SemiBold', fontSize: 16 },
  muted:   { fontFamily: 'Nunito_600SemiBold', fontSize: 14 },
  nav:     { fontFamily: 'Nunito_700Bold', fontSize: 11 },
};

export const Radii = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 24,
  full: 999,
};

export const Spacing = {
  screenX: 24, screenTop: 32, screenBot: 24, headMb: 32, gap: 16, cardP: 20, iconP: 12, iconWideP: 16, navPx: 24, navPy: 16,
};

export const IconSizes = { 
  sm: 24, 
  md: 28, 
  lg: 32  
};

export const Shadows = {
  light: {
    soft: { shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 },
    glow: { shadowColor: '#FACC15', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 5 },
    nav:  { shadowColor: '#D4AF37', shadowOffset: { width: 0, height: -12 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 10 },
    hard: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 }
  },
  dark: {
    soft: { shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 12 },
    glow: { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    nav:  { shadowColor: '#000000', shadowOffset: { width: 0, height: -12 }, shadowOpacity: 0.8, shadowRadius: 30, elevation: 15 },
    hard: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 }
  },
};
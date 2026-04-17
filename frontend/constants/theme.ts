export const Colors = {
  light: {
    background: '#FFFDF7',
    cardBg: 'rgba(255, 253, 247, 0.85)',
    textMain: '#431407',
    textMuted: 'rgba(67, 20, 7, 0.7)',
    accent: '#EA580C',
    iconBg: 'rgba(254, 240, 138, 0.6)',
    iconColor: '#EA580C',
    borderTopLeft: 'rgba(255, 255, 255, 0.8)',
    borderBotRight: 'rgba(212, 212, 216, 0.4)',
    overlay: 'rgba(255, 251, 235, 0.2)',
    navBg: 'rgba(255, 253, 247, 0.95)',
    navIconActive: '#EA580C',
    navIconInactive: 'rgba(67, 20, 7, 0.4)',
    petOutline: '#78350F',
    petFill: '#FDBA74',
  },
  dark: {
    background: '#020617',
    cardBg: 'rgba(26, 28, 41, 0.85)',
    textMain: '#EFF6FF',
    textMuted: '#BFDBFE',
    accent: '#3B82F6',
    iconBg: 'rgba(37, 99, 235, 0.2)',
    iconColor: '#93C5FD',
    borderTopLeft: 'rgba(59, 130, 246, 0.2)',
    borderBotRight: 'rgba(0, 0, 0, 0.4)',
    overlay: 'rgba(2, 6, 23, 0.5)',
    navBg: 'rgba(26, 28, 41, 0.95)',
    navIconActive: '#BFDBFE',
    navIconInactive: 'rgba(147, 197, 253, 0.5)',
    petOutline: '#1E293B',
    petFill: '#475569',
  },
} as const;

export const Typography = {
  titleXl: { fontFamily: 'Nunito_800ExtraBold', fontSize: 32 },
  titleLg: { fontFamily: 'Nunito_700Bold', fontSize: 20 },
  titleMd: { fontFamily: 'Nunito_700Bold', fontSize: 18 },
  body:    { fontFamily: 'Nunito_600SemiBold', fontSize: 16 },
  muted:   { fontFamily: 'Nunito_600SemiBold', fontSize: 14 },
  nav:     { fontFamily: 'Nunito_700Bold', fontSize: 11 },
};

export const Radii = {
  md: 16,
  lg: 24,
  full: 999,
};

export const Spacing = {
  screenX: 24, screenTop: 48, screenBot: 24, headMb: 32, gap: 16, cardP: 20, iconP: 12, iconWideP: 16, navPx: 24, navPy: 16,
};

export const IconSizes = { sm: 24, md: 28, lg: 32 };

export const Shadows = {
  light: {
    soft: { shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 },
    glow: { shadowColor: '#FACC15', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 5 },
    nav:  { shadowColor: '#D4AF37', shadowOffset: { width: 0, height: -12 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 10 },
  },
  dark: {
    soft: { shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 12 },
    glow: { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 10 },
    nav:  { shadowColor: '#000000', shadowOffset: { width: 0, height: -12 }, shadowOpacity: 0.8, shadowRadius: 30, elevation: 15 },
  },
};
import { textLayout } from '@/utils/textLayout';

export const Colors = {
  light: {
    background: '#FFFDF7',
    cardBg: 'rgba(255, 255, 255, 0.92)',
    textMain: '#431407',
    textMuted: 'rgba(124, 45, 18, 0.7)',
    accent: '#F97316',
    iconBg: 'rgba(254, 240, 138, 0.6)',
    iconColor: '#EA580C',
    border: 'rgba(212, 212, 216, 0.4)',
    overlay: 'rgba(255, 251, 235, 0.2)',
    navBg: 'rgba(255, 255, 255, 0.92)',
    navIconActive: '#EA580C',
    navIconInactive: 'rgba(124, 45, 18, 0.4)',
    petOutline: '#78350F',
    petFill: '#FDBA74',
  },
  dark: {
    background: '#020617',
    cardBg: 'rgba(30, 35, 55, 0.92)',
    textMain: '#EFF6FF',
    textMuted: '#BFDBFE',
    accent: '#2563EB',
    iconBg: 'rgba(37, 99, 235, 0.2)',
    iconColor: '#93C5FD',
    border: 'rgba(59, 130, 246, 0.2)',
    overlay: 'rgba(2, 6, 23, 0.5)',
    navBg: 'rgba(30, 35, 55, 0.92)',
    navIconActive: '#DBEAFE',
    navIconInactive: 'rgba(147, 197, 253, 0.5)',
    petOutline: '#1E293B',
    petFill: '#475569',
  },
} as const;

export const Typography = {
  titleXl: { fontFamily: 'Nunito_800ExtraBold', fontSize: 32, ...textLayout },
  titleLg: { fontFamily: 'Nunito_700Bold', fontSize: 20, ...textLayout },
  titleMd: { fontFamily: 'Nunito_700Bold', fontSize: 18, ...textLayout },
  button: { fontFamily: 'Nunito_700Bold', fontSize: 16, ...textLayout },
  body: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, ...textLayout },
  muted: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, ...textLayout },
  nav: { fontFamily: 'Nunito_700Bold', fontSize: 11, ...textLayout },
};

export const Radii = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 24,
  full: 999,
};

export const Spacing = {
  screenX: 24,
  screenTop: 32,
  screenBot: 24,
  headMb: 32,
  gap: 16,
  cardP: 20,
  iconP: 12,
  iconWideP: 16,
  navPx: 24,
  navPy: 16,
};

export const IconSizes = {
  sm: 24,
  md: 28,
  lg: 32,
};

export const AuthLayout = {
  scrollPaddingVertical: 40,
  headerMarginTop: 20,
  headerMarginBottom: 40,
  headerIconSize: 100,
  headerIconRadius: 20,
};

export const Shadows = {
  light: {
    soft: { shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16 },
    glow: { shadowColor: '#FACC15', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 14 },
    nav: { shadowColor: '#D4AF37', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.12, shadowRadius: 20 },
    hard: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 10 },
  },
  dark: {
    soft: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16 },
    glow: { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 14 },
    nav: { shadowColor: '#000000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.6, shadowRadius: 20 },
    hard: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.25, shadowRadius: 10 },
  },
};

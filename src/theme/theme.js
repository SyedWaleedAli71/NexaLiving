/**
 * NexaLiving design tokens — single source of truth for the brand system.
 */

export const colors = {
  primary: '#7C3AED',
  primaryDark: '#5B21B6',
  primarySoft: '#EDE9FE',
  secondary: '#EC4899',
  secondarySoft: '#FCE7F3',
  background: '#F9FAFB',
  white: '#FFFFFF',
  textMain: '#0F172A',
  textSecondary: '#64748B',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  error: '#DC2626',
  errorSoft: '#FEE2E2',
  border: '#E2E8F0',
  inputBg: '#F8FAFC',
  google: {
    red: '#EA4335',
    yellow: '#FBBC05',
    green: '#34A853',
    blue: '#4285F4',
  },
  apple: '#0F172A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 8,
  },
  soft: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  primary: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const font = {
  h1: { fontSize: 30, fontWeight: '800', color: colors.textMain, letterSpacing: -0.5 },
  h2: { fontSize: 25, fontWeight: '800', color: colors.textMain, letterSpacing: -0.4 },
  body: { fontSize: 15, fontWeight: '500', color: colors.textMain },
  label: { fontSize: 13.5, fontWeight: '700', color: colors.textMain, letterSpacing: 0.1 },
  caption: { fontSize: 13.5, fontWeight: '500', color: colors.textSecondary, lineHeight: 20 },
  button: { fontSize: 16, fontWeight: '700', color: colors.white, letterSpacing: 0.2 },
};

export const easing = {
  enter: { type: 'spring', stiffness: 90, damping: 16 },
};

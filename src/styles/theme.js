// DPR Analyzer Pro — design tokens.
// Centralized so every component renders with the same palette/spacing/typography.

export const colors = {
  // Header / hero gradient stops
  navy900: '#1A1A2E',
  navy800: '#16213E',
  navy700: '#0F3460',

  // Primary accent (buttons, active states)
  tealPrimary: '#0D9488',
  tealDark: '#0F766E',

  // Surface
  pageBg: '#F5F7FA',
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textOnDark: '#F8FAFC',
  textOnDarkMuted: '#CBD5E1',

  // Status
  statusSubmitted: '#64748B',
  statusInReview: '#D97706',
  statusCompleted: '#10B981',
  statusFailed: '#DC2626',
};

export const gradients = {
  hero: `linear-gradient(135deg, ${colors.navy900} 0%, ${colors.navy800} 50%, ${colors.navy700} 100%)`,
};

export const fonts = {
  body: "'Outfit', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  heading: "'Playfair Display', Georgia, 'Times New Roman', serif",
};

export const radii = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '22px',
  pill: '999px',
};

export const shadows = {
  card: '0 1px 4px rgba(0, 0, 0, 0.05)',
  cardHover: '0 4px 16px rgba(15, 52, 96, 0.10)',
  raised: '0 8px 24px rgba(15, 52, 96, 0.12)',
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
};

export const breakpoints = {
  mobile: '640px',
  tablet: '900px',
  desktop: '1200px',
};

export const layout = {
  maxWidth: '1200px',
  navHeight: '72px',
};

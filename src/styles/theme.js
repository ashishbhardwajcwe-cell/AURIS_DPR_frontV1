// DPR Analyzer Pro — design tokens.
// Centralized so every component renders with the same palette/spacing/typography.

export const colors = {
  // Header / hero gradient stops — deep ink-navy, richer than the old flat stops
  navy900: '#0E1320',
  navy800: '#15203A',
  navy700: '#1C3057',

  // Primary accent (buttons, active states)
  tealPrimary: '#0D9488',
  tealDark: '#0F766E',
  tealBright: '#14B8A6',

  // Brand gold — matches the AURIS monogram. Use sparingly: eyebrows,
  // highlights, the BEST VALUE ribbon. It reads premium only in small doses.
  gold: '#C8A24B',
  goldSoft: 'rgba(200, 162, 75, 0.16)',

  // Surface
  pageBg: '#F4F6F9',
  cardBg: '#FFFFFF',
  cardBorder: '#E4E9F0',

  // Text
  textPrimary: '#101828',
  textSecondary: '#46556B',
  textMuted: '#64748B',
  textOnDark: '#F8FAFC',
  textOnDarkMuted: '#B9C4D6',

  // Status
  statusSubmitted: '#64748B',
  statusInReview: '#D97706',
  statusCompleted: '#10B981',
  statusFailed: '#DC2626',
};

export const gradients = {
  // Layered: a faint teal glow bleeding in from the top-right over the
  // navy sweep gives the hero depth instead of a flat diagonal.
  hero: [
    'radial-gradient(1100px 480px at 85% -10%, rgba(20, 184, 166, 0.16) 0%, rgba(20, 184, 166, 0) 60%)',
    'radial-gradient(900px 420px at 0% 110%, rgba(200, 162, 75, 0.08) 0%, rgba(200, 162, 75, 0) 55%)',
    `linear-gradient(135deg, ${colors.navy900} 0%, ${colors.navy800} 52%, ${colors.navy700} 100%)`,
  ].join(', '),
  // Primary CTA — subtle vertical sheen so buttons don't look flat.
  cta: `linear-gradient(180deg, ${colors.tealBright} 0%, ${colors.tealPrimary} 100%)`,
  ctaHover: `linear-gradient(180deg, ${colors.tealPrimary} 0%, ${colors.tealDark} 100%)`,
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
  // Layered shadows: a tight contact shadow + a soft ambient one. Reads
  // far more "designed" than a single blur.
  card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 4px 16px rgba(16, 24, 40, 0.05)',
  cardHover: '0 2px 4px rgba(16, 24, 40, 0.06), 0 12px 32px rgba(28, 48, 87, 0.12)',
  raised: '0 3px 6px rgba(16, 24, 40, 0.07), 0 16px 40px rgba(28, 48, 87, 0.14)',
  cta: '0 1px 2px rgba(13, 148, 136, 0.35), 0 6px 16px rgba(13, 148, 136, 0.28)',
  header: '0 1px 0 rgba(255, 255, 255, 0.06) inset, 0 8px 24px rgba(14, 19, 32, 0.35)',
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

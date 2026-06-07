import { Link } from 'react-router-dom';
import { colors, fonts, radii, shadows, spacing } from '../styles/theme.js';

const cardStyle = {
  background: colors.cardBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.lg,
  boxShadow: shadows.card,
  padding: spacing.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const eyebrowStyle = {
  fontFamily: fonts.body,
  fontSize: '11.5px',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: colors.tealDark,
};

const numberStyle = {
  fontFamily: fonts.heading,
  fontSize: 'clamp(40px, 6vw, 56px)',
  fontWeight: 700,
  lineHeight: 1.05,
  color: colors.textPrimary,
  letterSpacing: '-0.02em',
};

const labelStyle = {
  fontFamily: fonts.body,
  fontSize: '13.5px',
  color: colors.textSecondary,
};

const helperStyle = {
  fontFamily: fonts.body,
  fontSize: '13px',
  color: colors.textMuted,
  marginTop: spacing.sm,
};

const topUpStyle = {
  display: 'inline-block',
  marginTop: spacing.md,
  fontFamily: fonts.body,
  fontSize: '13.5px',
  fontWeight: 600,
  color: colors.tealDark,
};

export default function CreditBalanceCard({ balance, loading }) {
  return (
    <section style={cardStyle} aria-label="Credit balance">
      <span style={eyebrowStyle}>Credits</span>
      <span style={numberStyle}>
        {loading ? '—' : Number.isFinite(balance) ? balance : 0}
      </span>
      <span style={labelStyle}>available for DPR submissions</span>
      <span style={helperStyle}>
        Each DPR submission uses 1 credit. We&apos;ll email you when your
        balance gets low.
      </span>
      <Link to="/pricing" style={topUpStyle}>
        Top up credits →
      </Link>
    </section>
  );
}

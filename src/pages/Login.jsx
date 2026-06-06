import { Link } from 'react-router-dom';
import { colors, fonts, radii, shadows, spacing } from '../styles/theme.js';

// Stub login page. Full implementation lands in Milestone 2
// (Supabase email/password + Google OAuth + pending-approval state).

const wrapStyle = {
  paddingTop: spacing['2xl'],
  paddingBottom: spacing['3xl'],
  display: 'flex',
  justifyContent: 'center',
};

const cardStyle = {
  background: colors.cardBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.lg,
  boxShadow: shadows.card,
  padding: spacing.xl,
  width: '100%',
  maxWidth: '440px',
};

const titleStyle = {
  fontFamily: fonts.heading,
  fontSize: '26px',
  color: colors.textPrimary,
  marginBottom: spacing.sm,
};

const subStyle = {
  fontFamily: fonts.body,
  fontSize: '14.5px',
  color: colors.textSecondary,
  marginBottom: spacing.lg,
};

const placeholderNote = {
  fontFamily: fonts.body,
  fontSize: '13px',
  color: colors.textMuted,
  background: '#F8FAFC',
  border: `1px dashed ${colors.cardBorder}`,
  borderRadius: radii.sm,
  padding: spacing.md,
  marginTop: spacing.lg,
};

const homeLink = {
  display: 'inline-block',
  marginTop: spacing.md,
  fontFamily: fonts.body,
  fontSize: '14px',
};

export default function Login() {
  return (
    <div style={wrapStyle}>
      <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>Log in</h1>
          <p style={subStyle}>
            Sign in with your firm&apos;s email or your Google account to access
            your DPR Analyzer Pro workspace.
          </p>
          <div style={placeholderNote}>
            Sign-in is being set up. This screen will be wired to Supabase Auth
            (email/password and Google OAuth) in the next milestone.
          </div>
          <Link to="/" style={homeLink}>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

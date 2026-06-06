import Alert from '../components/Alert.jsx';
import { useAuth } from '../lib/auth.jsx';
import { colors, fonts, radii, shadows, spacing } from '../styles/theme.js';

const wrapStyle = {
  paddingTop: spacing['2xl'],
  paddingBottom: spacing['3xl'],
};

const headerRow = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: spacing.md,
  marginBottom: spacing.lg,
};

const titleStyle = {
  fontFamily: fonts.heading,
  fontSize: 'clamp(26px, 4vw, 34px)',
  color: colors.textPrimary,
};

const subStyle = {
  fontFamily: fonts.body,
  fontSize: '14.5px',
  color: colors.textSecondary,
};

const cardStyle = {
  background: colors.cardBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.lg,
  boxShadow: shadows.card,
  padding: spacing.xl,
};

const cardTitleStyle = {
  fontFamily: fonts.heading,
  fontSize: '20px',
  color: colors.textPrimary,
  marginBottom: spacing.sm,
};

const cardBodyStyle = {
  fontFamily: fonts.body,
  fontSize: '14.5px',
  color: colors.textSecondary,
  lineHeight: 1.6,
};

// Milestone 2 dashboard: minimal welcome surface. The real dashboard with
// credit balance, "Upload a DPR" CTA, and jobs table lands in Milestone 4.
export default function Dashboard() {
  const { profile, isPending } = useAuth();
  const companyName = profile?.company_name || 'your workspace';

  return (
    <div style={wrapStyle}>
      <div className="container">
        <div style={headerRow}>
          <div>
            <h1 style={titleStyle}>Welcome, {companyName}</h1>
            <p style={subStyle}>
              {profile?.contact_name ? `Hi ${profile.contact_name}. ` : ''}
              This is your DPR Analyzer Pro workspace.
            </p>
          </div>
        </div>

        {isPending && (
          <Alert
            variant="warning"
            title="Your account is pending approval"
            style={{ marginBottom: spacing.lg }}
          >
            Thanks for signing up. We&apos;re reviewing your registration and
            will activate your account along with a trial credit allocation.
            You&apos;ll receive an email when it&apos;s ready — usually within
            one business day.
          </Alert>
        )}

        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>What happens next</h2>
          <p style={cardBodyStyle}>
            Once your account is active, you&apos;ll be able to upload a DPR
            and track its analysis status from this dashboard. When the
            compliance report is ready you&apos;ll receive an email; the
            report (PDF) and audio overview (MP3) will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}

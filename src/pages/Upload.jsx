import { Link } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import { colors, fonts, radii, shadows, spacing } from '../styles/theme.js';

// Placeholder route. The real upload flow — presigned direct-to-storage
// URLs, multi-file picker, resumable uploads via Uppy/TUS — lands in
// Milestone 5.
const wrapStyle = {
  paddingTop: spacing['2xl'],
  paddingBottom: spacing['3xl'],
};

const cardStyle = {
  background: colors.cardBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.lg,
  boxShadow: shadows.card,
  padding: spacing.xl,
  maxWidth: '720px',
};

const titleStyle = {
  fontFamily: fonts.heading,
  fontSize: 'clamp(24px, 4vw, 32px)',
  color: colors.textPrimary,
  marginBottom: spacing.sm,
};

const subStyle = {
  fontFamily: fonts.body,
  fontSize: '14.5px',
  color: colors.textSecondary,
  marginBottom: spacing.lg,
};

const linkStyle = {
  fontFamily: fonts.body,
  fontSize: '14px',
  color: colors.tealDark,
  fontWeight: 600,
};

export default function Upload() {
  return (
    <div style={wrapStyle}>
      <div className="container">
        <div style={cardStyle}>
          <h1 style={titleStyle}>Upload a DPR</h1>
          <p style={subStyle}>
            Submit a Detailed Project Report for compliance analysis.
          </p>
          <Alert variant="neutral">
            The upload flow is being built. Files will go straight from your
            browser to private encrypted storage — they&apos;ll never pass
            through any analysis service in transit.
          </Alert>
          <p style={{ marginTop: spacing.lg }}>
            <Link to="/dashboard" style={linkStyle}>
              ← Back to dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

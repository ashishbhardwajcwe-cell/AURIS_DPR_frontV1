import { colors, fonts, radii, shadows, spacing } from '../styles/theme.js';

const wrapStyle = {
  paddingTop: spacing['2xl'],
  paddingBottom: spacing['2xl'],
};

const cardStyle = {
  background: colors.cardBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.lg,
  boxShadow: shadows.card,
  padding: spacing.xl,
  maxWidth: '780px',
};

const titleStyle = {
  fontFamily: fonts.heading,
  fontSize: 'clamp(28px, 4vw, 38px)',
  color: colors.textPrimary,
  marginBottom: spacing.lg,
};

const h2Style = {
  fontFamily: fonts.heading,
  fontSize: '20px',
  color: colors.textPrimary,
  marginTop: spacing.xl,
  marginBottom: spacing.sm,
};

const pStyle = {
  fontFamily: fonts.body,
  fontSize: '15px',
  lineHeight: 1.65,
  color: colors.textSecondary,
  marginBottom: spacing.md,
};

const listStyle = {
  fontFamily: fonts.body,
  fontSize: '15px',
  lineHeight: 1.7,
  color: colors.textSecondary,
  paddingLeft: '22px',
  marginBottom: spacing.md,
};

const ctaStyle = {
  display: 'inline-block',
  marginTop: spacing.md,
  padding: '11px 22px',
  borderRadius: radii.md,
  background: colors.tealPrimary,
  color: colors.textOnDark,
  fontFamily: fonts.body,
  fontWeight: 600,
  fontSize: '14.5px',
};

export default function Confidentiality() {
  return (
    <div style={wrapStyle}>
      <div className="container">
        <article style={cardStyle}>
          <h1 style={titleStyle}>Confidentiality</h1>
          <p style={pStyle}>
            DPRs are commercially sensitive documents. We treat every file you
            upload as confidential and structure our service around that
            principle.
          </p>

          <h2 style={h2Style}>What we commit to</h2>
          <ul style={listStyle}>
            <li>
              Your documents are accessed only by the analyst assigned to your
              project, who operates under a written non-disclosure agreement.
            </li>
            <li>
              Files are not shared with any third party, government body, or
              competitor.
            </li>
            <li>
              Files are not used to train machine learning models — yours or
              anyone else&apos;s.
            </li>
            <li>
              All access is logged in an immutable audit trail.
            </li>
          </ul>

          <h2 style={h2Style}>Mutual NDA</h2>
          <p style={pStyle}>
            For added comfort, we can sign a mutual non-disclosure agreement
            before any file is uploaded. Download our template, review it with
            your legal team, and send it back signed.
          </p>
          {/* TODO: replace with the real NDA template once uploaded to /public */}
          <a href="/auris-nda-template.pdf" style={ctaStyle} download>
            Download mutual NDA template
          </a>

          <h2 style={h2Style}>Reporting a concern</h2>
          <p style={pStyle}>
            If you believe a confidentiality issue has occurred, contact{' '}
            <a href="mailto:security@dpranalyzer.com">
              security@dpranalyzer.com
            </a>{' '}
            and we will respond within one business day.
          </p>
        </article>
      </div>
    </div>
  );
}

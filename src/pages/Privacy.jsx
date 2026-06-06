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

export default function Privacy() {
  return (
    <div style={wrapStyle}>
      <div className="container">
        <article style={cardStyle}>
          <h1 style={titleStyle}>Privacy &amp; Data Handling</h1>
          <p style={pStyle}>
            DPR Analyzer Pro is operated by AURIS. This page explains how we
            handle the documents and information you share with us.
          </p>

          <h2 style={h2Style}>How your files are processed</h2>
          <p style={pStyle}>
            DPRs uploaded to the portal are reviewed by a qualified human
            analyst working under a confidentiality agreement. We do not use
            uploaded files to train any machine learning model, and we do not
            share them with any third party for analytical purposes.
          </p>

          <h2 style={h2Style}>Storage &amp; encryption</h2>
          <ul style={listStyle}>
            <li>Files are encrypted in transit (TLS) and at rest (AES-256).</li>
            <li>
              Storage is provisioned in the Mumbai (ap-south-1) region for
              Indian data residency.
            </li>
            <li>
              Access is restricted at the database layer — your firm cannot see
              another firm&apos;s files, and another firm cannot see yours.
            </li>
          </ul>

          <h2 style={h2Style}>Retention</h2>
          <p style={pStyle}>
            Uploaded source files and delivered reports are deleted 30 days
            after the report is delivered. Job metadata (project name,
            submission date, credit usage) is retained for billing and audit
            purposes.
          </p>

          <h2 style={h2Style}>Mutual NDA</h2>
          <p style={pStyle}>
            We are happy to sign a mutual non-disclosure agreement before you
            upload any document. A template is available on request.
          </p>

          <h2 style={h2Style}>Contact</h2>
          <p style={pStyle}>
            For privacy questions, write to{' '}
            <a href="mailto:privacy@dpranalyzer.com">privacy@dpranalyzer.com</a>
            .
          </p>
        </article>
      </div>
    </div>
  );
}

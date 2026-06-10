import { Link } from 'react-router-dom';
import {
  colors,
  gradients,
  fonts,
  radii,
  shadows,
  spacing,
} from '../styles/theme.js';

const heroStyle = {
  background: gradients.hero,
  color: colors.textOnDark,
  paddingTop: spacing['3xl'],
  paddingBottom: spacing['3xl'],
};

const heroInnerStyle = {
  maxWidth: '780px',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.lg,
};

const eyebrowStyle = {
  fontFamily: fonts.body,
  fontSize: '13px',
  fontWeight: 600,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: colors.gold,
};

const headlineStyle = {
  fontFamily: fonts.heading,
  fontSize: 'clamp(34px, 5vw, 52px)',
  lineHeight: 1.1,
  color: colors.textOnDark,
};

const subStyle = {
  fontFamily: fonts.body,
  fontSize: '17px',
  lineHeight: 1.6,
  color: colors.textOnDarkMuted,
  maxWidth: '640px',
};

const ctaRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing.md,
  marginTop: spacing.sm,
};

const primaryCta = {
  background: gradients.cta,
  color: colors.textOnDark,
  fontFamily: fonts.body,
  fontWeight: 600,
  fontSize: '15px',
  padding: '14px 28px',
  borderRadius: radii.md,
  border: 'none',
  display: 'inline-block',
  boxShadow: shadows.cta,
  transition: 'transform 120ms ease, box-shadow 140ms ease',
};

const secondaryCta = {
  background: 'transparent',
  color: colors.textOnDark,
  fontFamily: fonts.body,
  fontWeight: 500,
  fontSize: '15px',
  padding: '13px 24px',
  borderRadius: radii.md,
  border: `1px solid rgba(255,255,255,0.25)`,
  display: 'inline-block',
};

const sectionStyle = {
  paddingTop: spacing['3xl'],
  paddingBottom: spacing.xl,
};

const sectionHeading = {
  fontFamily: fonts.heading,
  fontSize: 'clamp(24px, 3vw, 32px)',
  color: colors.textPrimary,
  marginBottom: spacing.lg,
};

const featureGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: spacing.lg,
};

const cardStyle = {
  background: colors.cardBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.lg,
  boxShadow: shadows.card,
  padding: spacing.lg,
  transition: 'transform 160ms ease, box-shadow 160ms ease',
};

function liftCard(e) {
  e.currentTarget.style.transform = 'translateY(-3px)';
  e.currentTarget.style.boxShadow = shadows.cardHover;
}

function restCard(e) {
  e.currentTarget.style.transform = 'translateY(0)';
  e.currentTarget.style.boxShadow = shadows.card;
}

const cardTitle = {
  fontFamily: fonts.heading,
  fontSize: '18px',
  color: colors.textPrimary,
  marginBottom: spacing.sm,
};

const cardBody = {
  fontFamily: fonts.body,
  fontSize: '14.5px',
  color: colors.textSecondary,
  lineHeight: 1.55,
};

export default function Landing() {
  return (
    <>
      <section style={heroStyle}>
        <div className="container" style={heroInnerStyle}>
          <span style={eyebrowStyle}>AURIS · DPR Analyzer Pro</span>
          <h1 style={headlineStyle}>
            Compliance analysis for road &amp; highway DPRs — delivered as a
            report and an audio overview.
          </h1>
          <p style={subStyle}>
            Upload your Detailed Project Report and receive a structured
            compliance review against IRC and MoRTH standards, prepared by
            qualified analysts. Built for consultancy firms working with NHAI,
            MoRTH, PWD, and BRO.
          </p>
          <div style={ctaRowStyle}>
            <Link to="/login" style={primaryCta}>
              Log in
            </Link>
            <Link to="/privacy" style={secondaryCta}>
              How we handle your data
            </Link>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div className="container">
          <h2 style={sectionHeading}>What you receive</h2>
          <div style={featureGrid}>
            <article style={cardStyle} onMouseEnter={liftCard} onMouseLeave={restCard}>
              <h3 style={cardTitle}>Structured compliance report</h3>
              <p style={cardBody}>
                A clearly written PDF mapping your DPR against the relevant IRC
                and MoRTH provisions, highlighting compliance gaps and
                observations section by section.
              </p>
            </article>
            <article style={cardStyle} onMouseEnter={liftCard} onMouseLeave={restCard}>
              <h3 style={cardTitle}>Audio overview</h3>
              <p style={cardBody}>
                A short, podcast-style audio walkthrough so you can absorb the
                key findings on the move before reading the full report.
              </p>
            </article>
            <article style={cardStyle} onMouseEnter={liftCard} onMouseLeave={restCard}>
              <h3 style={cardTitle}>Confidential by design</h3>
              <p style={cardBody}>
                Files stay in private, encrypted storage in the Mumbai region.
                Access is restricted to your firm. Files are deleted 30 days
                after report delivery.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}

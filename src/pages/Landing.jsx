import { Link } from 'react-router-dom';
import AudioBriefingPreview from '../components/AudioBriefingPreview.jsx';
import { useAuth } from '../lib/auth.jsx';
import { useSettings } from '../lib/settings.jsx';
import {
  colors,
  gradients,
  fonts,
  radii,
  shadows,
  spacing,
} from '../styles/theme.js';

// `min(100%, …)` keeps auto-fit grids from overflowing on phones.
const fitColumns = (min) => `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))`;

// Hero background: the navy sweep, with the bottom band repainted in the
// page colour so the report "product shot" straddles dark and light.
const HERO_LIGHT_BAND = 300;

// Layout that changes between phone and laptop (alignment, columns,
// background band, float positions) lives in the .hero-* classes in
// global.css; these inline styles hold only what stays the same.
const heroStyle = {
  '--hero-gradient': gradients.hero,
  '--hero-band': `linear-gradient(180deg, transparent calc(100% - ${HERO_LIGHT_BAND}px), ${colors.pageBg} calc(100% - ${HERO_LIGHT_BAND}px))`,
  color: colors.textOnDark,
  overflow: 'hidden',
};

const heroIntroStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
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
  lineHeight: 1.1,
  color: colors.textOnDark,
};

const subStyle = {
  fontFamily: fonts.body,
  lineHeight: 1.6,
  color: colors.textOnDarkMuted,
  maxWidth: '720px',
};

const ctaRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing.md,
  marginTop: spacing.xs,
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

const stageStyle = {
  position: 'relative',
};

// Laptop-only list of the three deliverables under the buttons (on phones
// the same items sit in the caption row under the product shot).
const pointsStyle = {
  listStyle: 'none',
  margin: '8px 0 0',
  padding: 0,
  flexDirection: 'column',
  gap: 12,
  fontFamily: fonts.body,
  fontSize: '15px',
  color: colors.textOnDarkMuted,
};

const pointStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const pointIconStyle = {
  width: 30,
  height: 30,
  borderRadius: '50%',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#E2BC63',
  background: 'rgba(200, 162, 75, 0.12)',
  border: '1px solid rgba(200, 162, 75, 0.3)',
};

const reportFrameStyle = {
  borderRadius: radii.lg,
  overflow: 'hidden',
  background: colors.cardBg,
  border: '1px solid rgba(255, 255, 255, 0.16)',
  boxShadow:
    '0 40px 90px rgba(4, 8, 20, 0.45), 0 0 0 8px rgba(255, 255, 255, 0.04)',
};

const heroImgStyle = {
  display: 'block',
  width: '100%',
  height: 'auto',
};

const scoreFrameStyle = {
  borderRadius: radii.lg,
  overflow: 'hidden',
  border: '1px solid rgba(200, 162, 75, 0.45)',
  boxShadow: '0 30px 60px rgba(4, 8, 20, 0.45)',
};

const captionRowStyle = {
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '12px 28px',
  fontFamily: fonts.body,
  fontSize: '14.5px',
  color: colors.textSecondary,
};

const captionItemStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontWeight: 500,
  color: colors.textPrimary,
};

const sectionStyle = {
  paddingTop: spacing['3xl'],
  paddingBottom: spacing.xl,
};

const sectionIntroStyle = {
  maxWidth: '720px',
  marginBottom: spacing.xl,
};

const sectionEyebrowStyle = {
  fontFamily: fonts.body,
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: colors.tealDark,
  display: 'block',
  marginBottom: spacing.sm,
};

const sectionHeading = {
  fontFamily: fonts.heading,
  fontSize: 'clamp(26px, 3.2vw, 36px)',
  lineHeight: 1.2,
  color: colors.textPrimary,
};

const sectionLeadStyle = {
  fontFamily: fonts.body,
  fontSize: '16px',
  lineHeight: 1.6,
  color: colors.textSecondary,
  marginTop: spacing.md,
};

const impactStyle = {
  background: gradients.hero,
  color: colors.textOnDark,
  borderRadius: radii.xl,
  boxShadow: shadows.raised,
  padding: 'clamp(28px, 5vw, 56px)',
};

const impactHeadingStyle = {
  fontFamily: fonts.heading,
  fontSize: 'clamp(26px, 3.4vw, 40px)',
  lineHeight: 1.15,
  color: colors.textOnDark,
};

const statGridStyle = {
  display: 'grid',
  gridTemplateColumns: fitColumns(190),
  gap: spacing.md,
  marginTop: spacing.xl,
};

const statCardStyle = {
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: radii.md,
  padding: '26px 20px',
  textAlign: 'center',
};

const statValueStyle = {
  fontFamily: fonts.heading,
  fontSize: 'clamp(34px, 4vw, 46px)',
  fontWeight: 700,
  lineHeight: 1.05,
  color: '#E2BC63',
};

const statLabelStyle = {
  marginTop: 10,
  fontFamily: fonts.body,
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: colors.textOnDarkMuted,
};

const showcaseGridStyle = {
  display: 'grid',
  gridTemplateColumns: fitColumns(420),
  alignItems: 'center',
  gap: '48px',
};

const sampleImgStyle = {
  display: 'block',
  width: '100%',
  height: 'auto',
  borderRadius: radii.lg,
  border: `1px solid ${colors.cardBorder}`,
  background: colors.cardBg,
  boxShadow: shadows.raised,
};

const captionStyle = {
  marginTop: spacing.md,
  fontFamily: fonts.body,
  fontSize: '13.5px',
  lineHeight: 1.55,
  color: colors.textMuted,
};

const featureListStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.lg,
};

const featureItemStyle = {
  display: 'flex',
  gap: spacing.md,
  alignItems: 'flex-start',
};

const iconCircleStyle = (tone) => ({
  width: 44,
  height: 44,
  borderRadius: '50%',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: tone === 'gold' ? '#8A6A1F' : colors.tealDark,
  background: tone === 'gold' ? colors.goldSoft : 'rgba(13, 148, 136, 0.1)',
});

const itemTitleStyle = {
  fontFamily: fonts.heading,
  fontSize: '18px',
  color: colors.textPrimary,
  marginBottom: 4,
};

const itemBodyStyle = {
  fontFamily: fonts.body,
  fontSize: '14.5px',
  lineHeight: 1.6,
  color: colors.textSecondary,
};

const stepsGridStyle = {
  display: 'grid',
  gridTemplateColumns: fitColumns(260),
  gap: spacing.lg,
};

const stepCardStyle = {
  background: colors.cardBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.lg,
  boxShadow: shadows.card,
  padding: spacing.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
};

const stepNumberStyle = {
  fontFamily: fonts.heading,
  fontSize: '15px',
  fontWeight: 700,
  color: colors.gold,
  letterSpacing: '0.08em',
};

const trustPanelStyle = {
  background: colors.cardBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.xl,
  boxShadow: shadows.card,
  padding: spacing.xl,
  display: 'grid',
  gridTemplateColumns: fitColumns(240),
  gap: spacing.lg,
};

const closingStyle = {
  background: gradients.hero,
  color: colors.textOnDark,
  borderRadius: radii.xl,
  boxShadow: shadows.raised,
  padding: 'clamp(32px, 5vw, 56px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: spacing.lg,
};

function Icon({ children, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const ICONS = {
  gauge: (
    <>
      <path d="m12 14 4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </>
  ),
  findings: (
    <>
      <path d="m3 17 2 2 4-4" />
      <path d="m3 7 2 2 4-4" />
      <path d="M13 6h8" />
      <path d="M13 12h8" />
      <path d="M13 18h8" />
    </>
  ),
  report: (
    <>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </>
  ),
  audio: (
    <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
  ),
  lock: (
    <>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  shield: (
    <>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
};

// Report images are cropped from real reports. The road, place, altitude,
// project name and project figures are painted out (not blurred), so
// nothing is recoverable.
const HERO_REPORT = {
  src: '/samples/report-a3.webp',
  width: 1600,
  height: 1034,
  alt: 'A3 DPR Analysis Report: executive summary with 68% compliance, moderate risk, 5 critical, 8 major and 5 minor findings, and a quick-reference table of issues, IRC clauses and recommendations. Project details are redacted.',
};

const HERO_SCORECARD = {
  src: '/samples/report-scorecard.webp',
  width: 1200,
  height: 835,
  alt: 'Online analysis scorecard: 58% compliance, high risk, 7 critical, 7 major and 5 minor findings. The project summary is redacted.',
};

const FINDING = {
  src: '/samples/report-finding.webp',
  width: 1200,
  height: 942,
  alt: 'A critical pavement finding citing IRC:37-2018, with its impact and recommended fix. Project-specific details are redacted.',
};

const HERO_POINTS = [
  { icon: 'report', label: 'Print-ready A3 report' },
  { icon: 'gauge', label: 'Online scorecard & findings' },
  { icon: 'audio', label: '4–5 min audio briefing' },
];

// The impact slide from the DPR Analyzer Pro capability brief.
const IMPACT = [
  { value: '~99%', label: 'Review time saved' },
  { value: '14', label: 'Codes checked, every time' },
  { value: '4–5 min', label: 'Spoken audit briefing' },
  { value: 'A3', label: 'Print-ready report' },
];

const DELIVERABLES = [
  {
    icon: 'gauge',
    title: 'Compliance scorecard',
    body: 'An overall compliance score and risk level, so you can see where the DPR stands at a glance.',
  },
  {
    icon: 'findings',
    title: 'Classified, clause-traced findings',
    body: 'Every gap graded critical, major or minor and traced to the relevant IRC or MoRTH provision, with its impact and a recommended fix.',
  },
  {
    icon: 'report',
    title: 'Print-ready A3 report',
    body: 'Executive summary, quick-reference table and detailed findings, ready to print, file and share.',
  },
  {
    icon: 'audio',
    tone: 'gold',
    title: 'Audio briefing',
    body: 'The whole review narrated as a 4–5 minute, podcast-style briefing you can listen to anywhere.',
  },
];

const STEPS = [
  {
    title: 'Upload your DPR',
    body: 'Submit the report and supporting files through the portal. They go straight to private, encrypted storage.',
  },
  {
    title: 'Compliance review',
    body: 'The DPR is checked section by section against the applicable IRC and MoRTH standards.',
  },
  {
    title: 'Read and listen',
    body: 'Your report and audio briefing appear on your dashboard, and you get an email when they are ready.',
  },
];

const TRUST = [
  {
    icon: 'lock',
    title: 'Private, encrypted storage',
    body: 'Encrypted in transit and at rest, hosted in the Mumbai region.',
  },
  {
    icon: 'shield',
    title: 'Restricted access',
    body: 'Only you and the review team can open your files. Every access is logged.',
  },
  {
    icon: 'clock',
    title: 'Deleted after delivery',
    body: 'Source files and reports are removed 30 days after the report is delivered.',
  },
];

export default function Landing() {
  const { brand } = useSettings();
  const { isAuthenticated } = useAuth();
  const mainCta = isAuthenticated ? (
    <Link to="/dashboard" style={primaryCta}>
      Go to dashboard
    </Link>
  ) : (
    <Link to="/login" style={primaryCta}>
      Log in
    </Link>
  );

  return (
    <>
      <section className="hero" style={heroStyle}>
        <div className="container hero-grid">
          <div className="hero-intro" style={heroIntroStyle}>
            <span style={eyebrowStyle}>{brand.eyebrow}</span>
            <h1 className="hero-title" style={headlineStyle}>
              Compliance analysis for road &amp; highway DPRs — delivered as a
              report and an audio overview.
            </h1>
            <p className="hero-sub" style={subStyle}>
              Upload your Detailed Project Report and receive a structured
              compliance review against IRC and MoRTH standards, prepared by
              qualified analysts. {brand.audience}
            </p>
            <div className="hero-ctas" style={ctaRowStyle}>
              {mainCta}
              <Link to="/privacy" style={secondaryCta}>
                How we handle your data
              </Link>
            </div>
            <ul className="hero-points" style={pointsStyle}>
              {HERO_POINTS.map((p) => (
                <li key={p.label} style={pointStyle}>
                  <span style={pointIconStyle}>
                    <Icon size={15}>{ICONS[p.icon]}</Icon>
                  </span>
                  {p.label}
                </li>
              ))}
              <li style={{ ...pointStyle, fontSize: '13px', opacity: 0.75 }}>
                Real output · project details redacted
              </li>
            </ul>
          </div>

          {/* Product shot: the A3 report, with the online scorecard and
              the audio briefing floating over its corners. Beside the text
              on laptops, below it on phones (.hero-* in global.css). */}
          <div className="hero-stage" style={stageStyle}>
            <div className="hero-report" style={reportFrameStyle}>
              <img
                src={HERO_REPORT.src}
                alt={HERO_REPORT.alt}
                width={HERO_REPORT.width}
                height={HERO_REPORT.height}
                fetchpriority="high"
                style={heroImgStyle}
              />
            </div>
            <div className="hero-float hero-float-score">
              <div style={scoreFrameStyle}>
                <img
                  src={HERO_SCORECARD.src}
                  alt={HERO_SCORECARD.alt}
                  width={HERO_SCORECARD.width}
                  height={HERO_SCORECARD.height}
                  style={heroImgStyle}
                />
              </div>
            </div>
            <div className="hero-float hero-float-audio">
              <AudioBriefingPreview compact />
            </div>
          </div>

          <div className="hero-captions" style={captionRowStyle}>
            {HERO_POINTS.map((p) => (
              <span key={p.label} style={captionItemStyle}>
                <Icon size={17}>{ICONS[p.icon]}</Icon>
                {p.label}
              </span>
            ))}
            <span>Real output · project details redacted</span>
          </div>
        </div>
      </section>

      <section style={{ paddingTop: spacing.xl }}>
        <div className="container">
          <div style={impactStyle}>
            <span style={{ ...sectionEyebrowStyle, color: colors.gold }}>The impact</span>
            <h2 style={impactHeadingStyle}>
              Faster. More consistent.{' '}
              <em style={{ color: '#E2BC63' }}>Now audible.</em>
            </h2>
            <p style={{ ...sectionLeadStyle, color: colors.textOnDarkMuted, maxWidth: 760 }}>
              Senior-engineer time saved, review quality standardised, and the
              verdict delivered in a form decision-makers can take in anywhere.
            </p>
            <div style={statGridStyle}>
              {IMPACT.map((s) => (
                <div key={s.label} style={statCardStyle}>
                  <div style={statValueStyle}>{s.value}</div>
                  <div style={statLabelStyle}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div className="container">
          <div style={sectionIntroStyle}>
            <span style={sectionEyebrowStyle}>What you receive</span>
            <h2 style={sectionHeading}>
              Every finding explained, traced and fixed
            </h2>
            <p style={sectionLeadStyle}>
              Each gap in the DPR is graded by severity, tied to the IRC or
              MoRTH clause it breaches, and paired with its impact and a
              practical correction.
            </p>
          </div>
          <div style={showcaseGridStyle}>
            <figure style={{ margin: 0 }}>
              <img
                src={FINDING.src}
                alt={FINDING.alt}
                width={FINDING.width}
                height={FINDING.height}
                loading="lazy"
                decoding="async"
                style={sampleImgStyle}
              />
              <figcaption style={captionStyle}>
                A finding from a real report · project details redacted
              </figcaption>
            </figure>
            <ul style={featureListStyle}>
              {DELIVERABLES.map((d) => (
                <li key={d.title} style={featureItemStyle}>
                  <span style={iconCircleStyle(d.tone)}>
                    <Icon>{ICONS[d.icon]}</Icon>
                  </span>
                  <div>
                    <h3 style={itemTitleStyle}>{d.title}</h3>
                    <p style={itemBodyStyle}>{d.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div className="container">
          <div style={sectionIntroStyle}>
            <span style={sectionEyebrowStyle}>How it works</span>
            <h2 style={sectionHeading}>From upload to briefing in three steps</h2>
          </div>
          <ol style={{ ...stepsGridStyle, listStyle: 'none', margin: 0, padding: 0 }}>
            {STEPS.map((s, i) => (
              <li key={s.title} style={stepCardStyle}>
                <span style={stepNumberStyle}>{String(i + 1).padStart(2, '0')}</span>
                <h3 style={itemTitleStyle}>{s.title}</h3>
                <p style={itemBodyStyle}>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section style={sectionStyle}>
        <div className="container">
          <div style={sectionIntroStyle}>
            <span style={sectionEyebrowStyle}>Confidential by design</span>
            <h2 style={sectionHeading}>Your DPR stays yours</h2>
          </div>
          <div style={trustPanelStyle}>
            {TRUST.map((t) => (
              <div key={t.title} style={featureItemStyle}>
                <span style={iconCircleStyle()}>
                  <Icon>{ICONS[t.icon]}</Icon>
                </span>
                <div>
                  <h3 style={itemTitleStyle}>{t.title}</h3>
                  <p style={itemBodyStyle}>{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: spacing['2xl'] }}>
        <div className="container">
          <div style={closingStyle}>
            <div style={{ maxWidth: 560 }}>
              <h2 style={{ ...sectionHeading, color: colors.textOnDark }}>
                Ready to review your next DPR?
              </h2>
              <p style={{ ...sectionLeadStyle, color: colors.textOnDarkMuted, marginTop: spacing.sm }}>
                {isAuthenticated
                  ? 'Upload a report and follow its review from your dashboard.'
                  : 'Log in to upload a report and follow its review from your dashboard.'}
              </p>
            </div>
            {mainCta}
          </div>
        </div>
      </section>
    </>
  );
}

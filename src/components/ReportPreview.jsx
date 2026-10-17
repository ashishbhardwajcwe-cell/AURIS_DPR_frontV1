import { colors, fonts, radii, shadows } from '../styles/theme.js';

// Landing-page illustration of the compliance report. The score and counts
// are illustrative, and every clause reference and finding is drawn as a
// redacted bar, so no real project detail is shown.

const SCORE = 68;
const COUNTS = [
  { label: 'Critical', value: 3, color: colors.statusFailed },
  { label: 'Major', value: 8, color: colors.statusInReview },
  { label: 'Minor', value: 5, color: '#2563EB' },
  { label: 'Total', value: 16, color: colors.tealDark },
];
const ROWS = [
  { severity: 'Critical', color: colors.statusFailed, w: '88%' },
  { severity: 'Major', color: colors.statusInReview, w: '72%' },
  { severity: 'Major', color: colors.statusInReview, w: '94%' },
  { severity: 'Minor', color: '#2563EB', w: '64%' },
];

const cardStyle = {
  width: '100%',
  maxWidth: 560,
  background: colors.cardBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.lg,
  boxShadow: shadows.raised,
  overflow: 'hidden',
  fontFamily: fonts.body,
};

const headStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '16px 22px',
  background: `linear-gradient(135deg, ${colors.navy900} 0%, ${colors.navy800} 100%)`,
  color: colors.textOnDark,
};

const emblemStyle = {
  width: 40,
  height: 40,
  borderRadius: 10,
  background: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const capsStyle = {
  fontSize: '10.5px',
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
};

const bodyStyle = {
  padding: 22,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

const sectionLabelStyle = {
  ...capsStyle,
  color: colors.textMuted,
  marginBottom: 8,
};

const skeleton = (width, height = 8) => ({
  display: 'block',
  width,
  height,
  borderRadius: 4,
  background: 'linear-gradient(90deg, #E6EBF2 0%, #F1F4F8 100%)',
});

function ScoreRing() {
  const r = 49;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 116, height: 116, flexShrink: 0 }}>
      <svg width="116" height="116" viewBox="0 0 116 116" aria-hidden="true">
        <circle cx="58" cy="58" r={r} fill="none" stroke="#EEF2F6" strokeWidth="9" />
        <circle
          cx="58"
          cy="58"
          r={r}
          fill="none"
          stroke={colors.statusInReview}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(SCORE / 100) * c} ${c}`}
          transform="rotate(-90 58 58)"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: fonts.heading,
            fontSize: '26px',
            fontWeight: 700,
            color: colors.textPrimary,
            lineHeight: 1,
          }}
        >
          {SCORE}%
        </span>
        <span
          style={{
            ...capsStyle,
            fontSize: '8.5px',
            letterSpacing: '0.1em',
            color: colors.textMuted,
            marginTop: 5,
          }}
        >
          Compliance
        </span>
      </div>
    </div>
  );
}

export default function ReportPreview({ brand }) {
  return (
    <div
      style={cardStyle}
      role="img"
      aria-label="Sample compliance report: an overall compliance score, risk level, counts of critical, major and minor findings, and a quick-reference table with details redacted"
    >
      <div style={headStyle}>
        {brand?.logoIcon && (
          <span style={emblemStyle}>
            <img
              src={brand.logoIcon}
              alt=""
              style={{ width: 30, height: 30, objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.parentElement.style.display = 'none';
              }}
            />
          </span>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ ...capsStyle, color: colors.gold }}>DPR Compliance Audit</div>
          <div style={{ fontFamily: fonts.heading, fontSize: '18px', marginTop: 2 }}>
            Sample hill-road DPR
          </div>
        </div>
        <span
          style={{
            ...capsStyle,
            color: colors.gold,
            border: '1px solid rgba(200, 162, 75, 0.5)',
            borderRadius: radii.pill,
            padding: '3px 10px',
          }}
        >
          Sample
        </span>
      </div>

      <div style={bodyStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
          <ScoreRing />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ ...capsStyle, color: colors.textMuted }}>Risk level</span>
              <span
                style={{
                  ...capsStyle,
                  fontSize: '11px',
                  color: '#92400E',
                  background: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  borderRadius: 6,
                  padding: '3px 10px',
                }}
              >
                Moderate
              </span>
            </div>
            <div style={sectionLabelStyle}>Executive summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={skeleton('100%')} />
              <span style={skeleton('92%')} />
              <span style={skeleton('68%')} />
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            background: '#F8FAFC',
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 12,
            padding: '14px 6px',
          }}
        >
          {COUNTS.map((c, i) => (
            <div
              key={c.label}
              style={{
                textAlign: 'center',
                borderLeft: i === 0 ? 'none' : `1px solid ${colors.cardBorder}`,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.heading,
                  fontSize: '26px',
                  fontWeight: 700,
                  color: c.color,
                  lineHeight: 1.1,
                }}
              >
                {c.value}
              </div>
              <div style={{ ...capsStyle, fontSize: '9.5px', color: colors.textMuted, marginTop: 4 }}>
                {c.label}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div style={sectionLabelStyle}>Quick-reference table</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ROWS.map((row, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '10px 64px 1fr auto',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderTop: i === 0 ? 'none' : `1px solid ${colors.cardBorder}`,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: row.color }} />
                <span style={skeleton('100%', 9)} />
                <span style={skeleton(row.w, 9)} />
                <span
                  style={{
                    ...capsStyle,
                    fontSize: '9.5px',
                    letterSpacing: '0.1em',
                    color: row.color,
                  }}
                >
                  {row.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            paddingTop: 14,
            borderTop: `1px solid ${colors.cardBorder}`,
            fontSize: '12.5px',
            color: colors.textMuted,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Illustrative sample · details redacted
          </span>
          <span style={{ fontWeight: 600, color: colors.textSecondary }}>A3 · print-ready</span>
        </div>
      </div>
    </div>
  );
}

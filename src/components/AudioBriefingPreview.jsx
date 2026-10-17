import { colors, fonts, radii } from '../styles/theme.js';

// Landing-page illustration of the audio deliverable. Purely visual: no audio
// is loaded and nothing is clickable. It shows what a briefing looks like
// without naming any real project.

const BARS = [
  0.35, 0.55, 0.8, 0.45, 0.95, 0.6, 0.75, 0.4, 0.9, 0.65, 0.5, 0.85, 0.7,
  0.45, 0.6, 0.9, 0.55, 0.75, 0.4, 0.65, 0.85, 0.5, 0.7, 0.35, 0.6, 0.8,
  0.45, 0.65, 0.5, 0.3,
];
const PLAYED = 12;
const GOLD_BRIGHT = '#E2BC63';

const cardStyle = {
  position: 'relative',
  width: '100%',
  maxWidth: 440,
  padding: '26px 28px 24px',
  borderRadius: radii.xl,
  background:
    'linear-gradient(165deg, rgba(28, 48, 87, 0.92) 0%, rgba(14, 19, 32, 0.96) 100%)',
  border: '1px solid rgba(200, 162, 75, 0.45)',
  boxShadow:
    '0 32px 64px rgba(4, 8, 20, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
  color: colors.textOnDark,
  fontFamily: fonts.body,
};

const topRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 22,
};

const sampleTagStyle = {
  fontSize: '10.5px',
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: GOLD_BRIGHT,
  border: '1px solid rgba(200, 162, 75, 0.5)',
  borderRadius: radii.pill,
  padding: '3px 10px',
};

const durationStyle = {
  fontSize: '12.5px',
  color: colors.textOnDarkMuted,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const iconWrapStyle = {
  width: 78,
  height: 78,
  margin: '0 auto 18px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: colors.navy900,
  background: `linear-gradient(160deg, ${GOLD_BRIGHT} 0%, ${colors.gold} 100%)`,
  boxShadow:
    '0 0 0 10px rgba(200, 162, 75, 0.09), 0 0 0 20px rgba(200, 162, 75, 0.04)',
};

const labelStyle = {
  textAlign: 'center',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: GOLD_BRIGHT,
};

const titleStyle = {
  textAlign: 'center',
  fontFamily: fonts.heading,
  fontStyle: 'italic',
  fontSize: '20px',
  margin: '6px 0 20px',
};

const waveStyle = {
  height: 56,
  display: 'flex',
  alignItems: 'center',
  gap: 3,
};

const trackStyle = {
  position: 'relative',
  height: 3,
  borderRadius: 2,
  background: 'rgba(255, 255, 255, 0.12)',
  marginTop: 14,
};

const timesStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: 8,
  fontSize: '12px',
  color: colors.textOnDarkMuted,
  fontVariantNumeric: 'tabular-nums',
};

const controlsStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 22,
  marginTop: 16,
};

const skipStyle = {
  width: 38,
  height: 38,
  borderRadius: '50%',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  fontWeight: 600,
  color: colors.textOnDarkMuted,
};

const playStyle = {
  width: 58,
  height: 58,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(160deg, ${GOLD_BRIGHT} 0%, ${colors.gold} 100%)`,
  boxShadow: '0 8px 22px rgba(200, 162, 75, 0.35)',
};

const factsStyle = {
  display: 'flex',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: '6px 14px',
  marginTop: 20,
  paddingTop: 16,
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  fontSize: '12.5px',
  color: colors.textOnDarkMuted,
};

export default function AudioBriefingPreview() {
  const playedPct = (PLAYED / BARS.length) * 100;
  return (
    <div
      style={cardStyle}
      role="img"
      aria-label="Sample audio briefing: a podcast-style player summarising a DPR compliance review in about five minutes"
    >
      <div style={topRowStyle}>
        <span style={sampleTagStyle}>Sample output</span>
        <span style={durationStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
          </svg>
          4–5 min
        </span>
      </div>

      <div style={iconWrapStyle}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      </div>

      <div style={labelStyle}>DPR Analysis · VoiceOver</div>
      <div style={titleStyle}>Hill-road DPR · compliance briefing</div>

      <div style={waveStyle} aria-hidden="true">
        {BARS.map((h, i) => {
          const played = i < PLAYED;
          return (
            <span
              key={i}
              className={played ? 'wave-live' : undefined}
              style={{
                flex: 1,
                height: `${h * 100}%`,
                borderRadius: 2,
                background: played ? GOLD_BRIGHT : 'rgba(255, 255, 255, 0.16)',
                transformOrigin: 'center',
                animationDelay: played ? `${(i % 6) * 0.12}s` : undefined,
              }}
            />
          );
        })}
      </div>

      <div style={trackStyle} aria-hidden="true">
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${playedPct}%`,
            borderRadius: 2,
            background: GOLD_BRIGHT,
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: `calc(${playedPct}% - 5px)`,
            top: -4,
            width: 11,
            height: 11,
            borderRadius: '50%',
            background: GOLD_BRIGHT,
            boxShadow: '0 0 0 4px rgba(200, 162, 75, 0.2)',
          }}
        />
      </div>
      <div style={timesStyle} aria-hidden="true">
        <span>1:52</span>
        <span>4:38</span>
      </div>

      <div style={controlsStyle} aria-hidden="true">
        <span style={skipStyle}>−10</span>
        <span style={playStyle}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5.5v13l10.5-6.5z" fill={colors.navy900} />
          </svg>
        </span>
        <span style={skipStyle}>+10</span>
      </div>

      <div style={factsStyle} aria-hidden="true">
        <span>Findings consolidated</span>
        <span>·</span>
        <span>Plain-spoken</span>
        <span>·</span>
        <span>Listen anywhere</span>
      </div>
    </div>
  );
}

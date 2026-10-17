import { useEffect, useRef, useState } from 'react';
import { colors, fonts, radii } from '../styles/theme.js';

// Landing-page sample of the audio deliverable. If a short excerpt has been
// published at EXCERPT_SRC the controls play it; if the file is missing the
// card stays a static illustration. Either way no real project is named.
const EXCERPT_SRC = '/audio/briefing-excerpt.mp3';

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

function formatTime(seconds) {
  const t = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

const buttonReset = {
  border: 'none',
  padding: 0,
  font: 'inherit',
  cursor: 'pointer',
};

export default function AudioBriefingPreview() {
  const audioRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    const onMeta = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        setReady(true);
      }
    };
    const onTime = () => setTime(audio.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      audio.currentTime = 0;
    };
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    // A missing file comes back as the SPA's index.html, fails to decode and
    // never fires loadedmetadata, so the card simply stays static.
    audio.src = EXCERPT_SRC;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audioRef.current = null;
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }

  function skip(delta) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(Math.max(audio.currentTime + delta, 0), duration);
  }

  const progress = ready ? time / duration : PLAYED / BARS.length;
  const playedBars = Math.round(progress * BARS.length);
  const playedPct = progress * 100;
  // Static illustration keeps its gentle motion; the live player only
  // animates while it is actually playing.
  const animate = ready ? playing : true;

  const playIcon = playing ? (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="5.5" width="3.6" height="13" rx="1" fill={colors.navy900} />
      <rect x="13.4" y="5.5" width="3.6" height="13" rx="1" fill={colors.navy900} />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l10.5-6.5z" fill={colors.navy900} />
    </svg>
  );

  return (
    <div
      style={cardStyle}
      role={ready ? 'region' : 'img'}
      aria-label={
        ready
          ? 'Sample audio briefing excerpt'
          : 'Sample audio briefing: a podcast-style player summarising a DPR compliance review in about five minutes'
      }
    >
      <div style={topRowStyle}>
        <span style={sampleTagStyle}>{ready ? 'Listen to a sample' : 'Sample output'}</span>
        <span style={durationStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
          </svg>
          {ready ? `Excerpt · ${formatTime(duration)}` : '4–5 min'}
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
          const played = i < playedBars;
          return (
            <span
              key={i}
              className={played && animate ? 'wave-live' : undefined}
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
        <span>{ready ? formatTime(time) : '1:52'}</span>
        <span>{ready ? formatTime(duration) : '4:38'}</span>
      </div>

      {ready ? (
        <div style={controlsStyle}>
          <button type="button" style={{ ...buttonReset, ...skipStyle, background: 'transparent' }} onClick={() => skip(-10)} aria-label="Back 10 seconds">
            −10
          </button>
          <button type="button" style={{ ...buttonReset, ...playStyle }} onClick={togglePlay} aria-label={playing ? 'Pause sample briefing' : 'Play sample briefing'}>
            {playIcon}
          </button>
          <button type="button" style={{ ...buttonReset, ...skipStyle, background: 'transparent' }} onClick={() => skip(10)} aria-label="Forward 10 seconds">
            +10
          </button>
        </div>
      ) : (
        <div style={controlsStyle} aria-hidden="true">
          <span style={skipStyle}>−10</span>
          <span style={playStyle}>{playIcon}</span>
          <span style={skipStyle}>+10</span>
        </div>
      )}

      <div style={factsStyle} aria-hidden="true">
        {ready ? (
          <span>Full briefings run 4–5 minutes</span>
        ) : (
          <>
            <span>Findings consolidated</span>
            <span>·</span>
            <span>Plain-spoken</span>
            <span>·</span>
            <span>Listen anywhere</span>
          </>
        )}
      </div>
    </div>
  );
}

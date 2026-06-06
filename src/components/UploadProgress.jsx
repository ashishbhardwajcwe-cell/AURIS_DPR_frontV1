import { formatBytes } from '../lib/format.js';
import { colors, fonts, radii, spacing } from '../styles/theme.js';

const wrapStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.md,
};

const rowStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  padding: spacing.md,
  background: '#FFFFFF',
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.sm,
};

const rowHeadStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing.md,
  fontFamily: fonts.body,
  fontSize: '14px',
};

const barTrack = {
  width: '100%',
  height: '6px',
  background: '#E2E8F0',
  borderRadius: '999px',
  overflow: 'hidden',
};

const statusLabel = (status) => {
  const map = {
    waiting:  { label: 'Waiting',   color: colors.textMuted, fill: '#CBD5E1' },
    uploading:{ label: 'Uploading', color: colors.tealDark,  fill: colors.tealPrimary },
    done:     { label: 'Uploaded',  color: colors.statusCompleted, fill: colors.statusCompleted },
    error:    { label: 'Failed',    color: colors.statusFailed,    fill: colors.statusFailed },
  };
  return map[status] ?? map.waiting;
};

export default function UploadProgress({ items, overallPercent }) {
  return (
    <div style={wrapStyle}>
      {Number.isFinite(overallPercent) && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: fonts.body,
              fontSize: '13.5px',
              color: colors.textSecondary,
              marginBottom: '6px',
            }}
          >
            <span>Overall progress</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {overallPercent}%
            </span>
          </div>
          <div style={barTrack}>
            <div
              style={{
                width: `${overallPercent}%`,
                height: '100%',
                background: colors.tealPrimary,
                transition: 'width 200ms ease',
              }}
            />
          </div>
        </div>
      )}

      {items.map((item) => {
        const meta = statusLabel(item.status);
        return (
          <div key={item.id} style={rowStyle}>
            <div style={rowHeadStyle}>
              <span
                style={{
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  minWidth: 0,
                }}
                title={item.name}
              >
                {item.name}
              </span>
              <span
                style={{
                  fontSize: '12.5px',
                  color: colors.textMuted,
                  whiteSpace: 'nowrap',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatBytes(item.size)}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: meta.color,
                  whiteSpace: 'nowrap',
                }}
              >
                {meta.label}
              </span>
            </div>
            <div style={barTrack}>
              <div
                style={{
                  width: `${item.percent ?? 0}%`,
                  height: '100%',
                  background: meta.fill,
                  transition: 'width 200ms ease',
                }}
              />
            </div>
            {item.error && (
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: '12.5px',
                  color: colors.statusFailed,
                }}
              >
                {item.error}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

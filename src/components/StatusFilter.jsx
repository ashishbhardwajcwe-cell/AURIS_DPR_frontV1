import { STATUS_META } from '../lib/jobs.js';
import { colors, fonts, radii, spacing } from '../styles/theme.js';

const FILTERS = [
  { value: null,         label: 'All' },
  { value: 'submitted',  label: 'Submitted' },
  { value: 'in_review',  label: 'In Review' },
  { value: 'completed',  label: 'Completed' },
  { value: 'failed',     label: 'Failed' },
  { value: 'cancelled',  label: 'Cancelled' },
];

const wrapStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing.sm,
  marginBottom: spacing.lg,
};

const buttonBase = {
  fontFamily: fonts.body,
  fontSize: '13.5px',
  fontWeight: 500,
  padding: '7px 14px',
  borderRadius: radii.pill,
  border: `1px solid ${colors.cardBorder}`,
  background: '#FFFFFF',
  color: colors.textPrimary,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const buttonActive = {
  ...buttonBase,
  background: colors.tealPrimary,
  borderColor: colors.tealPrimary,
  color: colors.textOnDark,
  fontWeight: 600,
};

export default function StatusFilter({ value, onChange, counts }) {
  return (
    <div style={wrapStyle} role="tablist" aria-label="Filter by status">
      {FILTERS.map((f) => {
        const isActive = (f.value ?? null) === (value ?? null);
        const meta = f.value ? STATUS_META[f.value] : null;
        const count = counts ? counts[f.value ?? 'all'] ?? 0 : undefined;
        return (
          <button
            key={f.label}
            type="button"
            role="tab"
            aria-selected={isActive}
            style={isActive ? buttonActive : buttonBase}
            onClick={() => onChange(f.value ?? null)}
          >
            {meta && !isActive && (
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: meta.color,
                }}
              />
            )}
            <span>{f.label}</span>
            {typeof count === 'number' && (
              <span
                style={{
                  marginLeft: 4,
                  fontSize: '11.5px',
                  opacity: 0.75,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

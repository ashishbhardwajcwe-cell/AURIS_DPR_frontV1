import { STATUS_META } from '../lib/jobs.js';
import { fonts, radii } from '../styles/theme.js';

function hexToRgba(hex, alpha) {
  const v = hex.replace('#', '');
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const FALLBACK = { label: 'Unknown', color: '#64748B' };

export default function StatusBadge({ status, size = 'md' }) {
  const meta = STATUS_META[status] ?? FALLBACK;
  const padding = size === 'sm' ? '3px 9px' : '5px 12px';
  const fontSize = size === 'sm' ? '11px' : '12px';

  return (
    <span
      role="status"
      aria-label={`Status: ${meta.label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding,
        borderRadius: radii.pill,
        fontFamily: fonts.body,
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: meta.color,
        background: hexToRgba(meta.color, 0.1),
        border: `1px solid ${hexToRgba(meta.color, 0.3)}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: meta.color,
        }}
      />
      {meta.label}
    </span>
  );
}

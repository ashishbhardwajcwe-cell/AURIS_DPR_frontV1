import { colors } from '../styles/theme.js';

// Small round mark for an account's approval state: a tick once approved
// (active), a cross when suspended, a clock while pending.
const META = {
  active: {
    color: colors.statusCompleted,
    label: 'Account approved',
    path: 'M6.2 10.4l2.5 2.5 5-5.4',
  },
  suspended: {
    color: colors.statusFailed,
    label: 'Account suspended',
    path: 'M7.2 7.2l5.6 5.6M12.8 7.2l-5.6 5.6',
  },
  pending: {
    color: colors.statusInReview,
    label: 'Pending approval',
    path: 'M10 5.8V10l2.8 1.9',
  },
};

export default function AccountStatusIcon({ status, size = 16 }) {
  const m = META[status] ?? META.pending;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      role="img"
      aria-label={m.label}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <title>{m.label}</title>
      <circle cx="10" cy="10" r="10" fill={m.color} />
      <path
        d={m.path}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

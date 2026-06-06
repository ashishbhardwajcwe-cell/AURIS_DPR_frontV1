import { colors, fonts, radii, spacing } from '../styles/theme.js';

const variants = {
  info: {
    background: '#EFF6FF',
    border: '#BFDBFE',
    color: '#1E3A8A',
  },
  success: {
    background: '#ECFDF5',
    border: '#A7F3D0',
    color: '#065F46',
  },
  warning: {
    background: '#FFFBEB',
    border: '#FCD34D',
    color: '#92400E',
  },
  error: {
    background: '#FEF2F2',
    border: '#FCA5A5',
    color: '#991B1B',
  },
  neutral: {
    background: '#F8FAFC',
    border: colors.cardBorder,
    color: colors.textSecondary,
  },
};

export default function Alert({ variant = 'info', title, children, style }) {
  const v = variants[variant] ?? variants.info;
  return (
    <div
      role="status"
      style={{
        background: v.background,
        border: `1px solid ${v.border}`,
        borderRadius: radii.sm,
        padding: `${spacing.md} ${spacing.md}`,
        fontFamily: fonts.body,
        fontSize: '14px',
        color: v.color,
        lineHeight: 1.55,
        ...style,
      }}
    >
      {title && (
        <div style={{ fontWeight: 600, marginBottom: children ? 4 : 0 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

import { colors, fonts, gradients, radii, shadows } from '../styles/theme.js';

const variants = {
  primary: {
    background: gradients.cta,
    color: colors.textOnDark,
    border: '1px solid transparent',
    boxShadow: shadows.cta,
  },
  secondary: {
    background: '#FFFFFF',
    color: colors.textPrimary,
    border: `1px solid ${colors.cardBorder}`,
    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
  },
  ghost: {
    background: 'transparent',
    color: colors.tealDark,
    border: '1px solid transparent',
  },
  danger: {
    background: colors.statusFailed,
    color: colors.textOnDark,
    border: '1px solid transparent',
  },
};

const sizes = {
  sm: { padding: '8px 14px', fontSize: '13.5px' },
  md: { padding: '11px 20px', fontSize: '14.5px' },
  lg: { padding: '13px 26px', fontSize: '15.5px' },
};

const spinnerStyle = {
  width: 14,
  height: 14,
  borderRadius: '50%',
  border: '2px solid rgba(255,255,255,0.35)',
  borderTopColor: 'currentColor',
  animation: 'spin 700ms linear infinite',
  flexShrink: 0,
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  disabled,
  loading,
  type = 'button',
  onClick,
  children,
  style: styleOverride,
}) {
  const variantStyle = variants[variant] ?? variants.primary;
  const sizeStyle = sizes[size] ?? sizes.md;

  const style = {
    ...variantStyle,
    ...sizeStyle,
    fontFamily: fonts.body,
    fontWeight: 600,
    letterSpacing: '0.01em',
    borderRadius: radii.sm,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.65 : 1,
    width: fullWidth ? '100%' : undefined,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition:
      'background 140ms ease, box-shadow 140ms ease, transform 120ms ease, border-color 140ms ease',
    ...styleOverride,
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={style}
      onMouseEnter={(e) => {
        if (disabled || loading) return;
        const el = e.currentTarget;
        el.style.transform = 'translateY(-1px)';
        if (variant === 'primary') {
          el.style.background = gradients.ctaHover;
          el.style.boxShadow = shadows.cardHover;
        } else if (variant === 'secondary') {
          el.style.borderColor = '#CBD5E1';
          el.style.boxShadow = shadows.card;
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'translateY(0)';
        if (variant === 'primary') {
          el.style.background = gradients.cta;
          el.style.boxShadow = shadows.cta;
        } else if (variant === 'secondary') {
          el.style.borderColor = colors.cardBorder;
          el.style.boxShadow = '0 1px 2px rgba(16, 24, 40, 0.05)';
        }
      }}
      onMouseDown={(e) => {
        if (disabled || loading) return;
        e.currentTarget.style.transform = 'translateY(0) scale(0.99)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px) scale(1)';
      }}
    >
      {loading && <span style={spinnerStyle} aria-hidden="true" />}
      {loading ? 'Working…' : children}
    </button>
  );
}

import { colors, fonts, radii } from '../styles/theme.js';

const variants = {
  primary: {
    background: colors.tealPrimary,
    color: colors.textOnDark,
    border: '1px solid transparent',
  },
  secondary: {
    background: '#FFFFFF',
    color: colors.textPrimary,
    border: `1px solid ${colors.cardBorder}`,
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
    borderRadius: radii.sm,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.7 : 1,
    width: fullWidth ? '100%' : undefined,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background 120ms ease, transform 80ms ease',
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
        if (variant === 'primary') {
          e.currentTarget.style.background = colors.tealDark;
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') {
          e.currentTarget.style.background = colors.tealPrimary;
        }
      }}
    >
      {loading ? 'Working…' : children}
    </button>
  );
}

import { colors, fonts, radii, spacing } from '../styles/theme.js';

const wrapStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  marginBottom: spacing.md,
};

const labelStyle = {
  fontFamily: fonts.body,
  fontSize: '13.5px',
  fontWeight: 500,
  color: colors.textPrimary,
};

const baseInputStyle = {
  fontFamily: fonts.body,
  fontSize: '15px',
  padding: '11px 14px',
  borderRadius: radii.sm,
  border: `1px solid ${colors.cardBorder}`,
  background: '#FFFFFF',
  color: colors.textPrimary,
  outline: 'none',
  transition: 'border-color 120ms ease, box-shadow 120ms ease',
};

const errorStyle = {
  fontFamily: fonts.body,
  fontSize: '12.5px',
  color: colors.statusFailed,
};

const hintStyle = {
  fontFamily: fonts.body,
  fontSize: '12.5px',
  color: colors.textMuted,
};

export default function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  required,
  autoComplete,
  placeholder,
  error,
  hint,
  disabled,
}) {
  const inputStyle = {
    ...baseInputStyle,
    borderColor: error ? colors.statusFailed : colors.cardBorder,
    background: disabled ? '#F1F5F9' : '#FFFFFF',
    cursor: disabled ? 'not-allowed' : 'text',
  };

  return (
    <div style={wrapStyle}>
      <label htmlFor={id} style={labelStyle}>
        {label}
        {required && <span style={{ color: colors.statusFailed }}> *</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        style={inputStyle}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error
            ? colors.statusFailed
            : colors.tealPrimary;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${
            error ? 'rgba(220,38,38,0.12)' : 'rgba(13,148,136,0.15)'
          }`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error
            ? colors.statusFailed
            : colors.cardBorder;
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      {error && <span style={errorStyle}>{error}</span>}
      {hint && !error && <span style={hintStyle}>{hint}</span>}
    </div>
  );
}

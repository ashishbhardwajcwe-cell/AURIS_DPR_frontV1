import { colors, fonts, radii } from '../styles/theme.js';

// Inline 4-color Google "G" mark. Matches Google's brand guidelines.
function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.45c-.28 1.45-1.13 2.68-2.4 3.5v2.91h3.88c2.27-2.09 3.56-5.17 3.56-8.65z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.88-2.91c-1.07.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A11.998 11.998 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.38c-.25-.74-.39-1.53-.39-2.34s.14-1.6.39-2.34V6.6H1.29A11.998 11.998 0 0 0 0 12c0 1.93.46 3.76 1.29 5.4l3.98-3.02z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.6l3.98 3.1C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

const baseStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  width: '100%',
  padding: '11px 16px',
  borderRadius: radii.sm,
  border: `1px solid ${colors.cardBorder}`,
  background: '#FFFFFF',
  color: colors.textPrimary,
  fontFamily: fonts.body,
  fontSize: '14.5px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 120ms ease, border-color 120ms ease',
};

export default function GoogleButton({ onClick, disabled, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...baseStyle,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = '#F8FAFC';
        e.currentTarget.style.borderColor = '#CBD5E1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#FFFFFF';
        e.currentTarget.style.borderColor = colors.cardBorder;
      }}
    >
      <GoogleIcon />
      <span>{label}</span>
    </button>
  );
}

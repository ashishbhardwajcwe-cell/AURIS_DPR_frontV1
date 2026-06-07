import { useEffect } from 'react';
import { colors, fonts, radii, shadows, spacing } from '../styles/theme.js';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing.md,
  zIndex: 200,
};

const dialogStyle = {
  background: colors.cardBg,
  borderRadius: radii.lg,
  boxShadow: shadows.raised,
  width: '100%',
  maxWidth: '480px',
  maxHeight: '92vh',
  overflowY: 'auto',
  padding: spacing.xl,
};

const titleStyle = {
  fontFamily: fonts.heading,
  fontSize: '22px',
  color: colors.textPrimary,
  marginBottom: spacing.sm,
};

const subStyle = {
  fontFamily: fonts.body,
  fontSize: '14px',
  color: colors.textSecondary,
  marginBottom: spacing.md,
};

export default function Modal({ open, onClose, title, subtitle, children }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div style={dialogStyle}>
        {title && <h2 style={titleStyle}>{title}</h2>}
        {subtitle && <p style={subStyle}>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

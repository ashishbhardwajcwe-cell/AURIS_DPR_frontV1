import { colors, fonts, spacing } from '../styles/theme.js';

const wrapStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: spacing.sm,
  padding: `${spacing.xl} ${spacing.lg}`,
  color: colors.textSecondary,
};

const titleStyle = {
  fontFamily: fonts.heading,
  fontSize: '20px',
  color: colors.textPrimary,
};

const bodyStyle = {
  fontFamily: fonts.body,
  fontSize: '14.5px',
  color: colors.textSecondary,
  maxWidth: '440px',
  lineHeight: 1.55,
};

const actionsStyle = {
  marginTop: spacing.md,
  display: 'flex',
  gap: spacing.sm,
  flexWrap: 'wrap',
  justifyContent: 'center',
};

export default function EmptyState({ title, children, actions }) {
  return (
    <div style={wrapStyle}>
      {title && <h3 style={titleStyle}>{title}</h3>}
      {children && <p style={bodyStyle}>{children}</p>}
      {actions && <div style={actionsStyle}>{actions}</div>}
    </div>
  );
}

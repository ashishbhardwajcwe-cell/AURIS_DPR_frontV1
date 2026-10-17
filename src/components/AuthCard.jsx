import { useSettings } from '../lib/settings.jsx';
import { colors, fonts, radii, shadows, spacing } from '../styles/theme.js';

const wrapStyle = {
  paddingTop: spacing['2xl'],
  paddingBottom: spacing['3xl'],
  display: 'flex',
  justifyContent: 'center',
};

const cardStyle = {
  background: colors.cardBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.lg,
  boxShadow: shadows.raised,
  padding: spacing.xl,
  width: '100%',
  maxWidth: '460px',
};

const brandRowStyle = {
  display: 'flex',
  justifyContent: 'center',
  paddingBottom: spacing.lg,
  marginBottom: spacing.lg,
  borderBottom: `1px solid ${colors.cardBorder}`,
};

const titleStyle = {
  fontFamily: fonts.heading,
  fontSize: '26px',
  color: colors.textPrimary,
  marginBottom: '6px',
};

const subStyle = {
  fontFamily: fonts.body,
  fontSize: '14.5px',
  color: colors.textSecondary,
  marginBottom: spacing.lg,
};

export default function AuthCard({ title, subtitle, children, footer }) {
  const { brand } = useSettings();
  return (
    <div style={wrapStyle}>
      <div
        className="container"
        style={{ display: 'flex', justifyContent: 'center' }}
      >
        <div style={cardStyle}>
          {brand.wordmarkLight && (
            <div style={brandRowStyle}>
              <img
                src={brand.wordmarkLight}
                alt={brand.productName}
                style={{ height: 30, width: 'auto', display: 'block' }}
                onError={(e) => {
                  e.currentTarget.parentElement.style.display = 'none';
                }}
              />
            </div>
          )}
          {title && <h1 style={titleStyle}>{title}</h1>}
          {subtitle && <p style={subStyle}>{subtitle}</p>}
          {children}
          {footer && (
            <div
              style={{
                marginTop: spacing.lg,
                fontFamily: fonts.body,
                fontSize: '13.5px',
                color: colors.textSecondary,
                textAlign: 'center',
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

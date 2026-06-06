import { Link, NavLink } from 'react-router-dom';
import { colors, gradients, fonts, layout, spacing } from '../styles/theme.js';

const headerStyle = {
  background: gradients.hero,
  color: colors.textOnDark,
  borderBottom: `1px solid ${colors.navy700}`,
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const innerStyle = {
  height: layout.navHeight,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing.lg,
};

const brandStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing.md,
  color: colors.textOnDark,
};

const logoStyle = {
  width: 40,
  height: 40,
  borderRadius: '8px',
  flexShrink: 0,
};

const wordmarkStyle = {
  display: 'flex',
  flexDirection: 'column',
  lineHeight: 1.1,
};

const productNameStyle = {
  fontFamily: fonts.heading,
  fontSize: '20px',
  fontWeight: 600,
  letterSpacing: '0.01em',
};

const taglineStyle = {
  fontFamily: fonts.body,
  fontSize: '11.5px',
  fontWeight: 400,
  color: colors.textOnDarkMuted,
  marginTop: 2,
};

const navStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing.md,
};

const linkBase = {
  fontFamily: fonts.body,
  fontSize: '14px',
  fontWeight: 500,
  color: colors.textOnDarkMuted,
  padding: '8px 12px',
  borderRadius: '8px',
  transition: 'color 120ms ease, background 120ms ease',
};

const loginBtnStyle = {
  ...linkBase,
  background: colors.tealPrimary,
  color: colors.textOnDark,
  padding: '9px 18px',
  fontWeight: 600,
};

export default function Header() {
  return (
    <header style={headerStyle}>
      <div className="container" style={innerStyle}>
        <Link to="/" style={brandStyle} aria-label="DPR Analyzer Pro home">
          <img
            src="/auris-logo.svg"
            alt="AURIS"
            style={logoStyle}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span style={wordmarkStyle}>
            <span style={productNameStyle}>DPR Analyzer Pro</span>
            <span style={taglineStyle}>
              AI-Assisted DPR Compliance Analysis · Road &amp; Highway Projects
            </span>
          </span>
        </Link>

        <nav style={navStyle} aria-label="Primary">
          <NavLink
            to="/privacy"
            style={({ isActive }) => ({
              ...linkBase,
              color: isActive ? colors.textOnDark : colors.textOnDarkMuted,
            })}
          >
            Privacy
          </NavLink>
          <NavLink
            to="/confidentiality"
            style={({ isActive }) => ({
              ...linkBase,
              color: isActive ? colors.textOnDark : colors.textOnDarkMuted,
            })}
          >
            Confidentiality
          </NavLink>
          <Link to="/login" style={loginBtnStyle}>
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}

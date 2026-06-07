import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { colors, gradients, fonts, layout, radii, spacing } from '../styles/theme.js';

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
  gap: spacing.sm,
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

const ctaButtonStyle = {
  ...linkBase,
  background: colors.tealPrimary,
  color: colors.textOnDark,
  padding: '9px 18px',
  fontWeight: 600,
};

const ghostButtonStyle = {
  ...linkBase,
  border: '1px solid rgba(255,255,255,0.18)',
  padding: '8px 14px',
  background: 'transparent',
  cursor: 'pointer',
};

const pendingBadgeStyle = {
  fontFamily: fonts.body,
  fontSize: '11.5px',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#FCD34D',
  background: 'rgba(252, 211, 77, 0.12)',
  border: '1px solid rgba(252, 211, 77, 0.35)',
  padding: '4px 10px',
  borderRadius: radii.pill,
};

const userPillStyle = {
  fontFamily: fonts.body,
  fontSize: '13px',
  color: colors.textOnDarkMuted,
  padding: '6px 12px',
  borderRadius: radii.pill,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  maxWidth: '180px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const adminLinkStyle = {
  fontFamily: fonts.body,
  fontSize: '12.5px',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: colors.tealPrimary,
  border: '1px solid rgba(13,148,136,0.45)',
  background: 'rgba(13,148,136,0.08)',
  padding: '6px 12px',
  borderRadius: radii.sm,
};

export default function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isPending, profile, user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  const displayLabel =
    profile?.company_name || profile?.contact_name || user?.email || '';

  return (
    <header style={headerStyle}>
      <div className="container" style={innerStyle}>
        <Link
          to={isAuthenticated ? '/dashboard' : '/'}
          style={brandStyle}
          aria-label="DPR Analyzer Pro home"
        >
          <img
            src="/auris-logo.png"
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
          {!isAuthenticated && (
            <>
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
              <Link to="/login" style={ctaButtonStyle}>
                Log in
              </Link>
            </>
          )}

          {isAuthenticated && (
            <>
              {isAdmin && (
                <NavLink to="/admin/jobs" style={adminLinkStyle}>
                  Admin
                </NavLink>
              )}
              {isPending && !isAdmin && (
                <span style={pendingBadgeStyle} title="Awaiting operator approval">
                  Pending approval
                </span>
              )}
              {displayLabel && (
                <span style={userPillStyle} title={displayLabel}>
                  {displayLabel}
                </span>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                style={ghostButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Sign out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

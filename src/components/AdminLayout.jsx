import { NavLink, Outlet } from 'react-router-dom';
import { colors, fonts, radii, spacing } from '../styles/theme.js';

const stripStyle = {
  background: '#0B1220',
  borderBottom: `1px solid ${colors.navy700}`,
};

const innerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing.lg,
  padding: `12px 0`,
};

const eyebrowStyle = {
  fontFamily: fonts.body,
  fontSize: '11.5px',
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: colors.tealPrimary,
  whiteSpace: 'nowrap',
};

const tabsStyle = {
  display: 'flex',
  gap: '4px',
};

const linkBase = {
  fontFamily: fonts.body,
  fontSize: '14px',
  fontWeight: 500,
  color: colors.textOnDarkMuted,
  padding: '8px 14px',
  borderRadius: radii.sm,
  transition: 'color 120ms ease, background 120ms ease',
};

const linkActive = {
  ...linkBase,
  color: colors.textOnDark,
  background: 'rgba(13, 148, 136, 0.18)',
};

export default function AdminLayout() {
  return (
    <>
      <div style={stripStyle}>
        <div className="container" style={innerStyle}>
          <span style={eyebrowStyle}>Admin</span>
          <nav style={tabsStyle} aria-label="Admin sections">
            <NavLink
              to="/admin/jobs"
              style={({ isActive }) => (isActive ? linkActive : linkBase)}
            >
              Jobs
            </NavLink>
            <NavLink
              to="/admin/clients"
              style={({ isActive }) => (isActive ? linkActive : linkBase)}
            >
              Clients
            </NavLink>
          </nav>
        </div>
      </div>
      <Outlet />
    </>
  );
}

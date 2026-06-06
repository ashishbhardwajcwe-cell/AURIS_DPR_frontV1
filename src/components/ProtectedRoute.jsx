import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { colors, fonts, spacing } from '../styles/theme.js';

const spinnerWrapStyle = {
  padding: spacing['3xl'],
  textAlign: 'center',
  fontFamily: fonts.body,
  color: colors.textMuted,
};

function LoadingShell() {
  return <div style={spinnerWrapStyle}>Loading your workspace…</div>;
}

// Guards every authenticated route. Behavior:
//   - loading           → shell ("Loading…")
//   - not signed in     → /login, remembering where the user was heading
//   - profile missing company_name (typical for fresh OAuth signups)
//                       → /complete-profile
//   - admin-only route + non-admin user
//                       → /dashboard
export default function ProtectedRoute({ adminOnly = false }) {
  const { loading, isAuthenticated, isAdmin, needsProfileCompletion } =
    useAuth();
  const location = useLocation();

  if (loading) return <LoadingShell />;

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (needsProfileCompletion && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

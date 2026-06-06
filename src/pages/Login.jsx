import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import GoogleButton from '../components/GoogleButton.jsx';
import Alert from '../components/Alert.jsx';
import { useAuth } from '../lib/auth.jsx';
import { colors, fonts, spacing } from '../styles/theme.js';

const dividerWrap = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing.md,
  margin: `${spacing.md} 0`,
  color: colors.textMuted,
  fontFamily: fonts.body,
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
};

const dividerLine = {
  flex: 1,
  height: 1,
  background: colors.cardBorder,
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    configured,
    isAuthenticated,
    loading,
    signInWithEmail,
    signInWithGoogle,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from || '/dashboard';

  // If a session is already live, send them straight in.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [loading, isAuthenticated, navigate, from]);

  async function handleEmailLogin(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmail({ email: email.trim(), password });
      // Navigation happens via the useEffect above once the session updates.
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      await signInWithGoogle();
      // Redirect is handled by Supabase / Google.
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    }
  }

  return (
    <AuthCard
      title="Log in"
      subtitle="Welcome back. Sign in to access your DPR Analyzer Pro workspace."
      footer={
        <span>
          New to DPR Analyzer Pro?{' '}
          <Link to="/signup">Create an account</Link>
        </span>
      }
    >
      {!configured && (
        <Alert variant="warning" title="Authentication is being configured.">
          The Supabase project URL and anon key need to be set in Netlify
          (and locally in <code>.env</code>) before sign-in will work.
        </Alert>
      )}

      {error && (
        <Alert variant="error" title="Sign-in failed" style={{ marginBottom: spacing.md }}>
          {error}
        </Alert>
      )}

      <GoogleButton
        onClick={handleGoogle}
        disabled={!configured || submitting}
        label="Continue with Google"
      />

      <div style={dividerWrap}>
        <span style={dividerLine} />
        <span>or</span>
        <span style={dividerLine} />
      </div>

      <form onSubmit={handleEmailLogin} noValidate>
        <FormField
          id="login-email"
          label="Work email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={!configured || submitting}
          placeholder="you@firm.com"
        />
        <FormField
          id="login-password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          disabled={!configured || submitting}
        />
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={!configured || submitting}
          loading={submitting}
        >
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}

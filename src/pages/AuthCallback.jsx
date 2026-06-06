import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthCard from '../components/AuthCard.jsx';
import Alert from '../components/Alert.jsx';
import { useAuth } from '../lib/auth.jsx';

// Landing page for OAuth redirects and email-confirmation links.
// Supabase JS parses the URL hash / query string automatically (because we
// set detectSessionInUrl: true), so all we do here is wait for the session
// to materialise and route the user onward.
export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, isAuthenticated, needsProfileCompletion } = useAuth();
  const errorParam =
    searchParams.get('error_description') || searchParams.get('error');

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) {
      navigate(needsProfileCompletion ? '/complete-profile' : '/dashboard', {
        replace: true,
      });
    }
  }, [loading, isAuthenticated, needsProfileCompletion, navigate]);

  if (errorParam) {
    return (
      <AuthCard
        title="Sign-in failed"
        subtitle="Something went wrong while completing the sign-in."
      >
        <Alert variant="error">{errorParam}</Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Signing you in…" subtitle="One moment.">
      <Alert variant="neutral">
        Finishing authentication. You&apos;ll be redirected automatically.
      </Alert>
    </AuthCard>
  );
}

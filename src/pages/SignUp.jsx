import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

function validate({ email, password, companyName, contactName, phone }) {
  const errors = {};
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = 'Please enter a valid work email address.';
  }
  if (!password || password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (!companyName?.trim()) {
    errors.companyName = 'Company / firm name is required.';
  }
  if (!contactName?.trim()) {
    errors.contactName = 'Please tell us your name.';
  }
  if (!phone || phone.replace(/\D/g, '').length < 7) {
    errors.phone = 'Please enter a valid phone number.';
  }
  return errors;
}

export default function SignUp() {
  const navigate = useNavigate();
  const {
    configured,
    isAuthenticated,
    loading,
    signUpWithEmail,
    signInWithGoogle,
  } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
    companyName: '',
    contactName: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!loading && isAuthenticated && !success) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, isAuthenticated, navigate, success]);

  const update = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError(null);
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitting(true);
    try {
      const result = await signUpWithEmail({
        email: form.email.trim(),
        password: form.password,
        companyName: form.companyName.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
      });

      // Supabase returns a session immediately if email confirmation is
      // disabled in the project. Otherwise the user must verify by email
      // before signing in.
      if (result?.session) {
        navigate('/dashboard', { replace: true });
      } else {
        setSuccess(
          'Account created. Check your email for a confirmation link, then come back here to sign in.'
        );
      }
    } catch (err) {
      setServerError(err.message || 'Unable to create your account.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setServerError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setServerError(err.message || 'Google sign-in failed.');
    }
  }

  if (success) {
    return (
      <AuthCard
        title="Almost there"
        subtitle="One last step before you can sign in."
        footer={<Link to="/login">Back to sign in</Link>}
      >
        <Alert variant="success" title="Account created">
          {success}
        </Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Sign up to upload DPRs and receive compliance reports. Your account will be activated once we verify your firm."
      footer={
        <span>
          Already have an account? <Link to="/login">Log in</Link>
        </span>
      }
    >
      {!configured && (
        <Alert variant="warning" title="Authentication is being configured.">
          The Supabase project URL and anon key need to be set before sign-up
          will work.
        </Alert>
      )}

      {serverError && (
        <Alert variant="error" title="Sign-up failed" style={{ marginBottom: spacing.md }}>
          {serverError}
        </Alert>
      )}

      <GoogleButton
        onClick={handleGoogle}
        disabled={!configured || submitting}
        label="Sign up with Google"
      />

      <div style={dividerWrap}>
        <span style={dividerLine} />
        <span>or</span>
        <span style={dividerLine} />
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          id="signup-company"
          label="Company / firm name"
          value={form.companyName}
          onChange={update('companyName')}
          required
          autoComplete="organization"
          disabled={!configured || submitting}
          placeholder="e.g. Acme Highway Consultants Pvt Ltd"
          error={errors.companyName}
        />
        <FormField
          id="signup-contact"
          label="Your name"
          value={form.contactName}
          onChange={update('contactName')}
          required
          autoComplete="name"
          disabled={!configured || submitting}
          error={errors.contactName}
        />
        <FormField
          id="signup-email"
          label="Work email"
          type="email"
          value={form.email}
          onChange={update('email')}
          required
          autoComplete="email"
          disabled={!configured || submitting}
          error={errors.email}
        />
        <FormField
          id="signup-phone"
          label="Phone number"
          type="tel"
          value={form.phone}
          onChange={update('phone')}
          required
          autoComplete="tel"
          placeholder="+91 98765 43210"
          disabled={!configured || submitting}
          error={errors.phone}
        />
        <FormField
          id="signup-password"
          label="Password"
          type="password"
          value={form.password}
          onChange={update('password')}
          required
          autoComplete="new-password"
          disabled={!configured || submitting}
          hint="At least 8 characters."
          error={errors.password}
        />
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={!configured || submitting}
          loading={submitting}
        >
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}

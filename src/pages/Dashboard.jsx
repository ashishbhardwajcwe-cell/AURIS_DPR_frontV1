import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import CreditBalanceCard from '../components/CreditBalanceCard.jsx';
import JobsTable from '../components/JobsTable.jsx';
import { useAuth } from '../lib/auth.jsx';
import { getCreditBalance } from '../lib/credits.js';
import { listJobsForUser, subscribeToUserJobs } from '../lib/jobs.js';
import { colors, fonts, radii, shadows, spacing } from '../styles/theme.js';

const wrapStyle = {
  paddingTop: spacing['2xl'],
  paddingBottom: spacing['3xl'],
};

const headerRow = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: spacing.md,
  marginBottom: spacing.lg,
};

const titleStyle = {
  fontFamily: fonts.heading,
  fontSize: 'clamp(26px, 4vw, 34px)',
  color: colors.textPrimary,
};

const subStyle = {
  fontFamily: fonts.body,
  fontSize: '14.5px',
  color: colors.textSecondary,
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(260px, 1fr) minmax(0, 2fr)',
  gap: spacing.lg,
  marginBottom: spacing.lg,
};

const gridStyleMobile = {
  ...gridStyle,
  gridTemplateColumns: '1fr',
};

const uploadCardStyle = {
  background: colors.cardBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.lg,
  boxShadow: shadows.card,
  padding: spacing.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
};

const uploadTitleStyle = {
  fontFamily: fonts.heading,
  fontSize: '20px',
  color: colors.textPrimary,
};

const uploadBodyStyle = {
  fontFamily: fonts.body,
  fontSize: '14.5px',
  color: colors.textSecondary,
  lineHeight: 1.6,
};

const uploadCtaRow = {
  marginTop: spacing.md,
  display: 'flex',
  gap: spacing.sm,
  flexWrap: 'wrap',
};

function useIsNarrow(breakpointPx = 880) {
  const [narrow, setNarrow] = useState(
    () =>
      typeof window !== 'undefined' && window.innerWidth < breakpointPx
  );
  useEffect(() => {
    function onResize() {
      setNarrow(window.innerWidth < breakpointPx);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpointPx]);
  return narrow;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, isPending } = useAuth();
  const narrow = useIsNarrow();

  const [balance, setBalance] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [error, setError] = useState(null);

  const userId = user?.id;
  const isActive = profile?.status === 'active';
  const hasCredits = (balance ?? 0) > 0;
  const canUpload = isActive && hasCredits;

  const loadJobs = useCallback(async () => {
    if (!userId) return;
    setError(null);
    setLoadingJobs(true);
    try {
      const data = await listJobsForUser(userId);
      setJobs(data);
    } catch (err) {
      setError(err.message || 'Unable to load your jobs.');
    } finally {
      setLoadingJobs(false);
    }
  }, [userId]);

  const loadBalance = useCallback(async () => {
    if (!userId) return;
    setLoadingBalance(true);
    try {
      const value = await getCreditBalance(userId);
      setBalance(value);
    } finally {
      setLoadingBalance(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    if (!userId) return;
    loadJobs();
    loadBalance();
  }, [userId, loadJobs, loadBalance]);

  // Realtime: any change to this user's jobs (admin status flip, new
  // submission, completion) → refresh both the jobs table and the balance
  // (since submissions deduct credits and failed jobs are refunded).
  useEffect(() => {
    if (!userId) return undefined;
    const unsubscribe = subscribeToUserJobs(userId, () => {
      loadJobs();
      loadBalance();
    });
    return unsubscribe;
  }, [userId, loadJobs, loadBalance]);

  function handleRefresh() {
    loadJobs();
    loadBalance();
  }

  function handleUpload() {
    navigate('/upload');
  }

  const companyName = profile?.company_name || 'your workspace';

  return (
    <div style={wrapStyle}>
      <div className="container">
        <div style={headerRow}>
          <div>
            <h1 style={titleStyle}>Welcome, {companyName}</h1>
            <p style={subStyle}>
              {profile?.contact_name ? `Hi ${profile.contact_name}. ` : ''}
              This is your DPR Analyzer Pro workspace.
            </p>
          </div>
        </div>

        {isPending && (
          <Alert
            variant="warning"
            title="Your account is pending approval"
            style={{ marginBottom: spacing.lg }}
          >
            We&apos;re reviewing your registration and will activate your
            account along with a trial credit allocation. You&apos;ll receive
            an email when it&apos;s ready — usually within one business day.
          </Alert>
        )}

        {!isPending && isActive && !hasCredits && !loadingBalance && (
          <Alert
            variant="info"
            title="You don't have any credits yet"
            style={{ marginBottom: spacing.lg }}
          >
            Each DPR uses 3–10 credits depending on size — see the{' '}
            <Link to="/pricing" style={{ fontWeight: 600 }}>
              rate card
            </Link>
            .{' '}
            <Link to="/pricing" style={{ fontWeight: 600 }}>
              Top up your credits →
            </Link>
          </Alert>
        )}

        {error && (
          <Alert variant="error" title="Could not load your jobs" style={{ marginBottom: spacing.lg }}>
            {error}
          </Alert>
        )}

        <div style={narrow ? gridStyleMobile : gridStyle}>
          <CreditBalanceCard balance={balance} loading={loadingBalance} />

          <div style={uploadCardStyle}>
            <h2 style={uploadTitleStyle}>Ready to analyse a new DPR?</h2>
            <p style={uploadBodyStyle}>
              Upload your Detailed Project Report. We&apos;ll prepare a
              compliance review against IRC and MoRTH standards and deliver
              the report plus a short audio overview to your dashboard.
            </p>
            <div style={uploadCtaRow}>
              <Button
                variant="primary"
                size="lg"
                onClick={handleUpload}
                disabled={!canUpload}
              >
                Upload a DPR
              </Button>
              {!canUpload && (
                <span
                  style={{
                    fontFamily: fonts.body,
                    fontSize: '13px',
                    color: colors.textMuted,
                    alignSelf: 'center',
                  }}
                >
                  {isPending
                    ? 'Available once your account is approved.'
                    : 'Add credits to start a new submission.'}
                </span>
              )}
            </div>
          </div>
        </div>

        <JobsTable
          jobs={jobs}
          loading={loadingJobs}
          onRefresh={handleRefresh}
          onUpload={handleUpload}
          canUpload={canUpload}
        />
      </div>
    </div>
  );
}

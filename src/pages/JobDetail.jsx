import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../lib/auth.jsx';
import { getJob, subscribeToUserJobs } from '../lib/jobs.js';
import { formatDateTime, formatBytes } from '../lib/format.js';
import { colors, fonts, radii, shadows, spacing } from '../styles/theme.js';

// Placeholder layout for the job detail page. Milestone 7 adds the
// status timeline, the download buttons for report (PDF) + audio (MP3),
// and the operator summary block.
const wrapStyle = {
  paddingTop: spacing['2xl'],
  paddingBottom: spacing['3xl'],
};

const cardStyle = {
  background: colors.cardBg,
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.lg,
  boxShadow: shadows.card,
  padding: spacing.xl,
};

const titleStyle = {
  fontFamily: fonts.heading,
  fontSize: 'clamp(22px, 3vw, 28px)',
  color: colors.textPrimary,
  marginBottom: spacing.sm,
};

const metaGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: spacing.md,
  marginTop: spacing.lg,
  fontFamily: fonts.body,
};

const metaLabelStyle = {
  fontSize: '11.5px',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: colors.textMuted,
};

const metaValueStyle = {
  fontSize: '15px',
  color: colors.textPrimary,
  marginTop: 4,
};

const linkStyle = {
  fontFamily: fonts.body,
  fontSize: '14px',
  color: colors.tealDark,
  fontWeight: 600,
};

export default function JobDetail() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getJob(jobId);
        if (cancelled) return;
        if (!data) {
          setError('We could not find that job — it may have been removed.');
        } else {
          setJob(data);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load this job.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  // Live updates so a status flip from the admin shows immediately.
  useEffect(() => {
    if (!user?.id) return undefined;
    const unsubscribe = subscribeToUserJobs(user.id, (payload) => {
      if (payload?.new?.id === Number(jobId)) {
        setJob(payload.new);
      }
    });
    return unsubscribe;
  }, [user?.id, jobId]);

  return (
    <div style={wrapStyle}>
      <div className="container">
        <p style={{ marginBottom: spacing.md }}>
          <Link to="/dashboard" style={linkStyle}>
            ← Back to dashboard
          </Link>
        </p>

        <div style={cardStyle}>
          {loading && (
            <p style={{ color: colors.textMuted, fontFamily: fonts.body }}>
              Loading job…
            </p>
          )}

          {error && <Alert variant="error">{error}</Alert>}

          {job && (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md,
                  flexWrap: 'wrap',
                }}
              >
                <h1 style={titleStyle}>{job.project_name}</h1>
                <StatusBadge status={job.status} />
              </div>

              {job.road_stretch && (
                <p
                  style={{
                    fontFamily: fonts.body,
                    fontSize: '14.5px',
                    color: colors.textSecondary,
                  }}
                >
                  {job.road_stretch}
                </p>
              )}

              <div style={metaGridStyle}>
                <div>
                  <div style={metaLabelStyle}>Submitted</div>
                  <div style={metaValueStyle}>
                    {formatDateTime(job.submitted_at)}
                  </div>
                </div>
                <div>
                  <div style={metaLabelStyle}>Total size</div>
                  <div style={metaValueStyle}>
                    {formatBytes(job.total_size_bytes)}
                  </div>
                </div>
                <div>
                  <div style={metaLabelStyle}>Credits used</div>
                  <div style={metaValueStyle}>{job.credits_used ?? 1}</div>
                </div>
                {job.completed_at && (
                  <div>
                    <div style={metaLabelStyle}>Completed</div>
                    <div style={metaValueStyle}>
                      {formatDateTime(job.completed_at)}
                    </div>
                  </div>
                )}
              </div>

              <Alert variant="neutral" style={{ marginTop: spacing.lg }}>
                The full job detail view — status timeline, report download,
                audio player, and operator summary — is being built in the
                next milestone.
              </Alert>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

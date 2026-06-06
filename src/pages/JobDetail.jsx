import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import AudioPlayer from '../components/AudioPlayer.jsx';
import ReportDownloadCard from '../components/ReportDownloadCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StatusTimeline from '../components/StatusTimeline.jsx';
import { useAuth } from '../lib/auth.jsx';
import { getJob, subscribeToJob } from '../lib/jobs.js';
import { formatDateTime, formatBytes } from '../lib/format.js';
import { colors, fonts, radii, shadows, spacing } from '../styles/theme.js';

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
  marginBottom: spacing.lg,
};

const titleStyle = {
  fontFamily: fonts.heading,
  fontSize: 'clamp(22px, 3vw, 28px)',
  color: colors.textPrimary,
  margin: 0,
};

const sectionTitleStyle = {
  fontFamily: fonts.heading,
  fontSize: '18px',
  color: colors.textPrimary,
  margin: 0,
  marginBottom: spacing.md,
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

const summaryBoxStyle = {
  background: '#F8FAFC',
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.sm,
  padding: spacing.md,
  fontFamily: fonts.body,
  fontSize: '14.5px',
  color: colors.textPrimary,
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  marginBottom: spacing.lg,
};

const filenameFromPath = (path) =>
  path ? path.split('/').pop() || path : null;

export default function JobDetail() {
  const { jobId } = useParams();
  const { isAdmin } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const numericJobId = Number(jobId);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getJob(numericJobId);
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
  }, [numericJobId]);

  // Realtime — works for owners AND admins because the filter is by job id.
  useEffect(() => {
    if (!Number.isFinite(numericJobId)) return undefined;
    const unsubscribe = subscribeToJob(numericJobId, (payload) => {
      if (payload?.new) {
        setJob(payload.new);
      } else if (payload?.eventType === 'DELETE') {
        setError('This job has been removed.');
        setJob(null);
      }
    });
    return unsubscribe;
  }, [numericJobId]);

  if (loading) {
    return (
      <div style={wrapStyle}>
        <div className="container">
          <p style={{ marginBottom: spacing.md }}>
            <Link to="/dashboard" style={linkStyle}>
              ← Back to dashboard
            </Link>
          </p>
          <div style={cardStyle}>
            <p style={{ color: colors.textMuted, fontFamily: fonts.body }}>
              Loading job…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div style={wrapStyle}>
        <div className="container">
          <p style={{ marginBottom: spacing.md }}>
            <Link to="/dashboard" style={linkStyle}>
              ← Back to dashboard
            </Link>
          </p>
          <div style={cardStyle}>
            <Alert variant="error">{error || 'Job not found.'}</Alert>
          </div>
        </div>
      </div>
    );
  }

  const status = job.status;
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isCancelled = status === 'cancelled';
  const isInReview = status === 'in_review';
  const isSubmitted = status === 'submitted';
  const hasReport = Boolean(job.report_path);
  const hasAudio = Boolean(job.audio_path);
  const uploadCount = Array.isArray(job.upload_paths)
    ? job.upload_paths.length
    : 0;

  return (
    <div style={wrapStyle}>
      <div className="container">
        <p style={{ marginBottom: spacing.md }}>
          <Link to="/dashboard" style={linkStyle}>
            ← Back to dashboard
          </Link>
          {isAdmin && (
            <span
              style={{
                marginLeft: spacing.md,
                fontFamily: fonts.body,
                fontSize: '11.5px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: colors.tealDark,
                background: 'rgba(13,148,136,0.08)',
                border: `1px solid rgba(13,148,136,0.25)`,
                padding: '3px 9px',
                borderRadius: 999,
              }}
            >
              Admin view
            </span>
          )}
        </p>

        {/* --- Overview card --- */}
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.md,
              flexWrap: 'wrap',
            }}
          >
            <h1 style={titleStyle}>{job.project_name}</h1>
            <StatusBadge status={status} />
          </div>

          {job.road_stretch && (
            <p
              style={{
                fontFamily: fonts.body,
                fontSize: '14.5px',
                color: colors.textSecondary,
                marginTop: 6,
              }}
            >
              {job.road_stretch}
            </p>
          )}

          <StatusTimeline
            status={status}
            submittedAt={job.submitted_at}
            completedAt={job.completed_at}
          />

          <div style={metaGridStyle}>
            <div>
              <div style={metaLabelStyle}>Submitted</div>
              <div style={metaValueStyle}>
                {formatDateTime(job.submitted_at)}
              </div>
            </div>
            <div>
              <div style={metaLabelStyle}>Files</div>
              <div style={metaValueStyle}>
                {uploadCount} · {formatBytes(job.total_size_bytes)}
              </div>
            </div>
            <div>
              <div style={metaLabelStyle}>Credits used</div>
              <div style={metaValueStyle}>{job.credits_used ?? 1}</div>
            </div>
            {job.completed_at && (
              <div>
                <div style={metaLabelStyle}>
                  {isFailed ? 'Marked failed' : 'Completed'}
                </div>
                <div style={metaValueStyle}>
                  {formatDateTime(job.completed_at)}
                </div>
              </div>
            )}
          </div>

          {job.notes && (
            <div style={{ marginTop: spacing.lg }}>
              <div style={metaLabelStyle}>Your note to the analyst</div>
              <div
                style={{
                  ...summaryBoxStyle,
                  marginTop: 6,
                  marginBottom: 0,
                  background: '#FFFFFF',
                }}
              >
                {job.notes}
              </div>
            </div>
          )}
        </div>

        {/* --- Status-specific guidance --- */}
        {isSubmitted && (
          <div style={cardStyle}>
            <Alert variant="neutral" title="In our queue">
              Your DPR has been received and is waiting to be picked up by
              an analyst. We&apos;ll email you when the review is complete.
            </Alert>
          </div>
        )}

        {isInReview && (
          <div style={cardStyle}>
            <Alert variant="info" title="An analyst is reviewing your DPR">
              The compliance review is in progress. You&apos;ll receive an
              email and see this page update when the report and audio
              overview are ready.
            </Alert>
          </div>
        )}

        {isCancelled && (
          <div style={cardStyle}>
            <Alert variant="neutral" title="Submission cancelled">
              This submission was cancelled. No credit was deducted.
            </Alert>
          </div>
        )}

        {/* --- Deliverables card (completed) --- */}
        {isCompleted && (hasReport || hasAudio || job.operator_summary) && (
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Your deliverables</h2>

            {job.operator_summary && (
              <>
                <div style={metaLabelStyle}>Summary from the analyst</div>
                <div style={summaryBoxStyle}>{job.operator_summary}</div>
              </>
            )}

            {hasReport && (
              <div style={{ marginBottom: spacing.lg }}>
                <h3
                  style={{
                    ...sectionTitleStyle,
                    fontSize: '16px',
                    marginBottom: spacing.sm,
                  }}
                >
                  Compliance report
                </h3>
                <ReportDownloadCard
                  jobId={numericJobId}
                  filename={
                    filenameFromPath(job.report_path) ||
                    `dpr-report-${numericJobId}.pdf`
                  }
                />
              </div>
            )}

            {hasAudio && (
              <div>
                <h3
                  style={{
                    ...sectionTitleStyle,
                    fontSize: '16px',
                    marginBottom: spacing.sm,
                  }}
                >
                  Audio overview
                </h3>
                <AudioPlayer
                  jobId={numericJobId}
                  filename={
                    filenameFromPath(job.audio_path) ||
                    `dpr-audio-${numericJobId}.mp3`
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* --- Failed state --- */}
        {isFailed && (
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>This submission could not be completed</h2>
            {job.operator_summary ? (
              <>
                <div style={metaLabelStyle}>Note from the analyst</div>
                <div style={summaryBoxStyle}>{job.operator_summary}</div>
              </>
            ) : (
              <Alert variant="error">
                We were unable to complete the analysis on this submission.
                Please reach out for details.
              </Alert>
            )}
            <Alert variant="success" style={{ marginTop: spacing.sm }}>
              Your credit has been refunded.
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}

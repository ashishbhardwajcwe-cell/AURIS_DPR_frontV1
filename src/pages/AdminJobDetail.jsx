import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import DeliverableUploader from '../components/DeliverableUploader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StatusTimeline from '../components/StatusTimeline.jsx';
import UploadsList from '../components/UploadsList.jsx';
import { useAuth } from '../lib/auth.jsx';
import { getJob, subscribeToJob, STATUS_META } from '../lib/jobs.js';
import { getProfile } from '../lib/profiles.js';
import { saveJob } from '../lib/admin.js';
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

const labelStyle = {
  fontFamily: fonts.body,
  fontSize: '11.5px',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: colors.textMuted,
};

const inputStyle = {
  fontFamily: fonts.body,
  fontSize: '14.5px',
  padding: '11px 14px',
  borderRadius: radii.sm,
  border: `1px solid ${colors.cardBorder}`,
  background: '#FFFFFF',
  color: colors.textPrimary,
  width: '100%',
  outline: 'none',
};

const textareaStyle = {
  ...inputStyle,
  minHeight: 120,
  resize: 'vertical',
  fontFamily: fonts.body,
};

const linkStyle = {
  fontFamily: fonts.body,
  fontSize: '14px',
  color: colors.tealDark,
  fontWeight: 600,
};

const STATUS_OPTIONS = ['submitted', 'in_review', 'completed', 'failed', 'cancelled'];

export default function AdminJobDetail() {
  const { jobId } = useParams();
  const { isAdmin } = useAuth();
  const numericJobId = Number(jobId);

  const [job, setJob] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state (separate from job so we can hold edits before save)
  const [status, setStatus] = useState('submitted');
  const [summary, setSummary] = useState('');
  const [reportPath, setReportPath] = useState(null);
  const [audioPath, setAudioPath] = useState(null);
  const [notify, setNotify] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedFlash, setSavedFlash] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const j = await getJob(numericJobId);
      if (!j) {
        setError('Job not found.');
        return;
      }
      setJob(j);
      setStatus(j.status || 'submitted');
      setSummary(j.operator_summary || '');
      setReportPath(j.report_path || null);
      setAudioPath(j.audio_path || null);
      if (j.user_id) {
        const p = await getProfile(j.user_id);
        setOwner(p);
      }
    } catch (err) {
      setError(err.message || 'Could not load job.');
    } finally {
      setLoading(false);
    }
  }, [numericJobId]);

  useEffect(() => {
    if (Number.isFinite(numericJobId)) load();
  }, [numericJobId, load]);

  useEffect(() => {
    if (!Number.isFinite(numericJobId)) return undefined;
    const unsub = subscribeToJob(numericJobId, (payload) => {
      if (payload?.new) {
        setJob(payload.new);
        // Don't overwrite the operator's pending edits while they type.
      }
    });
    return unsub;
  }, [numericJobId]);

  async function handleSave({ withNotify } = {}) {
    setSaving(true);
    setSaveError(null);
    setSavedFlash(null);
    try {
      const willNotify =
        typeof withNotify === 'boolean' ? withNotify : notify;
      const result = await saveJob({
        jobId: numericJobId,
        status,
        operatorSummary: summary,
        reportPath: reportPath || null,
        audioPath: audioPath || null,
        notify: status === 'completed' ? willNotify : false,
      });
      let flash = 'Saved.';
      if (result.refunded) flash += ' Credit refunded.';
      if (result.notified) flash += ' Client notified.';
      setSavedFlash(flash);
      await load();
    } catch (err) {
      setSaveError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  if (!Number.isFinite(numericJobId)) {
    return (
      <div style={wrapStyle}>
        <div className="container">
          <Alert variant="error">Invalid job id.</Alert>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={wrapStyle}>
        <div className="container">
          <p style={{ marginBottom: spacing.md }}>
            <Link to="/admin/jobs" style={linkStyle}>
              ← All jobs
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
            <Link to="/admin/jobs" style={linkStyle}>
              ← All jobs
            </Link>
          </p>
          <Alert variant="error">{error || 'Job not found.'}</Alert>
        </div>
      </div>
    );
  }

  const isCompletedStatus = status === 'completed';

  return (
    <div style={wrapStyle}>
      <div className="container">
        <p style={{ marginBottom: spacing.md }}>
          <Link to="/admin/jobs" style={linkStyle}>
            ← All jobs
          </Link>
        </p>

        {/* Overview */}
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
            <StatusBadge status={job.status} />
            <Link to={`/jobs/${job.id}`} style={{ ...linkStyle, fontSize: 13 }}>
              View client-facing page →
            </Link>
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
            status={job.status}
            submittedAt={job.submitted_at}
            completedAt={job.completed_at}
          />

          {/* Two-column meta */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: spacing.md,
              marginTop: spacing.lg,
            }}
          >
            <div>
              <div style={labelStyle}>Firm</div>
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: '15px',
                  color: colors.textPrimary,
                  marginTop: 4,
                }}
              >
                {owner?.company_name || '—'}
              </div>
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: '13px',
                  color: colors.textMuted,
                  marginTop: 2,
                }}
              >
                {[owner?.contact_name, owner?.email].filter(Boolean).join(' · ')}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Submitted</div>
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: '15px',
                  color: colors.textPrimary,
                  marginTop: 4,
                }}
              >
                {formatDateTime(job.submitted_at)}
              </div>
              {job.completed_at && (
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: '13px',
                    color: colors.textMuted,
                    marginTop: 2,
                  }}
                >
                  Closed: {formatDateTime(job.completed_at)}
                </div>
              )}
            </div>
            <div>
              <div style={labelStyle}>Files</div>
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: '15px',
                  color: colors.textPrimary,
                  marginTop: 4,
                }}
              >
                {(job.upload_paths || []).length} ·{' '}
                {formatBytes(job.total_size_bytes)}
              </div>
            </div>
          </div>

          {job.notes && (
            <div style={{ marginTop: spacing.lg }}>
              <div style={labelStyle}>Note from client</div>
              <div
                style={{
                  marginTop: 6,
                  background: '#F8FAFC',
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: radii.sm,
                  padding: spacing.md,
                  fontFamily: fonts.body,
                  fontSize: '14.5px',
                  color: colors.textPrimary,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {job.notes}
              </div>
            </div>
          )}
        </div>

        {/* Source files */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Client uploads</h2>
          <UploadsList jobId={numericJobId} paths={job.upload_paths} />
        </div>

        {/* Operator working form */}
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Deliver</h2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.lg,
            }}
          >
            <DeliverableUploader
              jobId={numericJobId}
              kind="report"
              currentPath={reportPath}
              onUploaded={({ path }) => setReportPath(path)}
            />
            <DeliverableUploader
              jobId={numericJobId}
              kind="audio"
              currentPath={audioPath}
              onUploaded={({ path }) => setAudioPath(path)}
            />

            <div>
              <div style={labelStyle}>Summary for client</div>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="A few lines the client will see alongside the report on their job page and in the report-ready email."
                style={{ ...textareaStyle, marginTop: 6 }}
                disabled={saving}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: spacing.md,
              }}
            >
              <div>
                <div style={labelStyle}>Status</div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ ...inputStyle, marginTop: 6 }}
                  disabled={saving}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s]?.label ?? s}
                    </option>
                  ))}
                </select>
              </div>

              {isCompletedStatus && (
                <div>
                  <div style={labelStyle}>On save</div>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 10,
                      fontFamily: fonts.body,
                      fontSize: '14px',
                      color: colors.textPrimary,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={notify}
                      onChange={(e) => setNotify(e.target.checked)}
                      disabled={saving}
                    />
                    Email the client that their report is ready
                  </label>
                </div>
              )}
            </div>

            {status === 'failed' && job.status !== 'failed' && (
              <Alert variant="warning">
                Marking this job as <strong>Failed</strong> will automatically
                refund 1 credit to the client (idempotent — won&apos;t double-refund).
              </Alert>
            )}

            {saveError && <Alert variant="error">{saveError}</Alert>}
            {savedFlash && <Alert variant="success">{savedFlash}</Alert>}

            <div
              style={{
                display: 'flex',
                gap: spacing.sm,
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="secondary"
                onClick={load}
                disabled={saving}
              >
                Reset
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleSave()}
                disabled={saving || !isAdmin}
                loading={saving}
              >
                {isCompletedStatus && notify ? 'Save & notify client' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

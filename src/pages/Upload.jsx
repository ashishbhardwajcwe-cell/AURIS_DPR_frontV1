import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import FormField from '../components/FormField.jsx';
import FileDropzone from '../components/FileDropzone.jsx';
import UploadProgress from '../components/UploadProgress.jsx';
import { useAuth } from '../lib/auth.jsx';
import { getCreditBalance } from '../lib/credits.js';
import { describeFileIssues } from '../lib/uploadLimits.js';
import { requestUpload, confirmUpload, uploadFile } from '../lib/upload.js';
import { formatBytes } from '../lib/format.js';
import { colors, fonts, radii, shadows, spacing } from '../styles/theme.js';

const PHASES = Object.freeze({
  IDLE: 'idle',
  STARTING: 'starting',
  UPLOADING: 'uploading',
  CONFIRMING: 'confirming',
  SUCCESS: 'success',
  FAILED: 'failed',
});

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
  fontSize: 'clamp(24px, 4vw, 32px)',
  color: colors.textPrimary,
  marginBottom: spacing.sm,
};

const subStyle = {
  fontFamily: fonts.body,
  fontSize: '14.5px',
  color: colors.textSecondary,
  marginBottom: spacing.lg,
};

const summaryStyle = {
  marginTop: spacing.md,
  padding: spacing.md,
  background: '#F8FAFC',
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.sm,
  fontFamily: fonts.body,
  fontSize: '13.5px',
  color: colors.textSecondary,
  display: 'flex',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: spacing.sm,
};

const linkStyle = {
  fontFamily: fonts.body,
  fontSize: '14px',
  color: colors.tealDark,
  fontWeight: 600,
};

export default function Upload() {
  const navigate = useNavigate();
  const { user, profile, isPending } = useAuth();

  const [projectName, setProjectName] = useState('');
  const [roadStretch, setRoadStretch] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);

  const [phase, setPhase] = useState(PHASES.IDLE);
  const [errorText, setErrorText] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [items, setItems] = useState([]); // per-file progress

  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (user?.id) {
      getCreditBalance(user.id).then(setBalance);
    }
  }, [user?.id]);

  const totalSize = useMemo(
    () => files.reduce((acc, f) => acc + (f.size || 0), 0),
    [files]
  );

  const issues = describeFileIssues(files);
  const isActive = profile?.status === 'active';
  const hasCredits = (balance ?? 0) > 0;
  const submitDisabled =
    !projectName.trim() ||
    files.length === 0 ||
    issues.length > 0 ||
    !isActive ||
    !hasCredits ||
    phase === PHASES.STARTING ||
    phase === PHASES.UPLOADING ||
    phase === PHASES.CONFIRMING;

  function resetUploadState() {
    setItems([]);
    setJobId(null);
    setErrorText(null);
    setPhase(PHASES.IDLE);
  }

  const overallPercent = useMemo(() => {
    if (items.length === 0) return null;
    const totalKnown = items.reduce((acc, it) => acc + (it.size || 0), 0);
    if (totalKnown === 0) return 0;
    const totalDone = items.reduce(
      (acc, it) => acc + ((it.percent ?? 0) / 100) * (it.size || 0),
      0
    );
    return Math.min(100, Math.round((totalDone / totalKnown) * 100));
  }, [items]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorText(null);

    if (submitDisabled) return;

    try {
      setPhase(PHASES.STARTING);

      const { jobId: newJobId, files: signedFiles } = await requestUpload({
        projectName: projectName.trim(),
        roadStretch: roadStretch.trim(),
        notes: notes.trim(),
        files,
      });
      setJobId(newJobId);

      // Build a per-file progress state. The server orders signedFiles the
      // same as the request, so we can pair by index.
      const initialItems = signedFiles.map((sf, i) => ({
        id: `${i}-${sf.safeName}`,
        name: sf.originalName ?? files[i].name,
        size: files[i].size,
        percent: 0,
        status: 'waiting',
        error: null,
      }));
      setItems(initialItems);
      setPhase(PHASES.UPLOADING);

      // Upload one at a time to keep the network sane on a hotel wifi.
      // (Could fan-out 2-3 in parallel later if the network is good.)
      for (let i = 0; i < signedFiles.length; i += 1) {
        const sf = signedFiles[i];
        const file = files[i];

        setItems((prev) =>
          prev.map((it, j) =>
            j === i ? { ...it, status: 'uploading' } : it
          )
        );

        try {
          await uploadFile({
            file,
            path: sf.path,
            signedUrl: sf.signedUrl,
            onProgress: (pct) => {
              setItems((prev) =>
                prev.map((it, j) =>
                  j === i ? { ...it, percent: pct } : it
                )
              );
            },
          });
          setItems((prev) =>
            prev.map((it, j) =>
              j === i ? { ...it, percent: 100, status: 'done' } : it
            )
          );
        } catch (err) {
          setItems((prev) =>
            prev.map((it, j) =>
              j === i
                ? { ...it, status: 'error', error: err.message }
                : it
            )
          );
          throw err;
        }
      }

      setPhase(PHASES.CONFIRMING);
      await confirmUpload({
        jobId: newJobId,
        totalSizeBytes: totalSize,
      });

      setPhase(PHASES.SUCCESS);
      // Tiny delay so the user can see the success state before the redirect.
      setTimeout(() => navigate(`/jobs/${newJobId}`), 1200);
    } catch (err) {
      setErrorText(err.message || 'Something went wrong during upload.');
      setPhase(PHASES.FAILED);
    }
  }

  const submitting =
    phase === PHASES.STARTING ||
    phase === PHASES.UPLOADING ||
    phase === PHASES.CONFIRMING;

  return (
    <div style={wrapStyle}>
      <div className="container">
        <p style={{ marginBottom: spacing.md }}>
          <Link to="/dashboard" style={linkStyle}>
            ← Back to dashboard
          </Link>
        </p>

        <div style={cardStyle}>
          <h1 style={titleStyle}>Upload a DPR</h1>
          <p style={subStyle}>
            Submit a Detailed Project Report for compliance analysis. Each
            submission uses 1 credit.
          </p>

          {isPending && (
            <Alert variant="warning" title="Your account is pending approval">
              You&apos;ll be able to submit once your account is activated.
            </Alert>
          )}

          {!isPending && !hasCredits && balance !== null && (
            <Alert variant="info" title="No credits available">
              You don&apos;t have any credits yet. Please reach out to top up
              before submitting.
            </Alert>
          )}

          {errorText && phase === PHASES.FAILED && (
            <Alert
              variant="error"
              title="Upload failed"
              style={{ marginBottom: spacing.md, marginTop: spacing.md }}
            >
              {errorText}
            </Alert>
          )}

          {phase === PHASES.SUCCESS && (
            <Alert
              variant="success"
              title="Submitted"
              style={{ marginBottom: spacing.md, marginTop: spacing.md }}
            >
              Your DPR has been submitted. Redirecting to your job page…
            </Alert>
          )}

          {(phase === PHASES.IDLE || phase === PHASES.FAILED) && (
            <form
              onSubmit={handleSubmit}
              noValidate
              style={{ marginTop: spacing.lg }}
            >
              <FormField
                id="up-project"
                label="Project / road name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
                disabled={submitting}
                placeholder="e.g. NH-44 widening — Hyderabad to Nagpur"
              />
              <FormField
                id="up-stretch"
                label="Road stretch (optional)"
                value={roadStretch}
                onChange={(e) => setRoadStretch(e.target.value)}
                disabled={submitting}
                placeholder="e.g. KM 144+200 to 188+500"
              />
              <FormField
                id="up-notes"
                label="Notes for the analyst (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={submitting}
                placeholder="Anything specific you want us to look at"
              />

              <div style={{ margin: `${spacing.md} 0` }}>
                <label
                  htmlFor="dropzone"
                  style={{
                    fontFamily: fonts.body,
                    fontSize: '13.5px',
                    fontWeight: 500,
                    color: colors.textPrimary,
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Files <span style={{ color: colors.statusFailed }}>*</span>
                </label>
                <FileDropzone
                  files={files}
                  onFilesChange={setFiles}
                  disabled={submitting}
                />
              </div>

              {files.length > 0 && (
                <div style={summaryStyle}>
                  <span>
                    {files.length} file{files.length === 1 ? '' : 's'} ·{' '}
                    {formatBytes(totalSize)} total
                  </span>
                  <span>
                    This will use <strong>1 credit</strong> · {balance ?? '—'}{' '}
                    available
                  </span>
                </div>
              )}

              {issues.length > 0 && (
                <Alert variant="error" style={{ marginTop: spacing.md }}>
                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                    {issues.map((msg) => (
                      <li key={msg}>{msg}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              <div
                style={{
                  marginTop: spacing.lg,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: spacing.sm,
                }}
              >
                {phase === PHASES.FAILED && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetUploadState}
                  >
                    Reset
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={submitDisabled}
                  loading={submitting}
                >
                  Submit DPR
                </Button>
              </div>
            </form>
          )}

          {(phase === PHASES.UPLOADING ||
            phase === PHASES.CONFIRMING ||
            phase === PHASES.SUCCESS ||
            (phase === PHASES.FAILED && items.length > 0)) && (
            <div style={{ marginTop: spacing.lg }}>
              <h3
                style={{
                  fontFamily: fonts.heading,
                  fontSize: '16px',
                  color: colors.textPrimary,
                  marginBottom: spacing.md,
                }}
              >
                {phase === PHASES.CONFIRMING
                  ? 'Finalising submission…'
                  : phase === PHASES.SUCCESS
                  ? 'Submitted'
                  : 'Uploading'}
              </h3>
              <UploadProgress items={items} overallPercent={overallPercent} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

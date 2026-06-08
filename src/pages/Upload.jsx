import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import FormField from '../components/FormField.jsx';
import FileDropzone from '../components/FileDropzone.jsx';
import UploadProgress from '../components/UploadProgress.jsx';
import { useAuth } from '../lib/auth.jsx';
import { getCreditBalance } from '../lib/credits.js';
import { describeFileIssues } from '../lib/uploadLimits.js';
import {
  requestUpload,
  confirmUpload,
  cancelUpload,
  uploadFile,
} from '../lib/upload.js';
import { formatBytes } from '../lib/format.js';
import {
  estimateCredits,
  LENGTH_BANDS,
  CREDIT_PRICE,
} from '../lib/estimateCredits.js';
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

const estimateCardStyle = (low) => ({
  marginTop: spacing.md,
  padding: spacing.md,
  background: low ? '#FEF2F2' : '#ECFDF5',
  border: `1px solid ${low ? '#FCA5A5' : '#A7F3D0'}`,
  borderRadius: radii.sm,
  fontFamily: fonts.body,
  fontSize: '14px',
  color: colors.textPrimary,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

const selectStyle = {
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

const fieldLabelStyle = {
  fontFamily: fonts.body,
  fontSize: '13.5px',
  fontWeight: 500,
  color: colors.textPrimary,
  display: 'block',
  marginBottom: '6px',
};

function formatRupees(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

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
  const [lengthBand, setLengthBand] = useState('standard');
  const [packages, setPackages] = useState(1);
  const [hasStructures, setHasStructures] = useState(false);

  const [phase, setPhase] = useState(PHASES.IDLE);
  const [errorText, setErrorText] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [items, setItems] = useState([]); // per-file progress

  const [balance, setBalance] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const abortRef = useRef(null);

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
  const estimate = useMemo(
    () =>
      estimateCredits({
        lengthBand,
        packages: Number(packages) || 1,
        hasStructures,
      }),
    [lengthBand, packages, hasStructures]
  );
  const balanceKnown = balance !== null;
  const hasEnoughCredits = balanceKnown && balance >= estimate;
  const submitDisabled =
    !projectName.trim() ||
    files.length === 0 ||
    issues.length > 0 ||
    !isActive ||
    !hasEnoughCredits ||
    phase === PHASES.STARTING ||
    phase === PHASES.UPLOADING ||
    phase === PHASES.CONFIRMING;

  function resetUploadState() {
    setItems([]);
    setJobId(null);
    setErrorText(null);
    setPhase(PHASES.IDLE);
    setCancelling(false);
    abortRef.current = null;
  }

  async function handleCancel() {
    if (cancelling) return;
    setCancelling(true);

    // Stop the in-flight XHR/TUS upload immediately.
    abortRef.current?.abort();

    // Best-effort server-side cleanup. Failures here are non-fatal — the
    // retention reaper (Milestone 10) catches orphans either way.
    if (jobId) {
      try {
        await cancelUpload({ jobId });
      } catch (err) {
        console.warn('[upload] cancel-upload failed:', err);
      }
    }

    resetUploadState();
    // Refresh balance in case anything was charged (it shouldn't be).
    if (user?.id) getCreditBalance(user.id).then(setBalance);
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
      // Fresh AbortController for this submission. The Cancel button
      // calls .abort() on it, which propagates into both the XHR PUT
      // path and the TUS resumable path.
      abortRef.current = new AbortController();

      const { jobId: newJobId, files: signedFiles } = await requestUpload({
        projectName: projectName.trim(),
        roadStretch: roadStretch.trim(),
        notes: notes.trim(),
        files,
        lengthBand,
        packages: Number(packages) || 1,
        hasStructures,
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
            signal: abortRef.current?.signal,
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
            Submit a Detailed Project Report for compliance analysis. Credit
            cost depends on size and complexity — see the{' '}
            <Link to="/pricing" style={linkStyle}>
              rate card
            </Link>
            .
          </p>

          {isPending && (
            <Alert variant="warning" title="Your account is pending approval">
              You&apos;ll be able to submit once your account is activated.
            </Alert>
          )}

          {!isPending && balanceKnown && balance < estimate && (
            <Alert variant="info" title="Not enough credits">
              You have {balance} credit{balance === 1 ? '' : 's'} but this
              submission needs {estimate}.{' '}
              <Link to="/pricing" style={{ fontWeight: 600 }}>
                Top up your credits →
              </Link>
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

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: spacing.md,
                  marginTop: spacing.md,
                }}
              >
                <div>
                  <label htmlFor="up-band" style={fieldLabelStyle}>
                    Road length <span style={{ color: colors.statusFailed }}>*</span>
                  </label>
                  <select
                    id="up-band"
                    value={lengthBand}
                    onChange={(e) => setLengthBand(e.target.value)}
                    disabled={submitting}
                    style={selectStyle}
                  >
                    {LENGTH_BANDS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="up-packages" style={fieldLabelStyle}>
                    Number of packages
                  </label>
                  <input
                    id="up-packages"
                    type="number"
                    min={1}
                    step={1}
                    value={packages}
                    onChange={(e) => setPackages(e.target.value)}
                    disabled={submitting}
                    style={selectStyle}
                  />
                </div>
                <div>
                  <label style={fieldLabelStyle}>Structural design</label>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '11px 0',
                      fontFamily: fonts.body,
                      fontSize: '14px',
                      color: colors.textPrimary,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={hasStructures}
                      onChange={(e) => setHasStructures(e.target.checked)}
                      disabled={submitting}
                    />
                    Contains major bridge(s)
                  </label>
                </div>
              </div>

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
                </div>
              )}

              <div style={estimateCardStyle(balanceKnown && balance < estimate)}>
                <span>
                  Estimated cost:{' '}
                  <strong>
                    {estimate} credit{estimate === 1 ? '' : 's'} (
                    {formatRupees(estimate * CREDIT_PRICE)})
                  </strong>
                  {' · '}
                  Your balance:{' '}
                  <strong>
                    {balanceKnown ? `${balance} credit${balance === 1 ? '' : 's'}` : '—'}
                  </strong>
                </span>
                <span style={{ fontSize: 12.5, color: colors.textMuted }}>
                  Final credit cost is confirmed by the operator when the
                  file is reviewed.
                </span>
              </div>

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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: spacing.md,
                  marginBottom: spacing.md,
                  flexWrap: 'wrap',
                }}
              >
                <h3
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: '16px',
                    color: colors.textPrimary,
                    margin: 0,
                  }}
                >
                  {phase === PHASES.CONFIRMING
                    ? 'Finalising submission…'
                    : phase === PHASES.SUCCESS
                    ? 'Submitted'
                    : 'Uploading'}
                </h3>
                {phase === PHASES.UPLOADING && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCancel}
                    disabled={cancelling}
                    loading={cancelling}
                  >
                    Cancel upload
                  </Button>
                )}
              </div>
              <UploadProgress items={items} overallPercent={overallPercent} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useRef, useState } from 'react';
import Alert from './Alert.jsx';
import Button from './Button.jsx';
import { getDeliverableUploadUrl, uploadDeliverable } from '../lib/admin.js';
import { formatBytes } from '../lib/format.js';
import { colors, fonts, radii, spacing } from '../styles/theme.js';

const acceptMap = {
  report: '.pdf,application/pdf',
  audio: '.mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/wav',
};

const labelMap = {
  report: 'Compliance report (PDF)',
  audio: 'Audio overview (MP3)',
};

// Picks a file, uploads it to dpr-reports via the admin signed URL
// endpoint, and reports the resulting storage path back to the parent
// (which persists it via /api/admin/save-job).
//
// Showing `currentPath` lets the operator see what's already attached
// without re-uploading.
export default function DeliverableUploader({
  jobId,
  kind,
  currentPath,
  onUploaded,
}) {
  const inputRef = useRef(null);
  const [phase, setPhase] = useState('idle'); // idle | signing | uploading | done | error
  const [error, setError] = useState(null);
  const [pct, setPct] = useState(0);
  const [selected, setSelected] = useState(null);

  async function handlePick(file) {
    if (!file) return;
    setSelected(file);
    setError(null);
    setPct(0);
    try {
      setPhase('signing');
      const { path, signedUrl } = await getDeliverableUploadUrl({
        jobId,
        kind,
        filename: file.name,
      });
      setPhase('uploading');
      await uploadDeliverable({
        file,
        signedUrl,
        onProgress: (p) => setPct(p),
      });
      setPhase('done');
      onUploaded?.({ path, filename: file.name, size: file.size });
    } catch (err) {
      setError(err.message || 'Upload failed.');
      setPhase('error');
    }
  }

  const busy = phase === 'signing' || phase === 'uploading';
  const filename = selected?.name || currentPath?.split('/').pop() || null;

  return (
    <div>
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: '11.5px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: colors.textMuted,
          marginBottom: 6,
        }}
      >
        {labelMap[kind]}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={acceptMap[kind]}
        style={{ display: 'none' }}
        onChange={(e) => handlePick(e.target.files?.[0])}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
          padding: `${spacing.sm} ${spacing.md}`,
          background: '#FFFFFF',
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: radii.sm,
        }}
      >
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: '14px',
            color: filename ? colors.textPrimary : colors.textMuted,
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={filename || ''}
        >
          {filename || 'No file attached'}
          {selected && (
            <span style={{ color: colors.textMuted, marginLeft: 8 }}>
              {formatBytes(selected.size)}
            </span>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {currentPath || phase === 'done' ? 'Replace' : 'Choose file'}
        </Button>
      </div>

      {busy && (
        <div style={{ marginTop: spacing.sm }}>
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: '12.5px',
              color: colors.textMuted,
              marginBottom: 4,
            }}
          >
            {phase === 'signing' ? 'Preparing upload…' : `Uploading… ${pct}%`}
          </div>
          <div
            style={{
              width: '100%',
              height: 6,
              background: '#E2E8F0',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: phase === 'signing' ? '10%' : `${pct}%`,
                height: '100%',
                background: colors.tealPrimary,
                transition: 'width 200ms ease',
              }}
            />
          </div>
        </div>
      )}

      {phase === 'done' && (
        <p
          style={{
            fontFamily: fonts.body,
            fontSize: '13px',
            color: colors.statusCompleted,
            marginTop: 6,
          }}
        >
          Uploaded. Click <em>Save</em> below to attach it to this job.
        </p>
      )}

      {error && <Alert variant="error" style={{ marginTop: spacing.sm }}>{error}</Alert>}
    </div>
  );
}

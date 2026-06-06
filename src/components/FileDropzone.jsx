import { useRef, useState } from 'react';
import { ACCEPT_ATTR, ALLOWED_EXTENSIONS } from '../lib/uploadLimits.js';
import { formatBytes } from '../lib/format.js';
import { colors, fonts, radii, spacing } from '../styles/theme.js';

const wrapStyle = (active, disabled) => ({
  position: 'relative',
  border: `2px dashed ${active ? colors.tealPrimary : colors.cardBorder}`,
  background: active ? 'rgba(13, 148, 136, 0.04)' : '#FAFBFC',
  borderRadius: radii.lg,
  padding: spacing.xl,
  textAlign: 'center',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.6 : 1,
  transition: 'border-color 120ms ease, background 120ms ease',
});

const headlineStyle = {
  fontFamily: fonts.heading,
  fontSize: '18px',
  color: colors.textPrimary,
  marginBottom: '6px',
};

const hintStyle = {
  fontFamily: fonts.body,
  fontSize: '13px',
  color: colors.textMuted,
};

const fileListStyle = {
  marginTop: spacing.md,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing.sm,
};

const fileRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing.md,
  padding: `${spacing.sm} ${spacing.md}`,
  background: '#FFFFFF',
  border: `1px solid ${colors.cardBorder}`,
  borderRadius: radii.sm,
  fontFamily: fonts.body,
  fontSize: '14px',
};

const removeBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: colors.statusFailed,
  fontFamily: fonts.body,
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer',
};

export default function FileDropzone({ files, onFilesChange, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function openPicker() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function handlePicked(list) {
    if (disabled || !list) return;
    const incoming = Array.from(list);
    const merged = [...files];
    for (const f of incoming) {
      // De-dupe by name+size
      const seen = merged.some((m) => m.name === f.name && m.size === f.size);
      if (!seen) merged.push(f);
    }
    onFilesChange(merged);
    // Reset the input so the same file can be re-picked after removal.
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleRemove(index) {
    if (disabled) return;
    const next = files.filter((_, i) => i !== index);
    onFilesChange(next);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handlePicked(e.dataTransfer?.files);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={wrapStyle(dragging, disabled)}
        aria-label="Pick files or drop them here"
      >
        <div style={headlineStyle}>
          {dragging ? 'Drop files to add them' : 'Click to choose files or drop them here'}
        </div>
        <div style={hintStyle}>
          Accepted: {ALLOWED_EXTENSIONS.map((e) => '.' + e).join(', ')} · 300 MB per
          file · 500 MB per submission
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          onChange={(e) => handlePicked(e.target.files)}
          style={{ display: 'none' }}
          disabled={disabled}
        />
      </div>

      {files.length > 0 && (
        <div style={fileListStyle}>
          {files.map((f, i) => (
            <div key={`${f.name}-${f.size}-${i}`} style={fileRowStyle}>
              <span
                style={{
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  minWidth: 0,
                }}
                title={f.name}
              >
                {f.name}
              </span>
              <span style={{ color: colors.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                {formatBytes(f.size)}
              </span>
              <button
                type="button"
                style={removeBtnStyle}
                onClick={() => handleRemove(i)}
                disabled={disabled}
                aria-label={`Remove ${f.name}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

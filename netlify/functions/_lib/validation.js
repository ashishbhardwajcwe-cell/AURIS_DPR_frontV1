// Server-side validation for upload requests.
// Mirrored in src/lib/uploadLimits.js for the client-side pre-check;
// the server is the authority.

export const MAX_FILE_BYTES = 300 * 1024 * 1024; // 300 MB per file
export const MAX_JOB_BYTES = 500 * 1024 * 1024; // 500 MB total per job

export const ALLOWED_EXTENSIONS = Object.freeze([
  'xlsx',
  'xls',
  'csv',
  'pdf',
  'docx',
  'zip',
]);

const ALLOWED_SET = new Set(ALLOWED_EXTENSIONS);

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 400;
  }
}

export function extractExtension(name) {
  const lower = String(name).toLowerCase();
  const m = lower.match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

// Strip dangerous characters from an uploaded filename. We never trust
// the client's name verbatim — the storage path is built from this.
export function safeFilename(name) {
  const base = String(name).split(/[\\/]/).pop() || 'upload';
  const trimmed = base.trim().slice(0, 200);
  // Allow letters, digits, dot, dash, underscore; everything else → underscore
  const cleaned = trimmed.replace(/[^A-Za-z0-9._-]/g, '_');
  // Collapse runs of underscores and strip a leading dot if it remains
  return cleaned.replace(/_+/g, '_').replace(/^\.+/, '') || 'upload';
}

export function validateFiles(files) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new ValidationError('Please pick at least one file to upload.');
  }
  if (files.length > 20) {
    throw new ValidationError('You can upload up to 20 files per submission.');
  }

  let totalSize = 0;
  for (const f of files) {
    if (!f || typeof f.name !== 'string' || !f.name.trim()) {
      throw new ValidationError('A file is missing its name.');
    }
    const ext = extractExtension(f.name);
    if (!ALLOWED_SET.has(ext)) {
      throw new ValidationError(
        `File type ".${ext || 'unknown'}" is not accepted. Allowed: ${ALLOWED_EXTENSIONS.map((e) => '.' + e).join(', ')}.`
      );
    }
    const size = Number(f.sizeBytes);
    if (!Number.isFinite(size) || size <= 0) {
      throw new ValidationError(`File "${f.name}" has an invalid size.`);
    }
    if (size > MAX_FILE_BYTES) {
      throw new ValidationError(
        `File "${f.name}" is ${formatBytes(size)} — single-file limit is ${formatBytes(MAX_FILE_BYTES)}.`
      );
    }
    totalSize += size;
  }
  if (totalSize > MAX_JOB_BYTES) {
    throw new ValidationError(
      `Total upload is ${formatBytes(totalSize)} — per-submission limit is ${formatBytes(MAX_JOB_BYTES)}.`
    );
  }
  return { totalSize };
}

function formatBytes(b) {
  if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(1)} GB`;
  if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(0)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${b} B`;
}

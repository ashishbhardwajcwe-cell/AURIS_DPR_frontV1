// Client-side mirror of the server limits in netlify/functions/_lib/validation.js.
// The SERVER is the authority — these are here so the UI can give immediate
// feedback before round-tripping a doomed request.

export const MAX_FILE_BYTES = 300 * 1024 * 1024; // 300 MB
export const MAX_JOB_BYTES = 500 * 1024 * 1024; // 500 MB

export const RESUMABLE_THRESHOLD = 50 * 1024 * 1024; // 50 MB → use TUS

export const ALLOWED_EXTENSIONS = Object.freeze([
  'xlsx',
  'xls',
  'csv',
  'pdf',
  'docx',
  'zip',
]);

export const ACCEPT_ATTR = ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',');

const ALLOWED_SET = new Set(ALLOWED_EXTENSIONS);

export function extensionOf(name) {
  const m = String(name).toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

export function isAllowedFile(file) {
  return ALLOWED_SET.has(extensionOf(file.name));
}

// Returns an array of human-readable problems with this file set.
// Empty array means OK.
export function describeFileIssues(files) {
  const issues = [];
  if (files.length === 0) {
    issues.push('Pick at least one file.');
    return issues;
  }
  if (files.length > 20) {
    issues.push('You can upload up to 20 files per submission.');
  }
  let total = 0;
  for (const f of files) {
    if (!isAllowedFile(f)) {
      issues.push(
        `"${f.name}" — only ${ALLOWED_EXTENSIONS.map((e) => '.' + e).join(', ')} are accepted.`
      );
    }
    if (f.size > MAX_FILE_BYTES) {
      issues.push(
        `"${f.name}" is over the 300 MB single-file limit.`
      );
    }
    total += f.size;
  }
  if (total > MAX_JOB_BYTES) {
    issues.push('Total upload exceeds the 500 MB per-submission limit.');
  }
  return issues;
}

// Small formatting helpers reused across the dashboard and job views.

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const DATE_TIME_FMT = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(value) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return DATE_FMT.format(d);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return DATE_TIME_FMT.format(d);
}

const UNITS = ['B', 'KB', 'MB', 'GB'];

export function formatBytes(bytes) {
  if (bytes == null || Number.isNaN(Number(bytes))) return '—';
  let n = Number(bytes);
  let i = 0;
  while (n >= 1024 && i < UNITS.length - 1) {
    n /= 1024;
    i += 1;
  }
  const rounded = n >= 100 || i === 0 ? Math.round(n) : n.toFixed(1);
  return `${rounded} ${UNITS[i]}`;
}

export function pluralize(n, singular, plural) {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural ?? `${singular}s`}`;
}

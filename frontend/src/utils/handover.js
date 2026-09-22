export function extractHandoverToken(text) {
  if (!text) return null;
  const trimmed = String(text).trim();
  const match = trimmed.match(/\/verify\/([\w-]+\.[\w-]+\.[\w-]+)/) || trimmed.match(/\/handover\/([\w-]+\.[\w-]+\.[\w-]+)/);
  if (match) return match[1];
  if (trimmed.startsWith('ey')) return trimmed;
  return null;
}

export function formatCountdown(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
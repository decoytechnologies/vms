const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const current = String(process.env.LOG_LEVEL || 'info').toLowerCase();
const threshold = LEVELS[current] || LEVELS.info;

function serialize(meta) {
  if (!meta) return '';
  try { return JSON.stringify(meta, (k, v) => v instanceof Error ? { message: v.message, stack: v.stack } : v); } catch (_) { return String(meta); }
}

function logAt(level, message, meta) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [${level.toUpperCase()}] ${message} ${serialize(meta)}`;
  if (LEVELS[level] >= threshold) {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](line);
  }
}

module.exports = {
  debug: (msg, meta) => logAt('debug', msg, meta),
  info: (msg, meta) => logAt('info', msg, meta),
  warn: (msg, meta) => logAt('warn', msg, meta),
  error: (msg, meta) => logAt('error', msg, meta),
};



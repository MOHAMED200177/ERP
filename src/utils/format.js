const CURRENCY = "EGP";
const LOCALE   = "en-US";

export function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Format currency — no .00, no K shortening, clean integer display
 * e.g. 2800.00 → "EGP 2800"   |   2850.50 → "EGP 2850.50"
 */
export function formatCurrency(amount, currency = CURRENCY) {
  const n = toNumber(amount);
  // Show decimals only when they actually exist
  const hasDecimals = n % 1 !== 0;
  const formatted = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(n);
  return `${currency} ${formatted}`;
}

/**
 * Format a plain number — no currency symbol, no .00
 */
export function formatNumber(value) {
  const n = toNumber(value);
  const hasDecimals = n % 1 !== 0;
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(n);
}

export function formatPercent(value) {
  if (typeof value === "string" && value.includes("%")) return value;
  const n = toNumber(value);
  const hasDecimals = n % 1 !== 0;
  return `${hasDecimals ? n.toFixed(1) : Math.round(n)}%`;
}

export function formatDate(value, options = {}) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(LOCALE, {
    year: "numeric", month: "short", day: "numeric", ...options,
  });
}

export function toISODateRange(dateString, endOfDay = false) {
  if (!dateString) return undefined;
  const suffix = endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z";
  return `${dateString}${suffix}`;
}

export function defaultDateRange() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate:   now.toISOString().split("T")[0],
  };
}

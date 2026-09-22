const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatIDR(amount: number): string {
  const rounded = Math.round(amount);
  return `Rp${rounded.toLocaleString('id-ID')}`;
}

export function periodLabel(period: string): string {
  const parts = period.split('-');
  if (parts.length !== 2) return period;
  const mi = parseInt(parts[1], 10) - 1;
  if (Number.isNaN(mi) || mi < 0 || mi > 11) return period;
  return `${MONTH_NAMES[mi]} ${parts[0]}`;
}

export function shiftPeriodMonth(period: string, delta: number): string {
  const parts = period.split('-');
  if (parts.length !== 2) return period;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(y) || Number.isNaN(m)) return period;
  const dt = new Date(y, m - 1 + delta, 1);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  return `${yy}-${mm}`;
}

export function randomSixDigitPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

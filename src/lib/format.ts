/**
 * قالب‌بندی اعداد فارسی — واحد پول و درصد
 * ------------------------------------------------------------------
 * قرارداد واحد پول:
 *  - `fmtMillion(n)`  → n از قبل «میلیون تومان» است؛ همان عدد را قالب‌بندی می‌کند.
 *  - `fmtBillion(n)`  → n به «میلیون» است و به «میلیارد» تبدیل و قالب‌بندی می‌شود.
 *  - `fmtToman(n)`    → n به «تومان خام» است.
 *  - `fmtTomanSmart(m)` → m به «میلیون» است و به‌صورت خوانا (میلیارد/میلیون) برمی‌گرداند.
 */
const faNum = (n: number, digits = 0): string =>
  n.toLocaleString('fa-IR', { minimumFractionDigits: 0, maximumFractionDigits: digits });

/** تومان با جداکننده فارسی */
export const fmtToman = (n: number): string => faNum(Math.round(n));

/** میلیون تومان — حداکثر ۲ رقم اعشار */
export const fmtMillion = (n: number): string => faNum(n, 2);

/** میلیارد تومان — برای اعداد بزرگ سبد (ورودی بر حسب میلیون) */
export const fmtBillion = (n: number): string => {
  const b = n / 1000; // میلیون → میلیارد
  return faNum(b, b >= 100 ? 0 : 2);
};

/** مقدار میلیون‌تومانی را به‌صورت خوانا قالب‌بندی می‌کند (میلیارد اگر ≥ ۱۰۰۰ میلیون). */
export const fmtTomanSmart = (million: number): string => {
  if (Math.abs(million) >= 1000) return `${faNum(million / 1000, 2)} میلیارد ت`;
  return `${faNum(million, 1)} میلیون ت`;
};

export const fmtPct = (n: number): string => `${faNum(n, 1)}٪`;

export const fmtUsd = (n: number): string => `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

/** فاصله زمانی نسبی فارسی */
export const faTimeAgo = (iso?: string): string => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return '—';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'لحظاتی پیش';
  if (mins < 60) return `${faNum(mins)} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${faNum(hours)} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 31) return `${faNum(days)} روز پیش`;
  const months = Math.floor(days / 30);
  return `${faNum(months)} ماه پیش`;
};

export const faDateShort = (iso?: string): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
};

/** روزهای سپری‌شده از یک تاریخ */
export const daysSince = (iso?: string): number => {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
};

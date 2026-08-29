/**
 * تولید و دانلود CSV — با escaping صحیح (RFC 4180) و BOM برای اکسل فارسی
 * ------------------------------------------------------------------
 * منطق خروجی از کامپوننت‌ها جدا شده تا در همه‌جا یکسان و امن باشد.
 */

/** فرار دادن یک سلول: اگر حاوی کاما/کوتشن/خط جدید باشد در کوتشن محصور و کوتشن‌ها دوبرابر می‌شوند */
const escCell = (value: unknown): string => {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** تبدیل هدر + ردیف‌ها به متن CSV (با BOM برای نمایش درست فارسی در اکسل) */
export const toCsv = (headers: string[], rows: unknown[][]): string => {
  const head = headers.map(escCell).join(',');
  const body = rows.map((row) => row.map(escCell).join(',')).join('\n');
  return '\uFEFF' + [head, body].filter(Boolean).join('\n');
};

/** دانلود متن CSV در مرورگر */
export const downloadCsv = (filename: string, csv: string): void => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

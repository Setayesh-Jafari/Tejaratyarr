/**
 * موتور جستجوی فارسی — تطبیق کلمه‌محور با مرز واژه
 * ------------------------------------------------------------------
 * مشکل حل‌شده: تطبیق زیررشته‌ای ساده (includes) کلمه‌ی کوچک را داخل
 * ترکیبات بی‌ربط پیدا می‌کرد؛ مثلاً «پارچه» داخل «یکپارچه» (مشخصات لپ‌تاپ)!
 *
 * راه‌حل: نرمال‌سازی نویسه‌های فارسی/عربی + تبدیل نیم‌فاصله به فاصله +
 * توکن‌سازی واژه‌محور + تطبیق واژه کامل یا پیشوند واژه.
 */
 

/** نرمال‌سازی متن فارسی/انگلیسی برای مقایسه */
export const normalizeFa = (s: string): string =>
  s
    .replace(/[\u200c\u200f\u200e]/g, ' ')          // نیم‌فاصله و کنترل‌های RTL → فاصله
    .replace(/[\u064A\u0649]/g, '\u06CC')            // ي/ى عربی → ی فارسی
    .replace(/[\u0643]/g, '\u06A9')                  // ك عربی → ک فارسی
    .replace(/[\u0629]/g, '\u0647')                  // ة → ه
    .replace(/[\u0640]/g, '')                        // کشیده (ـ) حذف
    .replace(/[\u0622\u0623\u0625]/g, '\u0627')      // آ/أ/إ → ا
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0)) // ارقام فارسی → لاتین
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660)) // ارقام عربی → لاتین
    .replace(/[()«»"",؛,،:;.!؟?\-_/\\]+/g, ' ')      // علائم → فاصله
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();

/** توکن‌های واژه‌محور (کد تعرفه ۸۴۷۱.30.20 → [8471, 30, 20]) */
export const tokenize = (s: string): string[] =>
  normalizeFa(s)
    .split(' ')
    .filter((t) => t.length > 0);

/** آیا توکل پرس‌وجو در این مجموعه واژه‌ها تطبیق واژه‌کامل/پیشوندی دارد؟ */
const tokenMatches = (token: string, corpusTokens: string[]): boolean =>
  corpusTokens.some((w) => w === token || (token.length >= 3 && w.startsWith(token)) || (w.length >= 3 && token.startsWith(w) && w.length >= Math.min(4, token.length)));

/**
 * امتیاز تطبیق پرس‌وجو با یک متن (corpus).
 * تمام توکن‌های پرس‌وجو باید تطبیق داشته باشند (منطق AND) تا نتیجه بیاید.
 * خروجی: ۰ یعنی عدم تطبیق؛ در غیر این صورت امتیاز (توکن بلندتر = وزن بیشتر).
 */
export const matchScore = (query: string, corpus: string): number => {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return 0;
  const cTokens = tokenize(corpus);
  if (cTokens.length === 0) return 0;

  let score = 0;
  let matched = 0;
  for (const qt of qTokens) {
    if (!tokenMatches(qt, cTokens)) continue;
    matched += 1;
    // وزن: توکن‌های معنادار بلندتر مهم‌ترند؛ کدهای عددی وزنه کامل
    score += /^\d+$/.test(qt) ? 5 : qt.length >= 5 ? 4 : qt.length >= 3 ? 3 : 1;
  }
  return matched === qTokens.length ? score : 0;
};

/** آیا پرس‌وجو (منطق AND روی واژه‌ها) در متن تطبیق دارد؟ */
export const matchesQuery = (query: string, corpus: string): boolean => matchScore(query, corpus) > 0;

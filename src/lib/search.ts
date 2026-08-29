/**
 * موتور جستجوی هوشمند فارسی/انگلیسی برای کتاب تعرفه و کالاهای تجاری
 * ------------------------------------------------------------------
 * شامل:
 * ۱) نرمال‌سازی حروف فارسی و عربی (ی/ي، ک/ك، ة/ه، آ/ا، اعراب، نیم‌فاصله‌ها)
 * ۲) تبدیل ارقام فارسی و عربی به انگلیسی
 * ۳) تطبیق هوشمند کلمه‌ای، پیشوندی و زیررشته‌ای برای جستجوی روان کاربر
 * ۴) رتبه‌بندی نتایج بر اساس میزان تشابه و امتیاز تطابق
 */

/** نرمال‌سازی متن فارسی/انگلیسی برای مقایسه */
export const normalizeFa = (s: string): string => {
  if (!s) return '';
  return s
    .replace(/[\u200c\u200f\u200e\u00a0]/g, ' ')       // نیم‌فاصله، کاراکترهای جهت و فاصله‌های نشکن → فاصله
    .replace(/[\u064A\u0649]/g, '\u06CC')              // ي/ى عربی → ی فارسی
    .replace(/[\u0643]/g, '\u06A9')                    // ك عربی → ک فارسی
    .replace(/[\u0629]/g, '\u0647')                    // ة → ه
    .replace(/[\u064B-\u065F\u0670]/g, '')            // حذف تنوین‌ها و اعراب (َ ِ ُ ً ٍ ٌ ّ ْ)
    .replace(/[\u0640]/g, '')                          // کشیده (ـ) حذف
    .replace(/[\u0622\u0623\u0625]/g, '\u0627')        // آ/أ/إ → ا
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0)) // ارقام فارسی → لاتین
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660)) // ارقام عربی → لاتین
    .replace(/[()«»"",؛,،:;.!؟?\-_/\\|*+[\]{}~`^]+/g, ' ') // علائم نگارشی → فاصله
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
};

/** توکن‌های واژه‌محور */
export const tokenize = (s: string): string[] => {
  return normalizeFa(s)
    .split(' ')
    .filter((t) => t.length > 0);
};

/** آیا توکن ورودی با واژه‌های متن تطابق دارد؟ */
const tokenMatches = (token: string, corpusTokens: string[], normalizedCorpus: string): boolean => {
  if (!token) return false;

  // تطابق دقیق با یکی از کلمات
  if (corpusTokens.includes(token)) return true;

  // اگر توکن کد تعرفه یا عدد است (مثل 8541 یا 550)
  if (/^\d+$/.test(token)) {
    return normalizedCorpus.includes(token);
  }

  // اگر کلمه حداقل ۲ حرفی است و با کلمه‌ای در متن شروع می‌شود یا متن شامل آن است
  if (token.length >= 2) {
    // تطابق پیشوندی یا پسوندی
    const prefixOrSuffixMatch = corpusTokens.some(
      (w) => w.startsWith(token) || (w.length >= 3 && token.startsWith(w)) || w.includes(token)
    );
    if (prefixOrSuffixMatch) return true;

    // تطابق زیررشته‌ای مستقیم در کل متن
    if (token.length >= 3 && normalizedCorpus.includes(token)) {
      return true;
    }
  }

  return false;
};

/**
 * امتیاز تطبیق پرس‌وجو با یک متن (corpus).
 * اگر اکثر کلمات کلیدی پیدا شوند، امتیاز مثبت برمی‌گرداند.
 */
export const matchScore = (query: string, corpus: string): number => {
  const normQuery = normalizeFa(query);
  const normCorpus = normalizeFa(corpus);

  if (!normQuery || !normCorpus) return 0;

  // تطابق مستقیم کل عبارت (بالاترین امتیاز)
  if (normCorpus.includes(normQuery)) {
    return 100 + normQuery.length;
  }

  const qTokens = tokenize(normQuery);
  if (qTokens.length === 0) return 0;

  const cTokens = tokenize(normCorpus);
  if (cTokens.length === 0) return 0;

  let matchedTokens = 0;
  let score = 0;

  for (const qt of qTokens) {
    if (tokenMatches(qt, cTokens, normCorpus)) {
      matchedTokens += 1;
      score += /^\d+$/.test(qt) ? 15 : qt.length >= 4 ? 10 : 5;
    }
  }

  // برای عبارت‌های تک‌کلمه‌ای یا چندکلمه‌ای: حداقل ۵۰٪ کلمات باید تطبیق کنند
  const minRequiredMatches = qTokens.length <= 2 ? qTokens.length : Math.ceil(qTokens.length * 0.6);

  if (matchedTokens >= minRequiredMatches) {
    return score + (matchedTokens * 10);
  }

  return 0;
};

/** آیا پرس‌وجو در متن تطبیق دارد؟ */
export const matchesQuery = (query: string, corpus: string): boolean => {
  return matchScore(query, corpus) > 0;
};

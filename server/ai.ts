/**
 * لایه هوش مصنوعی — Gemini (سمت سرور) + موتور محلی جایگزین
 * ------------------------------------------------------------------
 * اصل طراحی: AI لایه «افزایشی» است. بدون GEMINI_API_KEY همه‌چیز
 * با موتور قاعده‌محور محلی کار می‌کند و UI وضعیت را شفاف نشان می‌دهد.
 * اعداد تعرفه همیشه از دایرکتوری محلی تامین می‌شود تا نرخ توهمی تولید نشود.
 */
import { GoogleGenAI, Type } from '@google/genai';
import { HS_CODE_DIRECTORY } from '../src/data/hscodeDirectory';
import { matchScore } from '../src/lib/search';
import type { AiHsSuggestion, AiSupplierReport } from '../src/types';

// نام مدل از env قابل تغییر است؛ پیش‌فرض یک مدل پایدار و مستند Google است
// (gemini-3.7-flash مدل معتبری نبود و به‌طور بی‌صدا fallback می‌شد).
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let client: GoogleGenAI | null = null;
function ai(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY') return null;
  if (!client) client = new GoogleGenAI({ apiKey: key });
  return client;
}

export const isAiEnabled = (): boolean => ai() !== null;
export const modelName = (): string => MODEL;

async function callGemini<T>(prompt: string, schema: any): Promise<T> {
  const genai = ai();
  if (!genai) throw new Error('AI_DISABLED');
  const res = await genai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.2 },
  });
  const text = res.text ?? '';
  return JSON.parse(text) as T;
}

/* ================= پیشنهاد کد تعرفه (HS Code) ================= */

export interface HsSuggestReq {
  productName: string;
  description?: string;
  category?: string;
}

/** جستجوی قاعده‌محور روی دایرکتوری تعرفه — هم fallback و هم زمینه برای مدل
 *  تطبیق واژه‌محور با مرز کلمه (مشکل «پارچه» ↔ «یکپارچه» حل شده است) */
export function localHsSearch(query: string, category?: string, limit = 6): AiHsSuggestion[] {
  const scored = HS_CODE_DIRECTORY.map((entry) => {
    const samples = entry.sampleProducts ? entry.sampleProducts.join(' ') : '';
    const hay = `${entry.titleFa} ${entry.titleEn} ${samples} ${entry.specifications ?? ''} ${entry.category} ${entry.code}`;
    // امتیاز واژه‌محور؛ صفر = عدم تطبیق
    let score = matchScore(query, hay);
    if (score > 0 && category && entry.category === category) score += 4;
    return { entry, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const max = scored[0]?.score ?? 1;
  return scored.map(({ entry, score }) => ({
    code: entry.code,
    title: entry.titleFa,
    dutyTotalPct: entry.customsDuty + entry.commercialProfit,
    samtGroup: entry.samtGroup,
    confidence: Math.max(28, Math.min(92, Math.round((score / max) * 88))),
    reasoning: `تطابق واژگانی با عنوان تعرفه در دایرکتوری رسمی (${entry.titleEn}). حقوق ورودی ${entry.customsDuty}٪ + سود بازرگانی ${entry.commercialProfit}٪.`,
    warnings: entry.mandatoryPermits?.length ? [`مجوز الزامی: ${entry.mandatoryPermits.join('، ')}`] : [],
  }));
}

const hsSchema = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING, description: 'کد تعرفه ۸ رقمی با فرمت گمرک ایران مثل 8541.43.00 یا 8471.30.40' },
          title: { type: Type.STRING, description: 'عنوان دقیق فارسی طبق کتاب مقررات صادرات و واردات' },
          titleEn: { type: Type.STRING, description: 'Official English Title according to HS Nomenclature' },
          category: { type: Type.STRING, description: 'دسته‌بندی اصلی کالا' },
          customsDuty: { type: Type.NUMBER, description: 'درصد حقوق گمرکی پایه (معمولاً ۴ درصد)' },
          commercialProfit: { type: Type.NUMBER, description: 'درصد سود بازرگانی مصوب' },
          dutyTotalPct: { type: Type.NUMBER, description: 'مجموع درصد حقوق ورودی' },
          vatRate: { type: Type.NUMBER, description: 'درصد مالیات بر ارزش افزوده (۰ برای اقلام معاف، ۱۰ برای سایر)' },
          samtGroup: { type: Type.STRING, description: 'گروه کالایی سامانه جامع تجارت مثلا گروه ۲۱، ۲۲، ۲۴ یا ۲۶' },
          allowedFxTypes: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'نوع ارزهای مجاز: نیما، تالار دوم، ارز اشخاص، ارز ترجیحی' },
          mandatoryPermits: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'مجوزهای ترخیص الزامی: استاندارد، غذا و دارو، جهاد، انرژی اتمی و...' },
          specifications: { type: Type.STRING, description: 'مشخصات فنی، شروط شمول و تفکیک از کدهای مشابه' },
          confidence: { type: Type.NUMBER, description: 'درصد اطمینان ۰ تا ۱۰۰' },
          reasoning: { type: Type.STRING, description: 'دلیل قانونی و فنی انتخاب این ردیف تعرفه به فارسی' },
          warnings: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'هشدارهای گمرکی، خطر شمول ماده ۱۰۸ یا الزامات آزمایشگاهی' },
        },
        required: ['code', 'title', 'confidence', 'reasoning', 'dutyTotalPct'],
      },
    },
    note: { type: Type.STRING, description: 'یادداشت ارزیابی کلی برای واردکننده به فارسی' },
  },
  required: ['suggestions'],
};

export async function hsSuggest(req: HsSuggestReq): Promise<{ engine: 'gemini' | 'local'; suggestions: AiHsSuggestion[]; note?: string }> {
  // نامزدهای محلی
  const candidates = localHsSearch(`${req.productName} ${req.description ?? ''}`, req.category, 8);
  const byCode = new Map(HS_CODE_DIRECTORY.map((e) => [e.code, e]));

  const genai = ai();
  if (!genai) {
    return {
      engine: 'local',
      suggestions: candidates.slice(0, 5),
      note:
        candidates.length > 0
          ? 'موتور محلی کتاب تعرفه (تطابق واژگانی با ۲۷ ردیف منتخب دایرکتوری). برای استعلام زنده از سایر فصول، کلید Gemini را فعال کنید.'
          : 'در دایرکتوری محلی (۲۷ ردیف منتخب) تطبیقی یافت نشد. لطفاً توضیحات فنی دقیق‌تری بدهید یا کلید Gemini را برای استعلام از سایر فصول فعال کنید.',
    };
  }

  const directoryContext = HS_CODE_DIRECTORY
    .slice(0, 30)
    .map((c) => `${c.code} | ${c.titleFa} | ${c.category} | حقوق ورودی ${c.totalTariffPercent}%`)
    .join('\n');

  const prompt = `شما کارشناس ارشد ارزش‌گذاری، طبقه‌بندی کالا و تعرفه گمرک جمهوری اسلامی ایران (کتاب مقررات صادرات و واردات، نمانکلاتور WCO HS) هستید.
کاربر می‌خواهد برای کالای زیر، کد تعرفه ۸ رقمی، سود بازرگانی، حقوق ورودی، گروه ارزی سامانه جامع تجارت و مجوزهای قانونی را استعلام کند:

نام کالا: «${req.productName}»
توضیحات تکمیلی و مشخصات فنی: «${req.description || 'توضیحات اضافی داده نشده'}»
دسته‌بندی اعلامی: «${req.category || 'مشخص نشده'}»

نمونه‌هایی از پایگاه داده تعرفه:
${directoryContext}

دستورالعمل:
۱. برای هر کالای تجاری در دنیا (حتی اگر در دایرکتوری نمونه نباشد)، کد ۸ رقمی رسمی ایران را با دقت استخراج کن (مثل 8541.43.00، 8471.30.40، 1001.99.00، 8703.80.00، 3004.90.00 و...).
۲. ۲ تا ۳ کد محتمل یا رقیب را بر اساس ویژگی‌های فنی کالا رتبه‌بندی کن.
۳. برای هر گزینه: کد ۸ رقمی، عنوان فارسی رسمی، عنوان انگلیسی، حقوق ورودی پایه (۴٪)، سود بازرگانی، مجموع تعرفه، نرخ مالیات ارزش افزوده (معمولاً ۱۰٪، دارو و کالای اساسی ۰٪)، گروه صمت (گروه ۲۱ تا ۲۶)، ارزهای مجاز، مجوزهای الزامی ترخیص (استاندارد، غذا و دارو، انرژی اتمی، صمت و...)، مشخصات فنی و استدلال قانونی قوی ارائه کن.`;

  try {
    const out = await callGemini<{ suggestions: AiHsSuggestion[]; note?: string }>(prompt, hsSchema);
    const rawSuggestions = out.suggestions ?? [];
    if (rawSuggestions.length === 0) throw new Error('EMPTY');

    const suggestions: AiHsSuggestion[] = rawSuggestions.map((s) => {
      const existing = byCode.get(s.code.trim());
      return {
        code: s.code.trim(),
        title: s.title || existing?.titleFa || 'کد تعرفه رسمی گمرک',
        titleEn: s.titleEn || existing?.titleEn || '',
        category: s.category || existing?.category || 'کالاهای بازرگانی',
        customsDuty: s.customsDuty ?? existing?.customsDuty ?? 4,
        commercialProfit: s.commercialProfit ?? existing?.commercialProfit ?? Math.max(0, (s.dutyTotalPct ?? 4) - 4),
        dutyTotalPct: s.dutyTotalPct ?? (existing ? existing.totalTariffPercent : 4),
        vatRate: s.vatRate ?? existing?.vatRate ?? 10,
        samtGroup: s.samtGroup || existing?.samtGroup || 'گروه ۲۲',
        allowedFxTypes: s.allowedFxTypes && s.allowedFxTypes.length > 0 ? s.allowedFxTypes : (existing?.allowedFxTypes || ['نیما', 'تالار دوم']),
        mandatoryPermits: s.mandatoryPermits && s.mandatoryPermits.length > 0 ? s.mandatoryPermits : (existing?.mandatoryPermits || ['سازمان ملی استاندارد']),
        specifications: s.specifications || existing?.specifications || '',
        tscReference: s.tscReference || existing?.tscReference || `شناسه TSC: ${s.code.replace(/\./g, '')}00000001`,
        confidence: Math.max(10, Math.min(99, Math.round(s.confidence))),
        reasoning: s.reasoning,
        warnings: s.warnings ?? (existing?.mandatoryPermits?.length ? [`مجوز الزامی: ${existing.mandatoryPermits.join('، ')}`] : []),
      };
    });

    return { engine: 'gemini', suggestions, note: out.note };
  } catch (e: any) {
    if (e?.message === 'AI_DISABLED') {
      return {
        engine: 'local',
        suggestions: candidates.slice(0, 5),
        note: candidates.length > 0
          ? 'موتور محلی کتاب تعرفه (تطابق واژگانی با دایرکتوری).'
          : 'در دایرکتوری محلی تطبیقی یافت نشد؛ توضیحات فنی دقیق‌تری بدهید.',
      };
    }
    console.error('[ai] hsSuggest fallback:', e?.message ?? e);
    // صادقانه: هیچ‌گاه کد تعرفه‌ی ساختگی تولید نمی‌کنیم؛ بدون تطبیق، پاسخ خالی است.
    return {
      engine: 'local',
      suggestions: candidates.slice(0, 5),
      note: candidates.length > 0
        ? 'مدل آنلاین در دسترس نبود؛ نتیجه بر اساس موتور محلی دایرکتوری ارائه شد.'
        : 'مدل آنلاین در دسترس نبود و در دایرکتوری محلی نیز تطبیقی یافت نشد. لطفاً توضیحات فنی دقیق‌تری (جنس، کاربرد، مشخصات) بدهید.',
    };
  }
}

/* ================= تحلیل ریسک تأمین‌کننده ================= */

export interface SupplierCheckReq {
  name: string;
  country?: string;
  domain?: string;
  categories?: string;
  extra?: string;
}

const supplierSchema = {
  type: Type.OBJECT,
  properties: {
    riskLevel: { type: Type.STRING, enum: ['کم', 'متوسط', 'بالا'] },
    riskScore: { type: Type.NUMBER, description: '۰ تا ۱۰۰؛ هرچه بیشتر ریسک بیشتر' },
    summary: { type: Type.STRING },
    entityInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
    redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendedChecks: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['riskLevel', 'riskScore', 'summary', 'entityInsights', 'redFlags', 'recommendedChecks'],
};

const FREE_MAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'aol.com', 'mail.com',
  'qq.com', '163.com', '126.com', 'sina.com', 'protonmail.com', 'icloud.com', 'gmx.com', 'web.de',
]);

const COUNTRY_TLD: Record<string, string> = {
  'چین': 'cn', 'امارات': 'ae', 'امارات متحده عربی': 'ae', 'ترکیه': 'tr', 'آلمان': 'de', 'ایتالیا': 'it',
  'هند': 'in', 'کره جنوبی': 'kr', 'ژاپن': 'jp', 'تایوان': 'tw', 'ویتنام': 'vn', 'مالزی': 'my',
  'تایلند': 'th', 'اسپانیا': 'es', 'فرانسه': 'fr', 'هلند': 'nl', 'بلژیک': 'be', 'انگلستان': 'uk',
  'بریتانیا': 'uk', 'روسیه': 'ru', 'برزیل': 'br', 'لهستان': 'pl', 'اتریش': 'at',
};

/**
 * تحلیل ریسک تأمین‌کننده — موتور محلی چک‌لیستی (جایگزین regexهای تک‌خطی قبلی)
 * هر بررسی یک آیتم ساختاری در redFlags / entityInsights می‌سازد و به امتیاز ریسک وزن می‌دهد.
 */
export function localSupplierCheck(req: SupplierCheckReq): AiSupplierReport {
  const red: string[] = [];
  const insights: string[] = [];
  let score = 20; // پایه‌ی خنثی

  const name = (req.name ?? '').trim();
  const domain = (req.domain ?? '').trim().toLowerCase();
  const country = (req.country ?? '').trim();
  const extra = (req.extra ?? '').trim();
  const categories = (req.categories ?? '').trim();

  // ۱) شخصیت حقوقی
  const hasLegalSuffix = /(co\.?[\s,]?ltd|ltd\.?|llc|gmbh|inc\.?|s\.?a\.?|s\.?r\.?l|ag\b|b\.?v\.?|pty[\s.]?ltd|company|corporation|group|holding)/i.test(name);
  if (hasLegalSuffix) {
    insights.push('نام شرکت پسوند شخصیت حقوقی رسمی دارد (Ltd/GmbH/AG و…) — نشانه‌ی مثبت ثبت رسمی.');
    score -= 5;
  } else {
    red.push('نام فاقد پسوند حقوقی رسمی است — احراز «کارخانه بودن» دشوارتر می‌شود.');
    score += 8;
  }

  // ۲) واژه‌های واسطه‌ای/بروکری
  if (/trading|import|export|broker|intermediar|بازرگانی|واسطه/i.test(name)) {
    red.push('نام entity حاوی واژه‌های واسطه‌ای (Trading/Import/بازرگانی) است — احتمال بروکر به‌جای کارخانه.');
    score += 18;
  }

  // ۳) طول و ژنریک بودن نام
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length <= 2 && !hasLegalSuffix) {
    red.push('نام بسیار کوتاه و ژنریک است — احتمال شرکت صوری یا شخص حقیقی بالاست.');
    score += 10;
  }

  // ۴) دامنه وب
  if (!domain) {
    red.push('وب‌سایت/دامنه معرفی نشده — بدون وب‌سایت صنعتی، ممیزی کارخانه ممکن نیست.');
    score += 12;
  } else {
    const host = domain.replace(/^www\./, '');
    const isFreeMail = FREE_MAIL_DOMAINS.has(host) || FREE_MAIL_DOMAINS.has(host.split('.').slice(-2).join('.'));
    if (isFreeMail) {
      red.push('دامنه ارائه‌شده یک سرویس ایمیل رایگان است — نشانه‌ی قوی عدم اصالت کارخانه.');
      score += 22;
    } else {
      insights.push('دامنه‌ی اختصاصی شرکتی ثبت شده است.');
      const tld = host.split('.').pop() ?? '';
      const key = Object.keys(COUNTRY_TLD).find((k) => country.includes(k) || k.includes(country));
      const expected = key ? COUNTRY_TLD[key] : undefined;
      if (expected && tld !== expected && tld !== 'com') {
        red.push(`دامنه .${tld} با کشور اعلامی (${country}) هم‌خوانی ندارد (مورد انتظار .${expected}).`);
        score += 12;
      } else if (expected) {
        insights.push(`دامنه .${tld} با کشور اعلامی سازگار است.`);
      }
    }
  }

  // ۵) نشانه‌های فروش تهاجمی در توضیحات
  if (extra && /(ارزان‌ترین|قیمت استثنایی|بدون پیش‌پرداخت|تخفیف|تحویل فوری)/.test(extra)) {
    red.push('متن معرفی حاوی وعده‌های فروش تهاجمی (قیمت استثنایی/بدون پیش‌پرداخت) است.');
    score += 6;
  }

  // ۶) مجوزهای تخصصی بر اساس دسته کالا
  if (/پزشکی|دارو|دارویی|سونوگرافی|تجهیزات پزشکی/i.test(categories)) {
    insights.push('دسته‌ی پزشکی: گواهی IMED/CE و تأییدیه سازمان غذا و دارو الزامی است.');
  }
  if (/غذایی|خوراکی|کشاورزی|قهوه|گندم/i.test(categories)) {
    insights.push('دسته‌ی غذایی/کشاورزی: گواهی بهداشت و قرنطینه نباتی الزامی است.');
  }

  insights.push('درخواست گواهی CCPIT/اتاق بازرگانی و سابقه بارنامه (B/L) دو محموله اخیر الزامی است.');

  const clamped = Math.max(5, Math.min(95, Math.round(score)));
  const level = clamped < 35 ? 'کم' : clamped < 65 ? 'متوسط' : 'بالا';
  return {
    riskLevel: level,
    riskScore: clamped,
    summary: `ارزیابی چک‌لیستی محلی: ریسک ${level} (${clamped}/100) بر اساس ${red.length} پرچم قرمز و ${insights.length} نکته‌ی ساختاری. این نتیجه قاعده‌محور است و جایگزین استعلام رسمی نیست.`,
    entityInsights: insights,
    redFlags: red.length ? red : ['هیچ پرچم قرمز ساختاری آشکاری در داده‌های ورودی یافت نشد.'],
    recommendedChecks: [
      'استعلام شناسه ثبت ملی (USCC چین / Trade Register اروپا) و تطبیق نام سهام‌دار',
      'درخواست Audit Report مالی سال قبل و گواهی بانکی سلامت حساب',
      'مطالبه گواهی CCPIT و کنسولی بر پروفرما و بارنامه',
      'پرداخت اولیه حتماً از طریق L/C اشتعالی یا escrow منطقه آزاد',
    ],
  };
}

export async function supplierCheck(req: SupplierCheckReq): Promise<{ engine: 'gemini' | 'local'; report: AiSupplierReport; disclaimer?: string }> {
  const genai = ai();
  if (!genai) return { engine: 'local', report: localSupplierCheck(req) };

  const prompt = `شما کارشناسdue diligence تجارت خارجی و تطبیق تحریم‌ها هستید. واردکننده ایرانی این تأمین‌کننده را ارزیابی می‌کند:
نام: ${req.name}
کشور اعلامی: ${req.country ?? '—'}
وب‌سایت/دامنه: ${req.domain ?? '—'}
دسته کالایی: ${req.categories ?? '—'}
توضیحات بیشتر: ${req.extra ?? '—'}

یک گزارش ریسک ساختاریافته فارسی تولید کن: riskLevel (کم/متوسط/بالا)، riskScore (0-100)، خلاصه، بینش‌های هویتی (entityInsights)، پرچم‌های قرمز (redFlags) و اقدامات بررسی پیشنهادی (recommendedChecks) مخصوص قرارداد با طرف ایرانی (تحریم‌ها، مسیر پرداخت امارات/عمان/چین، CCPIT). فقط برداشت مبتنی بر داده‌های فوق؛ ادعای دسترسی به پایگاه داده زنده نکن.`;

  try {
    const out = await callGemini<AiSupplierReport>(prompt, supplierSchema);
    return {
      engine: 'gemini',
      report: out,
      disclaimer: 'این تحلیل توسط هوش مصنوعی تولید شده و جایگزین استعلام رسمی (CCPIT/اتاق بازرگانی/بانک) نیست.',
    };
  } catch (e: any) {
    if (e?.message === 'AI_DISABLED') return { engine: 'local', report: localSupplierCheck(req) };
    console.error('[ai] supplierCheck fallback:', e?.message ?? e);
    return { engine: 'local', report: localSupplierCheck(req), disclaimer: 'مدل Gemini در دسترس نبود؛ نتیجه موتور محلی نمایش داده می‌شود.' };
  }
}

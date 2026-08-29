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
    const hay = `${entry.titleFa} ${entry.titleEn} ${entry.sampleProducts.join(' ')} ${entry.specifications} ${entry.category} ${entry.code}`;
    // امتیاز واژه‌محور؛ صفر = عدم تطبیق (توکن ناقص تطبیق‌نیافته کل پرس‌وجو را رد می‌کند)
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
          code: { type: Type.STRING, description: 'کد ۸ رقمی با نقطه، فقط از فهرست کدهای ارائه‌شده در زمینه' },
          confidence: { type: Type.NUMBER, description: '۰ تا ۱۰۰' },
          reasoning: { type: Type.STRING, description: 'دلیل فنی انتخاب به فارسی، حداکثر ۲ جمله' },
          warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['code', 'confidence', 'reasoning'],
      },
    },
    note: { type: Type.STRING, description: 'یادداشت کوتاه برای واردکننده به فارسی' },
  },
  required: ['suggestions'],
};

export async function hsSuggest(req: HsSuggestReq): Promise<{ engine: 'gemini' | 'local'; suggestions: AiHsSuggestion[]; note?: string }> {
  // نامزدهای محلی همیشه محاسبه می‌شوند — ریشه داده‌ها همین است
  const candidates = localHsSearch(`${req.productName} ${req.description ?? ''}`, req.category, 10);
  const byCode = new Map(HS_CODE_DIRECTORY.map((e) => [e.code, e]));

  const genai = ai();
  if (!genai || candidates.length === 0) {
    return { engine: 'local', suggestions: candidates.slice(0, 5), note: 'موتور محلی (تطابق واژگانی با دایرکتوری تعرفه) — برای تحلیل هوش مصنوعی، کلید Gemini را تنظیم کنید.' };
  }

  const context = candidates
    .map((c) => `${c.code} | ${byCode.get(c.code)?.titleFa ?? c.title} | ${byCode.get(c.code)?.titleEn ?? ''}`)
    .join('\n');

  const prompt = `شما کارشناس ارشد تعرفه گمرکی ایران (کتاب مقررات صادرات و واردات، معادل HS WCO) هستید.
واردکننده ایرانی این کالا را توصیف کرده است:
«نام: ${req.productName}
توضیحات فنی: ${req.description ?? '—'}
دسته‌بندی اعلامی: ${req.category ?? '—'}»

کدهای نامزد از دایرکتوری رسمی سامانه:
${context}

وظیفه: بهترین ۳ کد را از «فقط همین فهرست» انتخاب کن، برای هرکدام confidence (۰-۱۰۰) و دلیل فنی کوتاه فارسی بده. اگر توضیحات برای تفکیک کافی نیست، در warnings بنویس چه سند/مشخصه فنی باید روشن شود. کدی خارج از فهرست تولید نکن.`;

  try {
    const out = await callGemini<{ suggestions: Array<{ code: string; confidence: number; reasoning: string; warnings?: string[] }>; note?: string }>(prompt, hsSchema);
    const suggestions: AiHsSuggestion[] = (out.suggestions ?? [])
      .filter((s) => byCode.has(s.code.trim()))
      .slice(0, 4)
      .map((s) => {
        const e = byCode.get(s.code.trim())!;
        return {
          code: e.code,
          title: e.titleFa,
          dutyTotalPct: e.customsDuty + e.commercialProfit,
          samtGroup: e.samtGroup,
          confidence: Math.max(5, Math.min(99, Math.round(s.confidence))),
          reasoning: s.reasoning,
          warnings: s.warnings ?? [],
        };
      });
    if (suggestions.length === 0) throw new Error('EMPTY');
    return { engine: 'gemini', suggestions, note: out.note };
  } catch (e: any) {
    if (e?.message === 'AI_DISABLED') return { engine: 'local', ...{ suggestions: candidates.slice(0, 5) } };
    // خطای شبکه/مدل → سقوط امن به موتور محلی
    console.error('[ai] hsSuggest fallback:', e?.message ?? e);
    return { engine: 'local', suggestions: candidates.slice(0, 5), note: 'مدل Gemini در دسترس نبود؛ نتیجه موتور محلی نمایش داده می‌شود.' };
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

export function localSupplierCheck(req: SupplierCheckReq): AiSupplierReport {
  const red: string[] = [];
  const insights: string[] = [];
  let score = 18;

  const n = req.name.trim();
  if (/trading|import|export|سازمان|بازرگانی|group|holding/i.test(n)) {
    red.push('نام entity حاوی واژه‌های واسطه‌ای (Trading/Import/بازرگانی) است — احتمال بروکر به‌جای کارخانه.');
    score += 22;
  } else if (/co\.?,?\s*ltd|gmbh|inc\.?|s\.?a\.?|ag$/i.test(n)) {
    insights.push('پسوند حقوقی رسمی در نام شرکت ثبت شده (Ltd/GmbH/AG) — نشانه مثبت شخصیت حقوقی شفاف.');
    score -= 4;
  }
  if (req.domain) {
    const tld = req.domain.split('.').pop()?.toLowerCase() ?? '';
    const c = (req.country ?? '').trim();
    const countryTld: Record<string, string> = { چین: 'cn', 'امارات': 'ae', 'امارات متحده عربی': 'ae', ترکیه: 'tr', آلمان: 'de', ایتالیا: 'it', هند: 'in', 'کره جنوبی': 'kr', ژاپن: 'jp' };
    const expected = countryTld[c];
    if (expected && tld !== expected && tld !== 'com') {
      red.push(`دامنه .${tld} با کشور اعلامی (${c}) هم‌خوانی ندارد — دامنه ملی مورد انتظار .${expected} بود.`);
      score += 14;
    } else {
      insights.push('دامنه وب با کشور اعلامی سازگار است.');
    }
  } else {
    red.push('دامنه/وب‌سایت معرفی نشده — بدون وب‌سایت صنعتی، احراز کارخانه بودن ممکن نیست.');
    score += 12;
  }
  if (n.split(/\s+/).length <= 2 && !/ltd|gmbh|co\b|inc/i.test(n)) {
    red.push('نام کوتاه و ژنریک — احتمال شرکت صوری یا شخص حقیقی بالاست.');
    score += 10;
  }
  insights.push('درخواست حتماً گواهی CCPIT/اتاق بازرگانی و سابقه بارنامه (B/L) دو محموله اخیر را مطالبه کنید.');

  const clamped = Math.max(5, Math.min(95, Math.round(score)));
  const level = clamped < 35 ? 'کم' : clamped < 65 ? 'متوسط' : 'بالا';
  return {
    riskLevel: level,
    riskScore: clamped,
    summary: `ارزیابی قاعده‌محور: پتانسیل ریسک ${level} (${clamped}/100). این نتیجه موتور محلی است؛ برای تحلیل هوش مصنوعی کلید Gemini را تنظیم کنید.`,
    entityInsights: insights,
    redFlags: red.length ? red : ['هیچ پرچم قرمز ساختاری آشکاری در داده‌های ورودی یافت نشد.'],
    recommendedChecks: [
      'استعلام شناسه ثبت ملی (USCC چین / Trade Register اروپا) و تطبیق نام سهام‌دار',
      'درخواست Audit Report مالی سال قبل و گواهی بانکی سلامت حساب',
      'مطالبه گواهی CCPIT و کنسولی بر پروفرما و بارنامه',
      'پرداخت اولیه حتماً از طریق L/C اشتعاعی یا escrow منطقه آزاد',
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

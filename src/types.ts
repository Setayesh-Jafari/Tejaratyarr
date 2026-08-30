export type ItemStatus =
  | 'موجود در انبار (ترخیص شده)'
  | 'در گمرک (در حال ترخیص)'
  | 'در حال ترانزیت بین‌المللی'
  | 'در انتظار تخصیص ارز و ثبت سفارش'
  | 'رزرو مشتری / پیش‌فروش';

export type ProductCategory =
  | 'خودرو و ماشین‌آلات صنعتی'
  | 'تجهیزات خورشیدی و برق'
  | 'فولاد و مواد اولیه صنعتی'
  | 'تجهیزات پزشکی و آزمایشگاهی'
  | 'کالاهای اساسی و کشاورزی'
  | 'منسوجات و پوشاک'
  | 'قطعات الکترونیک و IT';

export type FxType = 'ارز نیمایی (سامانه نیما)' | 'ارز تالار دوم (توافقی)' | 'ارز اشخاص / صادرات خود' | 'ارز آزاد تجاری';

export type SearchEngineSource = 
  | 'ITC Trade Map (سازمان تجارت جهانی)'
  | 'ImportYeti (تحلیل بارنامه دریایی و کانتینر)'
  | 'Panjiva / S&P Global (زنجیره تأمین بین‌الملل)'
  | 'سامانه سوابق ارزش TSC گمرک ایران'
  | 'Baidu B2B (موتور چین و کارخانه‌ها)'
  | 'Perplexity Trade (هوش مصنوعی و سنتز اسناد صمت)'
  | 'Apify (پایشگر قیمت زنده و بورس کالا)'
  | 'Yandex & Eurasia Cargo (اوراسیا و ترانزیت)'
  | 'CCPIT (اتاق بازرگانی و احراز اصالت چین)'
  | 'Yellow Pages / Kompass (دایرکتوری رسمی)';

export type EngineKey = 
  | 'trademap' 
  | 'importyeti' 
  | 'panjiva' 
  | 'irica_tsc' 
  | 'baidu' 
  | 'perplexity' 
  | 'apify' 
  | 'yandex' 
  | 'ccpit' 
  | 'yellowpages';

export type VerificationState = 
  | 'تأییدشده و قطعی (Verified)'
  | 'نیازمند اعتبارسنجی میدانی (Needs Verification)'
  | 'مشکوک به اختلاف تعرفه / نیازمند تفکیک HS Code'
  | 'نیازمند استعلام رسمی از دفتر مقررات صمت';

export interface IntelligenceSearchResult {
  id: string;
  title: string;
  titleEn: string;
  category: ProductCategory;
  engine: SearchEngineSource;
  engineKey: EngineKey;
  sourceName: string;
  sourceUrlOrRef: string;
  sourceDate: string;
  hsCodeSuggested?: string;
  samtGroup?: string;
  estimatedPriceRange: string;
  priceCurrency: string;
  originCountry: string;
  supplierOrEntity?: string;
  summary: string;
  details: string[];
  verificationState: VerificationState;
  confidenceScore: number; // 0 - 100
  verificationNotes: string;
  verifiedDataPoints: string[];
  unverifiedDataPoints: string[];
  tags: string[];
}

export interface CompetingHsCode {
  code: string;
  titleFa: string;
  titleEn: string;
  customsDuty: number; // حقوق ورودی پایه (درصد)
  commercialProfit: number; // سود بازرگانی مصوب صمت (درصد)
  totalTariffPercent: number; // مجموع حقوق ورودی + سود بازرگانی
  vatRate: number; // درصد مالیات بر ارزش افزوده
  samtGroup: string; // گروه کالایی سامانه جامع تجارت (۲۱ تا ۲۶)
  allowedFxTypes: string[]; // انواع ارز مجاز (نیما، اشخاص و...)
  mandatoryPermits: string[]; // سازمان ملی استاندارد، غذا و دارو، ساتبا، تنظیم مقررات، انرژی اتمی و...
  technicalDiscriminator: string; // تفاوت فنی و فیزیکی که این کد را متمایز می‌کند
  riskNotes: string; // ریسک بیش‌بود/کم‌بود، جریمه ماده ۲۷ یا تبصره بند ش ق.ا.گ
  isRecommended?: boolean;
  recommendationReason?: string;
  tscIdSample: string; // نمونه شناسه سابقه ارزش در سامانه TSC
}

export interface HsDisputeScenario {
  id: string;
  productNameFa: string;
  productNameEn: string;
  category: ProductCategory;
  problemStatement: string; // چرا این کالا مدام اشتباه ثبت می‌شود و اختلاف ایجاد می‌کند
  commonMistake: string; // اشتباه رایج ترخیص‌کاران و واردکنندگان
  keyDecisionQuestion: string; // سؤال فنی کلیدی برای تفکیک (مثلاً: آیا اینورتر هیبرید دارای شارژر است یا متصل به شبکه ساده؟)
  competingCodes: CompetingHsCode[];
  expertAdvice: string;
  legalBasis: string; // بند یا یادداشت فصل کتاب مقررات صادرات و واردات
}

export interface DataProvenanceSource {
  id: string;
  name: string;
  authority: string;
  coverage: string;
  frequency: string;
  integrationType: 'استعلام وب‌سرویس مستقیم' | 'بانک اطلاعاتی آفلاین ساختاریافته' | 'وب اسکرپینگ زنده' | 'سند رسمی مصوب';
  usageInApp: string;
  officialRefUrl: string;
  reliabilityScore: number;
}

/**
 * قرارداد واحد پول در کل سامانه:
 * `landedCostToman` و `marketPriceToman` بر حسب «میلیون تومان» ذخیره می‌شوند
 * (مثلاً 5.1 یعنی ۵.۱ میلیون تومان). برای قالب‌بندی از توابع lib/format استفاده شود.
 */
export interface InventoryUnit {
  id: string;
  sku: string;
  vinOrCode: string;
  name: string;
  category: ProductCategory;
  specifications: string;
  originCountry: string;
  yearOrBatch: string;
  status: ItemStatus;
  stockQty: number;
  unit: string;
  costPriceUsd: number; // قیمت خرید ارزی (CIF هر واحد به دلار)
  landedCostToman: number; // بهای تمام‌شده نهایی پس از ترخیص و حقوق گمرکی (میلیون تومان)
  /** نرخ ارزی که بهای تمام‌شده با آن محاسبه شده (تومان/دلار) — برای بازمحاسبه‌ی «چه‌اگر» در داشبورد */
  fxRateAtLandedToman?: number;
  marketPriceToman: number; // ارزش روز فروش بازار ایران (میلیون تومان)
  hsCode: string; // کد تعرفه گمرکی ۸ رقمی
  samtGroup: string; // گروه کالایی سامانه جامع تجارت (۲۱ تا ۲۶)
  customsPort: string; // گمرک ورودی (شهید رجایی، امام خمینی، بازرگان و...)
  orderRegCode: string; // شماره ثبت سفارش صمت
  fxType: FxType; // نوع ارز تأمینی
  supplierName: string;
  supplierRating: number; // 1-100
  complianceGate: 'تأیید استاندارد و بهداشت' | 'در حال بازرسی استاندارد (COI)' | 'نیازمند اصلاح اسناد گمرکی';
  lastUpdated: string;
  verificationStatus?: 'تأییدشده رسمی' | 'نیازمند استعلام میدانی';
  /** توسعه ۱۴۰۵: چرخه‌ی عمر پرونده */
  events?: CargoEvent[];
  createdAt?: string;      // ISO
  stageEnteredAt?: string; // ISO تاریخ ورود به وضعیت فعلی
}

export interface SupplierRecord {
  id: string;
  name: string;
  country: string;
  verifiedEntity: boolean;
  tier: 'تأمین‌کننده معتبر سطح ۱ (Tier 1)' | 'ارزیابی‌شده سطح ۲' | 'در حال ممیزی کارخانه';
  score: number; // 0 - 100
  mainCategories: string[];
  entityResolutionId: string;
  moq: string;
  leadTime: string;
  certifications: string[];
  financialStability: 'پایدار و معتبر' | 'متوسط' | 'ریسک بالا';
  sanctionCheck: 'احراز هویت و حساب بانکی پاک' | 'بررسی شده' | 'دارای هشدار واسطه';
  contactPerson: string;
  email: string;
  phone: string;
  notes: string;
  sourceVerification: {
    source: string;
    isVerified: boolean;
    confidence: number;
    notes: string;
  };
}

export interface TradeAssessmentDossier {
  id: string;
  title: string;
  productFa: string;
  productEn: string;
  category: string;
  specs: string;
  qty: string;
  unit: string;
  originPref: string;
  targetCustomer: string;
  application: string;
  estimatedLandedCostToman: number;
  suggestedHsCode: string;
  samtGroup: string;
  customsDutyRate: number; // درصد حقوق ورودی + سود بازرگانی
  vatRate: number; // درصد مالیات ارزش افزوده
  status: 'آماده ثبت سفارش' | 'در حال ارزیابی فنی و استاندارد' | 'تأیید نهایی کمیته خرید' | 'رد شده به دلیل ممنوعیت صمت';
  evidenceScore: number;
  createdAt: string;
}

export interface StageLog {
  timestamp: string;
  stage: string;
  stageFa: string;
  message: string;
  status: 'ok' | 'info' | 'warn' | 'active';
}

export type ActiveView = 'overview' | 'inventory' | 'intelligence' | 'hscode_resolver' | 'sourcing' | 'assessment' | 'rfq' | 'provenance' | 'analytics' | 'pipeline';

/* ---------- توسعه ۱۴۰۵: گردش کار، بهای تمام‌شده، هوش مصنوعی ---------- */

/** رویداد چرخه‌ی عمر پرونده (تایم‌لاین کارگو) */
export interface CargoEvent {
  id: string;
  at: string; // ISO datetime
  kind: 'created' | 'status_change' | 'note' | 'assessment' | 'ai_review';
  title: string;
  detail?: string;
  by?: string;
}

/** وضعیت‌های اصلی جریان کار (رزرو مشتری حالت جانبی است) */
export const STATUS_FLOW: ItemStatus[] = [
  'در انتظار تخصیص ارز و ثبت سفارش',
  'در حال ترانزیت بین‌المللی',
  'در گمرک (در حال ترخیص)',
  'موجود در انبار (ترخیص شده)',
];

/** همه‌ی وضعیت‌های ممکن — منبع یگانه برای فرم‌ها (شامل حالت جانبی رزرو مشتری) */
export const ALL_STATUSES: ItemStatus[] = [
  ...STATUS_FLOW,
  'رزرو مشتری / پیش‌فروش',
];

/** آیا وضعیت «تسویه‌شده» است (انبار یا رزرو مشتری)؟ */
export const isSettledStatus = (s: ItemStatus): boolean =>
  s === 'موجود در انبار (ترخیص شده)' || s === 'رزرو مشتری / پیش‌فروش';

/** همه‌ی دسته‌بندی‌های کالایی — منبع یگانه برای فرم‌ها */
export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'خودرو و ماشین‌آلات صنعتی',
  'تجهیزات خورشیدی و برق',
  'فولاد و مواد اولیه صنعتی',
  'تجهیزات پزشکی و آزمایشگاهی',
  'کالاهای اساسی و کشاورزی',
  'منسوجات و پوشاک',
  'قطعات الکترونیک و IT',
];

/** ورودی موتور بهای تمام‌شده — معادل فرمول‌های ترخیص گمرک ایران */
export interface CostingInput {
  fobUsd: number;            // قیمت هر واحد FOB به دلار
  freightUsd: number;        // سهم حمل هر واحد (دریایی/هوایی)
  insuranceUsd: number;      // سهم بیمه هر واحد
  qty: number;               // تعداد
  fxRateToman: number;       // نرخ برابری دلار به تومان
  customsDutyPct: number;    // حقوق ورودی پایه (٪)
  commercialProfitPct: number; // سود بازرگانی مصوب صمت (٪)
  vatPct: number;            // مالیات بر ارزش افزوده واردات (٪)
  clearanceFeeToman: number; // هزینه ترخیص‌کاری و پلمب هر واحد
  inlandFreightToman: number; // حمل داخلی بندر→انبار هر واحد
  brokerAndBankToman: number; // کارمزد بانک/صرافی و اسناد هر واحد
  otherFeeToman: number;     // سایر (بازرسی COI، استاندارد و...)
}

export interface CostLine {
  key: string;
  label: string;
  totalToman: number;
  perUnitToman: number;
  pctOfTotal: number;
  kind: 'base' | 'tariff' | 'tax' | 'local';
}

export interface LandedCostResult {
  cifUsdTotal: number;
  cifTomanTotal: number;
  lines: CostLine[];
  landedTotalToman: number;
  landedPerUnitToman: number;
  landedPerUnitMillionToman: number;
  customsOutlayToman: number; // مجموع پرداخت به گمرک (حقوق ورودی + سود بازرگانی + مالیات)
  fxRateToman: number; // نرخ ارز به‌کاررفته در این محاسبه (برای ثبت به‌عنوان مرجع «چه‌اگر»)
}

export interface MarginAnalysis {
  sellPricePerUnitToman: number;
  profitPerUnitToman: number;
  profitTotalToman: number;
  marginPct: number;      // سود / قیمت فروش
  roiPct: number;         // سود / بهای تمام‌شده
  breakEvenFxToman: number; // نرخ ارزی که سود صفر شود
}

/** تنظیمات سراسری سامانه */
export interface AppSettings {
  fx: {
    usdNimaToman: number;
    usdAzadToman: number;
    eurToman: number;
    updatedAt: string;
  };
  vatDefaultPct: number;
  orgName: string;
}

/** پیشنهاد هوشمند کد تعرفه */
export interface AiHsSuggestion {
  code: string;
  title: string;
  titleEn?: string;
  category?: string;
  customsDuty?: number;
  commercialProfit?: number;
  dutyTotalPct?: number;
  vatRate?: number;
  samtGroup?: string;
  allowedFxTypes?: string[];
  mandatoryPermits?: string[];
  specifications?: string;
  tscReference?: string;
  confidence: number; // 0-100
  reasoning: string;
  warnings?: string[];
}

export interface AiHsSuggestResponse {
  engine: 'gemini' | 'local';
  suggestions: AiHsSuggestion[];
  note?: string;
}

/** گزارش تحلیل ریسک تأمین‌کننده */
export interface AiSupplierReport {
  riskLevel: 'کم' | 'متوسط' | 'بالا';
  riskScore: number; // 0 (ریسک صفر) تا 100 (ریسک کامل)
  summary: string;
  entityInsights: string[];
  redFlags: string[];
  recommendedChecks: string[];
}

export interface AiSupplierCheckResponse {
  engine: 'gemini' | 'local';
  report: AiSupplierReport;
  disclaimer?: string;
}

export interface HealthResponse {
  ok: true;
  aiEnabled: boolean;
  model?: string;
  version: string;
}

export interface BootstrapResponse {
  inventory: InventoryUnit[];
  suppliers: SupplierRecord[];
  assessments: TradeAssessmentDossier[];
  settings: AppSettings;
}

export interface PaginatedEvents {
  events: CargoEvent[];
  total: number;
}




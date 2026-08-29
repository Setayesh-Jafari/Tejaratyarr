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
  legalRiskNotes: string; // ریسک بیش‌بود/کم‌بود، جریمه ماده ۲۷ یا تبصره بند ش ق.ا.گ
  isRecommended?: boolean;
  recommendationReason?: string;
  tscValueRef?: string; // سابقه ارزش در سامانه TSC
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
  costPriceUsd: number; // قیمت خرید ارزی
  landedCostToman: number; // بهای تمام‌شده نهایی پس از ترخیص و حقوق گمرکی (میلیون تومان)
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

export type ActiveView = 'inventory' | 'intelligence' | 'hscode_resolver' | 'sourcing' | 'assessment' | 'rfq' | 'provenance' | 'analytics';



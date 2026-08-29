import { DataProvenanceSource } from '../types';

export const DATA_PROVENANCE_SOURCES: DataProvenanceSource[] = [
  {
    id: 'SRC-IRICA-STATS',
    name: 'سالنامه آمار تجارت خارجی و ارزش‌گذاری گمرک جمهوری اسلامی ایران (IRICA)',
    authority: 'دفتر فن‌آوری اطلاعات و ارتباطات و دفتر ارزش گمرک ایران',
    coverage: 'حجم ماهانه و سالانه واردات قطعی به تفکیک کدهای ۸ رقمی تعرفه (HS)، گمرکات اجرایی کشور، وزن ناخالص و ارزش دلاری CIF',
    frequency: 'به‌روزرسانی ماهانه و گزارش‌های تجمیعی فصلی',
    integrationType: 'بانک اطلاعاتی آفلاین ساختاریافته',
    usageInApp: 'پایه‌ریزی میانگین حجم واردات ماهانه، پرتراکنش‌ترین گمرکات ورودی (شهید رجایی، بوشهر، فرودگاه امام) و محاسبه حاشیه سود ترخیص',
    officialRefUrl: 'https://irica.ir',
    reliabilityScore: 99,
  },
  {
    id: 'SRC-IRICA-TSC',
    name: 'سامانه شناسه ارزش‌گذاری متمرکز کالا (TSC - Tariff Specification Code)',
    authority: 'دفتر تعیین ارزش گمرک ایران',
    coverage: 'سوابق ارزش‌های ترخیص‌شده، قیمت‌های پایه FOB/CIF بر اساس برند، مدل، کشور مبدأ و مشخصات فنی ثبت‌شده در کمیسیون ارزش',
    frequency: 'پایش مستمر و بخشنامه‌های ادواری اصلاح ارزش پایه',
    integrationType: 'بانک اطلاعاتی آفلاین ساختاریافته',
    usageInApp: 'محاسبه بهای تمام‌شده بر اساس ارزش مصوب گمرکی، جلوگیری از ریسک بیش‌بود (Over-Invoicing) یا کم‌بود ارزش (Under-Invoicing) و جریمه بند ش ماده ۱۰۸ ق.ا.گ',
    officialRefUrl: 'https://epl.irica.ir/TscSearch',
    reliabilityScore: 98,
  },
  {
    id: 'SRC-NTSW-SAMT',
    name: 'سامانه جامع تجارت ایران (NTSW) و کتاب مقررات صادرات و واردات ۱۴۰۳',
    authority: 'وزارت صنعت، معدن و تجارت (صمت) و هیئت وزیران',
    coverage: 'جداول حقوق گمرکی، سود بازرگانی، اولویت‌بندی ارزی (گروه‌های ۲۱ تا ۲۶)، سقف اعتباری کارت بازرگانی و مجوزهای الزامی ورود',
    frequency: 'مصوبات سالانه و بخشنامه‌های موردی دفتر مقررات',
    integrationType: 'سند رسمی مصوب',
    usageInApp: 'تطابق ضوابط ثبت سفارش، محاسبه خودکار حقوق ورودی + سود بازرگانی، احراز شرایط تخصیص ارز نیمایی و تالار دوم',
    officialRefUrl: 'https://ntsw.ir',
    reliabilityScore: 100,
  },
  {
    id: 'SRC-ITC-TRADEMAP',
    name: 'مرکز تجارت بین‌الملل سازمان تجارت جهانی (ITC Trade Map / UN Comtrade)',
    authority: 'International Trade Centre (WTO & UNCTAD - ژنو، سوئیس)',
    coverage: 'جریان تجارت دوجانبه ایران با ۲۰۰+ کشور جهان به روش آمار معکوس (Mirror Trade Data) با جزئیات کد تعرفه HS-6 و HS-8',
    frequency: 'فصلی و سالانه',
    integrationType: 'استعلام وب‌سرویس مستقیم',
    usageInApp: 'تحلیل سهم بازار کشورهای تأمین‌کننده اصلی (چین، امارات، ترکیه، آلمان، روسیه)، نرخ رشد مرکب سالانه و روندهای واردات',
    officialRefUrl: 'https://trademap.org',
    reliabilityScore: 96,
  },
  {
    id: 'SRC-IMPORTYETI-BOLS',
    name: 'پلتفرم تحلیل بارنامه‌های دریایی و کانتینری (ImportYeti / Ocean Bill of Lading Engine)',
    authority: 'شبکه رصد مانیفست‌های کشتیرانی بین‌المللی',
    coverage: 'تحلیل سوابق صادراتی کارخانجات چینی، هندی و اروپایی، شرکت‌های فورواردر، خطوط کشتیرانی (IRISL, Maersk, COSCO) و بنادر بارگیری',
    frequency: 'هفتگی بر اساس مانیفست‌های ترانزیتی',
    integrationType: 'وب اسکرپینگ زنده',
    usageInApp: 'احراز هویت واقعی بودن صادرکننده، سوابق حمل دریایی به مقاصد خلیج فارس (جبل علی، بندرعباس) و راستی‌آزمایی ظرفیت تحویل',
    officialRefUrl: 'https://importyeti.com',
    reliabilityScore: 94,
  },
  {
    id: 'SRC-PANJIVA-SP',
    name: 'پایگاه زنجیره تأمین جهانی Panjiva (S&P Global Market Intelligence)',
    authority: 'S&P Global Inc.',
    coverage: 'اطلاعات حقوقی بیش از ۱۰ میلیون شرکت بازرگانی، رتبه‌بندی اعتباری تأمین‌کنندگان، وضعیت مالکیت و تحلیل گره‌های تحریمی',
    frequency: 'ماهانه',
    integrationType: 'بانک اطلاعاتی آفلاین ساختاریافته',
    usageInApp: 'ماژول ارزیابی و ممیزی تأمین‌کنندگان خارجی (Due Diligence) و اعتبارسنجی کانال‌های بانکی و صرافی',
    officialRefUrl: 'https://panjiva.com',
    reliabilityScore: 95,
  },
  {
    id: 'SRC-COMMODITY-EXCHANGES',
    name: 'شاخص بورس‌های بین‌المللی کالا و فلزات (LME, ICE, SHFE, CME)',
    authority: 'London Metal Exchange, ICE Futures, Shanghai Futures Exchange',
    coverage: 'قیمت لحظه‌ای و آتی ورق فولادی، بیلت، شمش روی، مس، نیکل، آلومینیوم و دانه‌های کشاورزی',
    frequency: 'بلایو و روزانه',
    integrationType: 'وب اسکرپینگ زنده',
    usageInApp: 'تخمین دامنه قیمت عادلانه FOB برای مواد اولیه صنعتی و جلوگیری از خرید با قیمت‌های غیرواقعی',
    officialRefUrl: 'https://lme.com',
    reliabilityScore: 99,
  },
  {
    id: 'SRC-CCPIT-CHINA',
    name: 'شورای توسعه تجارت بین‌المللی و اتاق بازرگانی چین (CCPIT / CCPIT Registry)',
    authority: 'China Council for the Promotion of International Trade',
    coverage: 'اصالت‌سنجی پروانه کسب‌وکار کارخانجات چینی (Business License)، گواهی مبدأ فرم E و گواهی ممیزی تولیدکننده',
    frequency: 'استعلام بلایو پرونده‌ها',
    integrationType: 'استعلام وب‌سرویس مستقیم',
    usageInApp: 'احراز هویت تولیدکنندگان سطح یک چین در ماژول‌های جستجوی Baidu و Sourcing',
    officialRefUrl: 'https://ccpit.org',
    reliabilityScore: 97,
  }
];

export const LANDED_COST_METHODOLOGY = {
  title: 'فرمولاسیون محاسباتی بهای تمام‌شده واردات در سامانه تجارت‌یار (Landed Cost Matrix)',
  description: 'کلیه محاسبات ریالی و بهای تمام‌شده کالای وارداتی بر مبنای قوانین جاری گمرک جمهوری اسلامی ایران و مصوبات ارزی سال ۱۴۰۳ به شرح زیر انجام می‌شود:',
  formulaSteps: [
    {
      step: '۱. ارزش ارزی CIF کالا (ارزش پایه گمرکی)',
      formula: 'ارزش CIF (دلار) = قیمت خرید FOB + هزینه حمل بین‌المللی دریایی/هوایی + حق بیمه باربری (معمولاً ۰.۵٪)',
      explanation: 'این رقم در گمرک به عنوان مأخذ محاسبه کلیه حقوق و عوارض دولتی تلقی می‌شود.'
    },
    {
      step: '۲. تبدیل به ریال بر اساس نرخ تسعیر گمرکی',
      formula: 'ارزش ریالی گمرکی (V) = ارزش دلاری CIF × نرخ ارز محاسباتی گمرک (ETS / مرکز مبادله)',
      explanation: 'طبق بند هـ تبصره ۷ قانون بودجه، نرخ محاسبه حقوق گمرکی بر اساس نرخ سامانه مبادله ارز و طلا (ETS) تعیین می‌شود.'
    },
    {
      step: '۳. حقوق ورودی و سود بازرگانی (Customs Duty & Commercial Profit)',
      formula: 'حقوق ورودی = V × (حقوق گمرکی پایه ۴٪ + درصد سود بازرگانی مصوب صمت)',
      explanation: 'سود بازرگانی بر اساس جدول ضمیمه کتاب مقررات صادرات و واردات سال ۱۴۰۳ و کد تعرفه ۸ رقمی کالا تعیین می‌شود.'
    },
    {
      step: '۴. عوارض متفرقه قانونی و هلال احمر',
      formula: 'عوارض هلال احمر = ۱٪ از حقوق ورودی | پسماند و محیط زیست = ۰.۵ در هزار',
      explanation: 'عوارض قانونی خاص بر حسب گروه کالایی اعمال می‌شود.'
    },
    {
      step: '۵. مالیات بر ارزش افزوده و مالیات علی‌الحساب',
      formula: 'مالیات ارزش افزوده = ۱۰٪ × (ارزش ریالی گمرکی V + مجموع حقوق ورودی) | مالیات علی‌الحساب = ۲٪',
      explanation: 'کالاهای پزشکی و تجهیزات درمانی طبق قانون معاف از مالیات بر ارزش افزوده هستند (VAT = 0%).'
    },
    {
      step: '۶. هزینه‌های داخلی ترخیص و بندری (Local Port & Terminal Clearance)',
      formula: 'هزینه‌های داخلی = هزینه تخلیه و بارگیری THC + دموراژ کانتینر + انبارداری + دستمزد ترخیص‌کار + کارمزد صرافی (۱ الی ۲.۵٪)',
      explanation: 'هزینه‌های ترمینال شهید رجایی یا فرودگاه امام و باربری داخلی تا انبار مشتری.'
    },
    {
      step: '۷. بهای تمام‌شده نهایی (Landed Cost)',
      formula: 'بهای تمام‌شده هر واحد = (مجموع کل هزینه‌های فوق بر حسب تومان) ÷ تیراژ سالم تحویلی',
      explanation: 'مبنای قیمت‌گذاری فروش در بازار داخل و تعیین حاشیه سود بازرگان.'
    }
  ]
};

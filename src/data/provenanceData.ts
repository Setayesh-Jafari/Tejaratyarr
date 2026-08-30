/**
 * شناسنامه منابع داده و متدولوژی محاسبات
 * ------------------------------------------------------------------
 * فهرست مراجع رسمی که داده‌های مرجع سامانه (کد تعرفه، ارزش‌گذاری و
 * متدولوژی بهای تمام‌شده) از آن‌ها اقتباس شده است، به همراه ضریب
 * اطمینان و نحوه‌ی استفاده در سامانه.
 */

import type { DataProvenanceSource } from '../types';

export const DATA_PROVENANCE_SOURCES: DataProvenanceSource[] = [
  {
    id: 'IRICA-TARIC',
    name: 'کتاب مقررات صادرات و واردات (فصل تعرفه)',
    authority: 'گمرک جمهوری اسلامی ایران (IRICA) — دفتر تعرفه',
    coverage: 'کدهای ۸ رقمی HS، حقوق ورودی پایه و سود بازرگانی مصوب هر ردیف.',
    frequency: 'به‌روزرسانی سالانه (هر سال مالی)',
    integrationType: 'سند رسمی مصوب',
    usageInApp: 'مبنای دایرکتوری کدهای تعرفه و سناریوهای تفکیک تعرفه در سامانه.',
    officialRefUrl: 'irica.ir',
    reliabilityScore: 96,
  },
  {
    id: 'WCO-HS',
    name: 'نمانکلاتور سیستم هماهنگ‌شده (WCO HS Nomenclature)',
    authority: 'سازمان جهانی گمرک (WCO)',
    coverage: 'ساختار ۶ رقمی بین‌المللی کدهای HS و یادداشت‌های فصل.',
    frequency: 'بازبینی هر ۵ سال',
    integrationType: 'سند رسمی مصوب',
    usageInApp: 'مبنای عنوان انگلیسی کدهای تعرفه در دایرکتوری.',
    officialRefUrl: 'wcoomd.org',
    reliabilityScore: 98,
  },
  {
    id: 'IRICA-TSC',
    name: 'سامانه سوابق ارزش TSC',
    authority: 'گمرک جمهوری اسلامی ایران (IRICA)',
    coverage: 'سوابق ارزش ثبت‌شده کالاهای وارداتی برای ارزش‌گذاری اظهارنامه.',
    frequency: 'به‌روزرسانی مستمر (به ازای هر اظهارنامه)',
    integrationType: 'بانک اطلاعاتی آفلاین ساختاریافته',
    usageInApp: 'شناسه‌های نمونه ارزش TSC در دایرکتوری تعرفه (نمونه، نه استعلام زنده).',
    officialRefUrl: 'tsc.irica.ir',
    reliabilityScore: 92,
  },
  {
    id: 'SCCIMA-SAMT',
    name: 'سامانه جامع تجارت و گروه‌بندی کالایی',
    authority: 'وزارت صنعت، معدن و تجارت (صمت)',
    coverage: 'گروه‌های کالایی ۲۱ تا ۲۶ و اولویت‌بندی تخصیص ارز.',
    frequency: 'به‌روزرسانی بر اساس مصوبات',
    integrationType: 'سند رسمی مصوب',
    usageInApp: 'گروه کالایی صمت هر کد تعرفه در دایرکتوری و پرونده‌ها.',
    officialRefUrl: 'ntsw.ir',
    reliabilityScore: 90,
  },
  {
    id: 'WTO-ITC',
    name: 'ITC Trade Map (آمار تجارت بین‌الملل)',
    authority: 'ITC / WTO / UNCTAD',
    coverage: 'جریان تجارت جهانی بر اساس کدهای HS، مبادی و مقاصد.',
    frequency: 'به‌روزرسانی سالانه و فصلی',
    integrationType: 'بانک اطلاعاتی آفلاین ساختاریافته',
    usageInApp: 'مرجع اسناد نمونه در کاوشگر هوش تجاری (داده نمونه).',
    officialRefUrl: 'trademap.org',
    reliabilityScore: 93,
  },
  {
    id: 'IMPORTYETI',
    name: 'ImportYeti (تحلیل بارنامه‌های دریایی)',
    authority: 'ImportYeti',
    coverage: 'بارنامه‌ها و روند حمل دریایی کانتینری.',
    frequency: 'به‌روزرسانی مستمر',
    integrationType: 'بانک اطلاعاتی آفلاین ساختاریافته',
    usageInApp: 'مرجع اسناد نمونه بارنامه در کاوشگر هوش تجاری.',
    officialRefUrl: 'importyeti.com',
    reliabilityScore: 84,
  },
  {
    id: 'PANJIVA',
    name: 'Panjiva / S&P Global',
    authority: 'S&P Global Market Intelligence',
    coverage: 'زنجیره تأمین بین‌الملل و سوابق صادرات شرکت‌ها.',
    frequency: 'به‌روزرسانی مستمر',
    integrationType: 'بانک اطلاعاتی آفلاین ساختاریافته',
    usageInApp: 'مرجع اسناد نمونه اعتبارسنجی تأمین‌کنندگان.',
    officialRefUrl: 'panjiva.com',
    reliabilityScore: 88,
  },
  {
    id: 'CCPIT',
    name: 'اتاق بازرگانی چین (CCPIT)',
    authority: 'China Council for the Promotion of International Trade',
    coverage: 'احراز اصالت شرکت‌های چینی و گواهی مبدأ.',
    frequency: 'به ازای هر استعلام',
    integrationType: 'بانک اطلاعاتی آفلاین ساختاریافته',
    usageInApp: 'مرجع اعتبارسنجی تأمین‌کنندگان چینی در ممیزی.',
    officialRefUrl: 'ccpit.org',
    reliabilityScore: 95,
  },
];

export const LANDED_COST_METHODOLOGY = {
  title: 'متدولوژی محاسبه بهای تمام‌شده ترخیص (Landed Cost)',
  description:
    'موتور بهای تمام‌شده بر اساس قاعده‌ی محاسبات واردات ایران و مطابق کتاب مقررات صادرات و واردات پیاده‌سازی شده است.',
  formulaSteps: [
    {
      step: 'ارزش CIF (قیمت در مبدأ + حمل + بیمه)',
      formula: 'CIF = FOB + Freight + Insurance',
      explanation: 'ارزش گمرکی بر مبنای CIF (قیمت خرید، کرایه حمل و بیمه) محاسبه می‌شود.',
    },
    {
      step: 'ارزش گمرکی به تومان',
      formula: 'ارزش گمرکی (تومان) = CIF × نرخ ارز',
      explanation: 'نرخ ارز بر اساس کانال تأمین (نیما، تالار دوم یا ارز اشخاص) اعمال می‌شود.',
    },
    {
      step: 'حقوق ورودی گمرکی',
      formula: 'حقوق ورودی = ارزش گمرکی × نرخ حقوق ورودی',
      explanation: 'نرخ حقوق ورودی پایه مطابق ردیف تعرفه در کتاب مقررات اعمال می‌شود.',
    },
    {
      step: 'سود بازرگانی مصوب صمت',
      formula: 'سود بازرگانی = (ارزش گمرکی + حقوق ورودی) × نرخ سود بازرگانی',
      explanation: 'سود بازرگانی روی جمع ارزش گمرکی و حقوق ورودی محاسبه می‌شود.',
    },
    {
      step: 'مالیات بر ارزش افزوده واردات',
      formula: 'مالیات = (ارزش گمرکی + حقوق ورودی + سود بازرگانی) × نرخ مالیات',
      explanation: 'پایه مالیات شامل ارزش گمرکی، حقوق ورودی و سود بازرگانی است.',
    },
    {
      step: 'هزینه‌های محلی و ترخیص',
      formula: 'Local = ترخیص‌کاری + حمل داخلی + کارمزد بانک + بازرسی COI',
      explanation: 'هزینه‌های داخلی بندر تا انبار به‌صورت هر واحد اضافه می‌شوند.',
    },
  ],
};

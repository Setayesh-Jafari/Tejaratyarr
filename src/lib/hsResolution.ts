/**
 * تفکیک تعرفه HS — منبع واحد نرخ‌ها
 * ------------------------------------------------------------------
 * نرخ تعرفه (حقوق ورودی، سود بازرگانی، مالیات، گروه صمت، ارز مجاز، مجوزها)
 * فقط در `HS_CODE_DIRECTORY` نگهداری می‌شود. سناریوهای اختلافی (`HS_DISPUTE_SCENARIOS`)
 * صرفاً «معیار فنی تفکیک» و «ریسک» را می‌گویند و نرخ‌هایشان در زمان نمایش
 * از دایرکتوری تغذیه می‌شود تا داده در دو جا drift نکند.
 */
import type { CompetingHsCode } from '../types';
import { HS_CODE_DIRECTORY } from '../data/hscodeDirectory';
import type { HsCodeDatabaseEntry } from '../data/hscodeDirectory';

/** جستجوی تعرفه در دایرکتوری HS (کد ۸ رقمی) */
export const findHsDirectoryEntry = (code: string): HsCodeDatabaseEntry | undefined =>
  HS_CODE_DIRECTORY.find((e) => e.code === code);

/**
 * غنی‌سازی کد رقیب سناریو از دایرکتوری رسمی.
 * فیلدهای تعرفه‌ای/قانونی و عنوان از دایرکتوری می‌آیند؛ فیلدهای اختصاصی سناریو
 * (technicalDiscriminator، riskNotes، isRecommended، recommendationReason، tscIdSample)
 * دست‌نخورده باقی می‌مانند. اگر کدی در دایرکتوری نباشد، داده‌ی خود سناریو مبناست.
 */
export const enrichScenarioCode = (code: CompetingHsCode): CompetingHsCode => {
  const entry = findHsDirectoryEntry(code.code);
  if (!entry) return code;
  return {
    ...code,
    titleFa: entry.titleFa,
    titleEn: entry.titleEn,
    customsDuty: entry.customsDuty,
    commercialProfit: entry.commercialProfit,
    totalTariffPercent: entry.totalTariffPercent,
    vatRate: entry.vatRate,
    samtGroup: entry.samtGroup,
    allowedFxTypes: entry.allowedFxTypes,
    mandatoryPermits: entry.mandatoryPermits,
  };
};

/** همه‌ی کدهای رقیب یک سناریو، غنی‌شده از دایرکتوری */
export const enrichScenarioCodes = (codes: CompetingHsCode[]): CompetingHsCode[] =>
  codes.map(enrichScenarioCode);

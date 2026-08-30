/**
 * موتور بازمحاسبه‌ی «چه‌اگر» نرخ ارز (FX Revaluation Engine)
 * ------------------------------------------------------------------
 * بهای تمام‌شده‌ی ذخیره‌شده در هر پرونده، یک عدد تاریخی است و با تغییر
 * نرخ ارز در تنظیمات عوض نمی‌شود (و نباید هم بشود). این ماژول صرفاً
 * «سناریوی چه‌اگر» می‌سازد: اگر نرخ ارز امروز X بود، بهای تمام‌شده‌ی سبد
 * چقدر می‌شد؟
 *
 * منطق (مطابق موتور costing.ts):
 *   سهم ارزی هر واحد = CIF(دلار) × نرخ ارز × (۱+حقوق) × (۱+سود بازرگانی) × (۱+مالیات)
 *   سهم ریالی ثابت   = بهای ذخیره‌شده − سهم ارزی فعلی   (ترخیص‌کاری، حمل داخلی، کارمزد...)
 *   بهای بازمحاسبه‌شده = بهای ذخیره‌شده + (سهم ارزیِ نرخ جدید − سهم ارزیِ نرخ مرجع)
 *
 * مفروضات (به‌صورت صریح در UI نمایش داده می‌شود):
 *   - نرخ تعرفه از دایرکتوری HS جاری خوانده می‌شود (کتاب مقررات مرجع داخلی).
 *   - تغییر نرخ «موازی» است: نسبت نیما/آزاد ثابت می‌ماند.
 *   - اگر پرونده نرخ ارز ثبت‌شده داشته باشد (ثبت از ویزارد)، همان مبناست؛
 *     وگرنه نرخ مرجع از کانال ارزی پرونده (نیما/آزاد) در تنظیمات فعلی گرفته می‌شود.
 */
import type { AppSettings, InventoryUnit } from '../types';
import { HS_CODE_DIRECTORY } from '../data/hscodeDirectory';
import type { HsCodeDatabaseEntry } from '../data/hscodeDirectory';

const NIMA_CHANNEL = 'ارز نیمایی (سامانه نیما)' as const;

/** جستجوی تعرفه در دایرکتوری HS (کد ۸ رقمی) */
export const findHsDirectoryEntry = (code: string): HsCodeDatabaseEntry | undefined =>
  HS_CODE_DIRECTORY.find((e) => e.code === code);

/**
 * ضریب تراکمی بهای گمرکی: (۱+حقوق)×(۱+سود بازرگانی)×(۱+مالیات).
 * اگر تعرفه در دایرکتوری نباشد، ضریب حداقلی (حقوق ۴٪ + مالیات پیش‌فرض) با پرچم hsFound=false.
 */
export const tariffMultiplier = (entry: HsCodeDatabaseEntry | undefined, vatFallbackPct: number): number => {
  const duty = entry?.customsDuty ?? 4;
  const cp = entry?.commercialProfit ?? 0;
  const vat = entry?.vatRate ?? (vatFallbackPct || 10);
  return (1 + duty / 100) * (1 + cp / 100) * (1 + vat / 100);
};

/** آیا پرونده از کانال ارز نیما تأمین شده است؟ */
export const isNimaChannel = (unit: InventoryUnit): boolean => unit.fxType === NIMA_CHANNEL;

export interface UnitRevaluation {
  unit: InventoryUnit;
  refFxToman: number;          // نرخ ارز مرجع (ثبت‌شده یا کانال فعلی)
  newFxToman: number;          // نرخ ارز در سناریوی فرضی
  channelShift: number;        // ضریب جابه‌جایی کانال (نیما=۱، آزاد=نسبت آزاد/نیما)
  tariffMultiplier: number;
  hsFound: boolean;            // تعرفه در دایرکتوری یافت شد؟
  fxElasticOldMillion: number; // سهم ارزی هر واحد در نرخ مرجع (میلیون ت)
  fxElasticNewMillion: number; // سهم ارزی هر واحد در نرخ فرضی (میلیون ت)
  localFixedMillion: number;   // سهم ریالی ثابت هر واحد (میلیون ت)
  landedOldMillion: number;    // بهای ذخیره‌شده (میلیون ت)
  landedNewMillion: number;    // بهای بازمحاسبه‌شده (میلیون ت)
  deltaMillion: number;        // تغییر بهای هر واحد (میلیون ت)
}

export const revalueUnit = (unit: InventoryUnit, newNimaFx: number, settings: AppSettings): UnitRevaluation => {
  const nima = settings.fx.usdNimaToman || 68000;
  const azad = settings.fx.usdAzadToman || 92500;
  const nimaUnit = isNimaChannel(unit);

  const channelRef = nimaUnit ? nima : azad;
  const channelShift = nimaUnit ? 1 : azad / Math.max(1, nima);
  const channelNew = newNimaFx * channelShift;

  const refFx = unit.fxRateAtLandedToman ?? channelRef;
  const newFx = refFx + (channelNew - channelRef);

  const entry = findHsDirectoryEntry(unit.hsCode);
  const mult = tariffMultiplier(entry, settings.vatDefaultPct);

  const cifUsd = unit.costPriceUsd || 0;
  const fxElasticOld = cifUsd * refFx * mult; // تومان به ازای هر واحد
  const fxElasticNew = cifUsd * newFx * mult;

  const landedOld = unit.landedCostToman;
  const fxElasticOldMillion = fxElasticOld / 1_000_000;
  const landedNew = landedOld + (fxElasticNew - fxElasticOld) / 1_000_000;

  return {
    unit,
    refFxToman: Math.round(refFx),
    newFxToman: Math.round(newFx),
    channelShift,
    tariffMultiplier: mult,
    hsFound: !!entry,
    fxElasticOldMillion,
    fxElasticNewMillion: fxElasticNew / 1_000_000,
    localFixedMillion: landedOld - fxElasticOldMillion,
    landedOldMillion: landedOld,
    landedNewMillion: landedNew,
    deltaMillion: landedNew - landedOld,
  };
};

export interface PortfolioRevaluation {
  perUnit: UnitRevaluation[];
  landedOldMillion: number;   // بهای تمام‌شده سبد (میلیون ت)
  landedNewMillion: number;   // بهای بازمحاسبه‌شده سبد (میلیون ت)
  deltaMillion: number;       // تغییر کل (میلیون ت)
  marketMillion: number;      // ارزش بازار (میلیون ت)
  profitOldMillion: number;
  profitNewMillion: number;
  missingTariffCount: number; // پرونده‌های بدون تعرفه در دایرکتوری
  /** تغییر بهای تمام‌شده‌ی کل به ازای هر ۱۰۰۰ تومان افزایش نرخ نیما (میلیون ت) */
  sensitivityPerThousandTomanMillion: number;
}

export const revaluePortfolio = (
  inventory: InventoryUnit[],
  newNimaFx: number,
  settings: AppSettings
): PortfolioRevaluation => {
  const perUnit = inventory.map((u) => revalueUnit(u, newNimaFx, settings));
  const landedOldMillion = perUnit.reduce((s, r) => s + r.landedOldMillion * r.unit.stockQty, 0);
  const landedNewMillion = perUnit.reduce((s, r) => s + r.landedNewMillion * r.unit.stockQty, 0);
  const marketMillion = inventory.reduce((s, u) => s + u.marketPriceToman * u.stockQty, 0);
  const sensitivityPerThousandTomanMillion = perUnit.reduce(
    (s, r) => s + (r.unit.stockQty * (r.unit.costPriceUsd || 0) * r.tariffMultiplier * r.channelShift) / 1000,
    0
  );

  return {
    perUnit,
    landedOldMillion,
    landedNewMillion,
    deltaMillion: landedNewMillion - landedOldMillion,
    marketMillion,
    profitOldMillion: marketMillion - landedOldMillion,
    profitNewMillion: marketMillion - landedNewMillion,
    missingTariffCount: perUnit.filter((r) => !r.hsFound).length,
    sensitivityPerThousandTomanMillion,
  };
};

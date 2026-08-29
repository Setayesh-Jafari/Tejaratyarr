/**
 * موتور بهای تمام‌شده ترخیص (Landed Cost Engine)
 * ------------------------------------------------------------------
 * پیاده‌سازی قاعده محاسبات واردات ایران:
 *   CIF = FOB + حمل + بیمه
 *   ارزش گمرکی (تومان) = CIF × نرخ ارز
 *   حقوق ورودی = ارزش گمرکی × نرخ حقوق ورودی
 *   سود بازرگانی = (ارزش گمرکی + حقوق ورودی) × نرخ سود بازرگانی
 *   پایه مالیات = ارزش گمرکی + حقوق ورودی + سود بازرگانی
 *   مالیات بر ارزش افزوده = پایه مالیات × نرخ مالیات
 *   + هزینه‌های محلی (ترخیص‌کاری، حمل داخلی، کارمزد بانک، بازرسی)
 */
import type { CostingInput, LandedCostResult, MarginAnalysis, CostLine } from '../types';

const safe = (n: number): number => (Number.isFinite(n) && n > 0 ? n : 0);

export function computeLandedCost(input: CostingInput): LandedCostResult {
  const qty = Math.max(1, safe(input.qty) || 1);
  const fx = safe(input.fxRateToman);

  const fobUsd = safe(input.fobUsd);
  const freightUsd = safe(input.freightUsd);
  const insuranceUsd = safe(input.insuranceUsd);
  const cifUsdPerUnit = fobUsd + freightUsd + insuranceUsd;
  const cifUsdTotal = cifUsdPerUnit * qty;

  const cifTomanPerUnit = cifUsdPerUnit * fx;
  const cifTomanTotal = cifUsdPerUnit * fx * qty;

  const dutyTotal = cifTomanTotal * (safe(input.customsDutyPct) / 100);
  const commercialProfitTotal = (cifTomanTotal + dutyTotal) * (safe(input.commercialProfitPct) / 100);
  const vatBase = cifTomanTotal + dutyTotal + commercialProfitTotal;
  const vatTotal = vatBase * (safe(input.vatPct) / 100);

  const customsOutlay = dutyTotal + commercialProfitTotal + vatTotal;

  const clearanceTotal = safe(input.clearanceFeeToman) * qty;
  const inlandTotal = safe(input.inlandFreightToman) * qty;
  const brokerTotal = safe(input.brokerAndBankToman) * qty;
  const otherTotal = safe(input.otherFeeToman) * qty;

  const localTotal = clearanceTotal + inlandTotal + brokerTotal + otherTotal;
  const landedTotal = cifTomanTotal + customsOutlay + localTotal;

  const rawLines: Array<Omit<CostLine, 'pctOfTotal'>> = [
    { key: 'cif', label: 'ارزش گمرکی CIF (خريد + حمل + بيمه)', totalToman: cifTomanTotal, perUnitToman: cifTomanPerUnit, kind: 'base' },
    { key: 'duty', label: `حقوق ورودی گمرکی (${safe(input.customsDutyPct)}٪)`, totalToman: dutyTotal, perUnitToman: dutyTotal / qty, kind: 'tariff' },
    { key: 'profit', label: `سود بازرگانی صمت (${safe(input.commercialProfitPct)}٪)`, totalToman: commercialProfitTotal, perUnitToman: commercialProfitTotal / qty, kind: 'tariff' },
    { key: 'vat', label: `مالیات بر ارزش افزوده (${safe(input.vatPct)}٪)`, totalToman: vatTotal, perUnitToman: vatTotal / qty, kind: 'tax' },
    { key: 'clearance', label: 'ترخیص‌کاری، پلمب و دعاوی گمرکی', totalToman: clearanceTotal, perUnitToman: clearanceTotal / qty, kind: 'local' },
    { key: 'inland', label: 'حمل داخلی (بندر → انبار)', totalToman: inlandTotal, perUnitToman: inlandTotal / qty, kind: 'local' },
    { key: 'broker', label: 'کارمزد بانک/صرافی و اسناد ارزی', totalToman: brokerTotal, perUnitToman: brokerTotal / qty, kind: 'local' },
    { key: 'other', label: 'بازرسی COI، استاندارد و متفرقه', totalToman: otherTotal, perUnitToman: otherTotal / qty, kind: 'local' },
  ];

  const lines: CostLine[] = rawLines.map((l) => ({
    ...l,
    pctOfTotal: landedTotal > 0 ? Math.round((l.totalToman / landedTotal) * 1000) / 10 : 0,
  }));

  return {
    cifUsdTotal,
    cifTomanTotal,
    lines,
    landedTotalToman: landedTotal,
    landedPerUnitToman: landedTotal / qty,
    landedPerUnitMillionToman: landedTotal / qty / 1_000_000,
    customsOutlayToman: customsOutlay,
  };
}

export function analyzeMargin(result: LandedCostResult, sellPricePerUnitToman: number, qty: number): MarginAnalysis {
  const q = Math.max(1, qty || 1);
  const sell = safe(sellPricePerUnitToman);
  const profitPerUnit = sell - result.landedPerUnitToman;
  const profitTotal = profitPerUnit * q;

  // نرخ سربه‌سر ارز: نرخی که در آن بهای تمام‌شده هر واحد = قیمت فروش
  const tariffish = 1 + result.customsOutlayToman / Math.max(1, result.cifTomanTotal); // ضریب عوارض روی CIF
  const nonCifPerUnit = (result.landedTotalToman - result.cifTomanTotal - result.customsOutlayToman) / q;
  const cifUsdPerUnit = result.cifUsdTotal / q;
  const breakEvenFx = cifUsdPerUnit > 0 ? (sell - nonCifPerUnit) / (cifUsdPerUnit * tariffish) : 0;

  return {
    sellPricePerUnitToman: sell,
    profitPerUnitToman: profitPerUnit,
    profitTotalToman: profitTotal,
    marginPct: sell > 0 ? Math.round((profitPerUnit / sell) * 1000) / 10 : 0,
    roiPct: result.landedPerUnitToman > 0 ? Math.round((profitPerUnit / result.landedPerUnitToman) * 1000) / 10 : 0,
    breakEvenFxToman: Math.max(0, Math.round(breakEvenFx)),
  };
}

/** سناریوی حساسیت نرخ ارز: نتیجه در نرخ‌های جایگزین */
export function fxSensitivity(input: CostingInput, currentFx: number): Array<{ label: string; fx: number; landedPerUnitToman: number }> {
  const deltas = [
    { label: 'بدبینانه (+۱۵٪)', fx: currentFx * 1.15 },
    { label: 'محتاطانه (+۷٪)', fx: currentFx * 1.07 },
    { label: 'نرخ فعلی', fx: currentFx },
    { label: 'خوش‌بینانه (−۵٪)', fx: currentFx * 0.95 },
  ];
  return deltas.map((d) => ({
    ...d,
    fx: Math.round(d.fx),
    landedPerUnitToman: computeLandedCost({ ...input, fxRateToman: d.fx }).landedPerUnitToman,
  }));
}

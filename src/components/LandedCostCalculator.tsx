/**
 * ماشین‌حساب بهای تمام‌شده ترخیص — بر پایه موتور محاسباتی src/lib/costing.ts
 * قابل استفاده در ویزارد ارزیابی و داشبورد مالی
 */
import React, { useMemo, useState } from 'react';
import { Calculator, TrendingUp, Gauge, Ship, Landmark, Truck, FileWarning } from 'lucide-react';
import type { CostingInput } from '../types';
import { computeLandedCost, analyzeMargin, fxSensitivity } from '../lib/costing';
import { fmtToman, fmtMillion, fmtPct } from '../lib/format';

interface LandedCostCalculatorProps {
  initial?: Partial<CostingInput>;
  sellPricePerUnitToman?: number;
  onSellPriceChange?: (v: number) => void;
  /** نتیجه و تحلیل حاشیه سود زنده — برای همگام‌سازی با والد (مثل حکم نهایی ویزارد) */
  onResult?: (
    result: ReturnType<typeof computeLandedCost>,
    margin: ReturnType<typeof analyzeMargin>,
    qty: number
  ) => void;
  compact?: boolean;
}

const NumField: React.FC<{
  label: string; value: number; onChange: (n: number) => void;
  suffix?: string; step?: number; hint?: string; dark?: boolean;
}> = ({ label, value, onChange, suffix, step = 1, hint, dark }) => (
  <div className="space-y-1">
    <label className={`text-[10px] font-bold block ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</label>
    <div className="relative">
      <input
        type="number"
        dir="ltr"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full rounded-lg border px-2.5 py-1.5 text-xs font-mono font-bold text-left focus:outline-none focus:ring-2 transition-all ${
          dark
            ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500'
            : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-500 focus:bg-white'
        }`}
      />
      {suffix && <span className={`absolute left-2 top-1.5 text-[10px] font-normal ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{suffix}</span>}
    </div>
    {hint && <p className={`text-[9px] leading-tight ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{hint}</p>}
  </div>
);

export const LandedCostCalculator: React.FC<LandedCostCalculatorProps> = ({
  initial = {},
  sellPricePerUnitToman = 0,
  onSellPriceChange,
  onResult,
  compact = false,
}) => {
  const [input, setInput] = useState<CostingInput>({
    fobUsd: 62,
    freightUsd: 4.5,
    insuranceUsd: 0.8,
    qty: 620,
    fxRateToman: 68000,
    customsDutyPct: 4,
    commercialProfitPct: 0,
    vatPct: 10,
    clearanceFeeToman: 290000,
    inlandFreightToman: 120000,
    brokerAndBankToman: 180000,
    otherFeeToman: 95000,
    ...initial,
  });

  const set = (patch: Partial<CostingInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => computeLandedCost(input), [input]);
  const margin = useMemo(() => analyzeMargin(result, sellPricePerUnitToman || result.landedPerUnitToman * 1.3, input.qty), [result, sellPricePerUnitToman, input.qty]);
  const sensitivity = useMemo(() => fxSensitivity(input, input.fxRateToman), [input]);

  React.useEffect(() => {
    onResult?.(result, margin, input.qty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, margin]);

  return (
    <div className="space-y-4">
      {/* ورودی‌ها */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <NumField label="قیمت FOB هر واحد" value={input.fobUsd} onChange={(v) => set({ fobUsd: v })} suffix="$" step={0.5} />
        <NumField label="سهم حمل هر واحد" value={input.freightUsd} onChange={(v) => set({ freightUsd: v })} suffix="$" step={0.5} hint="دریایی/هوایی تقسیم بر تعداد" />
        <NumField label="سهم بیمه هر واحد" value={input.insuranceUsd} onChange={(v) => set({ insuranceUsd: v })} suffix="$" step={0.1} />
        <NumField label="تعداد کل" value={input.qty} onChange={(v) => set({ qty: v })} suffix="عدد" />
        <NumField label="نرخ برابری دلار" value={input.fxRateToman} onChange={(v) => set({ fxRateToman: v })} suffix="ت" step={500} hint="نیما یا آزاد" />
        <NumField label="قیمت فروش هر واحد" value={sellPricePerUnitToman || Math.round(result.landedPerUnitToman * 1.3)} onChange={(v) => onSellPriceChange?.(v)} suffix="ت" step={100000} hint="ارزش روز بازار" />
        <NumField label="حقوق ورودی" value={input.customsDutyPct} onChange={(v) => set({ customsDutyPct: v })} suffix="٪" step={0.5} />
        <NumField label="سود بازرگانی صمت" value={input.commercialProfitPct} onChange={(v) => set({ commercialProfitPct: v })} suffix="٪" step={0.5} />
        <NumField label="مالیات ارزش افزوده" value={input.vatPct} onChange={(v) => set({ vatPct: v })} suffix="٪" step={0.5} />
        <NumField label="ترخیص‌کاری هر واحد" value={input.clearanceFeeToman} onChange={(v) => set({ clearanceFeeToman: v })} suffix="ت" step={10000} />
        <NumField label="حمل داخلی هر واحد" value={input.inlandFreightToman} onChange={(v) => set({ inlandFreightToman: v })} suffix="ت" step={10000} />
        <NumField label="بانک/صرافی + متفرقه" value={input.brokerAndBankToman + input.otherFeeToman}
          onChange={(v) => set({ brokerAndBankToman: Math.round(v * 0.65), otherFeeToman: Math.round(v * 0.35) })}
          suffix="ت" step={10000} hint="تلفیق دو قلم" />
      </div>

      {/* نتایج کلیدی */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Calculator className="w-3 h-3" /> بهای تمام‌شده هر واحد</span>
          <span className="text-xl font-black font-mono" dir="ltr">{fmtMillion(result.landedPerUnitMillionToman)}</span>
          <span className="text-[10px] text-slate-400">میلیون تومان</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Landmark className="w-3 h-3 text-rose-500" /> پرداخت به گمرک (کل محموله)</span>
          <span className="text-lg font-black font-mono text-rose-700" dir="ltr">{fmtToman(result.customsOutlayToman / 1_000_000)}</span>
          <span className="text-[10px] text-slate-400">میلیون تومان — حقوق ورودی + سود بازرگانی + مالیات</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-600" /> حاشیه سود و بازده</span>
          <span className={`text-lg font-black font-mono ${margin.profitPerUnitToman >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} dir="ltr">
            {fmtPct(margin.marginPct)}
          </span>
          <span className="text-[10px] text-slate-400">بازده سرمایه {fmtPct(margin.roiPct)} — سود کل {fmtToman(margin.profitTotalToman / 1_000_000)} م.ت</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Gauge className="w-3 h-3 text-amber-600" /> نرخ ارز سربه‌سر</span>
          <span className="text-lg font-black font-mono text-amber-700" dir="ltr">{fmtToman(margin.breakEvenFxToman)}</span>
          <span className="text-[10px] text-slate-400">تومان — بالاتر از این نرخ، سود صفر می‌شود</span>
        </div>
      </div>

      {/* تفکیک قلم به قلم */}
      {!compact && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Ship className="w-3.5 h-3.5 text-blue-600" /> تفکیک بهای تمام‌شده کل محموله</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 font-mono" dir="ltr">CIF ${fmtToman(result.cifUsdTotal)}</span>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span>چاپ / خروجی PDF صورت‌حساب</span>
              </button>
            </div>
          </div>
          <table className="w-full text-right text-xs">
            <thead className="bg-white text-[10px] text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-4 py-2 font-bold">قلم هزینه</th>
                <th className="px-4 py-2 font-bold text-left" dir="ltr">جمع (م.ت)</th>
                <th className="px-4 py-2 font-bold">هر واحد</th>
                <th className="px-4 py-2 font-bold w-40">سهم از کل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {result.lines.map((l) => (
                <tr key={l.key} className="hover:bg-slate-50/70">
                  <td className="px-4 py-2.5 font-medium text-slate-700">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ml-1.5 ${
                      l.kind === 'base' ? 'bg-blue-500' : l.kind === 'tariff' ? 'bg-rose-500' : l.kind === 'tax' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    {l.label}
                  </td>
                  <td className="px-4 py-2.5 text-left font-mono font-bold text-slate-900" dir="ltr">{fmtMillion(l.totalToman / 1_000_000)}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500" dir="ltr">{fmtToman(l.perUnitToman)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          l.kind === 'base' ? 'bg-blue-500' : l.kind === 'tariff' ? 'bg-rose-500' : l.kind === 'tax' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} style={{ width: `${Math.min(100, l.pctOfTotal)}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 w-10 text-left" dir="ltr">{fmtPct(l.pctOfTotal)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white">
                <td className="px-4 py-3 font-bold text-xs">جمع کل بهای تمام‌شده (Landed Cost)</td>
                <td className="px-4 py-3 text-left font-mono font-black" dir="ltr">{fmtMillion(result.landedTotalToman / 1_000_000)}</td>
                <td className="px-4 py-3 font-mono text-slate-300" dir="ltr">{fmtToman(result.landedPerUnitToman)}</td>
                <td className="px-4 py-3 text-[10px] text-slate-400">برای {fmtToman(input.qty)} واحد</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* حساسیت نرخ ارز */}
      {!compact && (
        <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <FileWarning className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-950">تحلیل حساسیت نرخ ارز — قبل از ثبت سفارش حتماً بررسی کنید</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {sensitivity.map((s) => {
              const diffPct = ((s.landedPerUnitToman - result.landedPerUnitToman) / Math.max(1, result.landedPerUnitToman)) * 100;
              return (
                <div key={s.label} className={`rounded-lg border p-2.5 ${s.label === 'نرخ فعلی' ? 'bg-white border-blue-300' : 'bg-white/70 border-slate-200'}`}>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                    <span>{s.label}</span>
                    <span className="font-mono" dir="ltr">{fmtToman(s.fx)}</span>
                  </div>
                  <div className="text-sm font-black font-mono text-slate-800 mt-1" dir="ltr">{fmtToman(s.landedPerUnitToman / 1_000_000)} م.ت</div>
                  <div className={`text-[10px] font-bold font-mono mt-0.5 ${diffPct > 0.05 ? 'text-rose-600' : diffPct < -0.05 ? 'text-emerald-600' : 'text-slate-400'}`} dir="ltr">
                    {diffPct > 0 ? '+' : ''}{fmtPct(diffPct)}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-amber-800 leading-relaxed flex items-start gap-1.5">
            <Truck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            نکته کارشناسی: در کالاهای تعرفه‌دار، هر ۱٪ افزایش نرخ ارز تقریباً {(1 + (result.customsOutlayToman / Math.max(1, result.cifTomanTotal))).toFixed(2)} برابر در بهای تمام‌شده اثر می‌گذارد (اثر ضرب در عوارض گمرکی).
          </p>
        </div>
      )}
    </div>
  );
};

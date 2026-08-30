import React, { useMemo } from 'react';
import { InventoryUnit } from '../types';
import { Coins } from 'lucide-react';
import { fmtMillion, fmtBillion, fmtPct } from '../lib/format';
import { useStore } from '../store/AppStore';
import { revaluePortfolio } from '../lib/fxRevaluation';

interface FinancialLedgerProps {
  inventory: InventoryUnit[];
}

/** نسبت بهای تمام‌شده به ارزش بازار — شاخص سالم‌بودن قیمت‌گذاری (هرچه کمتر بهتر) */
const costRatioTone = (ratioPct: number): { label: string; cls: string } => {
  if (ratioPct >= 85) return { label: `بهای تمام‌شده بالا (${fmtPct(ratioPct)})`, cls: 'bg-rose-100 text-rose-800' };
  if (ratioPct >= 60) return { label: `بهای تمام‌شده متوسط (${fmtPct(ratioPct)})`, cls: 'bg-orange-100 text-orange-800' };
  return { label: `بهای تمام‌شده بهینه (${fmtPct(ratioPct)})`, cls: 'bg-emerald-100 text-emerald-800' };
};

export const FinancialLedger: React.FC<FinancialLedgerProps> = ({ inventory }) => {
  const { settings } = useStore();

  const fxSensitivityMillion = useMemo(() => {
    if (!inventory.length) return 0;
    const reval = revaluePortfolio(inventory, settings.fx.usdNimaToman, settings);
    return reval.sensitivityPerThousandTomanMillion;
  }, [inventory, settings]);

  const { rows, totals, stuckInCustoms } = useMemo(() => {
    const catMap = new Map<string, { qty: number; units: number; cost: number; market: number; unitLabel: string }>();
    for (const u of inventory) {
      const cur = catMap.get(u.category) ?? { qty: 0, units: 0, cost: 0, market: 0, unitLabel: u.unit.split(' ')[0] };
      cur.qty += u.stockQty;
      cur.units += 1;
      cur.cost += u.landedCostToman * u.stockQty;
      cur.market += u.marketPriceToman * u.stockQty;
      catMap.set(u.category, cur);
    }
    const rows = Array.from(catMap.entries()).map(([category, v]) => ({
      category,
      qty: v.qty,
      units: v.units,
      unitLabel: v.unitLabel,
      cost: v.cost,
      market: v.market,
      profit: v.market - v.cost,
      marginPct: v.market > 0 ? ((v.market - v.cost) / v.market) * 100 : 0,
      costRatio: v.market > 0 ? (v.cost / v.market) * 100 : 0,
    })).sort((a, b) => b.cost - a.cost);

    const totals = {
      cost: rows.reduce((s, r) => s + r.cost, 0),
      market: rows.reduce((s, r) => s + r.market, 0),
    };

    const stuck = inventory
      .filter((u) => u.status === 'در گمرک (در حال ترخیص)')
      .reduce((s, u) => s + u.landedCostToman * u.stockQty, 0);

    return { rows, totals, stuckInCustoms: stuck };
  }, [inventory]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-right flex-shrink-0">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/60">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>دفتر مالی و تراز بهای تمام‌شده واردات (Landed Cost Ledger)</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            تفکیک زنده‌ی سبد بر اساس دسته‌بندی، نسبت بهای تمام‌شده به بازار و حاشیه سود — محاسبه‌شده از داده واقعی کارتابل
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs border-collapse min-w-[760px]">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5">دسته‌بندی کالا</th>
              <th className="px-4 py-2.5">تعداد / پرونده</th>
              <th className="px-4 py-2.5">بهای تمام‌شده خرید و ترخیص</th>
              <th className="px-4 py-2.5">ارزش تخمینی در بازار</th>
              <th className="px-4 py-2.5">نسبت بهای تمام‌شده به بازار</th>
              <th className="px-4 py-2.5 text-left" dir="ltr">حاشیه سود خالص</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {rows.map((r) => {
              const tone = costRatioTone(r.costRatio);
              return (
                <tr key={r.category} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-900">{r.category}</td>
                  <td className="px-4 py-3 font-mono">
                    {r.qty.toLocaleString('fa-IR')} {r.unitLabel}
                    <span className="text-slate-400 text-[10px]"> ({r.units.toLocaleString('fa-IR')} پرونده)</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-900" dir="ltr">{fmtMillion(r.cost)} م.ت</td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-600" dir="ltr">{fmtMillion(r.market)} م.ت</td>
                  <td className="px-4 py-3">
                    <span className={`${tone.cls} text-[10px] font-bold px-2 py-0.5 rounded-md`}>{tone.label}</span>
                  </td>
                  <td className={`px-4 py-3 text-left font-bold font-mono ${r.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} dir="ltr">
                    {r.profit >= 0 ? '+' : ''}{fmtPct(r.marginPct)}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">کارتابل خالی است — با دکمه «ثبت کارگوی جدید» شروع کنید.</td></tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-slate-50 border-t-2 border-slate-200 text-slate-900">
              <tr>
                <td className="px-4 py-3 font-bold">جمع کل سبد</td>
                <td className="px-4 py-3 font-mono">{inventory.reduce((s, u) => s + u.stockQty, 0).toLocaleString('fa-IR')} واحد</td>
                <td className="px-4 py-3 font-mono font-bold" dir="ltr">{fmtBillion(totals.cost)} میلیارد ت</td>
                <td className="px-4 py-3 font-mono font-bold text-indigo-600" dir="ltr">{fmtBillion(totals.market)} میلیارد ت</td>
                <td className="px-4 py-3 text-[10px] text-amber-600 font-semibold" colSpan={2} dir="rtl">
                  رسوب در گمرک: {fmtBillion(stuckInCustoms)} میلیارد ت
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-[10px] text-slate-500" colSpan={6} dir="rtl">
                  حساسیت نرخ ارز: هر ۱۰۰۰ تومان افزایش نرخ نیما ≈{' '}
                  <span className="font-bold text-indigo-600">{fmtBillion(fxSensitivityMillion)} میلیارد ت</span>{' '}
                  به بهای تمام‌شده‌ی سبد می‌افزاید (تخمینی بر اساس دایرکتوری HS داخلی).
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

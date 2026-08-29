import React, { useMemo } from 'react';
import { InventoryUnit } from '../types';
import { Coins } from 'lucide-react';
import { fmtMillion, fmtBillion, fmtPct } from '../lib/format';

interface FinancialLedgerProps {
  inventory: InventoryUnit[];
}

const tariffTone = (avgTariffPct: number): { label: string; cls: string } => {
  if (avgTariffPct >= 60) return { label: `تعرفه سنگین (${fmtPct(avgTariffPct)})`, cls: 'bg-rose-100 text-rose-800' };
  if (avgTariffPct >= 20) return { label: `تعرفه بالا (${fmtPct(avgTariffPct)})`, cls: 'bg-orange-100 text-orange-800' };
  if (avgTariffPct >= 10) return { label: `تعرفه استاندارد (${fmtPct(avgTariffPct)})`, cls: 'bg-blue-100 text-blue-800' };
  return { label: `تعرفه تشویقی (${fmtPct(avgTariffPct)})`, cls: 'bg-emerald-100 text-emerald-800' };
};

export const FinancialLedger: React.FC<FinancialLedgerProps> = ({ inventory }) => {
  const { rows, totals, stuckInCustoms } = useMemo(() => {
    const catMap = new Map<string, { qty: number; units: number; cost: number; market: number; tariffWeighted: number; unitLabel: string }>();
    for (const u of inventory) {
      const cur = catMap.get(u.category) ?? { qty: 0, units: 0, cost: 0, market: 0, tariffWeighted: 0, unitLabel: u.unit.split(' ')[0] };
      cur.qty += u.stockQty;
      cur.units += 1;
      cur.cost += u.landedCostToman * u.stockQty;
      cur.market += u.marketPriceToman * u.stockQty;
      // میانگین وزنی «نامچسب تعرفه» — نسبت سود به ارزش خرید به‌عنوان شاخص فشردگی تعرفه
      const purchase = u.costPriceUsd > 0 ? u.costPriceUsd : 1;
      cur.tariffWeighted += ((u.landedCostToman / 68000) - purchase) * u.stockQty; // تقریب تفاوت landed از خرید ارزی
      catMap.set(u.category, cur);
    }
    const rows = Array.from(catMap.entries()).map(([category, v]) => {
      const costUsdApprox = inventory.filter((u) => u.category === category).reduce((s, u) => s + u.costPriceUsd * u.stockQty, 0);
      const avgTariff = costUsdApprox > 0 ? ((v.cost / 68000 - costUsdApprox) / costUsdApprox) * 100 : 0;
      return {
        category,
        qty: v.qty,
        units: v.units,
        unitLabel: v.unitLabel,
        cost: v.cost,
        market: v.market,
        profit: v.market - v.cost,
        marginPct: v.market > 0 ? ((v.market - v.cost) / v.market) * 100 : 0,
        avgTariff: Math.max(0, Math.min(120, avgTariff)),
      };
    }).sort((a, b) => b.cost - a.cost);

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
            تفکیک زنده‌ی سبد بر اساس دسته‌بندی، شاخص فشردگی تعرفه و حاشیه سود — محاسبه‌شده از داده واقعی کارتابل
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
              <th className="px-4 py-2.5">شاخص فشردگی تعرفه</th>
              <th className="px-4 py-2.5 text-left" dir="ltr">حاشیه سود خالص</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {rows.map((r) => {
              const tone = tariffTone(r.avgTariff);
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
            <tfoot className="bg-slate-900 text-white">
              <tr>
                <td className="px-4 py-3 font-bold">جمع کل سبد</td>
                <td className="px-4 py-3 font-mono">{inventory.reduce((s, u) => s + u.stockQty, 0).toLocaleString('fa-IR')} واحد</td>
                <td className="px-4 py-3 font-mono font-black" dir="ltr">{fmtBillion(totals.cost)} میلیارد ت</td>
                <td className="px-4 py-3 font-mono font-black text-blue-400" dir="ltr">{fmtBillion(totals.market)} میلیارد ت</td>
                <td className="px-4 py-3 text-[10px] text-amber-300 font-mono" colSpan={2} dir="rtl">
                  رسوب در گمرک: {fmtBillion(stuckInCustoms)} میلیارد ت
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

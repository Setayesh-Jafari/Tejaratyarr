/**
 * کارت سلامت کارتابل — شاخص‌های عملیاتی زنده
 * ------------------------------------------------------------------
 * همه‌ی اعداد از داده‌ی واقعی inventory مشتق می‌شوند و هیچ عدد
 * ثابت/نمایشی در این کامپوننت وجود ندارد.
 */
import React, { useMemo } from 'react';
import { TrendingUp, AlertTriangle, PackageCheck } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { STATUS_FLOW, isSettledStatus } from '../types';
import type { InventoryUnit } from '../types';
import { fmtBillion, fmtMillion, fmtPct, daysSince } from '../lib/format';

/** آستانه هشدار معطل‌کاری در گمرک (روز) */
const DEMURRAGE_DAYS = 25;

const STATUS_META: Record<string, { label: string; dot: string; bar: string }> = {
  'در انتظار تخصیص ارز و ثبت سفارش': { label: 'انتظار تخصیص ارز', dot: 'bg-violet-500', bar: 'bg-violet-500' },
  'در حال ترانزیت بین‌المللی': { label: 'ترانزیت بین‌المللی', dot: 'bg-sky-500', bar: 'bg-sky-500' },
  'در گمرک (در حال ترخیص)': { label: 'در گمرک', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  'موجود در انبار (ترخیص شده)': { label: 'انبار و آماده فروش', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
};

export const PerformanceSection: React.FC = () => {
  const { inventory } = useStore();

  const stats = useMemo(() => {
    const valueOf = (u: InventoryUnit) => u.landedCostToman * u.stockQty;
    const totalValue = inventory.reduce((s, u) => s + valueOf(u), 0);
    const totalMarket = inventory.reduce((s, u) => s + u.marketPriceToman * u.stockQty, 0);

    const byStatus = STATUS_FLOW.map((status) => {
      const items = inventory.filter(
        (u) => u.status === status || (status === 'موجود در انبار (ترخیص شده)' && u.status === 'رزرو مشتری / پیش‌فروش')
      );
      return { status, count: items.length, value: items.reduce((s, u) => s + valueOf(u), 0) };
    });

    const customsItems = inventory.filter((u) => u.status === 'در گمرک (در حال ترخیص)');
    const stuckValue = customsItems
      .filter((u) => daysSince(u.stageEnteredAt ?? u.createdAt) > DEMURRAGE_DAYS)
      .reduce((s, u) => s + valueOf(u), 0);

    const activeCount = inventory.filter((u) => !isSettledStatus(u.status)).length;
    const readyCount = inventory.length - activeCount;
    const marginPct = totalMarket > 0 ? ((totalMarket - totalValue) / totalMarket) * 100 : 0;

    return { totalValue, totalMarket, byStatus, stuckValue, activeCount, readyCount, marginPct, customsCount: customsItems.length };
  }, [inventory]);

  const maxValue = Math.max(1, ...stats.byStatus.map((s) => s.value));

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-shrink-0">
      {/* توزیع ارزش سبد بر اساس مرحله چرخه عمر (زنده) */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span>توزیع ارزش بهای تمام‌شده بر اساس مرحله چرخه عمر</span>
            </h4>
            <p className="text-[10px] text-slate-400">ارزش زنده سبد بر اساس وضعیت هر پرونده در کارتابل (میلیون تومان)</p>
          </div>
          <div className="flex items-center gap-2.5 text-[9px] font-bold text-slate-500">
            {STATUS_FLOW.map((s) => (
              <span key={s} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${STATUS_META[s].dot}`}></span>
                {STATUS_META[s].label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-3 pt-4 min-h-[112px]">
          {stats.byStatus.map((s) => {
            const meta = STATUS_META[s.status];
            const pct = Math.max(2, Math.min(100, Math.round((s.value / maxValue) * 100)));
            return (
              <div key={s.status}>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="font-bold text-slate-600">{meta.label}</span>
                  <span className="font-mono text-slate-500">
                    {s.count.toLocaleString('fa-IR')} پرونده · {fmtMillion(s.value)} م.ت
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className={`${meta.bar} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 flex-wrap gap-1">
          <span>مجموع بهای تمام‌شده سبد: <strong className="font-mono text-slate-800">{fmtBillion(stats.totalValue)} میلیارد ت</strong></span>
          <span>ارزش روز بازار: <strong className="font-mono text-emerald-700">{fmtBillion(stats.totalMarket)} میلیارد ت</strong></span>
        </div>
      </div>

      {/* کارت سلامت کارتابل (زنده) */}
      <div className="bg-[#1E293B] rounded-2xl p-4 shadow-xs text-white flex flex-col justify-between border border-slate-700/60">
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 mb-0.5 tracking-wider flex items-center gap-1">
            <PackageCheck className="w-3 h-3 text-emerald-400" />
            کارتابل در یک نگاه
          </h4>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black text-white font-mono">{stats.activeCount.toLocaleString('fa-IR')}</div>
            <span className="text-[10px] text-slate-400 font-bold">پرونده فعال</span>
          </div>
        </div>

        <div className="space-y-2 mt-2">
          <div className="flex justify-between items-center text-[10px] font-medium">
            <span className="text-slate-300">پرونده در گمرک</span>
            <span className="text-amber-300 font-bold font-mono">{stats.customsCount.toLocaleString('fa-IR')}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-medium">
            <span className="text-slate-300">آماده فروش (انبار/رزرو)</span>
            <span className="text-emerald-300 font-bold font-mono">{stats.readyCount.toLocaleString('fa-IR')}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-medium">
            <span className="text-slate-300">حاشیه سود ناخالص سبد</span>
            <span className="text-blue-300 font-bold font-mono">{fmtPct(stats.marginPct)}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-medium">
            <span className="text-slate-300">ارزش بهای تمام‌شده</span>
            <span className="text-slate-100 font-bold font-mono">{fmtBillion(stats.totalValue)} م.ت</span>
          </div>
        </div>

        {stats.stuckValue > 0 && (
          <div className="mt-3 flex items-start gap-1.5 text-[10px] text-rose-200 bg-rose-500/10 border border-rose-500/30 rounded-lg px-2.5 py-2 leading-relaxed">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-300" />
            <span>
              ریسک معطل‌کاری: {fmtMillion(stats.stuckValue)} م.ت سرمایه بیش از {DEMURRAGE_DAYS.toLocaleString('fa-IR')} روز در گمرک
            </span>
          </div>
        )}
      </div>
    </section>
  );
};

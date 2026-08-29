import React from 'react';
import { InventoryUnit } from '../types';

interface MetricsOverviewProps {
  inventory: InventoryUnit[];
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ inventory }) => {
  const totalClearedUnits = inventory
    .filter((i) => i.status === 'موجود در انبار (ترخیص شده)')
    .reduce((acc, item) => acc + item.stockQty, 0);

  const totalInTransitOrCustoms = inventory
    .filter((i) => i.status === 'در گمرک (در حال ترخیص)' || i.status === 'در حال ترانزیت بین‌المللی')
    .reduce((acc, item) => acc + item.stockQty, 0);

  const totalAwaitingFx = inventory.filter(
    (i) => i.status === 'در انتظار تخصیص ارز و ثبت سفارش' || i.complianceGate === 'در حال بازرسی استاندارد (COI)'
  ).length;

  const totalInventoryValueToman = inventory.reduce((acc, item) => {
    return acc + (item.landedCostToman * (item.unit.includes('تن') || item.unit.includes('کیسه') ? Math.min(item.stockQty, 10) : item.stockQty));
  }, 0);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
      {/* Total Units Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <p className="text-slate-500 text-xs font-semibold mb-1">کالاهای ترخیص‌شده در انبار</p>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold text-slate-900 font-mono">
            {totalClearedUnits.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-500 font-sans">واحد/عدد</span>
          </span>
          <span className="text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            آماده فروش
          </span>
        </div>
      </div>

      {/* Active In-Transit Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <p className="text-slate-500 text-xs font-semibold mb-1">محموله‌های در گمرک و ترانزیت</p>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold text-slate-900 font-mono">
            {totalInTransitOrCustoms.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-500 font-sans">واحد فعال</span>
          </span>
          <span className="text-blue-700 text-xs font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
            در حال ترخیص
          </span>
        </div>
      </div>

      {/* Awaiting Review */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <p className="text-slate-500 text-xs font-semibold mb-1">در صف تخصیص ارز و بازرسی استاندارد</p>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold text-slate-900 font-mono">
            {totalAwaitingFx.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-500 font-sans">پرونده صمت</span>
          </span>
          <span className="text-amber-700 text-xs font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
            پیگیری اولویت‌دار
          </span>
        </div>
      </div>

      {/* Avg Turnaround */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <p className="text-slate-500 text-xs font-semibold mb-1">میانگین چرخه ثبت تا ترخیص</p>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold text-slate-900 font-mono">
            ۲۱.۴ <span className="text-xs font-normal text-slate-500 font-sans">روز کاری</span>
          </span>
          <span className="text-slate-600 text-xs font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
            مسیر سبز گمرکی
          </span>
        </div>
      </div>
    </section>
  );
};


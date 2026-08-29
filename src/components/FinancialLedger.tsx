import React from 'react';
import { InventoryUnit } from '../types';
import { DollarSign, PieChart, TrendingUp, ShieldAlert, ArrowUpRight, Coins } from 'lucide-react';

interface FinancialLedgerProps {
  inventory: InventoryUnit[];
}

export const FinancialLedger: React.FC<FinancialLedgerProps> = ({ inventory }) => {
  const totalCostToman = inventory.reduce((sum, item) => sum + item.landedCostToman * item.stockQty, 0);
  const totalMarketValToman = inventory.reduce((sum, item) => sum + item.marketPriceToman * item.stockQty, 0);
  const projectedGrossProfitToman = totalMarketValToman - totalCostToman;
  const avgMargin = totalMarketValToman > 0 ? ((projectedGrossProfitToman / totalMarketValToman) * 100).toFixed(1) : '0';

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-right">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/60">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>دفتر مالی و تراز بهای تمام‌شده واردات (Landed Cost Ledger)</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            ارزش‌گذاری کل سبد کالا، عوارض گمرکی و سود بازرگانی پرداخت‌شده، حاشیه سود ناخالص و تخصیص منابع ارزی
          </p>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-5">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block mb-1">کل سرمایه درگیر (بهای تمام‌شده)</span>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {Math.round(totalCostToman).toLocaleString('fa-IR')} <span className="text-xs font-bold text-slate-500">م.ت</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">خرید ارزی + حمل + حقوق گمرک و ۹٪ مالیات</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block mb-1">ارزش روز بازار سبد کالا</span>
            <div className="text-2xl font-black text-blue-600 font-mono">
              {Math.round(totalMarketValToman).toLocaleString('fa-IR')} <span className="text-xs font-bold text-blue-400">م.ت</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">بر اساس نرخ فروش روز بازار تهران/شهرستان</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block mb-1">سود ناخالص پیش‌بینی شده</span>
            <div className="text-2xl font-black text-emerald-600 font-mono">
              +{Math.round(projectedGrossProfitToman).toLocaleString('fa-IR')} <span className="text-xs font-bold text-emerald-400">م.ت</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold mt-1 block">+{avgMargin}٪ حاشیه سود میانگین بازرگانی</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block mb-1">رسوب کالا در گمرکات و بنادر</span>
            <div className="text-2xl font-black text-amber-700 font-mono">
              ۲,۴۵۰ <span className="text-xs font-bold text-amber-500">م.ت</span>
            </div>
            <span className="text-[10px] text-amber-600 font-bold mt-1 block">۳ پرونده در حال ترخیص در بندرعباس و امام</span>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-slate-100/70 px-4 py-3 border-b border-slate-200 font-bold text-xs text-slate-700 flex justify-between items-center">
            <span>تفکیک سبد وارداتی بر اساس دسته‌بندی و نرخ تعرفه گمرکی صمت</span>
            <span className="text-slate-500 font-medium text-[11px]">مبتنی بر کدهای تعرفه ملی و سامانه NTSW</span>
          </div>
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">دسته‌بندی کالا</th>
                <th className="px-4 py-2.5">تعداد / حجم کل</th>
                <th className="px-4 py-2.5">بهای تمام‌شده خرید و ترخیص</th>
                <th className="px-4 py-2.5">ارزش تخمینی در بازار</th>
                <th className="px-4 py-2.5">شاخص تعرفه گمرک صمت</th>
                <th className="px-4 py-2.5 text-left" dir="ltr">حاشیه سود خالص</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-900">خودرو و ماشین‌آلات صنعتی</td>
                <td className="px-4 py-3 font-mono">۱۲ دستگاه</td>
                <td className="px-4 py-3 font-mono text-slate-900">۴۴,۸۰۰ میلیون ت</td>
                <td className="px-4 py-3 font-mono font-bold text-blue-600">۵۶,۲۰۰ میلیون ت</td>
                <td className="px-4 py-3"><span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md">تعرفه بالا (۷۵٪ - ۹۵٪)</span></td>
                <td className="px-4 py-3 text-left font-bold text-emerald-600 font-mono" dir="ltr">+25.4%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-900">تجهیزات خورشیدی و برق تجدیدپذیر</td>
                <td className="px-4 py-3 font-mono">۱,۲۵۸ پارت / پنل</td>
                <td className="px-4 py-3 font-mono text-slate-900">۵,۸۴۰ میلیون ت</td>
                <td className="px-4 py-3 font-mono font-bold text-blue-600">۷,۸۰۰ میلیون ت</td>
                <td className="px-4 py-3"><span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">تشویقی تولید سبز (۵٪)</span></td>
                <td className="px-4 py-3 text-left font-bold text-emerald-600 font-mono" dir="ltr">+33.5%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-900">فولاد و مواد اولیه صنعتی</td>
                <td className="px-4 py-3 font-mono">۱۲۰ تن</td>
                <td className="px-4 py-3 font-mono text-slate-900">۶,۲۴۰ میلیون ت</td>
                <td className="px-4 py-3 font-mono font-bold text-blue-600">۷,۶۸۰ میلیون ت</td>
                <td className="px-4 py-3"><span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md">تعرفه استاندارد (۱۵٪)</span></td>
                <td className="px-4 py-3 text-left font-bold text-emerald-600 font-mono" dir="ltr">+23.0%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-900">تجهیزات پزشکی و آزمایشگاهی</td>
                <td className="px-4 py-3 font-mono">۴۵۸ کارتن / ست</td>
                <td className="px-4 py-3 font-mono text-slate-900">۴,۳۲۰ میلیون ت</td>
                <td className="px-4 py-3 font-mono font-bold text-blue-600">۶,۱۰۰ میلیون ت</td>
                <td className="px-4 py-3"><span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">معافیت ترجیحی (۰٪ - ۴٪)</span></td>
                <td className="px-4 py-3 text-left font-bold text-emerald-600 font-mono" dir="ltr">+41.2%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


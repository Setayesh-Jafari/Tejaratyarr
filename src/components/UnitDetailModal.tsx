import React from 'react';
import { motion } from 'motion/react';
import { InventoryUnit } from '../types';
import { X, ShieldCheck, CheckCircle2, DollarSign, Truck, FileText, Globe, Building2, Anchor, History } from 'lucide-react';
import { faTimeAgo } from '../lib/format';

interface UnitDetailModalProps {
  unit: InventoryUnit | null;
  onClose: () => void;
  onUpdateStatus: (unitId: string, status: InventoryUnit['status']) => void;
}

export const UnitDetailModal: React.FC<UnitDetailModalProps> = ({
  unit,
  onClose,
  onUpdateStatus,
}) => {
  if (!unit) return null;

  const margin = Math.round(((unit.marketPriceToman - unit.landedCostToman) / unit.marketPriceToman) * 100);

  const statuses: InventoryUnit['status'][] = [
    'موجود در انبار (ترخیص شده)',
    'در گمرک (در حال ترخیص)',
    'در حال ترانزیت بین‌المللی',
    'در انتظار تخصیص ارز و ثبت سفارش',
    'رزرو مشتری / پیش‌فروش',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">{unit.name}</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                شناسه: {unit.vinOrCode} • کد تعرفه: {unit.hsCode} • ثبت سفارش: {unit.orderRegCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">ارزش تخمینی بازار ایران</span>
              <span className="text-lg font-bold text-slate-900 font-mono block">
                {unit.marketPriceToman >= 1000 ? `${(unit.marketPriceToman / 1000).toFixed(2)} میلیارد` : `${unit.marketPriceToman} میلیون`}
              </span>
              <span className="text-[10px] text-slate-500 block">تومان / واحد</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">بهای تمام‌شده ترخیص (Landed)</span>
              <span className="text-lg font-bold text-blue-600 font-mono block">
                {unit.landedCostToman >= 1000 ? `${(unit.landedCostToman / 1000).toFixed(2)} میلیارد` : `${unit.landedCostToman} میلیون`}
              </span>
              <span className="text-[10px] text-slate-500 block">خرید: ${unit.costPriceUsd.toLocaleString()}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">حاشیه سود ناخالص بازرگان</span>
              <span className="text-lg font-bold text-emerald-600 font-mono block">%{margin}</span>
              <span className="text-[10px] text-emerald-600 font-bold block">
                {(unit.marketPriceToman - unit.landedCostToman) >= 1000 ? `+${((unit.marketPriceToman - unit.landedCostToman) / 1000).toFixed(2)} میلیارد ت.` : `+${(unit.marketPriceToman - unit.landedCostToman).toFixed(1)} میلیون ت.`}
              </span>
            </div>
          </div>

          {/* Logistics & Customs Details */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Anchor className="w-3.5 h-3.5 text-blue-600" />
              <span>مشخصات فنی، گمرکی و بازرگانی محموله</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block mb-0.5">دسته‌بندی و گروه صمت:</span>
                <span className="font-bold text-slate-800">{unit.category} (گروه {unit.samtGroup})</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block mb-0.5">کشور مبدأ ساخت:</span>
                <span className="font-bold text-slate-800">{unit.originCountry}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block mb-0.5">گمرک ورودی و ترخیص:</span>
                <span className="font-bold text-slate-800">{unit.customsPort}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block mb-0.5">نوع ارز و منشأ:</span>
                <span className="font-bold text-slate-800">{unit.fxType}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block mb-0.5">سال تولید / پارت نامبر:</span>
                <span className="font-bold text-slate-800">{unit.yearOrBatch}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block mb-0.5">تعداد محموله موجود:</span>
                <span className="font-bold text-slate-800">{unit.stockQty.toLocaleString('fa-IR')} {unit.unit}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 block">شرح تفصیلی استاندارد و کاتالوگ:</span>
              <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">{unit.specifications}</p>
            </div>
          </div>

          {/* Supplier & Compliance */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-600" />
                <span>تأمین‌کننده طرف قرارداد خارجی و ممیزی حقوقی</span>
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                امتیاز اعتبار {unit.supplierRating} از ۱۰۰
              </span>
            </div>
            <div className="text-xs text-slate-700">
              <strong className="text-slate-900">{unit.supplierName}</strong>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                <span className="text-emerald-700 font-medium">✓ بررسی سابقه بانکی و تحریمی</span>
                <span>•</span>
                <span className="text-blue-700 font-medium">وضعیت گیت: {unit.complianceGate}</span>
              </div>
            </div>
          </div>

          {/* Timeline — چرخه عمر پرونده */}
          {(unit.events?.length ?? 0) > 0 && (
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-indigo-600" />
                <span>تایم‌لاین چرخه‌ی عمر پرونده ({unit.events!.length.toLocaleString('fa-IR')} رویداد)</span>
              </h4>
              <div className="space-y-0 pr-4 border-r-2 border-slate-100">
                {[...unit.events!].reverse().map((ev) => (
                  <motion.div key={ev.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="relative py-2 pr-4">
                    <span className={`absolute -right-[1.4rem] top-3.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      ev.kind === 'status_change' ? 'bg-blue-500' : ev.kind === 'created' ? 'bg-emerald-500' : 'bg-slate-400'
                    }`} />
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-slate-700">{ev.title}</p>
                        {ev.detail && <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{ev.detail}</p>}
                        {ev.by && <p className="text-[10px] text-slate-400 mt-0.5">{ev.by}</p>}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap" title={new Date(ev.at).toLocaleString('fa-IR')}>
                        {faTimeAgo(ev.at)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Status Quick Updater */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-slate-700 block">تغییر وضعیت پرونده / کارگو در سامانه (با ثبت در تایم‌لاین):</label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((st) => (
                <button
                  key={st}
                  onClick={() => onUpdateStatus(unit.id, st)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition-all ${
                    unit.status === st
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors"
          >
            بستن پرونده
          </button>
        </div>
      </div>
    </div>
  );
};


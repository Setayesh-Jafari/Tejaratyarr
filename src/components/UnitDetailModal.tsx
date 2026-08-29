import React, { useState } from 'react';
import { motion } from 'motion/react';
import { InventoryUnit, ALL_STATUSES, PRODUCT_CATEGORIES, ProductCategory } from '../types';
import { X, Pencil, Save, Loader2, FileText, Building2, Anchor, History } from 'lucide-react';
import { faTimeAgo, fmtTomanSmart } from '../lib/format';

interface UnitDetailModalProps {
  unit: InventoryUnit | null;
  onClose: () => void;
  onUpdateStatus: (unitId: string, status: InventoryUnit['status']) => void;
  onPatchUnit: (unitId: string, patch: Partial<InventoryUnit>) => Promise<void>;
}

/** فیلدهای قابل ویرایش پرونده */
type EditableDraft = Pick<
  InventoryUnit,
  | 'name'
  | 'category'
  | 'samtGroup'
  | 'specifications'
  | 'originCountry'
  | 'customsPort'
  | 'orderRegCode'
  | 'hsCode'
  | 'stockQty'
  | 'unit'
  | 'costPriceUsd'
  | 'landedCostToman'
  | 'marketPriceToman'
  | 'supplierName'
>;

const draftFrom = (u: InventoryUnit): EditableDraft => ({
  name: u.name,
  category: u.category,
  samtGroup: u.samtGroup,
  specifications: u.specifications,
  originCountry: u.originCountry,
  customsPort: u.customsPort,
  orderRegCode: u.orderRegCode,
  hsCode: u.hsCode,
  stockQty: u.stockQty,
  unit: u.unit,
  costPriceUsd: u.costPriceUsd,
  landedCostToman: u.landedCostToman,
  marketPriceToman: u.marketPriceToman,
  supplierName: u.supplierName,
});

const SAMT_GROUPS = ['۲۱', '۲۲', '۲۳', '۲۴', '۲۵', '۲۶'];

export const UnitDetailModal: React.FC<UnitDetailModalProps> = ({
  unit,
  onClose,
  onUpdateStatus,
  onPatchUnit,
}) => {
  const [draft, setDraft] = useState<EditableDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const editing = draft !== null;

  if (!unit) return null;

  const margin = Math.round(((unit.marketPriceToman - unit.landedCostToman) / unit.marketPriceToman) * 100);

  const startEdit = () => setDraft(draftFrom(unit));
  const cancelEdit = () => setDraft(null);

  const saveEdit = async () => {
    if (!draft || !draft.name.trim()) return;
    setSaving(true);
    try {
      await onPatchUnit(unit.id, {
        ...draft,
        stockQty: Number(draft.stockQty) || 0,
        costPriceUsd: Number(draft.costPriceUsd) || 0,
        landedCostToman: Number(draft.landedCostToman) || 0,
        marketPriceToman: Number(draft.marketPriceToman) || 0,
      });
      setDraft(null);
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof EditableDraft>(key: K, value: EditableDraft[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  const inputCls =
    'w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none';

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
          {editing ? (
            /* ---------- حالت ویرایش ---------- */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">نام تجاری کالا *</label>
                  <input value={draft!.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">دسته‌بندی کالا</label>
                  <select
                    value={draft!.category}
                    onChange={(e) => set('category', e.target.value as ProductCategory)}
                    className={inputCls}
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">گروه کالایی صمت</label>
                  <select value={draft!.samtGroup} onChange={(e) => set('samtGroup', e.target.value)} className={inputCls}>
                    {SAMT_GROUPS.map((g) => (
                      <option key={g} value={g}>گروه {g}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">کشور مبدأ</label>
                  <input value={draft!.originCountry} onChange={(e) => set('originCountry', e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">گمرک ورودی</label>
                  <input value={draft!.customsPort} onChange={(e) => set('customsPort', e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">کد تعرفه (HS)</label>
                  <input value={draft!.hsCode} onChange={(e) => set('hsCode', e.target.value)} className={`${inputCls} font-mono`} dir="ltr" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">شماره ثبت سفارش</label>
                  <input value={draft!.orderRegCode} onChange={(e) => set('orderRegCode', e.target.value)} className={`${inputCls} font-mono`} dir="ltr" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">تعداد موجودی</label>
                  <input type="number" value={draft!.stockQty} onChange={(e) => set('stockQty', Number(e.target.value))} className={`${inputCls} font-mono`} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">واحد شمارش</label>
                  <input value={draft!.unit} onChange={(e) => set('unit', e.target.value)} className={inputCls} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">قیمت خرید ارزی ($)</label>
                  <input type="number" value={draft!.costPriceUsd} onChange={(e) => set('costPriceUsd', Number(e.target.value))} className={`${inputCls} font-mono`} dir="ltr" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">بهای ترخیص (میلیون ت)</label>
                  <input type="number" value={draft!.landedCostToman} onChange={(e) => set('landedCostToman', Number(e.target.value))} className={`${inputCls} font-mono`} dir="ltr" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">قیمت فروش بازار (میلیون ت)</label>
                  <input type="number" value={draft!.marketPriceToman} onChange={(e) => set('marketPriceToman', Number(e.target.value))} className={`${inputCls} font-mono`} dir="ltr" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">تأمین‌کننده خارجی</label>
                  <input value={draft!.supplierName} onChange={(e) => set('supplierName', e.target.value)} className={inputCls} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">مشخصات فنی</label>
                  <textarea rows={2} value={draft!.specifications} onChange={(e) => set('specifications', e.target.value)} className={`${inputCls} leading-relaxed`} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button onClick={cancelEdit} className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                  انصراف
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving || !draft!.name.trim()}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Key Metrics Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">ارزش تخمینی بازار ایران</span>
                  <span className="text-lg font-bold text-slate-900 font-mono block">{fmtTomanSmart(unit.marketPriceToman)}</span>
                  <span className="text-[10px] text-slate-500 block">تومان / واحد</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">بهای تمام‌شده ترخیص (Landed)</span>
                  <span className="text-lg font-bold text-blue-600 font-mono block">{fmtTomanSmart(unit.landedCostToman)}</span>
                  <span className="text-[10px] text-slate-500 block">خرید: ${unit.costPriceUsd.toLocaleString('en-US')}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">حاشیه سود ناخالص بازرگان</span>
                  <span className="text-lg font-bold text-emerald-600 font-mono block">%{margin}</span>
                  <span className="text-[10px] text-emerald-600 font-bold block">+{fmtTomanSmart(unit.marketPriceToman - unit.landedCostToman)}</span>
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
                  {ALL_STATUSES.map((st) => (
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          {editing ? (
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> در حال ویرایش پرونده
            </span>
          ) : (
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-xl transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              ویرایش پرونده
            </button>
          )}
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

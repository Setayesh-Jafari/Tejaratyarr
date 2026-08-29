import React, { useState } from 'react';
import { InventoryUnit, ItemStatus, ProductCategory } from '../types';
import { X, Plus, CheckCircle2, ShieldAlert, Anchor } from 'lucide-react';

interface AddUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (unit: InventoryUnit) => void;
}

export const AddUnitModal: React.FC<AddUnitModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [vinOrCode, setVinOrCode] = useState('');
  const [category, setCategory] = useState<ProductCategory>('خودرو و ماشین‌آلات صنعتی');
  const [samtGroup, setSamtGroup] = useState('۲۲');
  const [specifications, setSpecifications] = useState('');
  const [originCountry, setOriginCountry] = useState('آلمان / چین');
  const [customsPort, setCustomsPort] = useState('گمرک شهید رجایی بندرعباس');
  const [yearOrBatch, setYearOrBatch] = useState('۲۰۲۴ / پارت ۱');
  const [status, setStatus] = useState<ItemStatus>('در گمرک (در حال ترخیص)');
  const [stockQty, setStockQty] = useState(1);
  const [unit, setUnit] = useState('دستگاه');
  const [costPriceUsd, setCostPriceUsd] = useState(45000);
  const [landedCostToman, setLandedCostToman] = useState(4200);
  const [marketPriceToman, setMarketPriceToman] = useState(5800);
  const [hsCode, setHsCode] = useState('8703.23.90');
  const [orderRegCode, setOrderRegCode] = useState('140398214');
  const [fxType, setFxType] = useState('سامانه نیما / بازرگانی');
  const [supplierName, setSupplierName] = useState('Euro Trade Direct GmbH');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !vinOrCode) return;

    const newUnit: InventoryUnit = {
      id: `CARGO-IR-${Date.now().toString().slice(-4)}`,
      sku: `IR-${Date.now().toString().slice(-4)}`,
      vinOrCode,
      name,
      category,
      samtGroup,
      specifications: specifications || 'مشخصات استاندارد تأییدشده گمرک و صمت',
      originCountry,
      customsPort,
      yearOrBatch,
      status,
      stockQty: Number(stockQty) || 1,
      unit,
      costPriceUsd: Number(costPriceUsd) || 0,
      landedCostToman: Number(landedCostToman) || 0,
      marketPriceToman: Number(marketPriceToman) || 0,
      hsCode: hsCode || '8471.30.00',
      orderRegCode: orderRegCode || `1403${Math.floor(100000 + Math.random() * 900000)}`,
      fxType,
      supplierName: supplierName || 'کمپانی تأمین‌کننده خارجی',
      supplierRating: 94,
      complianceGate: 'تأیید استاندارد و بهداشت',
      lastUpdated: 'هم‌اکنون',
    };

    onAdd(newUnit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">ثبت پرونده و کارگوی وارداتی جدید</h3>
              <p className="text-[11px] text-slate-400">افزودن محموله به کارتابل بازرگانی و انبار اختصاصی تجارت‌یار</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-right">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">نام تجاری کالا / مدل و مشخصه *</label>
              <input
                type="text"
                required
                placeholder="مثال: پورشه ماکان توربو ۲۰۲۴"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">شناسه فنی / VIN / سریال بارنامه *</label>
              <input
                type="text"
                required
                placeholder="مثال: WP1AB2A28RLB0192"
                value={vinOrCode}
                onChange={(e) => setVinOrCode(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">دسته‌بندی بازرگانی</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
              >
                <option value="خودرو و ماشین‌آلات صنعتی">خودرو و ماشین‌آلات صنعتی</option>
                <option value="تجهیزات خورشیدی و برق">تجهیزات خورشیدی و برق</option>
                <option value="فولاد و مواد اولیه صنعتی">فولاد و مواد اولیه صنعتی</option>
                <option value="تجهیزات پزشکی و آزمایشگاهی">تجهیزات پزشکی و آزمایشگاهی</option>
                <option value="کالاهای اساسی و کشاورزی">کالاهای اساسی و کشاورزی</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">گروه کالایی سامانه صمت</label>
              <select
                value={samtGroup}
                onChange={(e) => setSamtGroup(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              >
                <option value="21">گروه ۲۱ (ارز ترجیحی/اساسی)</option>
                <option value="22">گروه ۲۲ (ارز نیما تجاری)</option>
                <option value="23">گروه ۲۳ (ارز صادرات خود/توافقی)</option>
                <option value="24">گروه ۲۴ (ارز اشخاص)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">کشور مبدأ ساخت</label>
              <input
                type="text"
                value={originCountry}
                onChange={(e) => setOriginCountry(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">گمرک ورودی و ترخیص</label>
              <input
                type="text"
                value={customsPort}
                onChange={(e) => setCustomsPort(e.target.value)}
                placeholder="گمرک شهید رجایی / فرودگاه امام / بازرگان"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">شماره ثبت سفارش صمت</label>
              <input
                type="text"
                value={orderRegCode}
                onChange={(e) => setOrderRegCode(e.target.value)}
                placeholder="مثال: 140398214"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">شرح مشخصات فنی و استانداردهای کالا</label>
            <textarea
              rows={2}
              placeholder="مشخصات استاندارد، گواهی مبدأ، ویژگی‌های فنی..."
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">تعداد کالا</label>
              <input
                type="number"
                value={stockQty}
                onChange={(e) => setStockQty(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">واحد شمارش</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">قیمت خرید ارزی ($)</label>
              <input
                type="number"
                value={costPriceUsd}
                onChange={(e) => setCostPriceUsd(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">بهای ترخیص (میلیون ت)</label>
              <input
                type="number"
                value={landedCostToman}
                onChange={(e) => setLandedCostToman(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">قیمت فروش بازار (میلیون ت)</label>
              <input
                type="number"
                value={marketPriceToman}
                onChange={(e) => setMarketPriceToman(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-blue-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">کد تعرفه گمرکی (HS Code)</label>
              <input
                type="text"
                value={hsCode}
                onChange={(e) => setHsCode(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">نام تأمین‌کننده خارجی</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm shadow-blue-200 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ثبت نهایی و ورود به انبار</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


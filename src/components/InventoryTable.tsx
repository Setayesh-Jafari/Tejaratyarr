import React, { useState } from 'react';
import { InventoryUnit } from '../types';
import { matchesQuery } from '../lib/search';
import { downloadCsv, toCsv } from '../lib/csv';
import { fmtTomanSmart } from '../lib/format';
import { Download, Eye, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface InventoryTableProps {
  inventory: InventoryUnit[];
  searchQuery: string;
  onSelectUnit: (unit: InventoryUnit) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  inventory,
  searchQuery,
  onSelectUnit,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('همه');

  const categories = [
    'همه',
    'خودرو و ماشین‌آلات صنعتی',
    'تجهیزات خورشیدی و برق',
    'فولاد و مواد اولیه صنعتی',
    'تجهیزات پزشکی و آزمایشگاهی',
    'کالاهای اساسی و کشاورزی',
    'منسوجات و پوشاک',
  ];

  const filteredItems = inventory.filter((item) => {
    // جستجوی واژه‌محور (مرز کلمه) روی کل شناسه‌های پرونده
    const corpus = [
      item.name, item.vinOrCode, item.sku, item.supplierName,
      item.customsPort, item.hsCode, item.orderRegCode, item.category,
    ].join(' ');
    const matchesSearch = !searchQuery.trim() || matchesQuery(searchQuery, corpus);

    const matchesCategory = selectedCategory === 'همه' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: InventoryUnit['status']) => {
    switch (status) {
      case 'موجود در انبار (ترخیص شده)':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
      case 'در گمرک (در حال ترخیص)':
        return 'bg-blue-50 text-blue-800 border border-blue-200';
      case 'در حال ترانزیت بین‌المللی':
        return 'bg-indigo-50 text-indigo-800 border border-indigo-200';
      case 'در انتظار تخصیص ارز و ثبت سفارش':
        return 'bg-amber-50 text-amber-800 border border-amber-200';
      case 'رزرو مشتری / پیش‌فروش':
        return 'bg-purple-50 text-purple-800 border border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const exportCSV = () => {
    const headers = [
      'شناسه پرونده',
      'کد کالا / VIN',
      'نام کالا',
      'دسته‌بندی صمت',
      'کشور مبدأ',
      'گمرک ورودی',
      'کد تعرفه HS',
      'شماره ثبت سفارش',
      'وضعیت ترخیص',
      'تعداد موجودی',
      'واحد',
      'قیمت خرید ارزی ($)',
      'بهای تمام‌شده نهایی ترخیص (میلیون تومان)',
      'ارزش فروش بازار (میلیون تومان)',
      'تأمین‌کننده خارجی'
    ];
    const rows = filteredItems.map((item) => [
      item.id,
      item.vinOrCode,
      item.name,
      item.category,
      item.originCountry,
      item.customsPort,
      item.hsCode,
      item.orderRegCode,
      item.status,
      item.stockQty,
      item.unit,
      item.costPriceUsd,
      item.landedCostToman,
      item.marketPriceToman,
      item.supplierName,
    ]);

    downloadCsv(`tejaratyar_cargo_inventory_${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows));
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-xs flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header bar */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 flex-shrink-0 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-slate-800 text-xs md:text-sm">کارتابل پایش کارگوها و محموله‌های وارداتی</h3>
          <span className="text-xs text-slate-500 font-medium">({filteredItems.length} پرونده منطبق)</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl border border-slate-200 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>خروجی اکسل / CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container with Sticky Header */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-right border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr className="text-[11px] font-bold text-slate-600 border-b border-slate-200">
              <th className="px-5 py-3">کد کالا / VIN و تعرفه HS</th>
              <th className="px-5 py-3">شرح کالا و مشخصات فنی</th>
              <th className="px-4 py-3">مبدأ و گمرک ورودی</th>
              <th className="px-4 py-3">وضعیت ترخیص و موجودی</th>
              <th className="px-4 py-3">بهای تمام‌شده و قیمت بازار</th>
              <th className="px-4 py-3">مارجین بازرگان</th>
              <th className="px-4 py-3">گیت استاندارد</th>
              <th className="px-5 py-3 text-left">عملیات</th>
            </tr>
          </thead>
          <tbody className="text-xs text-slate-700 divide-y divide-slate-100 font-normal">
            {filteredItems.map((item) => {
              const margin = Math.round(((item.marketPriceToman - item.landedCostToman) / item.marketPriceToman) * 100);
              return (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectUnit(item)}
                >
                  <td className="px-5 py-3.5 font-mono text-[11px] font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-600 font-bold">{item.vinOrCode}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                      <span>HS: {item.hsCode}</span>
                      <span className="text-slate-400">|</span>
                      <span>ثبت: {item.orderRegCode}</span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-xs">{item.specifications}</div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="font-medium text-slate-800">{item.originCountry}</div>
                    <div className="text-[10px] text-slate-500">{item.customsPort}</div>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-md ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                    <div className="text-[11px] text-slate-600 mt-1 font-semibold">
                      {item.stockQty.toLocaleString('fa-IR')} {item.unit}
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900 font-mono">
                      {fmtTomanSmart(item.marketPriceToman)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      خرید: ${item.costPriceUsd.toLocaleString('en-US')} | تمام‌شده: {fmtTomanSmart(item.landedCostToman)}
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-14 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${margin > 20 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(100, Math.max(10, margin * 2))}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-slate-800 text-[11px] font-mono">%{margin}</span>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      سود: {fmtTomanSmart(item.marketPriceToman - item.landedCostToman)}
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    {item.complianceGate === 'تأیید استاندارد و بهداشت' ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        تأییدیه COI
                      </span>
                    ) : item.complianceGate === 'در حال بازرسی استاندارد (COI)' ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        در حال ممیزی
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        اصلاح اسناد
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-left">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectUnit(item);
                      }}
                      className="text-blue-600 font-bold text-xs hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      مشاهده پرونده
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};


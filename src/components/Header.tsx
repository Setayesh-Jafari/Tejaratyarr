import React from 'react';
import { Search, Plus, Sparkles, Menu } from 'lucide-react';
import { ActiveView } from '../types';

interface HeaderProps {
  activeView: ActiveView;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAddUnit: () => void;
  onOpenAssessment: () => void;
  onToggleMobileMenu?: () => void;
  totalUnits: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  searchQuery,
  setSearchQuery,
  onOpenAddUnit,
  onOpenAssessment,
  onToggleMobileMenu,
  totalUnits,
}) => {
  const getTitle = () => {
    switch (activeView) {
      case 'inventory':
        return 'میز کار مدیریت کارگو و موجودی انبار';
      case 'intelligence':
        return 'پایگاه هوش تجاری و جستجوی ۶ گانه (Apify, Baidu, Trade Map...)';
      case 'sourcing':
        return 'اعتبارسنجی و ممیزی حقوقی تأمین‌کنندگان خارجی (Due Diligence)';
      case 'assessment':
        return 'موتور ارزیابی ۷ مرحله‌ای واردات کالا (سامانه جامع تجارت و گمرک)';
      case 'rfq':
        return 'مرکز صدور استعلام قیمت بین‌المللی و مکاتبات خرید (RFQ)';
      case 'analytics':
        return 'دفتر کل مالی و محاسبه بهای تمام‌شده ترخیص کالا (Landed Cost)';
      default:
        return 'سامانه بازرگانی تجارت‌یار';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between flex-shrink-0 z-10">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="باز کردن منوی ناوبری"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <h2 className="text-xs md:text-base font-bold text-slate-800 tracking-tight line-clamp-1">{getTitle()}</h2>
          <div className="flex lg:hidden items-center gap-1 text-[10px] text-slate-500 font-semibold mt-0.5">
            <span>تجارت‌یار — نسخه بازرگان</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>سامانه فعال ({totalUnits} ردیف کالا)</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Search Box on desktop */}
        <div className="relative hidden md:block">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی کد کالا، تعرفه HS، VIN یا تأمین‌کننده..."
            className="bg-slate-100/90 border border-slate-200 rounded-xl py-1.5 pr-8 pl-6 text-xs text-slate-800 placeholder-slate-400 w-56 lg:w-72 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-sans"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-2 text-[10px] text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <button
          id="btn-quick-assess"
          onClick={onOpenAssessment}
          className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
          title="شروع ارزیابی پرونده جدید واردات"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span className="hidden sm:inline">ارزیابی واردات جدید</span>
          <span className="sm:hidden">ارزیابی</span>
        </button>

        <button
          id="btn-add-unit"
          onClick={onOpenAddUnit}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 md:px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs shadow-blue-200"
        >
          <Plus className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="hidden sm:inline">ثبت کارگوی جدید</span>
          <span className="sm:hidden">کارگو +</span>
        </button>
      </div>
    </header>
  );
};



import React from 'react';
import { Search, Plus, Menu, Cpu, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { ActiveView } from '../types';
import { useStore } from '../store/AppStore';

interface HeaderProps {
  activeView: ActiveView;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAddUnit: () => void;
  onOpenAssessment: () => void;
  onToggleMobileMenu?: () => void;
  totalUnits: number;
}

const TITLES: Record<ActiveView, { title: string; sub: string }> = {
  inventory: { title: 'میز کار کارگو و موجودی', sub: 'کارتابل کامل پرونده‌های وارداتی و انبار' },
  pipeline: { title: 'گردش کار پرونده‌ها', sub: 'ثبت سفارش ← ترانزیت ← گمرک ← انبار' },
  hscode_resolver: { title: 'تفکیک تعرفه (HS Code)', sub: 'دایرکتوری رسمی + پیشنهاد هوشمند' },
  intelligence: { title: 'کاوشگر هوش تجاری', sub: '۱۰ موتور استنادی تجارت خارجی' },
  assessment: { title: 'ارزیابی جامع واردات', sub: 'ویزارد ۷ مرحله‌ای صمت و گمرک' },
  sourcing: { title: 'اعتبارسنجی تأمین‌کنندگان', sub: 'Due Diligence و ریسک تحریم' },
  rfq: { title: 'استعلام قیمت (RFQ)', sub: 'پروفرما و اینکوترمز ۲۰۲۰' },
  analytics: { title: 'داشبورد تحلیلی و مالی', sub: 'نمودارهای سبد و بهای تمام‌شده' },
  provenance: { title: 'شناسنامه منابع داده', sub: 'شفافیت مراجع و متدولوژی' },
};

export const Header: React.FC<HeaderProps> = ({
  activeView,
  searchQuery,
  setSearchQuery,
  onOpenAddUnit,
  onOpenAssessment,
  onToggleMobileMenu,
  totalUnits,
}) => {
  const { health, settings } = useStore();
  const meta = TITLES[activeView] ?? { title: 'سامانه بازرگانی تجارت‌یار', sub: '' };

  return (
    <header className="tj-chrome border-b tj-chrome-line h-16 px-3 md:px-5 flex items-center justify-between flex-shrink-0 z-20 gap-3">
      {/* عنوان صفحه */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden w-9 h-9 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition-colors"
            title="منوی ناوبری"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="text-sm md:text-[15px] font-black text-white tracking-tight truncate">{meta.title}</h2>
          <p className="text-[10px] text-slate-400 font-medium truncate hidden sm:block">{meta.sub}</p>
        </div>
        <span className="hidden xl:inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {totalUnits.toLocaleString('fa-IR')} ردیف فعال
        </span>
      </div>

      <div className="flex items-center gap-2 md:gap-2.5">
        {/* جستجو */}
        <div className="relative hidden md:block">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در کارگو، تعرفه، تأمین‌کننده…"
            className="bg-slate-800/60 border border-slate-700/80 rounded-xl py-2 pr-9 pl-8 text-xs text-slate-100 placeholder-slate-500 w-48 lg:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:bg-slate-800 transition-all font-sans"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute left-2.5 top-2 text-slate-500 hover:text-slate-300">
              ✕
            </button>
          )}
        </div>

        {/* نرخ ارز — نشانگر جهت تغییر با نرخ آزاد نسبت به نیما */}
        <div
          className="hidden xl:flex items-center gap-1.5 bg-slate-800/50 border border-slate-700/70 rounded-xl px-2.5 py-1.5 text-[10px] font-bold"
          title="نرخ‌های مرجع داخلی — قابل ویرایش در داشبورد تحلیلی"
        >
          {settings.fx.usdAzadToman > settings.fx.usdNimaToman ? (
            <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <div className="leading-tight text-left" dir="ltr">
            <span className="text-slate-400 block">USD</span>
            <span className="font-mono text-slate-200">
              {(settings.fx.usdNimaToman / 1000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} / {(settings.fx.usdAzadToman / 1000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}k
            </span>
          </div>
        </div>

        {/* وضعیت هوش مصنوعی */}
        <div
          className={`hidden lg:flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-bold border ${
            health?.aiEnabled ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
          }`}
          title={health?.aiEnabled ? `مدل ${health.model} روی سرور فعال است` : 'برای فعال‌سازی، GEMINI_API_KEY را در env سرور تنظیم کنید'}
        >
          <Cpu className="w-3.5 h-3.5" />
          {health?.aiEnabled ? health.model : 'AI محلی'}
        </div>

        {/* اکشن‌ها */}
        <button onClick={onOpenAssessment} className="tj-btn bg-slate-800/70 hover:bg-slate-800 text-amber-200 border border-amber-500/25" title="ارزیابی پرونده جدید">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">ارزیابی جدید</span>
        </button>
        <button onClick={onOpenAddUnit} className="tj-btn tj-btn-primary" title="ثبت کارگوی جدید">
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">کارگوی جدید</span>
        </button>
      </div>
    </header>
  );
};

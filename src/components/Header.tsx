import React from 'react';
import { Search, Plus, Menu, Cpu, TrendingUp, TrendingDown, Sparkles, Clapperboard } from 'lucide-react';
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

const SECTIONS: Record<ActiveView, string> = {
  overview: 'نمای کلی',
  inventory: 'کارتابل کارگو',
  pipeline: 'گردش کار پرونده‌ها',
  hscode_resolver: 'تفکیک تعرفه HS',
  intelligence: 'کاوشگر هوش تجاری',
  assessment: 'ارزیابی واردات',
  sourcing: 'اعتبارسنجی تأمین‌کننده',
  rfq: 'استعلام قیمت RFQ',
  analytics: 'داشبورد تحلیلی و مالی',
  provenance: 'شناسنامه منابع داده',
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
  const section = SECTIONS[activeView] ?? '';

  return (
    <header className="bg-white/85 backdrop-blur border-b border-slate-200 h-14 px-3 md:px-5 flex items-center justify-between flex-shrink-0 z-20 gap-3">
      {/* مسیر ناوبری */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
            title="منوی ناوبری"
          >
            <Menu className="w-[18px] h-[18px]" />
          </button>
        )}
        <nav className="flex items-center gap-1.5 text-[12px] min-w-0 truncate">
          <span className="text-slate-400 hidden sm:inline">تجارت‌یار</span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <span className="font-semibold text-slate-800 truncate">{section}</span>
        </nav>
        <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-100 rounded-full px-2.5 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {totalUnits.toLocaleString('fa-IR')} پرونده
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* جستجو — فقط روی نمای کارتابل (محدوده‌ی واقعی آن) */}
        {activeView === 'inventory' && (
          <div className="relative hidden md:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در کارتابل…"
              className="tj-input w-52 lg:w-64 pr-9 pl-8"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-700">
                ✕
              </button>
            )}
          </div>
        )}

        {/* نرخ ارز */}
        <div
          className="hidden xl:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border border-slate-200 bg-white"
          title="نرخ‌های مرجع داخلی — قابل ویرایش در داشبورد تحلیلی"
        >
          {settings.fx.usdAzadToman > settings.fx.usdNimaToman ? (
            <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
          )}
          <div className="leading-tight text-left" dir="ltr">
            <span className="text-slate-400 block text-[9px]">USD</span>
            <span className="font-mono text-slate-700 font-bold">
              {(settings.fx.usdNimaToman / 1000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} / {(settings.fx.usdAzadToman / 1000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}k
            </span>
          </div>
        </div>

        {/* حالت ارائه — وقتی سرور با SEED_DEMO=1 بالا آمده باشد صریح اعلام می‌شود */}
        {health?.demoMode && (
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200"
            title="حالت ارائه: داده‌های کارتابل نمونه است (SEED_DEMO=1) و با داده‌ی واقعی اشتباه نشود."
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>داده نمونه — حالت ارائه</span>
          </div>
        )}

        {/* وضعیت هوش مصنوعی */}
        <div
          className={`hidden lg:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border ${
            health?.aiEnabled ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
          title={health?.aiEnabled ? `مدل ${health.model} روی سرور فعال است` : 'برای فعال‌سازی، GEMINI_API_KEY را در env سرور تنظیم کنید'}
        >
          <Cpu className="w-3.5 h-3.5" />
          {health?.aiEnabled ? health.model : 'AI محلی'}
        </div>

        {/* اکشن‌ها */}
        <button onClick={onOpenAssessment} className="tj-btn tj-btn-ghost" title="ارزیابی پرونده جدید">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
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

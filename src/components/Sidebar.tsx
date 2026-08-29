import React from 'react';
import { ActiveView } from '../types';
import {
  Boxes,
  FileCheck2,
  Globe2,
  Send,
  ShieldCheck,
  Sparkles,
  X,
  Scale,
  Database,
  Workflow,
  BarChart3
} from 'lucide-react';
import { useStore } from '../store/AppStore';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onOpenAssessment: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  onOpenAssessment,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { inventory, health } = useStore();

  const activeCount = inventory.filter((u) => u.status !== 'موجود در انبار (ترخیص شده)' && u.status !== 'رزرو مشتری / پیش‌فروش').length;
  const customsCount = inventory.filter((u) => u.status === 'در گمرک (در حال ترخیص)').length;

  const navItems = [
    {
      id: 'inventory' as ActiveView,
      label: 'مدیریت کارگو و موجودی انبار',
      icon: Boxes,
      badge: `${activeCount.toLocaleString('fa-IR')} محموله فعال`,
    },
    {
      id: 'pipeline' as ActiveView,
      label: 'گردش کار و چرخه عمر پرونده',
      icon: Workflow,
      badge: customsCount > 0 ? `${customsCount.toLocaleString('fa-IR')} در گمرک` : 'بدون انسداد',
    },
    {
      id: 'hscode_resolver' as ActiveView,
      label: 'تفکیک و انتخاب تعرفه (HS Code)',
      icon: Scale,
      badge: 'هوشمند + AI',
    },
    {
      id: 'intelligence' as ActiveView,
      label: 'کاوشگر اسناد و هوش ۱۰گانه',
      icon: Sparkles,
      badge: 'ImportYeti, TSC, Baidu',
    },
    {
      id: 'assessment' as ActiveView,
      label: 'ارزیابی جامع واردات کالا',
      icon: FileCheck2,
      badge: 'صمت و گمرک',
      onClick: () => {
        setActiveView('assessment');
        onOpenAssessment();
      },
    },
    {
      id: 'sourcing' as ActiveView,
      label: 'اعتبارسنجی تأمین‌کنندگان خارجی',
      icon: Globe2,
      badge: 'چین، اروپا، ترکیه',
    },
    {
      id: 'rfq' as ActiveView,
      label: 'صدور پیش‌نویس استعلام قیمت (RFQ)',
      icon: Send,
      badge: 'پروفرما و اینکوترمز',
    },
    {
      id: 'analytics' as ActiveView,
      label: 'داشبورد تحلیلی و بهای تمام‌شده',
      icon: BarChart3,
      badge: 'نیما / آزاد',
    },
    {
      id: 'provenance' as ActiveView,
      label: 'شناسنامه منابع داده و استنادها',
      icon: Database,
      badge: 'شفافیت مراجع رسمی',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Panel - Always positioned on the right */}
      <aside 
        className={`fixed lg:static top-0 bottom-0 right-0 z-50 w-72 lg:w-64 bg-[#0F172A] flex flex-col flex-shrink-0 text-slate-300 border-l border-slate-800 select-none transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 lg:p-5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white text-base shadow-md shadow-blue-500/20">
              ت
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-tight flex items-center gap-2">
                <span>تجارت‌یار</span>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30">نسخه ۲ حرفه‌ای</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">سامانه هوشمند واردات و ترخیص</div>
            </div>
          </div>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            عملیات و فرآیندهای بازرگانی
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else {
                    setActiveView(item.id);
                  }
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span className="text-right">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    isActive ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            گیت‌های نظارتی و ثبت سفارش
          </div>
          <div className="px-3 py-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                تطابق ضوابط صمت و بانک مرکزی
              </span>
              <span className="text-emerald-400 font-bold text-[10px]">۱۰۰٪ فعال</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed text-right">
              استعلام لحظه‌ای ممنوعیت‌های ثبت سفارش، سقف واردات کارت بازرگانی و ترانزیت بنادر جنوبی.
            </p>
          </div>
        </nav>

        {/* User / Org Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#0B1120]">
          <div className="bg-slate-800/90 rounded-xl p-2.5 flex items-center gap-2.5 border border-slate-700/50">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
              ب‌ا
            </div>
            <div className="overflow-hidden flex-1 min-w-0 text-right">
              <p className="text-xs text-white font-semibold truncate leading-tight">شرکت بازرگانی بین‌المللی آریا</p>
              <p className="text-[10px] text-slate-400 truncate">کارت بازرگانی حقوقی معتبر</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};



import React, { useState } from 'react';
import { ActiveView } from '../types';
import {
  Boxes, FileCheck2, Globe2, Send, Sparkles, X, Scale, Database,
  Workflow, BarChart3, ChevronLast, ChevronFirst, Cpu, ShieldCheck,
} from 'lucide-react';
import { useStore } from '../store/AppStore';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onOpenAssessment: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: ActiveView;
  label: string;
  hint: string;
  icon: React.ElementType;
  badge?: () => string | null;
  onClick?: (goto: (v: ActiveView) => void) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  onOpenAssessment,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { inventory, health, settings } = useStore();
  const [collapsed, setCollapsed] = useState(false);

  const activeCount = inventory.filter((u) => u.status !== 'موجود در انبار (ترخیص شده)' && u.status !== 'رزرو مشتری / پیش‌فروش').length;
  const customsCount = inventory.filter((u) => u.status === 'در گمرک (در حال ترخیص)').length;

  const groups: Array<{ title: string; items: NavItem[] }> = [
    {
      title: 'عملیات بازرگانی',
      items: [
        { id: 'inventory', label: 'مدیریت کارگو و موجودی', hint: 'کارتابل انبار و پرونده‌ها', icon: Boxes, badge: () => `${activeCount.toLocaleString('fa-IR')} فعال` },
        { id: 'pipeline', label: 'گردش کار پرونده‌ها', hint: 'کانبان چرخه عمر واردات', icon: Workflow, badge: () => (customsCount > 0 ? `${customsCount.toLocaleString('fa-IR')} در گمرک` : null) },
        { id: 'assessment', label: 'ارزیابی واردات کالا', hint: 'ویزارد ۷ مرحله‌ای', icon: FileCheck2, onClick: (go) => { go('assessment'); onOpenAssessment(); } },
        { id: 'rfq', label: 'استعلام قیمت (RFQ)', hint: 'مکاتبات خرید بین‌المللی', icon: Send },
      ],
    },
    {
      title: 'هوش و تحلیل',
      items: [
        { id: 'hscode_resolver', label: 'تفکیک تعرفه HS', hint: 'دایرکتوری + پیشنهاد هوشمند', icon: Scale },
        { id: 'sourcing', label: 'اعتبارسنجی تأمین‌کننده', hint: 'Due Diligence خارجی', icon: Globe2 },
        { id: 'intelligence', label: 'کاوشگر هوش تجاری', hint: '۱۰ موتور استنادی', icon: Sparkles },
        { id: 'analytics', label: 'داشبورد تحلیلی', hint: 'نمودار و بهای تمام‌شده', icon: BarChart3 },
        { id: 'provenance', label: 'شناسنامه منابع داده', hint: 'شفافیت استنادها', icon: Database },
      ],
    },
  ];

  return (
    <>
      {/* پرده موبایل */}
      {isMobileOpen && (
        <div onClick={onCloseMobile} className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden" />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 right-0 z-50 tj-chrome flex flex-col flex-shrink-0 text-slate-300 select-none border-l tj-chrome-line transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[76px]' : 'w-72 lg:w-64'
        } ${isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
      >
        {/* برند */}
        <div className={`p-4 flex items-center gap-3 border-b tj-chrome-line ${collapsed ? 'lg:justify-center lg:flex-col lg:gap-2' : 'justify-between'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="tj-grad tj-grad-ring w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-lg shrink-0">ت</div>
            {!collapsed && (
              <div className="hidden lg:block min-w-0">
                <div className="text-white font-black text-sm tracking-tight flex items-center gap-1.5">
                  تجارت‌یار
                  <span className="text-[9px] font-mono text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.5 rounded">v۲</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate">سامانه هوشمند واردات و ترخیص</div>
              </div>
            )}
          </div>
          {onCloseMobile && (
            <button onClick={onCloseMobile} className="lg:hidden w-8 h-8 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ناوبری گروه‌بندی‌شده */}
        <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <div className="px-2.5 pb-1 text-[9px] font-black text-slate-500 tracking-[0.14em]">{group.title}</div>
              )}
              {collapsed && <div className="tj-divider mx-2" />}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                const badge = item.badge?.();
                return (
                  <button
                    key={item.id}
                    title={collapsed ? item.label : item.hint}
                    onClick={() => (item.onClick ? item.onClick(setActiveView) : setActiveView(item.id))}
                    className={`tj-nav-item ${isActive ? 'tj-nav-item-active' : ''} ${collapsed ? 'lg:justify-center' : ''}`}
                  >
                    <Icon className={`w-[17px] h-[17px] shrink-0 ${isActive ? 'text-indigo-300' : 'text-slate-400'}`} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 leading-tight">{item.label}</span>
                        {badge && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-indigo-500/30 text-indigo-100' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* وضعیت سامانه */}
          {!collapsed && (
            <div className="px-2.5 pt-1">
              <div className="tj-divider mb-2.5" />
              <div className="rounded-2xl border tj-chrome-line bg-slate-950/40 p-3 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5" /> گیت نظارتی صمت
                  </span>
                  <span className="text-emerald-400">فعال</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="flex items-center gap-1.5 text-indigo-300">
                    <Cpu className="w-3.5 h-3.5" /> موتور هوش
                  </span>
                  <span className={health?.aiEnabled ? 'text-indigo-300' : 'text-amber-300'}>
                    {health?.aiEnabled ? health.model : 'محلی'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="flex items-center gap-1.5 text-teal-300">دلار نیما</span>
                  <span className="text-teal-200 font-mono">{settings.fx.usdNimaToman.toLocaleString('fa-IR')}</span>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* دکمه جمع‌شدن + کارت سازمان */}
        <div className="p-2.5 border-t tj-chrome-line space-y-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:flex w-full items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl py-2 transition-colors"
            title={collapsed ? 'باز کردن منو' : 'جمع کردن منو'}
          >
            {collapsed ? <ChevronFirst className="w-3.5 h-3.5" /> : <><ChevronLast className="w-3.5 h-3.5" /> جمع کردن منو</>}
          </button>
          {!collapsed && (
            <div className="rounded-2xl bg-slate-950/50 border tj-chrome-line p-2.5 flex items-center gap-2.5">
              <div className="tj-grad w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-[10px] shrink-0">آ</div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-white font-bold truncate leading-tight">{settings.orgName}</p>
                <p className="text-[9px] text-slate-400 truncate">کارت بازرگانی حقوقی معتبر</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

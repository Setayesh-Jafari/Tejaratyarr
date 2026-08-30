import React, { useState } from 'react';
import { ActiveView, isSettledStatus } from '../types';
import {
  Boxes, FileCheck2, Globe2, Send, Sparkles, X, Scale, Database,
  Workflow, BarChart3, ChevronLast, ChevronFirst, Cpu, LayoutDashboard, CircleCheck,
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

  const activeCount = inventory.filter((u) => !isSettledStatus(u.status)).length;
  const customsCount = inventory.filter((u) => u.status === 'در گمرک (در حال ترخیص)').length;

  const groups: Array<{ title: string; items: NavItem[] }> = [
    {
      title: 'عملیات بازرگانی',
      items: [
        { id: 'inventory', label: 'کارتابل کارگو', icon: Boxes, badge: () => `${activeCount.toLocaleString('fa-IR')} فعال` },
        { id: 'pipeline', label: 'گردش کار پرونده‌ها', icon: Workflow, badge: () => (customsCount > 0 ? `${customsCount.toLocaleString('fa-IR')} در گمرک` : null) },
        { id: 'assessment', label: 'ارزیابی واردات', icon: FileCheck2, onClick: (go) => { go('assessment'); onOpenAssessment(); } },
        { id: 'rfq', label: 'استعلام قیمت (RFQ)', icon: Send },
      ],
    },
    {
      title: 'تحلیل و اعتبارسنجی',
      items: [
        { id: 'analytics', label: 'داشبورد تحلیلی و مالی', icon: BarChart3 },
        { id: 'sourcing', label: 'اعتبارسنجی تأمین‌کننده', icon: Globe2 },
        { id: 'hscode_resolver', label: 'تفکیک تعرفه HS', icon: Scale },
        { id: 'intelligence', label: 'کاوشگر هوش تجاری', icon: Sparkles },
      ],
    },
    {
      title: 'سیستم',
      items: [
        { id: 'provenance', label: 'شناسنامه منابع داده', icon: Database },
      ],
    },
  ];

  return (
    <>
      {/* پرده موبایل */}
      {isMobileOpen && (
        <div onClick={onCloseMobile} className="fixed inset-0 bg-slate-950/40 z-40 lg:hidden" />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 right-0 z-50 bg-white flex flex-col flex-shrink-0 border-l border-slate-200 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[70px]' : 'w-72 lg:w-64'
        } ${isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
      >
        {/* برند */}
        <div className={`p-4 flex items-center gap-3 ${collapsed ? 'lg:justify-center lg:flex-col lg:gap-2' : 'justify-between'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shrink-0">ت</div>
            {!collapsed && (
              <div className="hidden lg:block min-w-0 leading-tight">
                <div className="text-slate-900 font-bold text-[15px] tracking-tight">تجارت‌یار</div>
                <div className="text-[10px] text-slate-400 font-medium truncate">سامانه مدیریت واردات و کارگو</div>
              </div>
            )}
          </div>
          {onCloseMobile && (
            <button onClick={onCloseMobile} className="lg:hidden w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ناوبری گروه‌بندی‌شده */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {/* نمای کلی — بالاترین اولویت */}
          <div className="space-y-1">
            <button
              title={collapsed ? 'نمای کلی' : undefined}
              onClick={() => setActiveView('overview')}
              className={`tj-nav-item ${activeView === 'overview' ? 'tj-nav-item-active' : ''} ${collapsed ? 'lg:justify-center' : ''}`}
            >
              <LayoutDashboard className={`w-[17px] h-[17px] shrink-0 ${activeView === 'overview' ? 'text-indigo-600' : 'text-slate-400'}`} />
              {!collapsed && <span className="flex-1 leading-tight">نمای کلی</span>}
            </button>
          </div>

          {groups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <div className="px-2.5 pb-1 text-[10px] font-bold text-slate-400 tracking-wide">{group.title}</div>
              )}
              {collapsed && <div className="tj-divider mx-1.5 mb-1" />}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                const badge = item.badge?.();
                return (
                  <button
                    key={item.id}
                    title={collapsed ? item.label : undefined}
                    onClick={() => (item.onClick ? item.onClick(setActiveView) : setActiveView(item.id))}
                    className={`tj-nav-item ${isActive ? 'tj-nav-item-active' : ''} ${collapsed ? 'lg:justify-center' : ''}`}
                  >
                    <Icon className={`w-[17px] h-[17px] shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 leading-tight">{item.label}</span>
                        {badge && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
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
            <div className="px-1.5 pt-1">
              <div className="tj-divider mb-2.5" />
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <CircleCheck className="w-3.5 h-3.5 text-emerald-500" /> اتصال سرور
                  </span>
                  <span className="text-emerald-600 font-bold">برقرار</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Cpu className="w-3.5 h-3.5" /> موتور هوش
                  </span>
                  <span className={health?.aiEnabled ? 'text-indigo-600 font-bold' : 'text-amber-600 font-bold'}>
                    {health?.aiEnabled ? health.model : 'محلی'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-slate-600">دلار نیما</span>
                  <span className="text-slate-800 font-mono font-bold" dir="ltr">
                    {settings.fx.usdNimaToman.toLocaleString('fa-IR')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* دکمه جمع‌شدن + کاربر */}
        <div className="p-3 border-t border-slate-200 space-y-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:flex w-full items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg py-2 transition-colors"
            title={collapsed ? 'باز کردن منو' : 'جمع کردن منو'}
          >
            {collapsed ? <ChevronFirst className="w-3.5 h-3.5" /> : <><ChevronLast className="w-3.5 h-3.5" /> جمع کردن منو</>}
          </button>
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-1">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-black text-[11px] shrink-0">س</div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-[12px] text-slate-800 font-semibold truncate">ستایش جعفری</p>
                <p className="text-[10px] text-slate-400 font-medium truncate">بازرگانی و واردات</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

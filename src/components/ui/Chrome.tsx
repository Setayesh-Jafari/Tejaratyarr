/**
 * کروم تجارت‌یار ۲ — سربرگ فشرده صفحه (PageHeader) و کارت شاخص (StatCard)
 * سیستم طراحی «روشن و مینیمال» — بدون بنر گرادیانی
 */
import React from 'react';

export interface HeroStat { label: string; value: string; tone?: string }

interface PageHeaderProps {
  title: string;
  description?: string;
  stats?: HeroStat[];
  actions?: React.ReactNode;
}

/** سربرگ فشرده‌ی هر صفحه — عنوان + توضیح + اکشن‌ها (بدون کارت/گرادیان) */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, stats, actions }) => (
  <div className="tj-rise flex flex-col md:flex-row md:items-end md:justify-between gap-3 flex-shrink-0">
    <div className="min-w-0">
      <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-snug">{title}</h1>
      {description && <p className="text-[12px] md:text-[13px] text-slate-500 leading-relaxed mt-1 max-w-3xl">{description}</p>}
      {stats && stats.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {stats.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-500">
              <span className="text-slate-400 font-medium">{s.label}:</span>
              <span className={`font-bold font-mono ${s.tone ?? 'text-slate-800'}`}>{s.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
  </div>
);

/* ------------------------------------------------------------------ */
/* کارت شاخص                                                          */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  badge?: { text: string; tone: 'emerald' | 'blue' | 'amber' | 'rose' | 'violet' | 'slate' };
  icon?: React.ReactNode;
  spark?: React.ReactNode;
}

const TONES: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, unit, badge, icon, spark }) => (
  <div className="tj-card p-4 tj-rise flex flex-col gap-2">
    <div className="flex items-center justify-between gap-2">
      <p className="text-slate-500 text-[11px] font-semibold flex items-center gap-1.5">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </p>
      {badge && (
        <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${TONES[badge.tone] ?? TONES.slate}`}>
          {badge.text}
        </span>
      )}
    </div>
    <div className="flex items-end justify-between gap-2">
      <span className="text-2xl font-bold text-slate-900 font-mono leading-none tabular-nums">
        {value}
        {unit && <span className="text-[11px] font-normal text-slate-400 font-sans mr-1.5">{unit}</span>}
      </span>
      {spark}
    </div>
  </div>
);

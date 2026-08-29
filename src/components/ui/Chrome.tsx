/**
 * کروم جدید تجارت‌یار — سربرگ صفحه (PageHero) و کارت شاخص (StatCard)
 * پایه‌ی ظاهری یکسان برای همه‌ی نماها
 */
import React from 'react';

export interface HeroStat { label: string; value: string; tone?: string }

interface PageHeroProps {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle?: string;
  stats?: HeroStat[];
  actions?: React.ReactNode;
}

export const PageHero: React.FC<PageHeroProps> = ({ icon, eyebrow, title, subtitle, stats, actions }) => (
  <div className="tj-hero tj-rise flex-shrink-0">
    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-4 p-4 md:p-5 pr-5 md:pr-6">
      {/* آیکون و متن */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <div className="tj-grad tj-grad-ring w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <span className="tj-chip">{eyebrow}</span>
          <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight mt-1.5 leading-snug">{title}</h2>
          {subtitle && <p className="text-[11px] md:text-xs text-slate-500 leading-relaxed mt-1 max-w-3xl">{subtitle}</p>}
        </div>
      </div>

      {/* شاخص‌ها */}
      {stats && stats.length > 0 && (
        <div className="flex flex-wrap gap-2 shrink-0">
          {stats.map((s) => (
            <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-[104px]">
              <span className="text-[9px] font-bold text-slate-400 block">{s.label}</span>
              <span className={`text-sm font-black font-mono ${s.tone ?? 'text-slate-800'}`}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* اکشن‌ها */}
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  </div>
);

/* ------------------------- کارت شاخص ------------------------- */

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  badge?: { text: string; tone: 'emerald' | 'blue' | 'amber' | 'rose' | 'violet' };
  icon?: React.ReactNode;
  spark?: React.ReactNode;
}

const TONES: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, unit, badge, icon, spark }) => (
  <div className="tj-card p-4 tj-rise flex flex-col gap-1.5">
    <div className="flex items-center justify-between gap-2">
      <p className="text-slate-500 text-[11px] font-bold flex items-center gap-1.5">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </p>
      {badge && (
        <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${TONES[badge.tone]}`}>
          {badge.text}
        </span>
      )}
    </div>
    <div className="flex items-end justify-between gap-2">
      <span className="text-2xl font-black text-slate-900 font-mono leading-none">
        {value}
        {unit && <span className="text-[11px] font-normal text-slate-400 font-sans mr-1">{unit}</span>}
      </span>
      {spark}
    </div>
  </div>
);

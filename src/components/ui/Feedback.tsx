/**
 * اجزای بازخورد رابط — توست، اسکلتون، حالت خالی
 */
import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useStore } from '../../store/AppStore';

/* ------------------------------ Toasts ------------------------------ */

export const ToastHost: React.FC = () => {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="fixed bottom-4 left-4 z-[100] space-y-2 w-80 max-w-[calc(100vw-2rem)]" dir="rtl">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-lg backdrop-blur-md text-xs font-medium ${
              t.kind === 'success'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                : t.kind === 'error'
                ? 'bg-rose-50/95 border-rose-200 text-rose-900'
                : 'bg-white/95 border-slate-200 text-slate-800'
            }`}
          >
            {t.kind === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
            {t.kind === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
            {t.kind === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
            <span className="leading-relaxed flex-1">{t.message}</span>
            <button onClick={() => dismissToast(t.id)} className="opacity-50 hover:opacity-100 transition-opacity">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

/* ----------------------------- Skeletons ---------------------------- */

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-gradient-to-l from-slate-200/70 via-slate-100 to-slate-200/70 ${className}`} />
);

export const ViewSkeleton: React.FC = () => (
  <div className="flex-1 space-y-4" aria-label="در حال بارگذاری">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} className="h-24" />)}
    </div>
    <SkeletonBox className="h-72" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} className="h-40" />)}
    </div>
  </div>
);

/* ---------------------------- Empty state --------------------------- */

export const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; hint?: string; action?: React.ReactNode }> = ({ icon, title, hint, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-14 px-6 space-y-3">
    <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
      {icon ?? <Info className="w-6 h-6" />}
    </div>
    <div className="space-y-1">
      <p className="text-sm font-bold text-slate-700">{title}</p>
      {hint && <p className="text-xs text-slate-500 leading-relaxed max-w-sm">{hint}</p>}
    </div>
    {action}
  </div>
);

/* -------------------------- Fatal error state ------------------------ */

export const FatalError: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="flex-1 flex items-center justify-center">
    <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4 shadow-sm">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-slate-800">اتصال به سرور تجارت‌یار برقرار نشد</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
        <p className="text-[11px] text-slate-400">سرور را با دستور <code dir="ltr" className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">npm run server</code> اجرا کنید.</p>
      </div>
      <button onClick={onRetry} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors">
        تلاش مجدد
      </button>
    </div>
  </div>
);

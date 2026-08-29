/**
 * دستیار هوشمند تجارت‌یار — دو قابلیت AI:
 * ۱) پیشنهاد کد تعرفه بر اساس توصیف کالا (Gemini + موتور محلی)
 * ۲) تحلیل ریسک تأمین‌کننده خارجی (Gemini + قواعد محلی)
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Search, ShieldCheck, AlertTriangle, Lightbulb, Loader2, BadgeCheck, Cpu } from 'lucide-react';
import { api } from '../lib/api';
import { useStore } from '../store/AppStore';
import type { AiHsSuggestion, AiSupplierReport } from '../types';
import { fmtPct } from '../lib/format';

/* --------------------- پیشنهاد کد تعرفه --------------------- */

export const AiHsSuggestCard: React.FC<{ onUseCode?: (code: string) => void }> = ({ onUseCode }) => {
  const { health } = useStore();
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ engine: string; suggestions: AiHsSuggestion[]; note?: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const aiOn = !!health?.aiEnabled;

  const run = async () => {
    if (!productName.trim()) return;
    setBusy(true); setErr(null); setResult(null);
    try {
      const res = await api.aiHsSuggest({ productName, description: description || undefined });
      setResult(res);
    } catch (e: any) {
      setErr(e?.message ?? 'خطا در دریافت پیشنهاد');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-gradient-to-l from-indigo-50/80 via-white to-white border border-indigo-200/70 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          پیشنهاد هوشمند کد تعرفه
        </h4>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${aiOn ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
          <Cpu className="w-3 h-3" />
          {aiOn ? `مدل ${health?.model} فعال` : 'موتور محلی (Gemini غیرفعال)'}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        کالای خود را همان‌طور که در پروفرما/کاتالوگ آمده توصیف کنید؛ سامانه از بین کدهای دایرکتوری رسمی تعرفه، بهترین گزینه‌ها را با دلیل فنی رتبه‌بندی می‌کند.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="مثال: اینورتر خورشیدی هیبرید ۵ کیلووات با شارژر باتری"
          className="md:col-span-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
        />
        <button
          onClick={run}
          disabled={busy || !productName.trim()}
          className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {busy ? 'در حال تحلیل...' : 'پیشنهاد بده'}
        </button>
      </div>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="توضیحات فنی تکمیلی (اختیاری): توان، کاربرد، قطعات همراه..."
        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
      />

      {err && <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-[11px] text-rose-700">{err}</div>}

      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          {result.note && <p className="text-[10px] text-slate-400 leading-relaxed">{result.note}</p>}
          {result.suggestions.map((s, i) => (
            <div key={s.code} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2 py-0.5 text-xs" dir="ltr">{s.code}</span>
                  <span className="text-[11px] font-bold text-slate-800 line-clamp-1">{s.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.confidence >= 75 ? 'bg-emerald-500' : s.confidence >= 50 ? 'bg-amber-500' : 'bg-rose-400'}`} style={{ width: `${s.confidence}%` }} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-600">{fmtPct(s.confidence)}</span>
                  </div>
                  {onUseCode && (
                    <button onClick={() => onUseCode(s.code)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-2.5 py-1 transition-colors">
                      استفاده در پرونده
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{s.reasoning}</p>
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                {s.dutyTotalPct !== undefined && <span className="bg-slate-100 text-slate-700 rounded px-1.5 py-0.5 font-medium">مجموع تعرفه: {fmtPct(s.dutyTotalPct)}</span>}
                {s.samtGroup && <span className="bg-blue-50 text-blue-700 rounded px-1.5 py-0.5 font-medium">{s.samtGroup}</span>}
                {(s.warnings ?? []).map((w, j) => <span key={j} className="bg-amber-50 text-amber-800 rounded px-1.5 py-0.5 font-medium">{w}</span>)}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

/* ------------------- تحلیل ریسک تأمین‌کننده ------------------- */

export const AiSupplierCheckCard: React.FC = () => {
  const { health } = useStore();
  const [form, setForm] = useState({ name: '', country: 'چین', domain: '', categories: '', extra: '' });
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<{ engine: string; report: AiSupplierReport; disclaimer?: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const aiOn = !!health?.aiEnabled;

  const run = async () => {
    if (!form.name.trim()) return;
    setBusy(true); setErr(null); setReport(null);
    try {
      const res = await api.aiSupplierCheck(form);
      setReport(res);
    } catch (e: any) {
      setErr(e?.message ?? 'خطا در تحلیل');
    } finally {
      setBusy(false);
    }
  };

  const tone = report?.report.riskLevel === 'کم' ? 'emerald' : report?.report.riskLevel === 'متوسط' ? 'amber' : 'rose';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          تحلیل هوشمند ریسک تأمین‌کننده (Due Diligence)
        </h4>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${aiOn ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
          <Cpu className="w-3 h-3" />
          {aiOn ? `مدل ${health?.model}` : 'موتور قاعده‌محور'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="نام کامل شرکت (مثل Jiangsu XYZ Energy Co., Ltd)"
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-400 focus:bg-white focus:outline-none" />
        <input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="وب‌سایت/دامنه (مثال xyz-solar.com)"
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-emerald-400 focus:bg-white focus:outline-none" dir="ltr" />
        <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="کشور اعلامی"
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-400 focus:bg-white focus:outline-none" />
        <input value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} placeholder="دسته کالایی (مثال پنل خورشیدی)"
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-400 focus:bg-white focus:outline-none" />
      </div>

      <button onClick={run} disabled={busy || !form.name.trim()}
        className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors w-full md:w-auto">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        {busy ? 'در حال بررسی...' : 'بررسی و تولید گزارش ریسک'}
      </button>

      {err && <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-[11px] text-rose-700">{err}</div>}

      {report && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className={`rounded-xl p-3 flex items-center gap-3 border ${
            tone === 'emerald' ? 'bg-emerald-50 border-emerald-200' : tone === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'
          }`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg ${
              tone === 'emerald' ? 'bg-emerald-100 text-emerald-700' : tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
            }`}>{report.report.riskScore}</div>
            <div>
              <p className={`text-xs font-bold ${tone === 'emerald' ? 'text-emerald-900' : tone === 'amber' ? 'text-amber-900' : 'text-rose-900'}`}>
                سطح ریسک: {report.report.riskLevel} <span className="font-normal opacity-70">(از ۱۰۰)</span>
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">{report.report.summary}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="border border-slate-200 rounded-xl p-3 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><BadgeCheck className="w-3 h-3 text-blue-500" /> بینش‌های هویتی</span>
              {report.report.entityInsights.map((x, i) => <p key={i} className="text-[10px] text-slate-600 leading-relaxed">• {x}</p>)}
            </div>
            <div className="border border-rose-200 bg-rose-50/40 rounded-xl p-3 space-y-1.5">
              <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> پرچم‌های قرمز</span>
              {report.report.redFlags.map((x, i) => <p key={i} className="text-[10px] text-rose-800 leading-relaxed">• {x}</p>)}
            </div>
            <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-3 space-y-1.5">
              <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> اقدامات پیشنهادی</span>
              {report.report.recommendedChecks.map((x, i) => <p key={i} className="text-[10px] text-amber-900 leading-relaxed">• {x}</p>)}
            </div>
          </div>

          {report.disclaimer && <p className="text-[10px] text-slate-400 leading-relaxed">{report.disclaimer}</p>}
        </motion.div>
      )}
    </div>
  );
};

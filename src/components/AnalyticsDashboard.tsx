/**
 * داشبورد تحلیلی و مالی — نمودارهای محاسبه‌شده از داده واقعی کارتابل
 * + شبیه‌ساز «چه‌اگر نرخ ارز تغییر کند» روی بهای تمام‌شده.
 * (هیچ عدد ثابتی hard-code نشده؛ همه از inventory زنده مشتق می‌شود)
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { PieChart as PieIcon, TrendingUp, Layers, Coins, Save, Activity, RefreshCw } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { STATUS_FLOW } from '../types';
import { fmtBillion, fmtPct, fmtTomanSmart } from '../lib/format';
import { revaluePortfolio } from '../lib/fxRevaluation';

const CAT_COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777'];

const toFa = (n: number): string => n.toLocaleString('fa-IR', { maximumFractionDigits: 1 });

export const AnalyticsDashboard: React.FC = () => {
  const { inventory, settings, saveSettings } = useStore();
  const [fxDraft, setFxDraft] = useState({ ...settings.fx });
  const baseNima = settings.fx.usdNimaToman || 68000;
  const [whatIfFx, setWhatIfFx] = useState<number>(baseNima);

  /* با تغییر نرخ مرجع ذخیره‌شده، شبیه‌ساز روی نرخ جدید بنشیند */
  useEffect(() => {
    setWhatIfFx(settings.fx.usdNimaToman || 68000);
  }, [settings.fx.usdNimaToman]);

  const reval = useMemo(
    () => revaluePortfolio(inventory, whatIfFx, settings),
    [inventory, whatIfFx, settings]
  );

  const stats = useMemo(() => {
    const totalCost = inventory.reduce((s, u) => s + u.landedCostToman * u.stockQty, 0);
    const totalMarket = inventory.reduce((s, u) => s + u.marketPriceToman * u.stockQty, 0);
    const units = inventory.map((u) => {
      const cost = u.landedCostToman * u.stockQty;
      const market = u.marketPriceToman * u.stockQty;
      return {
        name: u.name.length > 22 ? `${u.name.slice(0, 22)}…` : u.name,
        fullName: u.name,
        cost: Math.round(cost),
        market: Math.round(market),
        profit: Math.round(market - cost),
        marginPct: market > 0 ? Math.round(((market - cost) / market) * 1000) / 10 : 0,
        stock: u.stockQty,
      };
    });

    const byCategory = Object.entries(
      inventory.reduce<Record<string, number>>((acc, u) => {
        acc[u.category] = (acc[u.category] ?? 0) + u.marketPriceToman * u.stockQty;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value: Math.round(value) }));

    const byStatus = STATUS_FLOW.map((s) => ({
      name: s.replace(' (', '\u200C(').split(' ').slice(0, 3).join(' '),
      full: s,
      value: Math.round(inventory.filter((u) => u.status === s || (s === 'موجود در انبار (ترخیص شده)' && u.status === 'رزرو مشتری / پیش‌فروش')).reduce((acc, u) => acc + u.landedCostToman * u.stockQty, 0)),
    }));

    const byOrigin = Object.entries(
      inventory.reduce<Record<string, number>>((acc, u) => {
        const c = u.originCountry.split('(')[0].trim();
        acc[c] = (acc[c] ?? 0) + u.landedCostToman * u.stockQty;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value: Math.round(value) }));

    return {
      totalCost, totalMarket,
      profit: totalMarket - totalCost,
      marginPct: totalMarket > 0 ? ((totalMarket - totalCost) / totalMarket) * 100 : 0,
      units, byCategory, byStatus, byOrigin,
    };
  }, [inventory]);

  const fxDirty =
    fxDraft.usdNimaToman !== settings.fx.usdNimaToman ||
    fxDraft.usdAzadToman !== settings.fx.usdAzadToman ||
    fxDraft.eurToman !== settings.fx.eurToman;

  const minFx = Math.round(baseNima * 0.5);
  const maxFx = Math.round(baseNima * 1.5);

  const topMovers = useMemo(
    () =>
      reval.perUnit
        .map((r) => ({ name: r.unit.name, qty: r.unit.stockQty, delta: r.deltaMillion * r.unit.stockQty }))
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        .slice(0, 3),
    [reval]
  );

  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-0.5">
      {/* KPIها */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Coins className="w-3 h-3" /> سرمایه درگیر</span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1" dir="ltr">{fmtBillion(stats.totalCost)}</div>
          <span className="text-[10px] text-slate-500">میلیارد تومان بهای تمام‌شده</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-blue-500" /> ارزش روز بازار</span>
          <div className="text-2xl font-black font-mono text-blue-600 mt-1" dir="ltr">{fmtBillion(stats.totalMarket)}</div>
          <span className="text-[10px] text-slate-500">میلیارد تومان</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> سود ناخالص پیش‌بینی</span>
          <div className={`text-2xl font-black font-mono mt-1 ${stats.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} dir="ltr">
            {stats.profit >= 0 ? '+' : ''}{fmtBillion(stats.profit)}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">میلیارد تومان — حاشیه {fmtPct(stats.marginPct)}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Layers className="w-3 h-3 text-violet-500" /> تنوع سبد</span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">{inventory.length.toLocaleString('fa-IR')}</div>
          <span className="text-[10px] text-slate-500">پرونده فعال در {stats.byCategory.length.toLocaleString('fa-IR')} دسته کالایی</span>
        </div>
      </div>

      {/* شبیه‌ساز چه‌اگر نرخ ارز */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            شبیه‌ساز «چه‌اگر نرخ ارز تغییر کند»
          </h4>
          {whatIfFx !== baseNima && (
            <button
              onClick={() => setWhatIfFx(baseNima)}
              className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5" /> بازگشت به نرخ فعلی
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
          {/* اسلایدر نرخ */}
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">نرخ فرضی دلار نیما (تومان)</span>
              <input
                type="number"
                dir="ltr"
                step={500}
                min={1000}
                value={whatIfFx}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setWhatIfFx(Number.isFinite(v) && v > 0 ? v : baseNima);
                }}
                className="w-28 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-right"
              />
            </div>
            <input
              type="range"
              dir="ltr"
              min={minFx}
              max={maxFx}
              step={500}
              value={whatIfFx}
              onChange={(e) => setWhatIfFx(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-mono" dir="ltr">
              <span>{minFx.toLocaleString('en-US')}</span>
              <span className="text-blue-600 font-bold">{baseNima.toLocaleString('en-US')} (فعلی)</span>
              <span>{maxFx.toLocaleString('en-US')}</span>
            </div>
          </div>

          {/* نتایج */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] text-slate-500">بهای تمام‌شده فعلی</span>
              <div className="text-lg font-black font-mono text-slate-900 mt-0.5" dir="ltr">{fmtBillion(reval.landedOldMillion)}</div>
              <span className="text-[9px] text-slate-400">میلیارد تومان (ذخیره‌شده)</span>
            </div>
            <div className={`rounded-xl p-3 border ${reval.deltaMillion >= 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <span className="text-[10px] text-slate-500">با نرخ فرضی</span>
              <div className={`text-lg font-black font-mono mt-0.5 ${reval.deltaMillion >= 0 ? 'text-rose-700' : 'text-emerald-700'}`} dir="ltr">{fmtBillion(reval.landedNewMillion)}</div>
              <span className={`text-[9px] font-bold ${reval.deltaMillion >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {reval.deltaMillion >= 0 ? '+' : '−'}{fmtTomanSmart(Math.abs(reval.deltaMillion))} نسبت به فعلی
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] text-slate-500">سود ناخالص با نرخ فرضی</span>
              <div className={`text-lg font-black font-mono mt-0.5 ${reval.profitNewMillion >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} dir="ltr">
                {reval.profitNewMillion >= 0 ? '+' : ''}{fmtBillion(reval.profitNewMillion)}
              </div>
              <span className="text-[9px] text-slate-400">میلیارد تومان (فعلی: {fmtBillion(reval.profitOldMillion)})</span>
            </div>
            <div className="sm:col-span-3 bg-blue-50/60 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
              <Activity className="w-4 h-4 text-blue-600 shrink-0" />
              <p className="text-[11px] text-slate-700 leading-relaxed">
                <span className="font-bold">حساسیت سبد:</span> هر ۱۰۰۰ تومان افزایش نرخ نیما ≈{' '}
                <span className="font-black text-blue-700">{fmtTomanSmart(reval.sensitivityPerThousandTomanMillion)}</span>{' '}
                به بهای تمام‌شده‌ی کل اضافه می‌کند.
              </p>
            </div>
          </div>
        </div>

        {topMovers.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5">
            <span className="text-[10px] font-bold text-slate-500">بیشترین تأثیرپذیری:</span>
            {topMovers.map((m) => (
              <span key={m.name} className="text-[10px] bg-slate-100 border border-slate-200 rounded-lg px-2 py-1">
                {m.name} <span className={`font-bold ${m.delta >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{m.delta >= 0 ? '+' : '−'}{fmtTomanSmart(Math.abs(m.delta))}</span>
              </span>
            ))}
          </div>
        )}

        <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 pt-2">
          مفروضات شبیه‌سازی: سهم ارزی (CIF + حقوق ورودی + سود بازرگانی + مالیات) با نرخ جدید بازمحاسبه و سهم ریالی محلی (ترخیص‌کاری، حمل داخلی، کارمزد) ثابت نگه داشته می‌شود؛ نرخ تعرفه از دایرکتوری HS داخلی خوانده می‌شود و تغییر نرخ «موازی» فرض می‌شود (نسبت نیما/آزاد ثابت). این صرفاً تحلیل حساسیت است، نه پیش‌بینی رسمی نرخ.
        </p>
      </div>

      {/* نمودارها */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* بهای تمام‌شده در برابر بازار */}
        <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-700">بهای تمام‌شده در برابر ارزش بازار هر پرونده <span className="text-slate-400 font-medium">(میلیون تومان)</span></h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.units} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} reversed />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v) => toFa(v / 1000)} orientation="right" />
              <Tooltip
                formatter={(v: any, n: any) => [`${toFa(Number(v) / 1000)} م.ت`, n === 'cost' ? 'بهای تمام‌شده' : 'ارزش بازار']}
                labelStyle={{ fontSize: 11, direction: 'rtl' }}
                contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #e2e8f0' }}
              />
              <Legend formatter={(v) => (v === 'cost' ? 'بهای تمام‌شده' : 'ارزش بازار')} wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="cost" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="market" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ترکیب دسته‌ای */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><PieIcon className="w-3.5 h-3.5 text-blue-600" /> ترکیب ارزش بازار بر اساس دسته کالایی</h4>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={stats.byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {stats.byCategory.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any, n: any) => [`${toFa(Number(v) / 1000)} م.ت`, n]} contentStyle={{ fontSize: 11, borderRadius: 12, direction: 'rtl' }} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* حاشیه سود هر پرونده */}
        <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-700">حاشیه سود ناخالص هر پرونده <span className="text-slate-400 font-medium">(حجم دایره = ارزش محموله)</span></h4>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} reversed />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} orientation="right" tickFormatter={(v) => `${toFa(v)}٪`} />
              <ZAxis dataKey="market" range={[60, 700]} />
              <Tooltip
                formatter={(v: any, n: any) => (n === 'marginPct' ? `${toFa(v)}٪` : `${toFa(Number(v) / 1000)} م.ت`)}
                labelStyle={{ fontSize: 11 }}
                contentStyle={{ fontSize: 11, borderRadius: 12, direction: 'rtl' }}
              />
              <Scatter data={stats.units} dataKey="marginPct" fill="#059669" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* سرمایه بر اساس مرحله */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-700">توزیع سرمایه بر اساس مرحله چرخه عمر</h4>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.byStatus} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="stageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#64748b' }} reversed />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v) => toFa(v / 1000)} orientation="right" />
              <Tooltip formatter={(v: any) => `${toFa(Number(v) / 1000)} م.ت`} contentStyle={{ fontSize: 11, borderRadius: 12, direction: 'rtl' }} />
              <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fill="url(#stageGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* تنظیمات نرخ ارز */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-xs font-bold text-slate-700">تنظیمات نرخ ارز مرجع <span className="text-slate-400 font-medium">(مبنای محاسبات جدید ویزارد و ماشین‌حساب)</span></h4>
          {fxDirty && (
            <button
              onClick={() => saveSettings({ fx: fxDraft })}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-xl transition-colors"
            >
              <Save className="w-3.5 h-3.5" /> ذخیره نرخ‌ها
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          {([
            ['usdNimaToman', 'دلار نیما (تومان)', 500],
            ['usdAzadToman', 'دلار آزاد (تومان)', 500],
            ['eurToman', 'یورو (تومان)', 500],
          ] as const).map(([key, label, step]) => (
            <div key={key} className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">{label}</label>
              <input
                type="number"
                dir="ltr"
                step={step}
                value={fxDraft[key]}
                onChange={(e) => setFxDraft((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-2">
          آخرین به‌روزرسانی: {new Date(settings.fx.updatedAt).toLocaleString('fa-IR')} — این نرخ‌ها فقط مبنای محاسبات <span className="font-bold text-slate-500">جدید</span> (ویزارد و ماشین‌حساب) هستند و بهای تمام‌شده‌ی تاریخی ذخیره‌شده در کارتابل را تغییر نمی‌دهند. برای دیدن اثر نرخ بر سبد موجود، از شبیه‌ساز «چه‌اگر» در بالای صفحه استفاده کنید.
        </p>
      </div>
    </div>
  );
};

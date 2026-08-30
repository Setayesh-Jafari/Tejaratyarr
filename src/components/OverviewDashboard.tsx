/**
 * نمای کلی (Overview) — لندینگ تجارت‌یار
 * ------------------------------------------------------------------
 * یک لندینگ حرفه‌ای که در چند ثانیه «چرا این ابزار» را منتقل می‌کند:
 *   - هیرو با ارزش پیشنهادی شفاف + پنل پیش‌نمایش محصول (حقایق واقعی)
 *   - مسیر چهار مرحله‌ای کار
 *   - ابزارها و مزیت‌ها
 * هیچ عدد یا داده‌ی ساختگی وجود ندارد؛ آمار کسب‌وکار فقط پس از ثبت داده‌ی واقعی ظاهر می‌شود.
 */
import React, { useMemo } from 'react';
import {
  ArrowLeft, Boxes, FileCheck2, Scale, Send, Globe2, BarChart3, Plus,
  Warehouse, Ship, Landmark, Hourglass, AlertTriangle, TrendingUp,
  Wallet, Sparkles, ShieldCheck, Gauge, ClipboardList, FileSearch,
  Calculator, Coins, Lock,
} from 'lucide-react';
import { useStore } from '../store/AppStore';
import { ActiveView, InventoryUnit, STATUS_FLOW, isSettledStatus } from '../types';
import { fmtBillion, fmtMillion, fmtPct, daysSince, faTimeAgo } from '../lib/format';
import { HS_CODE_DIRECTORY } from '../data/hscodeDirectory';

interface OverviewDashboardProps {
  onNavigate: (view: ActiveView) => void;
  onOpenUnit: (unit: InventoryUnit) => void;
  onOpenAssessment: () => void;
  onOpenAddUnit: () => void;
}

const fa = (n: number, digits = 0): string =>
  n.toLocaleString('fa-IR', { minimumFractionDigits: 0, maximumFractionDigits: digits });

const STAGE_ICONS: Record<string, React.ElementType> = {
  'در انتظار تخصیص ارز و ثبت سفارش': Hourglass,
  'در حال ترانزیت بین‌المللی': Ship,
  'در گمرک (در حال ترخیص)': Landmark,
  'موجود در انبار (ترخیص شده)': Warehouse,
};

const STATUS_BADGE: Record<InventoryUnit['status'], string> = {
  'موجود در انبار (ترخیص شده)': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'رزرو مشتری / پیش‌فروش': 'bg-violet-50 text-violet-700 border-violet-200',
  'در گمرک (در حال ترخیص)': 'bg-blue-50 text-blue-700 border-blue-200',
  'در حال ترانزیت بین‌المللی': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'در انتظار تخصیص ارز و ثبت سفارش': 'bg-amber-50 text-amber-700 border-amber-200',
};

/** مسیر چهار مرحله‌ای ارزش پیشنهادی — همان جریان واقعی ویزارد ارزیابی */
const WORKFLOW: Array<{ icon: React.ElementType; step: string; title: string; desc: string; view: ActiveView }> = [
  { icon: ClipboardList, step: '۱', title: 'ثبت کالا', desc: 'مشخصات فنی، تعداد و هدف واردات.', view: 'assessment' },
  { icon: FileSearch, step: '۲', title: 'تفکیک تعرفه HS', desc: 'کد صحیح، حقوق ورودی و مجوزها.', view: 'hscode_resolver' },
  { icon: ShieldCheck, step: '۳', title: 'اعتبارسنجی تأمین‌کننده', desc: 'تحلیل ریسک واسطه و احراز اصالت.', view: 'sourcing' },
  { icon: Calculator, step: '۴', title: 'بهای تمام‌شده و سود', desc: 'Landed Cost و مارجین پیش از سفارش.', view: 'analytics' },
];

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigate, onOpenUnit, onOpenAssessment, onOpenAddUnit,
}) => {
  const { inventory, suppliers, settings } = useStore();

  const hasData = inventory.length > 0;

  const stats = useMemo(() => {
    const landed = inventory.reduce((s, u) => s + u.landedCostToman * u.stockQty, 0);
    const market = inventory.reduce((s, u) => s + u.marketPriceToman * u.stockQty, 0);
    const profit = market - landed;
    const marginPct = market > 0 ? ((market - landed) / market) * 100 : 0;
    const active = inventory.filter((u) => !isSettledStatus(u.status)).length;
    const inCustoms = inventory.filter((u) => u.status === 'در گمرک (در حال ترخیص)').length;
    const stuckUnits = inventory.filter(
      (u) => u.status === 'در گمرک (در حال ترخیص)' && daysSince(u.stageEnteredAt ?? u.createdAt ?? u.lastUpdated) > 25
    );
    const stuckValue = stuckUnits.reduce((s, u) => s + u.landedCostToman * u.stockQty, 0);
    const awaitingFx = inventory.filter((u) => u.status === 'در انتظار تخصیص ارز و ثبت سفارش').length;
    const needAudit = suppliers.filter((s) => !(s.sourceVerification?.isVerified ?? true)).length;

    let topMargin: { unit: InventoryUnit; pct: number } | null = null;
    for (const u of inventory) {
      if (u.marketPriceToman <= 0) continue;
      const pct = ((u.marketPriceToman - u.landedCostToman) / u.marketPriceToman) * 100;
      if (!topMargin || pct > topMargin.pct) topMargin = { unit: u, pct };
    }

    return { landed, market, profit, marginPct, active, inCustoms, stuckUnits, stuckValue, awaitingFx, needAudit, topMargin };
  }, [inventory, suppliers]);

  const byStage = useMemo(() => {
    return STATUS_FLOW.map((s) => {
      const items = inventory.filter((u) => u.status === s || (s === 'موجود در انبار (ترخیص شده)' && u.status === 'رزرو مشتری / پیش‌فروش'));
      const value = items.reduce((acc, u) => acc + u.landedCostToman * u.stockQty, 0);
      return { status: s, count: items.length, value };
    });
  }, [inventory]);

  const recent = useMemo(() => {
    const t = (u: InventoryUnit) => u.createdAt ?? u.lastUpdated;
    return [...inventory].sort((a, b) => t(b).localeCompare(t(a))).slice(0, 6);
  }, [inventory]);

  const quickActions: Array<{ label: string; desc: string; icon: React.ElementType; onClick: () => void }> = [
    { label: 'ثبت کارگوی جدید', desc: 'افزودن پرونده وارداتی به کارتابل', icon: Plus, onClick: onOpenAddUnit },
    { label: 'ارزیابی جدید واردات', desc: 'ویزارد ۴ مرحله‌ای امکان‌سنجی', icon: FileCheck2, onClick: onOpenAssessment },
    { label: 'تفکیک تعرفه HS', desc: 'یافتن کد صحیح و حقوق ورودی', icon: Scale, onClick: () => onNavigate('hscode_resolver') },
    { label: 'استعلام قیمت RFQ', desc: 'صدور پروفرما به تأمین‌کننده', icon: Send, onClick: () => onNavigate('rfq') },
    { label: 'اعتبارسنجی تأمین‌کننده', desc: 'ماتریس ممیزی و ریسک واسطه', icon: Globe2, onClick: () => onNavigate('sourcing') },
    { label: 'داشبورد تحلیلی', desc: 'نمودارها و بهای تمام‌شده', icon: BarChart3, onClick: () => onNavigate('analytics') },
  ];

  /* ---- حقایق واقعی محصول برای هیرو (نه داده ساختگی) ---- */
  const productFacts = [
    { label: 'مرحله ارزیابی', value: '۴', hint: 'از کالا تا بهای تمام‌شده' },
    { label: 'کد تعرفه مستند', value: fa(HS_CODE_DIRECTORY.length), hint: 'با مرجع استنادی و بازبینی' },
    { label: 'داده ساختگی', value: '۰', hint: 'همه‌چیز از ورودی شما' },
    { label: 'کانال ارزی', value: '۳', hint: 'نیما، آزاد و یورو' },
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-8 pr-0.5 pb-4">
      {/* ============================ هیرو ============================ */}
      <section className="tj-rise grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        {/* متن هیرو */}
        <div className="lg:col-span-6 space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-[12px] font-semibold text-indigo-700">
            <Sparkles className="w-4 h-4" />
            ابزار تخصصی مدیریت واردات و کارگو
          </span>

          <h1 className="text-[1.9rem] md:text-[2.5rem] font-bold leading-[1.45] tracking-tight text-slate-900">
            واردات را با{' '}
            <span className="bg-gradient-to-l from-indigo-600 via-violet-600 to-teal-600 bg-clip-text text-transparent">
              اطمینان و داده
            </span>{' '}
            مدیریت کن
          </h1>

          <p className="text-[14px] md:text-[15px] text-slate-500 leading-[1.9] max-w-xl">
            تجارت‌یار چهار مرحله‌ی حیاتی هر واردات — تفکیک تعرفه، اعتبارسنجی تأمین‌کننده،
            بهای تمام‌شده و گردش کار ترخیص — را در یک محیط شفاف کنار هم می‌گذارد.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button onClick={onOpenAssessment} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-6 py-3 text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              <Sparkles className="w-4 h-4" />
              شروع اولین ارزیابی
            </button>
            <button onClick={onOpenAddUnit} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-700 px-6 py-3 text-sm font-bold hover:bg-slate-50 transition-colors">
              <Plus className="w-4 h-4 text-indigo-600" />
              ثبت اولین پرونده
            </button>
          </div>

          {/* نوار اعتماد — حقایق واقعی محصول */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {productFacts.map((f) => (
              <div key={f.label} className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">{f.value}</span>
                  <span className="text-[11px] font-semibold text-slate-500">{f.label}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{f.hint}</div>
              </div>
            ))}
          </div>
        </div>

        {/* پنل پیش‌نمایش محصول */}
        <div className="lg:col-span-6">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
            {/* نوار عنوان پنجره */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
              <span className="flex gap-1.5" dir="ltr">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[11px] font-semibold text-slate-400 mr-2">تجارت‌یار — جریان ارزیابی واردات</span>
            </div>

            <div className="p-5 space-y-4">
              {/* مسیر چهار مرحله‌ای عمودی */}
              <div className="space-y-0">
                {WORKFLOW.map((w, i) => {
                  const Icon = w.icon;
                  const isLast = i === WORKFLOW.length - 1;
                  return (
                    <div key={w.step} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                          <Icon className="w-[18px] h-[18px] text-indigo-600" />
                        </span>
                        {!isLast && <span className="w-px flex-1 bg-slate-200 my-1" />}
                      </div>
                      <div className="pb-4 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold font-mono text-indigo-500">مرحله {w.step}</span>
                          <span className="text-[13px] font-bold text-slate-800">{w.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{w.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* نوار پایین: اعداد زنده واقعی */}
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                  <Coins className="w-3.5 h-3.5 text-emerald-600" />
                  نرخ دلار نیما:
                  <span className="font-mono font-bold text-slate-900" dir="ltr">{fa(settings.fx.usdNimaToman)}</span>
                </span>
                <span className="text-slate-200">|</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                  <Lock className="w-3.5 h-3.5 text-indigo-500" />
                  بدون داده ساختگی
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================== باند شروع سریع (بدون داده) ====================== */}
      {!hasData && (
        <section className="tj-rise">
          <div className="rounded-3xl border border-indigo-100 bg-gradient-to-l from-indigo-50/80 via-white to-white p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex-1 space-y-2">
              <h2 className="text-lg md:text-xl font-bold text-slate-900">شروع کار با تجارت‌یار</h2>
              <p className="text-[13px] text-slate-500 leading-[1.8] max-w-xl">
                کارتابل شما خالی است — و این عمدی است. برای دیدن آمار واقعی سبد (سرمایه، بازار و سود)،
                اولین پرونده یا ارزیابی خود را ثبت کنید.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
              <button onClick={onOpenAssessment} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white px-5 py-3 text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
                <FileCheck2 className="w-4 h-4" />
                ارزیابی جدید
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button onClick={onOpenAddUnit} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-700 px-5 py-3 text-sm font-bold hover:bg-slate-50 transition-colors">
                <Plus className="w-4 h-4 text-indigo-600" />
                ثبت کارگو
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ====================== فقط با داده واقعی ====================== */}
      {hasData && (
        <>
          {/* شاخص‌ها */}
          <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="tj-card p-4">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-slate-400" /> سرمایه درگیر</span>
              <div className="text-[22px] font-bold font-mono text-slate-900 mt-1.5 tabular-nums" dir="ltr">{fmtBillion(stats.landed)}</div>
              <span className="text-[10px] text-slate-400">میلیارد تومان بهای تمام‌شده</span>
            </div>
            <div className="tj-card p-4">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> ارزش روز بازار</span>
              <div className="text-[22px] font-bold font-mono text-indigo-600 mt-1.5 tabular-nums" dir="ltr">{fmtBillion(stats.market)}</div>
              <span className="text-[10px] text-slate-400">میلیارد تومان</span>
            </div>
            <div className="tj-card p-4">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-emerald-500" /> سود ناخالص</span>
              <div className={`text-[22px] font-bold font-mono mt-1.5 tabular-nums ${stats.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} dir="ltr">
                {stats.profit >= 0 ? '+' : '−'}{fmtBillion(Math.abs(stats.profit))}
              </div>
              <span className="text-[10px] text-slate-400">میلیارد تومان</span>
            </div>
            <div className="tj-card p-4">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5"><Boxes className="w-3.5 h-3.5 text-blue-500" /> پرونده‌های در جریان</span>
              <div className="text-[22px] font-bold font-mono text-slate-900 mt-1.5 tabular-nums">{fa(stats.active)}</div>
              <span className="text-[10px] text-slate-400">از {fa(inventory.length)} پرونده</span>
            </div>
          </section>

          {/* بینش‌ها + چرخه عمر */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            <div className="tj-card p-4 space-y-2.5">
              <h2 className="text-[13px] font-bold text-slate-800 mb-1">بینش‌های امروز</h2>

              {stats.topMargin && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                  <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0"><TrendingUp className="w-4 h-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-emerald-800">پرسودترین پرونده شما</div>
                    <button onClick={() => onOpenUnit(stats.topMargin!.unit)} className="text-right block w-full">
                      <div className="text-[12px] font-semibold text-slate-800 truncate mt-0.5 hover:text-indigo-700 transition-colors">{stats.topMargin.unit.name}</div>
                      <div className="text-[11px] font-mono text-emerald-700 font-bold mt-0.5">+{fmtPct(stats.topMargin.pct)} مارجین</div>
                    </button>
                  </div>
                </div>
              )}

              <button onClick={() => onNavigate('pipeline')} className="w-full flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-right hover:bg-rose-50 transition-colors">
                <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0"><AlertTriangle className="w-4 h-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-bold text-rose-800">
                    {stats.stuckUnits.length > 0 ? `${fa(stats.stuckUnits.length)} پرونده بیش از ۲۵ روز در گمرک معطل است` : 'هیچ پرونده‌ای در گمرک معطل نیست'}
                  </span>
                  <span className="block text-[11px] text-rose-600/80 mt-0.5">
                    {stats.stuckUnits.length > 0 ? `${fmtBillion(stats.stuckValue)} سرمایه در معرض جریمه روزانه` : 'وضعیت ترخیص سالم است'}
                  </span>
                </span>
                <ArrowLeft className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
              </button>

              <button onClick={() => onNavigate('sourcing')} className="w-full flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-right hover:bg-amber-50 transition-colors">
                <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><Globe2 className="w-4 h-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-bold text-amber-800">
                    {stats.needAudit > 0 ? `${fa(stats.needAudit)} تأمین‌کننده بدون احراز اصالت رسمی` : 'همه تأمین‌کننده‌ها ممیزی شده‌اند'}
                  </span>
                  <span className="block text-[11px] text-amber-600/80 mt-0.5">
                    {stats.awaitingFx > 0 ? `و ${fa(stats.awaitingFx)} پرونده در صف تخصیص ارز` : 'ریسک واسطه‌ای پایش می‌شود'}
                  </span>
                </span>
                <ArrowLeft className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              </button>
            </div>

            <div className="tj-card p-4 xl:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-bold text-slate-800">چرخه عمر پرونده‌ها</h2>
                <button onClick={() => onNavigate('pipeline')} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  کانبان کامل <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {byStage.map((stage) => {
                  const Icon = STAGE_ICONS[stage.status] ?? Boxes;
                  return (
                    <div key={stage.status} className="rounded-xl border border-slate-200 p-3 space-y-2 hover:border-indigo-200 transition-colors">
                      <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center"><Icon className="w-3.5 h-3.5 text-indigo-600" /></span>
                      <div>
                        <div className="text-lg font-bold font-mono text-slate-900 tabular-nums leading-none">{fa(stage.count)}</div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-1 leading-snug">{stage.status}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{fmtMillion(stage.value)} م.ت</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* آخرین پرونده‌ها */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold text-slate-900">آخرین پرونده‌ها</h2>
              <button onClick={() => onNavigate('inventory')} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                همه پرونده‌ها <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="tj-card divide-y divide-slate-100 overflow-hidden">
              {recent.map((u) => (
                <button key={u.id} onClick={() => onOpenUnit(u)} className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[13px] text-slate-800 truncate">{u.name}</span>
                      <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${STATUS_BADGE[u.status]}`}>{u.status}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{u.vinOrCode} · {u.originCountry} · {u.hsCode}</div>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-[13px] font-bold font-mono text-slate-800" dir="ltr">{fmtMillion(u.marketPriceToman * u.stockQty)}</div>
                    <div className="text-[10px] text-slate-400">میلیون تومان</div>
                  </div>
                  <div className="hidden sm:block text-[10px] text-slate-400 shrink-0 w-20 text-left">{faTimeAgo(u.createdAt ?? u.lastUpdated)}</div>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ====================== ابزارها ====================== */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900">ابزارهای سامانه</h2>
            <p className="text-[12px] text-slate-500 mt-0.5">هر بخش یک مرحله از کار واردات را پوشش می‌دهد.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button key={a.label} onClick={a.onClick} className="tj-card p-3.5 text-right hover:border-indigo-200 hover:-translate-y-0.5 hover:shadow-md transition-all group">
                <span className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <Icon className="w-4 h-4 text-indigo-600" />
                </span>
                <span className="block text-[12px] font-semibold text-slate-800 mt-2 group-hover:text-indigo-700 transition-colors">{a.label}</span>
                <span className="block text-[10px] text-slate-400 mt-0.5 leading-snug">{a.desc}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ====================== چرا تجارت‌یار؟ ====================== */}
      <section className="tj-card p-5 space-y-4">
        <h2 className="text-[15px] font-bold text-slate-900">چرا تجارت‌یار؟</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0"><Gauge className="w-4 h-4 text-emerald-600" /></span>
            <div>
              <h3 className="text-[12px] font-bold text-slate-800">شفاف، بدون داده ساختگی</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">همه‌ی اعداد از ورودی شما محاسبه می‌شود؛ مرجع هر نرخ و متدولوژی هر محاسبه در «شناسنامه منابع داده» مستند است.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0"><Scale className="w-4 h-4 text-indigo-600" /></span>
            <div>
              <h3 className="text-[12px] font-bold text-slate-800">تعرفه‌ی مستند</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{fa(HS_CODE_DIRECTORY.length)} کد تعرفه با حقوق ورودی، سود بازرگانی و مجوزها — هر کد با مرجع استنادی و تاریخ بازبینی.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0"><ShieldCheck className="w-4 h-4 text-amber-600" /></span>
            <div>
              <h3 className="text-[12px] font-bold text-slate-800">ریسک پیش از خسارت</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">اعتبارسنجی قاعده‌محور تأمین‌کننده (تشخیص واسطه، دامنه رایگان، ناسازگاری کشور/دامنه) و هشدار معطلی گمرک.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

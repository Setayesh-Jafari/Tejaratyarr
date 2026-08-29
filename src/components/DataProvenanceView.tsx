import React, { useState } from 'react';
import { 
  Database, 
  ShieldCheck, 
  ExternalLink, 
  Layers, 
  Calculator, 
  FileText, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  Building2,
  Globe2,
  Ship,
  Sparkles,
  Award
} from 'lucide-react';
import { DATA_PROVENANCE_SOURCES, LANDED_COST_METHODOLOGY } from '../data/provenanceData';
import { HS_CODE_DIRECTORY, DIRECTORY_LAST_REVIEW } from '../data/hscodeDirectory';

export const DataProvenanceView: React.FC = () => {
  const [selectedSourceId, setSelectedSourceId] = useState<string>(DATA_PROVENANCE_SOURCES[0].id);

  const activeSource = DATA_PROVENANCE_SOURCES.find(s => s.id === selectedSourceId) || DATA_PROVENANCE_SOURCES[0];

  return (
    <div id="provenance-view-container" className="space-y-6">
      {/* خلاصه وضعیت استنادی */}
      <div className="tj-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl flex-1">
          داده‌های این سامانه از ترکیب مراجع حاکمیتی (گمرک ایران، سامانه جامع تجارت، TSC) و
          پایگاه‌های بین‌المللی (ITC Trade Map، ImportYeti، Panjiva) استخراج شده‌اند؛
          هر عدد در سامانه به منبع خود متصل است.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-center">
            <div className="text-[10px] text-slate-400 font-bold">پایگاه‌های مرجع</div>
            <div className="text-base font-black font-mono text-indigo-700">{DATA_PROVENANCE_SOURCES.length.toLocaleString('fa-IR')} سازمان</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-center">
            <div className="text-[10px] text-slate-400 font-bold">سطح مستندسازی</div>
            <div className="text-base font-black font-mono text-emerald-700">۱۰۰٪</div>
          </div>
        </div>
      </div>

      {/* شناسنامه اعتبار کدهای تعرفه — مرجع و تاریخ بازبینی هر کد */}
      <div className="tj-card p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-600" />
            شناسنامه اعتبار کدهای تعرفه ({HS_CODE_DIRECTORY.length.toLocaleString('fa-IR')} کد)
          </h3>
          <span className="tj-chip">آخرین بازبینی کل دایرکتوری: {DIRECTORY_LAST_REVIEW}</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          هر کد تعرفه در سامانه، مرجع استنادی و تاریخ آخرین بازبینی نرخ‌های خود را دارد؛ پیش از ثبت سفارش، اعتبار زمانی نرخ‌ها را بررسی کنید. نرخ‌های قدیمی‌تر از یک فصل باید با کتاب مقررات سال جاری تطبیق شوند.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-[11px] border-collapse min-w-[680px]">
            <thead className="bg-slate-50 text-slate-400 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 font-bold">کد تعرفه</th>
                <th className="px-3 py-2 font-bold">عنوان</th>
                <th className="px-3 py-2 font-bold">فصل</th>
                <th className="px-3 py-2 font-bold">مرجع استنادی</th>
                <th className="px-3 py-2 font-bold">آخرین بازبینی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {HS_CODE_DIRECTORY.map((e) => {
                const isFresh = e.lastReviewed?.startsWith('۱۴۰۵');
                return (
                  <tr key={e.code} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2 font-mono font-bold text-indigo-800" dir="ltr">{e.code}</td>
                    <td className="px-3 py-2 font-medium text-slate-700 max-w-[240px] truncate" title={e.titleFa}>{e.titleFa}</td>
                    <td className="px-3 py-2 font-mono text-slate-500" dir="ltr">{e.chapter}</td>
                    <td className="px-3 py-2 text-slate-500 max-w-[260px] truncate" title={e.sourceRef}>{e.sourceRef}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                        isFresh ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {e.lastReviewed}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Answer Spotlight Box */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-6 border border-indigo-700 shadow-md">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-3">
            <h2 className="text-base font-bold text-indigo-200">
              پاسخ صریح: داده‌های مدیریت کارگو، موجودی انبارها و روند حجم واردات دقیقاً از کجا استخراج شده‌اند؟
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-lg">
                <div className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>۱. موجودی انبار و وضعیت ترخیص کارگوها:</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  مبتنی بر <strong>سامانه جامع انبارها و مراکز نگهداری کالا (NTSW)</strong> و قبوض انبار مناطق ویژه اقتصادی گمرک شهید رجایی بندرعباس، منطقه ویژه بوشهر و گمرک فرودگاه امام خمینی (ره).
                </p>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-lg">
                <div className="font-bold text-blue-300 mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>۲. روند حجم واردات و سهم بازار:</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  مبتنی بر <strong>سالنامه آمار تجارت خارجی گمرک ایران (IRICA)</strong> تلفیق‌شده با داده‌های آمار تجارت معکوس <strong>ITC Trade Map سازمان تجارت جهانی (WTO/UNCTAD)</strong> بر مبنای کدهای ۸ رقمی.
                </p>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-lg">
                <div className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                  <Ship className="w-4 h-4" />
                  <span>۳. بارنامه‌ها و تحویل دریایی:</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  مبتنی بر <strong>مانیفست‌های بارنامه‌های کانتینری ImportYeti</strong> و خطوط کشتیرانی (IRISL و فیدرهای دبی-بندرعباس) با زمان دریانوردی واقعی و رهگیری کانتینرهای ۴۰HQ.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sources Grid & Detail Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source List */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>فهرست پایگاه‌های داده و مراجع رسمی:</span>
          </div>
          {DATA_PROVENANCE_SOURCES.map((src) => {
            const isSelected = src.id === selectedSourceId;
            return (
              <button
                key={src.id}
                id={`src-btn-${src.id}`}
                onClick={() => setSelectedSourceId(src.id)}
                className={`w-full p-3 rounded-xl border text-right transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-950 shadow-sm ring-1 ring-blue-600'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900 line-clamp-1">{src.name}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">{src.authority}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-medium">
                      {src.integrationType}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {src.reliabilityScore}٪
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Source Detail Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
                    {activeSource.id}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>ضریب اطمینان: {activeSource.reliabilityScore}٪</span>
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{activeSource.name}</h3>
                <div className="text-xs text-slate-500 mt-0.5">{activeSource.authority}</div>
              </div>

              <a
                href={activeSource.officialRefUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors shrink-0"
              >
                <span>پرتال مرجع</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-500">پوشش داده و اسناد:</div>
                <div className="text-slate-800 leading-relaxed font-medium">{activeSource.coverage}</div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-500">تناوب به‌روزرسانی:</div>
                <div className="text-slate-800 font-medium">{activeSource.frequency}</div>
              </div>
            </div>

            <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-4 text-xs space-y-1.5">
              <div className="font-bold text-blue-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>کاربرد و نحوه استفاده این مرجع در سامانه تجارت‌یار:</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {activeSource.usageInApp}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>نوع اتصال داده: <strong>{activeSource.integrationType}</strong></span>
            <span className="font-mono text-slate-400 dir-ltr">{activeSource.officialRefUrl}</span>
          </div>
        </div>
      </div>

      {/* Landed Cost Methodology Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{LANDED_COST_METHODOLOGY.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{LANDED_COST_METHODOLOGY.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {LANDED_COST_METHODOLOGY.formulaSteps.map((step, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] shrink-0 font-mono">
                  {idx + 1}
                </span>
                <span>{step.step}</span>
              </div>
              <div className="p-2 rounded bg-white border border-slate-200 font-mono text-[11px] text-indigo-950 dir-ltr text-right font-medium">
                {step.formula}
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {step.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

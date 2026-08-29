import React, { useState, useMemo, useEffect } from 'react';
import { 
  HsDisputeScenario, 
  VerificationState,
  AiHsSuggestion
} from '../types';
import { HS_DISPUTE_SCENARIOS } from '../data/hscodeScenarios';
import { HS_CODE_DIRECTORY, CATEGORIES_WITH_COUNTS, HsCodeDatabaseEntry } from '../data/hscodeDirectory';
import { matchesQuery } from '../lib/search';
import { api } from '../lib/api';
import { AiHsSuggestCard } from './AiAssist';
import { 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Search, 
  BookOpen, 
  Cpu, 
  Layers, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldAlert,
  ShieldCheck, 
  ArrowRightLeft,
  Filter,
  Flame,
  Scale,
  DollarSign,
  ChevronDown,
  Building,
  Sparkles,
  Info,
  X,
  FileCheck2,
  FolderTree,
  TrendingDown,
  Loader2,
  Send
} from 'lucide-react';

interface HsCodeResolverProps {
  onSelectFinalCode?: (code: string, desc: string, duty: number) => void;
}

// کد تعرفه پیشنهادی سناریو: کدی از میان کدهای رقیب که پرچم isRecommended دارد
const getRecommendedCode = (scenario: HsDisputeScenario): string => {
  return scenario.competingCodes.find((c) => c.isRecommended)?.code ?? scenario.competingCodes[0].code;
};

export const HsCodeResolver: React.FC<HsCodeResolverProps> = ({ onSelectFinalCode }) => {
  // Navigation mode: 'interactive_scenarios' (dispute scenarios) vs 'comprehensive_directory' (searchable tariff book)
  const [viewMode, setViewMode] = useState<'interactive_scenarios' | 'comprehensive_directory'>('interactive_scenarios');

  // Scenario state
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(HS_DISPUTE_SCENARIOS[0].id);
  const [selectedCandidateCode, setSelectedCandidateCode] = useState<string>(
    getRecommendedCode(HS_DISPUTE_SCENARIOS[0])
  );
  const [activeTab, setActiveTab] = useState<'comparison' | 'decision_tree' | 'legal_notes'>('comparison');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Directory state (free-text / category search)
  const [directorySearch, setDirectorySearch] = useState('');
  const [selectedDirectoryCategory, setSelectedDirectoryCategory] = useState('همه دسته‌بندی‌ها');
  const [customEntries, setCustomEntries] = useState<HsCodeDatabaseEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<HsCodeDatabaseEntry | null>(HS_CODE_DIRECTORY[0]);

  // AI live search state for ANY commodity in the world
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchError, setAiSearchError] = useState<string | null>(null);
  const [aiSearchMessage, setAiSearchMessage] = useState<string | null>(null);

  // Combined Directory: Custom AI Lookups + Full Baseline Database
  const combinedDirectory = useMemo(() => {
    return [...customEntries, ...HS_CODE_DIRECTORY];
  }, [customEntries]);

  // Current Scenario
  const currentScenario = useMemo(() => {
    return HS_DISPUTE_SCENARIOS.find((s) => s.id === selectedScenarioId) || HS_DISPUTE_SCENARIOS[0];
  }, [selectedScenarioId]);

  // Current Selected Code Candidate within scenario
  const selectedCodeObj = useMemo(() => {
    return (
      currentScenario.competingCodes.find((c) => c.code === selectedCandidateCode) ||
      currentScenario.competingCodes.find((c) => c.code === getRecommendedCode(currentScenario)) ||
      currentScenario.competingCodes[0]
    );
  }, [currentScenario, selectedCandidateCode]);

  // Directory Search Filtering — تطبیق واژه‌محور
  const filteredDirectory = useMemo(() => {
    return combinedDirectory.filter((entry) => {
      // Category filter
      const matchesCategory = 
        selectedDirectoryCategory === 'همه دسته‌بندی‌ها' || 
        entry.category === selectedDirectoryCategory;

      // Text search — واژه‌کامل/پیشوندی با نرمال‌سازی فارسی
      let matchesText = true;
      if (directorySearch.trim()) {
        const samples = entry.sampleProducts ?? [];
        const permits = entry.mandatoryPermits ?? [];
        const fxTypes = entry.allowedFxTypes ?? [];
        const corpus = [
          entry.code,
          entry.titleFa,
          entry.titleEn,
          entry.category,
          entry.chapterFa ?? '',
          entry.samtGroup,
          entry.specifications ?? '',
          entry.tscReference ?? '',
          ...samples,
          ...permits,
          ...fxTypes
        ].join(' ');

        matchesText = matchesQuery(directorySearch, corpus);
      }

      return matchesCategory && matchesText;
    });
  }, [combinedDirectory, directorySearch, selectedDirectoryCategory]);

  // ✦ رفع باگ «شناسنامه گیرکرده»: هر بار نتایج فیلتر شوند، اگر انتخاب فعلی در نتایج نباشد اولین نتیجه انتخاب می‌شود
  useEffect(() => {
    if (filteredDirectory.length > 0 && !filteredDirectory.some((e) => e.code === selectedEntry?.code)) {
      setSelectedEntry(filteredDirectory[0]);
    }
  }, [filteredDirectory]);

  // استعلام زنده هوش مصنوعی برای هر کالای دلخواه در تمام ۹۸ فصل کتاب تعرفه
  const handleAiInquiry = async (queryText?: string) => {
    const query = (queryText ?? directorySearch).trim();
    if (!query) return;

    setIsAiSearching(true);
    setAiSearchError(null);
    setAiSearchMessage(null);

    try {
      const res = await api.aiHsSuggest({
        productName: query,
        category: selectedDirectoryCategory !== 'همه دسته‌بندی‌ها' ? selectedDirectoryCategory : undefined
      });

      if (res.suggestions && res.suggestions.length > 0) {
        const newEntries: HsCodeDatabaseEntry[] = res.suggestions.map((s: AiHsSuggestion) => ({
          code: s.code,
          titleFa: s.title,
          titleEn: s.titleEn || 'Customs Tariff Commodity',
          category: s.category || (selectedDirectoryCategory !== 'همه دسته‌بندی‌ها' ? selectedDirectoryCategory : 'کالاهای بازرگانی'),
          chapter: `فصل ${s.code.substring(0, 2)}`,
          chapterFa: `فصل ${s.code.substring(0, 2)} مقررات صادرات و واردات`,
          customsDuty: s.customsDuty ?? 4,
          commercialProfit: s.commercialProfit ?? Math.max(0, (s.dutyTotalPct ?? 4) - (s.customsDuty ?? 4)),
          totalTariffPercent: s.dutyTotalPct ?? 4,
          vatRate: s.vatRate ?? 10,
          samtGroup: s.samtGroup || 'گروه ۲۲',
          allowedFxTypes: s.allowedFxTypes || ['نیما', 'تالار دوم'],
          mandatoryPermits: s.mandatoryPermits || ['سازمان ملی استاندارد'],
          specifications: s.specifications || s.reasoning,
          tscReference: s.tscReference || `شناسه TSC: ${s.code.replace(/\./g, '')}00000001`,
          sourceRef: `استعلام رسمی هوشمند (${res.engine === 'gemini' ? 'هوش مصنوعی Gemini' : 'موتور تعرفه'})`,
          sampleProducts: [query, s.title],
          isPriority: true,
          notes: s.reasoning,
          lastReviewed: '۱۴۰۴ (استعلام زنده)'
        }));

        setCustomEntries((prev) => {
          const existingCodes = new Set(prev.map(p => p.code));
          const toAdd = newEntries.filter(n => !existingCodes.has(n.code));
          return [...toAdd, ...prev];
        });

        if (newEntries.length > 0) {
          setSelectedEntry(newEntries[0]);
          if (onSelectFinalCode) {
            onSelectFinalCode(newEntries[0].code, newEntries[0].titleFa, newEntries[0].totalTariffPercent);
          }
        }

        setAiSearchMessage(`کد تعرفه ۸ رقمی و مشخصات فنی کالای «${query}» با موفقیت از کتاب مقررات صادرات و واردات استخراج شد.`);
      } else {
        setAiSearchError('کالایی با این مشخصات یافت نشد. لطفاً نام تجاری یا مشخصات دقیق‌تری وارد کنید.');
      }
    } catch (err: any) {
      setAiSearchError(err?.message || 'خطا در ارتباط با سرور استعلام تعرفه');
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleRunSearchOrAi = () => {
    if (!directorySearch.trim()) return;
    if (filteredDirectory.length === 0) {
      handleAiInquiry();
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSelectCode = (code: string) => {
    setSelectedCandidateCode(code);
    const item = currentScenario.competingCodes.find(c => c.code === code);
    if (item && onSelectFinalCode) {
      onSelectFinalCode(item.code, item.titleFa, item.totalTariffPercent);
    }
  };

  const handleSelectDirectoryEntry = (entry: HsCodeDatabaseEntry) => {
    setSelectedEntry(entry);
    if (onSelectFinalCode) {
      onSelectFinalCode(entry.code, entry.titleFa, entry.totalTariffPercent);
    }
  };

  return (
    <div id="hs-code-resolver-module" className="space-y-3.5 text-right">
      {/* دستیار هوشمند پیشنهاد تعرفه */}
      <AiHsSuggestCard />

      {/* نوار حالت — سناریوها یا دایرکتوری */}
      <div className="tj-card p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setViewMode('interactive_scenarios')}
            className={`text-[11px] font-bold px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'interactive_scenarios' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>سناریوهای اختلافی گمرک</span>
          </button>
          <button
            onClick={() => setViewMode('comprehensive_directory')}
            className={`text-[11px] font-bold px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'comprehensive_directory' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-teal-600" />
            <span>جستجوی آزاد و استعلام کل کتاب تعرفه</span>
          </button>
        </div>
        <span className="text-[10px] text-slate-400 font-medium px-2">
          پشتیبانی از کلیه ۹۸ فصل کتاب مقررات صادرات و واردات و تعرفه‌های جهانی WCO
        </span>
      </div>

      {/* VIEW MODE 1: COMPREHENSIVE DIRECTORY & FREE TEXT SEARCH */}
      {viewMode === 'comprehensive_directory' && (
        <div className="space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch gap-3">
              {/* Live Search Input with Explicit Search Button */}
              <div className="relative flex-1 flex items-stretch">
                <input
                  type="text"
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleRunSearchOrAi();
                    }
                  }}
                  placeholder="نام هر کالایی را تایپ کنید (مثلاً: پنل خورشیدی، اینورتر، ورق گالوانیزه، گندم، پلی‌اتیلن، لاستیک، سونوگرافی، دستگاه CNC، قهوه)..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:bg-white text-slate-900 rounded-r-xl py-3 pr-11 pl-20 text-xs md:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-sans transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                
                <div className="absolute left-3 top-2.5 flex items-center gap-1.5">
                  {directorySearch && (
                    <button
                      onClick={() => setDirectorySearch('')}
                      className="text-xs text-slate-500 hover:text-slate-800 bg-slate-200 px-2 py-1 rounded cursor-pointer"
                      title="پاک کردن"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {filteredDirectory.length} کالا
                  </span>
                </div>

                {/* کلید اختصاصی جستجو و استعلام */}
                <button
                  onClick={handleRunSearchOrAi}
                  disabled={isAiSearching}
                  className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white font-bold text-xs px-4 md:px-6 rounded-l-xl flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-sm"
                  title="جستجو در بانک و استعلام خودکار هوش مصنوعی"
                >
                  {isAiSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Search className="w-4 h-4 text-white" />
                  )}
                  <span className="whitespace-nowrap">{isAiSearching ? 'در حال استعلام...' : 'جستجو و استعلام'}</span>
                </button>
              </div>

              {/* Category Dropdown */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-600">دسته‌بندی:</span>
                <select
                  value={selectedDirectoryCategory}
                  onChange={(e) => setSelectedDirectoryCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {CATEGORIES_WITH_COUNTS.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI Live Inquire Banner for Universal Products */}
            {directorySearch.trim() && (
              <div className="flex items-center justify-between flex-wrap gap-2 bg-indigo-50/70 border border-indigo-200 rounded-xl p-2.5 px-3">
                <div className="flex items-center gap-2 text-xs text-indigo-950">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    می‌خواهید برای <strong>«{directorySearch}»</strong> استعلام زنده ۸ رقمی با مأخذ سود بازرگانی و مجوزهای قانونی دریافت کنید؟
                  </span>
                </div>
                <button
                  onClick={() => handleAiInquiry()}
                  disabled={isAiSearching}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isAiSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{isAiSearching ? 'در حال استخراج تعرفه...' : 'استعلام تخصصی هوش مصنوعی'}</span>
                </button>
              </div>
            )}

            {aiSearchMessage && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{aiSearchMessage}</span>
              </div>
            )}

            {aiSearchError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{aiSearchError}</span>
              </div>
            )}

            {/* Quick Product Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-500 font-semibold shrink-0">محصولات پرجستجو:</span>
              {[
                'پنل خورشیدی کامل',
                'اینورتر On-Grid',
                'باتری لیتیومی خورشیدی',
                'خودرو تمام برقی BEV',
                'ورق گالوانیزه رول',
                'کاتد مس خالص',
                'سونوگرافی داپلر',
                'دستگاه برش لیزر CNC',
                'گندم خوراکی',
                'برنج باسماتی ۱۱۲۱',
                'پلی‌اتیلن LDPE',
                'پودر PVC',
                'کود اوره',
                'لپ‌تاپ مهندسی',
                'گوشی موبایل هوشمند',
                'بیل مکانیکی کوماتسو'
              ].map((pill) => (
                <button
                  key={pill}
                  onClick={() => {
                    setDirectorySearch(pill);
                    setSelectedDirectoryCategory('همه دسته‌بندی‌ها');
                  }}
                  className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-200 whitespace-nowrap transition-colors cursor-pointer"
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Results Grid & Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left/Middle: List of Matches */}
            <div className="lg:col-span-2 space-y-3">
              {filteredDirectory.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
                    <Sparkles className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      کالای «{directorySearch}» در بانک مقدماتی یافت نشد
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      سامانه قابلیت استعلام و بررسی <strong>تمامی کالاهای بازرگانی جهان</strong> در کل ۹۸ فصل کتاب مقررات صادرات و واردات را دارد.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                    <button
                      onClick={() => handleAiInquiry()}
                      disabled={isAiSearching}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      {isAiSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>{isAiSearching ? 'در حال استخراج تعرفه...' : `استعلام فوری تعرفه برای «${directorySearch}»`}</span>
                    </button>
                    <button
                      onClick={() => {
                        setDirectorySearch('');
                        setSelectedDirectoryCategory('همه دسته‌بندی‌ها');
                      }}
                      className="w-full sm:w-auto text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer"
                    >
                      نمایش تمام {combinedDirectory.length} کالای موجود در دایرکتوری
                    </button>
                  </div>
                </div>
              ) : (
                filteredDirectory.map((entry) => {
                  const isSelected = selectedEntry?.code === entry.code;
                  return (
                    <div
                      key={entry.code}
                      onClick={() => handleSelectDirectoryEntry(entry)}
                      className={`p-4 rounded-xl border bg-white cursor-pointer transition-all flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-xs ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/10'
                          : 'border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-sm font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                              {entry.code}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                              {entry.category}
                            </span>
                            {entry.isPriority && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                اولویت وارداتی
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {entry.titleFa}
                          </h4>
                          <p className="text-xs font-mono text-slate-500 mt-0.5 dir-ltr text-right">
                            {entry.titleEn}
                          </p>
                        </div>

                        <div className="text-left shrink-0 bg-slate-50 border border-slate-200 p-2 rounded-lg text-center min-w-[70px]" dir="ltr">
                          <span className="text-[10px] text-slate-400 font-bold block">حقوق ورودی</span>
                          <span className="text-base font-black font-mono text-slate-900">
                            {entry.totalTariffPercent}%
                          </span>
                        </div>
                      </div>

                      {/* Sample Products Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-slate-400 font-medium">نمونه مصادیق تجاری:</span>
                        {entry.sampleProducts.map((p, i) => (
                          <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {p}
                          </span>
                        ))}
                      </div>

                      {/* Key Indicators Footer */}
                      <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-3">
                          <span>گروه صمت: <strong className="text-slate-800">{entry.samtGroup.split(' ')[1] || entry.samtGroup}</strong></span>
                          <span>مالیات ارزش افزوده: <strong className="text-slate-800">%{entry.vatRate}</strong></span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCode(entry.code);
                          }}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200"
                        >
                          {copiedCode === entry.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>کپی کد تعرفه</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: Selected Entry Deep Inspector Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 sticky top-4 h-fit">
              {selectedEntry ? (
                <>
                  <div className="pb-3 border-b border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                        شناسنامه فنی کد تعرفه
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="همگام با جستجو و انتخاب شما" />
                      </span>
                      <span className="font-mono text-base font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300">
                        {selectedEntry.code}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-2 leading-snug">
                      {selectedEntry.titleFa}
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400 mt-1 text-left" dir="ltr">
                      {selectedEntry.titleEn}
                    </p>
                  </div>

                  {/* Tariff & Customs Breakdown */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">حقوق گمرکی</span>
                      <span className="font-bold font-mono text-slate-800 text-sm">%{selectedEntry.customsDuty}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">سود بازرگانی</span>
                      <span className="font-bold font-mono text-slate-800 text-sm">%{selectedEntry.commercialProfit}</span>
                    </div>
                    <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-200 text-indigo-900">
                      <span className="text-[10px] text-indigo-700 block font-bold">مجموع ورودی</span>
                      <span className="font-black font-mono text-indigo-900 text-sm">%{selectedEntry.totalTariffPercent}</span>
                    </div>
                  </div>

                  {/* Specifications & Technical Criteria */}
                  <div className="space-y-1.5 text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      مشخصات فیزیکی و الزامات انطباق:
                    </span>
                    <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
                      {selectedEntry.specifications}
                    </p>
                  </div>

                  {/* SAMT & FX Allocation Rules */}
                  <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">گروه اولویت‌بندی صمت:</span>
                      <span className="font-bold text-slate-800">{selectedEntry.samtGroup}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">کانال تخصیص ارز:</span>
                      <span className="font-bold text-slate-800">{selectedEntry.allowedFxTypes.join(' یا ')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">شناسه ارزش TSC گمرک:</span>
                      <span className="font-mono text-slate-800 text-[11px]">{selectedEntry.tscReference}</span>
                    </div>
                  </div>

                  {/* Mandatory Permits Checklist */}
                  <div className="space-y-1.5 text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                      مجوزهای قانونی اجباری برای ترخیص:
                    </span>
                    <ul className="space-y-1 pr-4 list-disc text-slate-700 text-[11px]">
                      {selectedEntry.mandatoryPermits.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Common Mistakes Warning */}
                  {selectedEntry.commonMistakesWarning && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-xs space-y-1">
                      <span className="font-bold flex items-center gap-1 text-amber-900">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        هشدار اشتباه در ثبت:
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        {selectedEntry.commonMistakesWarning}
                      </p>
                    </div>
                  )}

                  {/* شناسنامه استنادی — مرجع و تاریخ بازبینی */}
                  <div className="text-[10px] leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-600">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      شناسنامه استنادی این کد
                    </div>
                    <p className="text-slate-500">
                      مرجع: <span className="text-slate-700 font-medium">{selectedEntry.sourceRef ?? 'کتاب مقررات صادرات و واردات'}</span>
                    </p>
                    <p className="text-slate-500">
                      آخرین بازبینی نرخ‌ها: <span className="text-slate-700 font-mono">{selectedEntry.lastReviewed ?? '—'}</span>
                    </p>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      if (onSelectFinalCode) {
                        onSelectFinalCode(selectedEntry.code, selectedEntry.titleFa, selectedEntry.totalTariffPercent);
                      }
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-xs text-xs flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>انتخاب این کد برای ثبت سفارش و محاسبات هزینه</span>
                  </button>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  یک کالا را از لیست سمت راست انتخاب نمایید.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: INTERACTIVE DISPUTE SCENARIOS */}
      {viewMode === 'interactive_scenarios' && (
        <div className="space-y-4">
          {/* Scenario Selector Carousel */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>پرونده‌های پرتکرار اختلاف تعرفه و تعارض در گمرکات ایران (انتخاب پرونده):</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {HS_DISPUTE_SCENARIOS.length} پرونده داغ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {HS_DISPUTE_SCENARIOS.map((sc) => {
                const isSelected = sc.id === selectedScenarioId;
                return (
                  <button
                    key={sc.id}
                    onClick={() => {
                      setSelectedScenarioId(sc.id);
                      setSelectedCandidateCode(getRecommendedCode(sc));
                    }}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                          {sc.category}
                        </span>
                        <span className="text-rose-600 font-semibold text-[10px] flex items-center gap-0.5">
                          <Flame className="w-3 h-3" />
                          ریسک بالا
                        </span>
                      </div>
                      <h4 className="text-xs font-bold leading-snug line-clamp-2">{sc.productNameFa}</h4>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>کدهای درگیر: {sc.competingCodes.length} تعرفه</span>
                      <span className="font-mono text-indigo-700 font-bold">{getRecommendedCode(sc)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scenario Problem & Key Decision Statement */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-orange-50/40 border border-amber-200/80 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 border border-amber-300 text-amber-800 rounded-lg shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-amber-950">چرا این کالا مکرراً دچار اشتباه در ثبت تعرفه می‌شود؟</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-200/60 text-amber-900 font-medium">هشدار اختلاف گمرکی</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {currentScenario.problemStatement}
                  </p>
                  <div className="pt-2 border-t border-amber-200/60 flex items-start gap-2 text-xs text-rose-900 bg-rose-50/60 p-2.5 rounded-lg border border-rose-200/60">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">اشتباه رایج واردکنندگان و ترخیص‌کاران: </strong>
                      <span>{currentScenario.commonMistake}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm mb-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>سؤال کلیدی تفکیک فنی (Decision Trigger)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {currentScenario.keyDecisionQuestion}
                </p>
              </div>
              
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">مستند قانونی:</span>
                <span className="font-medium text-slate-700 line-clamp-1 text-left">{currentScenario.legalBasis}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 gap-4">
            <button
              onClick={() => setActiveTab('comparison')}
              className={`pb-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'comparison'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>جدول مقایسه تطبیقی کدهای رقیب ({currentScenario.competingCodes.length} کد تعرفه)</span>
            </button>
            <button
              onClick={() => setActiveTab('decision_tree')}
              className={`pb-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'decision_tree'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>درخت تصمیم و راهنمای گام‌به‌گام تفکیک</span>
            </button>
            <button
              onClick={() => setActiveTab('legal_notes')}
              className={`pb-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'legal_notes'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>توصیه کارشناس ارشد و احکام قانونی کتاب تعرفه</span>
            </button>
          </div>

          {/* Main View: Comparison Cards */}
          {activeTab === 'comparison' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {currentScenario.competingCodes.map((codeItem) => {
                  const isSelected = selectedCodeObj.code === codeItem.code;
                  const isRec = codeItem.isRecommended;

                  return (
                    <div
                      key={codeItem.code}
                      id={`code-card-${codeItem.code}`}
                      className={`rounded-xl border transition-all flex flex-col justify-between relative bg-white shadow-sm overflow-hidden ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-600/30'
                          : isRec
                          ? 'border-emerald-300 hover:border-emerald-400'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Card Header */}
                      <div className={`p-4 border-b ${
                        isRec 
                          ? 'bg-emerald-50/70 border-emerald-200/80' 
                          : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-base font-bold text-slate-900 tracking-wider bg-white px-2 py-0.5 rounded border border-slate-300 shadow-2xs">
                                {codeItem.code}
                              </span>
                              <button
                                onClick={() => handleCopyCode(codeItem.code)}
                                title="کپی کد تعرفه"
                                className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
                              >
                                {copiedCode === codeItem.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">{codeItem.titleFa}</h4>
                            <div className="text-[11px] font-mono text-slate-500 line-clamp-1 mt-0.5 dir-ltr text-right">{codeItem.titleEn}</div>
                          </div>

                          {isRec ? (
                            <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>گزینه استاندارد و قطعی</span>
                            </span>
                          ) : (
                            <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              تعرفه ثانویه / مشروط
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-3.5 text-xs">
                        {/* Tariff Metrics */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                          <div>
                            <span className="text-[10px] text-slate-400 block">حقوق گمرکی:</span>
                            <span className="font-mono font-bold text-slate-700">{codeItem.customsDuty}٪</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">سود بازرگانی:</span>
                            <span className="font-mono font-bold text-slate-700">{codeItem.commercialProfit}٪</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-indigo-700 font-bold block">مجموع ورودی:</span>
                            <span className="font-mono font-bold text-indigo-900 text-sm">{codeItem.totalTariffPercent}٪</span>
                          </div>
                        </div>

                        {/* Technical Criteria */}
                        <div>
                          <div className="text-slate-500 font-semibold mb-1 flex items-center gap-1 text-[11px]">
                            <Cpu className="w-3 h-3 text-indigo-600" />
                            <span>معیار فنی انطباق این ردیف:</span>
                          </div>
                          <p className="text-slate-700 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 leading-relaxed text-[11px]">
                            {codeItem.technicalDiscriminator}
                          </p>
                        </div>

                        {/* Financial and FX */}
                        <div className="space-y-1.5 pt-1 border-t border-slate-100 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">گروه کالایی صمت:</span>
                            <span className="font-semibold text-slate-800">{codeItem.samtGroup}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">کانال تخصیص ارز:</span>
                            <span className="font-semibold text-slate-800">{codeItem.allowedFxTypes.join(' یا ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">شناسه ارزش TSC گمرک:</span>
                            <span className="font-mono text-slate-800 text-[10px]">{codeItem.tscIdSample}</span>
                          </div>
                        </div>

                        {/* Mandatory Permits */}
                        <div>
                          <div className="text-slate-500 font-semibold mb-1 text-[11px]">مجوزهای ترخیص الزامی:</div>
                          <div className="flex flex-wrap gap-1">
                            {codeItem.mandatoryPermits.map((p, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded border border-slate-200">
                                ✓ {p}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Risk Notes */}
                        {codeItem.riskNotes && (
                          <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-amber-900 text-[11px] leading-relaxed">
                            <strong>ریسک اظهار نادرست: </strong>
                            {codeItem.riskNotes}
                          </div>
                        )}
                      </div>

                      {/* Card Footer Button */}
                      <div className="p-3 bg-slate-50 border-t border-slate-200">
                        <button
                          onClick={() => handleSelectCode(codeItem.code)}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-white" />
                              <span>این کد به عنوان کد مبنا انتخاب شد</span>
                            </>
                          ) : (
                            <span>انتخاب و مبنا قرار دادن کد {codeItem.code}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab: Decision Tree */}
          {activeTab === 'decision_tree' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-r-4 border-indigo-600 pr-4">
                <h3 className="text-base font-bold text-slate-900">درخت تصمیم و الگوریتم غربالگری تعرفه</h3>
                <p className="text-xs text-slate-600 mt-1">
                  پاسخ به سؤال زیر مستقیماً کد تعرفه اظهارنامه شما را مشخص می‌کند:
                </p>
              </div>

              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl text-center space-y-2">
                <span className="text-xs font-semibold text-indigo-800">مرحله ۱: بررسی مؤلفه فیزیکی و کارکردی</span>
                <p className="text-sm font-bold text-indigo-950 max-w-xl mx-auto">
                  «{currentScenario.keyDecisionQuestion}»
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentScenario.competingCodes.map((code) => (
                  <div
                    key={code.code}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                          {code.code}
                        </span>
                        <span className="text-xs font-bold text-slate-700">{code.titleFa}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        <strong>شرط انطباق فیزیکی: </strong>
                        {code.technicalDiscriminator}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        handleSelectCode(code.code);
                        setActiveTab('comparison');
                      }}
                      className="w-full py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs"
                    >
                      تأیید و انتخاب کد {code.code}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Legal Notes */}
          {activeTab === 'legal_notes' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
              <div className="border-r-4 border-indigo-600 pr-4">
                <h3 className="text-base font-bold text-slate-900">مستندات قانونی و احکام کتاب مقررات صادرات و واردات ۱۴۰۳</h3>
                <p className="text-xs text-slate-600 mt-1">{currentScenario.legalBasis}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-3 leading-relaxed">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm text-indigo-900">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>توصیه تخصصی کارشناس ارشد ترخیص و ممیزی گمرک:</span>
                </div>
                <p className="bg-white p-3 rounded-lg border border-slate-200">
                  {currentScenario.expertAdvice}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>ماده ۱۰۸ قانون امور گمرکی (جریمه تفاوت سود بازرگانی):</span>
                  </div>
                  <p className="leading-relaxed">
                    هرگاه کالایی با کد تعرفه اشتباه اظهار گردد که حقوق ورودی آن کمتر از مأخذ واقعی باشد، علاوه بر اخذ مابه‌التفاوت حقوق ورودی، جریمه‌ای از ۱۰٪ تا ۱۰۰٪ مابه‌التفاوت طبق تشخیص رئیس گمرک تعلق می‌گیرد.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>استعلام رسمی تعرفه قبل از ورود کالا (ماده ۲۷ آیین‌نامه اجرایی):</span>
                  </div>
                  <p className="leading-relaxed">
                    واردکنندگان می‌توانند قبل از ثبت سفارش و ورود قطعی کالا، با ارائه نمونه یا کاتالوگ فنی به دفتر تعرفه گمرک ایران، کتباً استعلام تعرفه رسمی (تعرفه تشخیصی) دریافت نمایند تا از هرگونه اختلاف آتی مصون باشند.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

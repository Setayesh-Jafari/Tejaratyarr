import React, { useState, useMemo, useTransition } from 'react';
import { 
  Search, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  HelpCircle, 
  Info,
  Copy, 
  Send, 
  FileCheck2, 
  Globe, 
  Database, 
  Cpu, 
  BookOpen, 
  Flame, 
  Layers, 
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  X,
  FileText,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { IntelligenceSearchResult, SearchEngineSource, VerificationState } from '../types';
import { INTELLIGENCE_RECORDS } from '../data/mockData';

interface TradeIntelligenceSearchProps {
  onOpenAssessment: () => void;
  onOpenRfq: (title: string, origin: string) => void;
}

export const TradeIntelligenceSearch: React.FC<TradeIntelligenceSearchProps> = ({
  onOpenAssessment,
  onOpenRfq,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<string>('all');
  const [selectedVerification, setSelectedVerification] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCardId, setExpandedCardId] = useState<string | null>('INT-ITC-01');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const engines = [
    { id: 'all', label: 'همه ابزارها و منابع', icon: Database, count: INTELLIGENCE_RECORDS.length },
    { id: 'trademap', label: 'ITC Trade Map (سازمان تجارت جهانی)', icon: Globe, count: INTELLIGENCE_RECORDS.filter(r => r.engineKey === 'trademap').length, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'importyeti', label: 'ImportYeti (تحلیل بارنامه‌های دریایی)', icon: Layers, count: INTELLIGENCE_RECORDS.filter(r => r.engineKey === 'importyeti').length, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
    { id: 'panjiva', label: 'Panjiva / S&P (زنجیره تأمین بین‌الملل)', icon: ShieldCheck, count: INTELLIGENCE_RECORDS.filter(r => r.engineKey === 'panjiva').length, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'irica_tsc', label: 'سامانه ارزش TSC گمرک ایران', icon: Database, count: INTELLIGENCE_RECORDS.filter(r => r.engineKey === 'irica_tsc').length, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
    { id: 'baidu', label: 'Baidu Trade (کارخانجات چین)', icon: Cpu, count: INTELLIGENCE_RECORDS.filter(r => r.engineKey === 'baidu').length, color: 'text-red-600 bg-red-50 border-red-200' },
    { id: 'perplexity', label: 'Perplexity (اسناد و مصوبات صمت)', icon: Sparkles, count: INTELLIGENCE_RECORDS.filter(r => r.engineKey === 'perplexity').length, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { id: 'apify', label: 'Apify Scraper (پایش قیمت زنده)', icon: Flame, count: INTELLIGENCE_RECORDS.filter(r => r.engineKey === 'apify').length, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'ccpit', label: 'CCPIT (اتاق بازرگانی چین)', icon: FileCheck2, count: INTELLIGENCE_RECORDS.filter(r => r.engineKey === 'ccpit').length, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'yandex', label: 'Yandex (اوراسیا و ترانزیت)', icon: Layers, count: INTELLIGENCE_RECORDS.filter(r => r.engineKey === 'yandex').length, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { id: 'yellowpages', label: 'Yellow Pages / Kompass', icon: BookOpen, count: INTELLIGENCE_RECORDS.filter(r => r.engineKey === 'yellowpages').length, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  ];

  const quickPills = [
    'بارنامه‌های دریایی ImportYeti',
    'استعلام ارزش TSC گمرک ایران',
    'پنل‌های خورشیدی TOPCon',
    'فولاد و ورق گالوانیزه DX51D',
    'زنجیره تأمین Panjiva',
    'تجهیزات سونوگرافی داپلر',
    'احراز اصالت CCPIT چین',
    'تعرفه واردات خودرو',
    'دانه قهوه عربیکا',
  ];

  // Distinct categories with counts
  const categories = useMemo(() => {
    const set = new Set<string>();
    INTELLIGENCE_RECORDS.forEach(r => set.add(r.category));
    return ['all', ...Array.from(set)];
  }, []);

  // Multi-term fuzzy/tokenized instant search
  const filteredRecords = useMemo(() => {
    return INTELLIGENCE_RECORDS.filter((item) => {
      // Engine Filter
      const matchesEngine = selectedEngine === 'all' || item.engineKey === selectedEngine;

      // Verification Filter
      const matchesVerification = 
        selectedVerification === 'all' || 
        (selectedVerification === 'verified' && item.verificationState.includes('تأییدشده')) ||
        (selectedVerification === 'needs_verification' && item.verificationState.includes('نیازمند اعتبارسنجی'));

      // Category Filter
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      // Multi-word Search Query Filter
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const rawTokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
        const searchableCorpus = [
          item.title,
          item.titleEn,
          item.category,
          item.originCountry,
          item.sourceName,
          item.sourceUrlOrRef,
          item.summary,
          item.hsCodeSuggested || '',
          item.samtGroup || '',
          item.engine,
          ...(item.details || []),
          ...(item.tags || []),
          ...(item.verifiedDataPoints || []),
          ...(item.unverifiedDataPoints || [])
        ].join(' ').toLowerCase();

        // Every typed token must appear in the item corpus
        matchesSearch = rawTokens.every(token => searchableCorpus.includes(token));
      }

      return matchesEngine && matchesVerification && matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedEngine, selectedVerification, selectedCategory]);

  const handleSearchChange = (val: string) => {
    startTransition(() => {
      setSearchQuery(val);
    });
  };

  const handleCopyCitation = (record: IntelligenceSearchResult) => {
    const text = `[منبع رسمی تجارت‌یار]\nموضوع: ${record.title}\nمرجع: ${record.sourceName}\nشناسه سند: ${record.sourceUrlOrRef}\nتاریخ گزارش: ${record.sourceDate}\nکد تعرفه پیشنهادی: ${record.hsCodeSuggested || 'نامشخص'}\nوضعیت اعتبارسنجی: ${record.verificationState} (ضریب اطمینان: %${record.confidenceScore})`;
    navigator.clipboard.writeText(text);
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getVerificationBadge = (state: VerificationState, score: number) => {
    if (state.includes('تأییدشده')) {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>تأییدشده رسمی (ضریب اطمینان: %{score})</span>
        </span>
      );
    } else if (state.includes('نیازمند اعتبارسنجی')) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>⚠️ نیازمند اعتبارسنجی میدانی (ضریب اطمینان: %{score})</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs">
          <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>نیازمند استعلام از صمت / ریسک تعرفه</span>
        </span>
      );
    }
  };

  return (
    <div id="trade-intelligence-explorer" className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-4 text-right">
      {/* یادآوری صادقانه: اسناد این بخش نمونه/مرجع هستند، نه استعلام زنده */}
      <div className="flex items-start gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-[11px] text-indigo-900 flex-shrink-0">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          اسناد این کاوشگر <strong>نمونه/مرجع</strong> هستند و به‌صورت زنده از موتورهای استنادی استعلام نمی‌شوند؛
          پیش از هر تصمیم تجاری، نتایج را با منبع رسمی تطبیق دهید.
        </span>
      </div>
      {/* نوار جستجوی فشرده — هویت جدید */}
      <div className="tj-card p-4 flex-shrink-0 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="جستجوی زنده کالا، کد تعرفه ۸ رقمی (مثلاً 8541.43)، نام کارخانه، کشور مبدأ یا کلیدواژه…"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2.5 pr-10 pl-24 text-xs md:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white font-sans"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <div className="absolute left-2.5 top-2 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[11px] text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                  title="پاک کردن جستجو"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded">
                {filteredRecords.length.toLocaleString('fa-IR')} نتیجه
              </span>
            </div>
          </div>
          <button
            onClick={onOpenAssessment}
            className="tj-btn tj-btn-primary self-start md:self-auto"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>پرونده ارزیابی جدید</span>
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold shrink-0">پیشنهادات سریع:</span>
          {quickPills.map((pill) => (
            <button
              key={pill}
              onClick={() => handleSearchChange(pill)}
              className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-600 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-200 whitespace-nowrap transition-colors"
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Engine & Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex-shrink-0 flex flex-col space-y-3">
        {/* Engine Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {engines.map((eng) => {
            const Icon = eng.icon;
            const isSelected = selectedEngine === eng.id;
            return (
              <button
                key={eng.id}
                onClick={() => setSelectedEngine(eng.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{eng.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {eng.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Row: Category & Verification */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Category Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              دسته‌بندی موضوعی:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">همه دسته‌بندی‌ها</option>
              {categories.filter(c => c !== 'all').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Verification Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              وضعیت اعتبار سند:
            </span>
            <select
              value={selectedVerification}
              onChange={(e) => setSelectedVerification(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">همه اسناد و گزارش‌ها</option>
              <option value="verified">فقط تأییدشده رسمی (Verified)</option>
              <option value="needs_verification">نیازمند اعتبارسنجی میدانی</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
              🔍
            </div>
            <h3 className="text-sm font-bold text-slate-800">موردی منطبق با عبارت «{searchQuery}» یافت نشد</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              لطفاً از کلمات کلیدی عام‌تر استفاده کرده یا فیلتر موتور جستجو و دسته‌بندی را روی حالت «همه» قرار دهید.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedEngine('all');
                setSelectedVerification('all');
                setSelectedCategory('all');
              }}
              className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-xl border border-blue-200"
            >
              پاک کردن فیلترها و مشاهده همه {INTELLIGENCE_RECORDS.length} سند
            </button>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const isExpanded = expandedCardId === record.id;
            return (
              <div
                key={record.id}
                id={`intel-card-${record.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar: Engine + Source + Verification Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                        <span>{record.engine}</span>
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {record.sourceDate}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-600 font-medium">
                        دسته: <strong>{record.category}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getVerificationBadge(record.verificationState, record.confidenceScore)}
                    </div>
                  </div>

                  {/* Title & English Title */}
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-slate-900 leading-snug">
                      {record.title}
                    </h3>
                    <p className="text-xs font-mono text-slate-500 mt-0.5 dir-ltr text-right">
                      {record.titleEn}
                    </p>
                  </div>

                  {/* Summary Box */}
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {record.summary}
                  </p>

                  {/* Key Metadata Pill Bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block mb-0.5">کد تعرفه پیشنهادی:</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{record.hsCodeSuggested || 'طبق آنالیز'}</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block mb-0.5">گروه کالایی صمت:</span>
                      <span className="font-bold text-slate-900 text-[11px]">{record.samtGroup || 'گروه ۲۲'}</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block mb-0.5">محدوده قیمت جهانی:</span>
                      <span className="font-bold text-emerald-700 text-[11px]">{record.estimatedPriceRange}</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block mb-0.5">مبادی عمده صادرات:</span>
                      <span className="font-bold text-slate-800 text-[11px] line-clamp-1">{record.originCountry}</span>
                    </div>
                  </div>

                  {/* Expandable Details Section */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-100 space-y-3 text-xs animate-fadeIn">
                      {/* Detailed Bullet Points */}
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5 text-xs">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>جزئیات تخصصی و یافته‌های استخراج‌شده:</span>
                        </h4>
                        <ul className="space-y-1.5 pr-4 list-disc text-slate-700 text-[11px] leading-relaxed">
                          {record.details.map((dt, i) => (
                            <li key={i}>{dt}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Verified vs Unverified Points */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Verified Data Points */}
                        {record.verifiedDataPoints.length > 0 && (
                          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1.5 text-[11px] text-emerald-950">
                            <span className="font-bold flex items-center gap-1 text-emerald-900">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              داده‌های قطعی و تطبیق‌یافته با اسناد بالادستی:
                            </span>
                            <ul className="space-y-1 pr-4 list-disc">
                              {record.verifiedDataPoints.map((v, i) => (
                                <li key={i}>{v}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Unverified Risks */}
                        {record.unverifiedDataPoints.length > 0 && (
                          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-1.5 text-[11px] text-amber-950">
                            <span className="font-bold flex items-center gap-1 text-amber-900">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              موارد عدم قطعیت / نیازمند راستی‌آزمایی میدانی:
                            </span>
                            <ul className="space-y-1 pr-4 list-disc">
                              {record.unverifiedDataPoints.map((u, i) => (
                                <li key={i}>{u}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Citation Source Box */}
                      <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-700">
                        <div className="text-[11px]">
                          <strong>شناسه و سند استناد: </strong>
                          <span className="font-mono text-slate-800 text-[10px]">{record.sourceUrlOrRef}</span>
                        </div>
                        <button
                          onClick={() => handleCopyCitation(record)}
                          className="shrink-0 text-xs bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                        >
                          {copiedId === record.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">کپی شد</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>کپی استناد رسمی</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3 text-xs">
                  <button
                    onClick={() => setExpandedCardId(isExpanded ? null : record.id)}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span>بستن جزئیات سند</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>مشاهده تحلیل کامل و ادله اثباتی ({record.details.length} مورد)</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenRfq(record.title, record.originCountry)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>ارسال استعلام براساس این سند (RFQ)</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

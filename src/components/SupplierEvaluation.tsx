import React, { useState, useMemo } from 'react';
import { SupplierRecord } from '../types';
import { AiSupplierCheckCard } from './AiAssist';
import { SupplierFormModal } from './SupplierFormModal';
import { useStore } from '../store/AppStore';
import { 
  CheckCircle2, 
  Globe, 
  Mail, 
  Send, 
  AlertTriangle, 
  Search,
  PackageCheck,
  Building2,
  Phone,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react';

interface SupplierEvaluationProps {
  suppliers: SupplierRecord[];
  onOpenRfqWithSupplier: (supplier: SupplierRecord) => void;
}

export const SupplierEvaluation: React.FC<SupplierEvaluationProps> = ({
  suppliers,
  onOpenRfqWithSupplier
}) => {
  const { upsertSupplier, deleteSupplier } = useStore();
  const [filterCountry, setFilterCountry] = useState('همه کشورها');
  const [filterCategory, setFilterCategory] = useState('همه کالاها و دسته‌ها');
  const [filterVerification, setFilterVerification] = useState<'همه' | 'verified' | 'needs_verification'>('همه');
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SupplierRecord | null>(null);

  // Dynamic Country extraction from supplier list
  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    suppliers.forEach(s => {
      // Normalize country
      const clean = s.country.replace(/\s*\(.*?\)\s*/g, '').trim();
      if (clean) set.add(clean);
    });
    return ['همه کشورها', ...Array.from(set)];
  }, [suppliers]);

  // Dynamic Category extraction from suppliers' mainCategories
  const availableCategories = useMemo(() => {
    const catMap: { [key: string]: number } = {};
    suppliers.forEach(s => {
      s.mainCategories.forEach(c => {
        catMap[c] = (catMap[c] || 0) + 1;
      });
    });
    return [
      { name: 'همه کالاها و دسته‌ها', count: suppliers.length },
      { name: 'تجهیزات خورشیدی و برق', count: suppliers.filter(s => s.mainCategories.some(c => c.includes('خورشیدی') || c.includes('برق') || c.includes('اینورتر'))).length },
      { name: 'خودرو و ماشین‌آلات صنعتی', count: suppliers.filter(s => s.mainCategories.some(c => c.includes('خودرو') || c.includes('ماشین'))).length },
      { name: 'فولاد و مواد اولیه صنعتی', count: suppliers.filter(s => s.mainCategories.some(c => c.includes('فولاد') || c.includes('گالوانیزه'))).length },
      { name: 'تجهیزات پزشکی و آزمایشگاهی', count: suppliers.filter(s => s.mainCategories.some(c => c.includes('پزشکی') || c.includes('سونوگرافی') || c.includes('دستکش'))).length },
      { name: 'کالاهای اساسی و کشاورزی', count: suppliers.filter(s => s.mainCategories.some(c => c.includes('قهوه') || c.includes('کشاورزی') || c.includes('اساسی'))).length },
      { name: 'فناوری اطلاعات و الکترونیک', count: suppliers.filter(s => s.mainCategories.some(c => c.includes('فناوری') || c.includes('الکترونیک') || c.includes('سرور'))).length },
    ].filter(cat => cat.count > 0 || cat.name === 'همه کالاها و دسته‌ها');
  }, [suppliers]);

  // Robust Filtering Logic
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      // Country match
      const cleanCountry = s.country.replace(/\s*\(.*?\)\s*/g, '').trim();
      const matchesCountry = filterCountry === 'همه کشورها' || 
        cleanCountry.includes(filterCountry) || 
        s.country.includes(filterCountry);

      // Category match
      let matchesCategory = true;
      if (filterCategory !== 'همه کالاها و دسته‌ها') {
        const catTokens = filterCategory.split(' ');
        matchesCategory = s.mainCategories.some(c => 
          c.includes(filterCategory) || 
          catTokens.some(t => t.length > 3 && c.includes(t))
        );
      }

      // Verification match
      let matchesVerification = true;
      const isVerified = s.sourceVerification?.isVerified ?? true;
      if (filterVerification === 'verified' && !isVerified) matchesVerification = false;
      if (filterVerification === 'needs_verification' && isVerified) matchesVerification = false;

      // Text Search
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        matchesSearch = 
          s.name.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q) ||
          s.entityResolutionId.toLowerCase().includes(q) ||
          s.mainCategories.some(c => c.toLowerCase().includes(q)) ||
          s.certifications.some(c => c.toLowerCase().includes(q)) ||
          s.notes.toLowerCase().includes(q);
      }

      return matchesCountry && matchesCategory && matchesVerification && matchesSearch;
    });
  }, [suppliers, filterCountry, filterCategory, filterVerification, searchQuery]);

  return (
    <>
    <div id="supplier-evaluation-matrix" className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-right">
      {/* یادآوری صادقانه */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] text-amber-900 flex-shrink-0">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          تحلیل ریسک این بخش <strong>قاعده‌محور</strong> است و جایگزین ممیزی میدانی و
          استعلام رسمی (CCPIT / اتاق بازرگانی / بانک) نیست. تأمین‌کنندگان را خودتان ثبت می‌کنید.
        </span>
      </div>
      {/* نوار ابزار فشرده — جستجو و شمارش (هویت جدید) */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col md:flex-row md:items-center gap-3 flex-shrink-0">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام کارخانه، کشور، نوع کالای تولیدی (پنل خورشیدی، فولاد، سونوگرافی)، استاندارد…"
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl py-2.5 pr-10 pl-4 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300 font-sans"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md"
            >
              پاک کردن
            </button>
          )}
        </div>
        <div className="tj-grad text-white rounded-xl px-4 py-2.5 text-center min-w-[130px] shadow-sm">
          <div className="text-[10px] opacity-90">تأمین‌کنندگان منطبق</div>
          <div className="text-lg font-black font-mono">{filteredSuppliers.length.toLocaleString('fa-IR')} شرکت</div>
        </div>
        <button
          onClick={() => { setEditingSupplier(null); setFormOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن تأمین‌کننده</span>
        </button>
      </div>

      {/* Multi-tier Filter Toolbar */}
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-col space-y-3 flex-shrink-0">
        {/* Category Pill Filters (کالای انتخابی) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1 shrink-0">
            <PackageCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>دسته‌بندی کالا:</span>
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {availableCategories.map((cat) => {
              const isSelected = filterCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setFilterCategory(cat.name)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Country & Verification Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/60">
          {/* Countries */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1 shrink-0">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>کشور مبدأ:</span>
            </span>
            <div className="flex items-center gap-1 overflow-x-auto">
              {availableCountries.map((c) => {
                const isSelected = filterCountry === c;
                return (
                  <button
                    key={c}
                    onClick={() => setFilterCountry(c)}
                    className={`text-xs px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Verification Status */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs shrink-0">
            <button
              onClick={() => setFilterVerification('همه')}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                filterVerification === 'همه' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              همه وضعیت‌ها
            </button>
            <button
              onClick={() => setFilterVerification('verified')}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                filterVerification === 'verified' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>احراز اصالت رسمی</span>
            </button>
            <button
              onClick={() => setFilterVerification('needs_verification')}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                filterVerification === 'needs_verification' ? 'bg-amber-600 text-white shadow-2xs' : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>نیازمند ممیزی میدانی</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Supplier Cards */}
      <div className="flex-1 p-4 md:p-5 overflow-y-auto grid grid-cols-1 xl:grid-cols-2 gap-4 bg-slate-50/50">
        {/* تحلیل هوشمند ریسک تأمین‌کننده */}
        <div className="xl:col-span-2">
          <AiSupplierCheckCard />
        </div>

        {filteredSuppliers.length === 0 ? (
          suppliers.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">هنوز تأمین‌کننده‌ای ثبت نشده است</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                هیچ داده‌ی ساختگی وجود ندارد. اولین تأمین‌کننده خارجی خود را با مشخصات واقعی ثبت کنید
                تا در ماتریس اعتبارسنجی تحلیل شود.
              </p>
              <button
                onClick={() => { setEditingSupplier(null); setFormOpen(true); }}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                افزودن اولین تأمین‌کننده
              </button>
            </div>
          ) : (
            <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
                🏢
              </div>
              <h3 className="text-sm font-bold text-slate-800">هیچ تأمین‌کننده‌ای با فیلترهای انتخابی شما یافت نشد</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                فیلتر کشور ({filterCountry}) یا دسته‌بندی ({filterCategory}) را به حالت پیش‌فرض بازگردانید.
              </p>
              <button
                onClick={() => {
                  setFilterCountry('همه کشورها');
                  setFilterCategory('همه کالاها و دسته‌ها');
                  setFilterVerification('همه');
                  setSearchQuery('');
                }}
                className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-200"
              >
                بازنشانی تمام فیلترها
              </button>
            </div>
          )
        ) : (
          filteredSuppliers.map((supplier) => {
            const vInfo = supplier.sourceVerification;
            const isVerified = vInfo?.isVerified ?? true;

            return (
              <div
                key={supplier.id}
                id={`supplier-card-${supplier.id}`}
                className={`border rounded-2xl p-5 bg-white transition-all flex flex-col justify-between shadow-2xs hover:shadow-md ${
                  !isVerified
                    ? 'border-amber-300 hover:border-amber-400 bg-amber-50/10'
                    : 'border-slate-200 hover:border-blue-500'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-slate-600" />
                          <span>{supplier.name}</span>
                        </h4>
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md font-mono">
                          {supplier.tier}
                        </span>

                        {/* Verification Badge */}
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            احراز اصالت رسمی
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            نیاز به اعتبارسنجی میدانی
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          <Globe className="w-3.5 h-3.5 text-blue-600" />
                          کشور: {supplier.country}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {supplier.entityResolutionId}
                        </span>
                      </div>
                    </div>

                    <div className="text-left shrink-0 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center min-w-[75px]" dir="ltr">
                      <span className="text-[10px] text-slate-400 font-bold block">ممیزی کارخانه</span>
                      <span className={`text-lg md:text-xl font-black font-mono ${supplier.score >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {supplier.score}/100
                      </span>
                    </div>
                  </div>

                  {/* Main Product Tags (کالاهای تحت پوشش) */}
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium mb-1.5 flex items-center gap-1">
                      <PackageCheck className="w-3 h-3 text-slate-400" />
                      <span>کالاها و خطوط تولید تخصصی:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {supplier.mainCategories.map((cat, i) => (
                        <span
                          key={i}
                          className="text-xs bg-indigo-50 text-indigo-900 border border-indigo-200/80 font-bold px-2.5 py-1 rounded-lg"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sourcing & Provenance Box */}
                  {vInfo && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-medium">
                          مرجع استعلام و رجیستری: <strong className="text-slate-900">{vInfo.source}</strong>
                        </span>
                        <span className="font-mono text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded text-[10px] font-bold">
                          ضریب اطمینان: %{vInfo.confidence}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {vInfo.notes}
                      </p>
                    </div>
                  )}

                  {/* Details Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">حداقل تیراژ (MOQ):</span>
                      <span className="font-bold text-slate-800 text-[11px]">{supplier.moq}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">زمان تحویل (Lead Time):</span>
                      <span className="font-bold text-slate-800 text-[11px]">{supplier.leadTime}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">پایداری مالی:</span>
                      <span className="font-bold text-emerald-700 text-[11px]">{supplier.financialStability}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">کانال پرداخت ارزی:</span>
                      <span className="font-bold text-emerald-700 text-[11px]">{supplier.sanctionCheck}</span>
                    </div>
                  </div>

                  {/* Certifications Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {supplier.certifications.map((cert) => (
                      <span
                        key={cert}
                        className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md border border-slate-200"
                      >
                        ✓ {cert}
                      </span>
                    ))}
                  </div>

                  {/* Notes / Special Terms */}
                  <p className="text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                    <strong>شرایط اختصاصی: </strong>
                    {supplier.notes}
                  </p>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4">
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {supplier.email}
                    </span>
                    <span className="hidden sm:inline text-slate-300">|</span>
                    <span className="flex items-center gap-1 font-mono text-[11px] dir-ltr text-right">
                      <Phone className="w-3 h-3 text-slate-400" /> {supplier.phone}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={() => { setEditingSupplier(supplier); setFormOpen(true); }}
                      className="text-xs border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold px-3 py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      title="ویرایش مشخصات"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>ویرایش</span>
                    </button>
                    <button
                      onClick={() => setConfirmDelete(supplier)}
                      className="text-xs border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold px-3 py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      title="حذف تأمین‌کننده"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                    <button
                      onClick={() => onOpenRfqWithSupplier(supplier)}
                      className="flex-1 sm:flex-none text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>صدور استعلام رسمی (RFQ)</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>

    {/* مودال افزودن / ویرایش تأمین‌کننده */}
    <SupplierFormModal
      isOpen={formOpen}
      onClose={() => { setFormOpen(false); setEditingSupplier(null); }}
      initial={editingSupplier}
      onSave={upsertSupplier}
    />

    {/* تأیید حذف تأمین‌کننده */}
    {confirmDelete && (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 text-right space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">حذف تأمین‌کننده</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                «{confirmDelete.name}» برای همیشه از ماتریس اعتبارسنجی حذف می‌شود. این عمل قابل بازگشت نیست.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              انصراف
            </button>
            <button
              onClick={async () => {
                if (confirmDelete) await deleteSupplier(confirmDelete.id);
                setConfirmDelete(null);
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
            >
              بله، حذف شود
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

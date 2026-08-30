import React, { useEffect, useState } from 'react';
import { X, Save, Building2 } from 'lucide-react';
import type { SupplierRecord } from '../types';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initial?: SupplierRecord | null;
  onSave: (rec: SupplierRecord) => Promise<void>;
}

const TIERS: SupplierRecord['tier'][] = [
  'تأمین‌کننده معتبر سطح ۱ (Tier 1)',
  'ارزیابی‌شده سطح ۲',
  'در حال ممیزی کارخانه',
];

const STABILITY: SupplierRecord['financialStability'][] = ['پایدار و معتبر', 'متوسط', 'ریسک بالا'];
const SANCTION: SupplierRecord['sanctionCheck'][] = [
  'احراز هویت و حساب بانکی پاک',
  'بررسی شده',
  'دارای هشدار واسطه',
];

const splitTags = (s: string): string[] =>
  s.split(/[،,]/).map((t) => t.trim()).filter(Boolean);

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({ isOpen, onClose, initial, onSave }) => {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('چین');
  const [tier, setTier] = useState<SupplierRecord['tier']>('در حال ممیزی کارخانه');
  const [categories, setCategories] = useState('');
  const [entityResolutionId, setEntityResolutionId] = useState('');
  const [moq, setMoq] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [certifications, setCertifications] = useState('');
  const [financialStability, setFinancialStability] = useState<SupplierRecord['financialStability']>('متوسط');
  const [sanctionCheck, setSanctionCheck] = useState<SupplierRecord['sanctionCheck']>('بررسی شده');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // بارگذاری مقادیر هنگام باز شدن (برای ویرایش یا فرم خالی)
  useEffect(() => {
    if (!isOpen) return;
    setName(initial?.name ?? '');
    setCountry(initial?.country ?? 'چین');
    setTier(initial?.tier ?? 'در حال ممیزی کارخانه');
    setCategories(initial?.mainCategories.join('، ') ?? '');
    setEntityResolutionId(initial?.entityResolutionId ?? '');
    setMoq(initial?.moq ?? '');
    setLeadTime(initial?.leadTime ?? '');
    setCertifications(initial?.certifications.join('، ') ?? '');
    setFinancialStability(initial?.financialStability ?? 'متوسط');
    setSanctionCheck(initial?.sanctionCheck ?? 'بررسی شده');
    setContactPerson(initial?.contactPerson ?? '');
    setEmail(initial?.email ?? '');
    setPhone(initial?.phone ?? '');
    setNotes(initial?.notes ?? '');
    setErr(null);
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setErr(null);
    const rec: SupplierRecord = {
      id: initial?.id ?? `SUP-${Date.now().toString(36)}`,
      name: name.trim(),
      country: country.trim() || 'نامشخص',
      verifiedEntity: initial?.verifiedEntity ?? false,
      tier,
      score: initial?.score ?? 50,
      mainCategories: splitTags(categories).length ? splitTags(categories) : ['متفرقه'],
      entityResolutionId: entityResolutionId.trim() || (initial?.entityResolutionId ?? `PENDING-${Date.now().toString(36)}`),
      moq: moq.trim() || '—',
      leadTime: leadTime.trim() || '—',
      certifications: splitTags(certifications),
      financialStability,
      sanctionCheck,
      contactPerson: contactPerson.trim() || '—',
      email: email.trim() || '—',
      phone: phone.trim() || '—',
      notes: notes.trim() || 'بدون شرایط اختصاصی ثبت‌شده.',
      sourceVerification: initial?.sourceVerification ?? {
        source: 'ثبت دستی کاربر',
        isVerified: false,
        confidence: 0,
        notes: 'در انتظار ممیزی میدانی و استعلام رسمی (CCPIT / اتاق بازرگانی).',
      },
    };
    try {
      await onSave(rec);
      onClose();
    } catch {
      setErr('ذخیره ناموفق بود؛ دوباره تلاش کنید.');
    } finally {
      setSaving(false);
    }
  };

  const fieldCls = 'w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none';
  const labelCls = 'text-[10px] font-bold text-slate-500';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">{initial ? 'ویرایش تأمین‌کننده' : 'افزودن تأمین‌کننده خارجی'}</h3>
              <p className="text-[11px] text-slate-500">ثبت سوابق ممیزی و مشخصات حقوقی — مبنای ماتریس اعتبارسنجی</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-right">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <label className={labelCls}>نام کامل شرکت (انگلیسی) *</label>
              <input required dir="ltr" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shanghai SolarTech Manufacturing Co., Ltd" className={`${fieldCls} font-mono`} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>کشور مبدأ</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="چین" className={fieldCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>سطح اعتبار (Tier)</label>
              <select value={tier} onChange={(e) => setTier(e.target.value as SupplierRecord['tier'])} className={fieldCls}>
                {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1 col-span-2">
              <label className={labelCls}>کالاها و خطوط تولید (با «،» جدا کنید)</label>
              <input value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="پنل خورشیدی، اینورتر، باتری لیتیومی" className={fieldCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>شناسه ثبت ملی (USCC / Trade Register)</label>
              <input dir="ltr" value={entityResolutionId} onChange={(e) => setEntityResolutionId(e.target.value)} placeholder="91310000MA1FL..." className={`${fieldCls} font-mono`} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>حداقل تیراژ (MOQ)</label>
              <input value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="۱ کانتینر" className={fieldCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>زمان تحویل (Lead Time)</label>
              <input value={leadTime} onChange={(e) => setLeadTime(e.target.value)} placeholder="۳۵ روز" className={fieldCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>گواهی‌ها (با «،» جدا کنید)</label>
              <input value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder="ISO 9001، CE، TÜV" className={fieldCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>پایداری مالی</label>
              <select value={financialStability} onChange={(e) => setFinancialStability(e.target.value as SupplierRecord['financialStability'])} className={fieldCls}>
                {STABILITY.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>وضعیت کانال پرداخت ارزی</label>
              <select value={sanctionCheck} onChange={(e) => setSanctionCheck(e.target.value as SupplierRecord['sanctionCheck'])} className={fieldCls}>
                {SANCTION.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>شخص رابط</label>
              <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Mr. Li Wei" className={fieldCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>ایمیل</label>
              <input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sales@company.com" className={`${fieldCls} font-mono`} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>تلفن / واتس‌اپ</label>
              <input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+86 21 0000 0000" className={`${fieldCls} font-mono`} />
            </div>
            <div className="space-y-1 col-span-2">
              <label className={labelCls}>شرایط اختصاصی و یادداشت</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="شرایط پرداخت، اینکوترمز، تخفیف‌ها…" className={fieldCls} />
            </div>
          </div>

          {err && <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-[11px] text-rose-700">{err}</div>}

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2.5">
            <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm">
              تأمین‌کننده‌ی تازه ثبت‌شده با وضعیت «نیازمند ممیزی میدانی» وارد می‌شود؛ پس از استعلام رسمی، سطح اعتبار و امتیاز را ویرایش کنید.
            </p>
            <div className="flex items-center gap-2.5 shrink-0">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                انصراف
              </button>
              <button type="submit" disabled={saving || !name.trim()} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm shadow-emerald-200 transition-colors flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'در حال ذخیره...' : 'ذخیره تأمین‌کننده'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

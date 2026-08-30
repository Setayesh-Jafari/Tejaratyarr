import React, { useCallback, useEffect, useState } from 'react';
import { PRESET_SCENARIOS } from '../data/mockData';
import { HS_DISPUTE_SCENARIOS } from '../data/hscodeScenarios';
import { computeLandedCost, analyzeMargin } from '../lib/costing';
import { enrichScenarioCode } from '../lib/hsResolution';
import { LandedCostCalculator } from './LandedCostCalculator';
import { api } from '../lib/api';
import { useStore } from '../store/AppStore';
import { 
  CheckCircle2, 
  Sparkles, 
  Scale, 
  ShieldCheck, 
  FileText, 
  Copy,
  ChevronLeft,
  X,
  Building2,
  Globe,
  AlertTriangle,
  Loader2,
  Check
} from 'lucide-react';
import { InventoryUnit, TradeAssessmentDossier, AiSupplierReport } from '../types';

interface TradeAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToInventory: (newItem: InventoryUnit) => void;
  onAddDossier?: (dossier: Omit<TradeAssessmentDossier, 'id'>) => Promise<unknown>;
  initialScenario?: typeof HS_DISPUTE_SCENARIOS[0];
}

export const TradeAssessmentModal: React.FC<TradeAssessmentModalProps> = ({
  isOpen,
  onClose,
  onAddToInventory,
  onAddDossier,
  initialScenario,
}) => {
  const { settings } = useStore();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [copiedRfq, setCopiedRfq] = useState(false);

  // کد پیشنهادی سناریوی ورودی (در صورت وجود) — غنی‌شده از دایرکتوری رسمی (منبع واحد نرخ تعرفه)
  const recommendedCode = initialScenario
    ? enrichScenarioCode(initialScenario.competingCodes.find((c) => c.isRecommended) ?? initialScenario.competingCodes[0])
    : undefined;

  // Form State — شروع خنثی و صادقانه؛ کاربر خودش مشخصات کالای واقعی را وارد می‌کند
  const [productFa, setProductFa] = useState(initialScenario?.productNameFa || '');
  const [productEn, setProductEn] = useState(initialScenario?.productNameEn || '');
  const [category, setCategory] = useState<any>(initialScenario?.category || 'تجهیزات خورشیدی و برق');
  const [selectedHsCode, setSelectedHsCode] = useState<string>(recommendedCode?.code || '');
  const [samtGroup, setSamtGroup] = useState(recommendedCode?.samtGroup || '');
  const [specs, setSpecs] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('عدد');
  const [originPref, setOriginPref] = useState('');
  const [customsPort, setCustomsPort] = useState('');
  const [targetCustomer, setTargetCustomer] = useState('');

  // تأمین‌کننده و اعتبارسنجی (Due Diligence) — جایگزین داده‌های ساختگی قبلی
  const [supplierName, setSupplierName] = useState('');
  const [supplierCountry, setSupplierCountry] = useState('چین');
  const [supplierDomain, setSupplierDomain] = useState('');
  const [supplierReport, setSupplierReport] = useState<{ engine: string; report: AiSupplierReport; disclaimer?: string } | null>(null);
  const [supplierBusy, setSupplierBusy] = useState(false);
  const [supplierErr, setSupplierErr] = useState<string | null>(null);

  // Pricing & Landed Cost state — موتور محاسباتی مشترک (src/lib/costing.ts)
  const [fobPriceUsd, setFobPriceUsd] = useState<number>(62);
  const [freightUsd, setFreightUsd] = useState<number>(4.5);
  const [insuranceUsd, setInsuranceUsd] = useState<number>(0.8);
  const [fxRateToman, setFxRateToman] = useState<number>(settings.fx.usdNimaToman || 68000);
  const [customsDutyPct, setCustomsDutyPct] = useState<number>(recommendedCode?.customsDuty ?? 4);
  const [commercialProfitPct, setCommercialProfitPct] = useState<number>(recommendedCode?.commercialProfit ?? 0);
  const [vatRate, setVatRate] = useState<number>(recommendedCode?.vatRate ?? 10);
  const [clearanceFeeToman, setClearanceFeeToman] = useState<number>(290000);
  const [inlandFreightToman, setInlandFreightToman] = useState<number>(120000);
  const [brokerAndBankToman, setBrokerAndBankToman] = useState<number>(180000);
  const [otherFeeToman, setOtherFeeToman] = useState<number>(95000);
  const [qtyNumber, setQtyNumber] = useState<number>(620);
  const [sellPricePerUnitToman, setSellPricePerUnitToman] = useState<number>(0); // صفر = پیشنهاد خودکار ۳۰٪
  const [savingDossier, setSavingDossier] = useState(false);

  // نتیجه‌ی زنده‌ی ماشین‌حساب (تا حکم نهایی و ثبت انبار همیشه با عددی که کاربر می‌بیند یکی باشد)
  const [calcResult, setCalcResult] = useState<ReturnType<typeof computeLandedCost> | null>(null);
  const [calcMargin, setCalcMargin] = useState<ReturnType<typeof analyzeMargin> | null>(null);

  // همگام‌سازی واقعی سناریو هنگام باز شدن از «تفکیک تعرفه» (مودال همیشه mount است، پس state اولیه کافی نیست)
  useEffect(() => {
    if (!initialScenario) return;
    const rec = enrichScenarioCode(initialScenario.competingCodes.find((c) => c.isRecommended) ?? initialScenario.competingCodes[0]);
    setProductFa(initialScenario.productNameFa);
    setProductEn(initialScenario.productNameEn);
    setCategory(initialScenario.category);
    setSelectedHsCode(rec?.code ?? initialScenario.competingCodes[0].code);
    setCustomsDutyPct(rec?.customsDuty ?? 4);
    setCommercialProfitPct(rec?.commercialProfit ?? 0);
    setVatRate(rec?.vatRate ?? 10);
    setSamtGroup(rec?.samtGroup ?? 'گروه ۲۲');
    setSupplierCountry(initialScenario.category === 'کالاهای اساسی و کشاورزی' ? 'نامشخص' : 'چین');
    setSupplierReport(null);
    setSupplierErr(null);
    setCurrentStep(0);
  }, [initialScenario]);

  const handleCalcResult = useCallback(
    (result: ReturnType<typeof computeLandedCost>, marginResult: ReturnType<typeof analyzeMargin>) => {
      setCalcResult(result);
      setCalcMargin(marginResult);
    },
    []
  );

  if (!isOpen) return null;

  // Matching scenario for HS Code disambiguation
  const matchedDispute = HS_DISPUTE_SCENARIOS.find(
    s => s.category === category || s.productNameFa.includes(productFa.split(' ')[0])
  ) || HS_DISPUTE_SCENARIOS[1];

  const loadScenario = (sc: typeof PRESET_SCENARIOS[0]) => {
    setProductFa(sc.fa);
    setProductEn(sc.en);
    setCategory(sc.category as any);
    setSamtGroup(sc.samtGroup);
    setSpecs(sc.specs);
    setQty(sc.qty);
    setUnit(sc.unit);
    setOriginPref(sc.origin);
    setTargetCustomer(sc.target);
    setSelectedHsCode(sc.hsCode);
    setCustomsDutyPct(sc.customsDuty);
    setCommercialProfitPct(sc.commercialProfit);
    setVatRate(sc.vat);
  };

  /* تحلیل ریسک تأمین‌کننده — موتور محلی قاعده‌محور یا Gemini در صورت وجود کلید */
  const runSupplierCheck = async () => {
    if (!supplierName.trim()) return;
    setSupplierBusy(true);
    setSupplierErr(null);
    setSupplierReport(null);
    try {
      const res = await api.aiSupplierCheck({
        name: supplierName.trim(),
        country: supplierCountry.trim(),
        domain: supplierDomain.trim() || undefined,
      });
      setSupplierReport(res);
    } catch (e: any) {
      setSupplierErr(e?.message ?? 'خطا در تحلیل ریسک تأمین‌کننده');
    } finally {
      setSupplierBusy(false);
    }
  };

  // Landed Cost — منبع حقیقت، خروجی زنده‌ی ماشین‌حساب است؛ موتور محاسباتی تنها به‌عنوان fallback اولیه
  const costingInput = {
    fobUsd: fobPriceUsd,
    freightUsd,
    insuranceUsd,
    qty: qtyNumber,
    fxRateToman,
    customsDutyPct,
    commercialProfitPct,
    vatPct: vatRate,
    clearanceFeeToman,
    inlandFreightToman,
    brokerAndBankToman,
    otherFeeToman,
  };
  const fallbackLanded = computeLandedCost(costingInput);
  const landed = calcResult ?? fallbackLanded;
  const margin =
    calcMargin ??
    analyzeMargin(fallbackLanded, sellPricePerUnitToman || fallbackLanded.landedPerUnitToman * 1.3, qtyNumber);
  const effectiveSell = sellPricePerUnitToman || landed.landedPerUnitToman * 1.3;
  const landedInMillionToman = Number(landed.landedPerUnitMillionToman.toFixed(2));
  const estimatedMarketPriceToman = Number((effectiveSell / 1000000).toFixed(2));

  const stages = [
    { title: '۱. کالا و مشخصات', desc: 'پارامترهای فنی کاتالوگ' },
    { title: '۲. تفکیک تعرفه HS', desc: 'انتخاب کد قطعی و صمت' },
    { title: '۳. اعتبارسنجی خارجی', desc: 'ممیزی حقوقی و RFQ' },
    { title: '۴. بهای تمام‌شده', desc: 'Landed Cost و سود' },
  ];

  const handleCreateAndAdd = async () => {
    setSavingDossier(true);
    const verdictOk = margin.profitPerUnitToman > 0;
    const newUnit: InventoryUnit = {
      id: `CARGO-IR-${Date.now().toString().slice(-6)}`,
      sku: `IMP-${Date.now().toString().slice(-6)}`,
      vinOrCode: `HS-${selectedHsCode.replace(/\./g, '')}-${Date.now().toString().slice(-4)}`,
      name: productFa,
      category: category,
      specifications: specs,
      originCountry: originPref,
      customsPort: customsPort,
      yearOrBatch: `${new Date().toLocaleDateString('fa-IR', { year: 'numeric' })} / پارت ارزیابی‌شده`,
      status: 'در انتظار تخصیص ارز و ثبت سفارش',
      stockQty: qtyNumber,
      unit: unit,
      costPriceUsd: Number((landed.cifUsdTotal / qtyNumber).toFixed(2)),
      landedCostToman: landedInMillionToman,
      fxRateAtLandedToman: Math.round(landed.fxRateToman),
      marketPriceToman: estimatedMarketPriceToman,
      hsCode: selectedHsCode,
      samtGroup: samtGroup,
      orderRegCode: `1404${Math.floor(100000 + Math.random() * 900000)}`,
      fxType: samtGroup.includes('۲۱') ? 'ارز نیمایی (سامانه نیما)' : 'ارز تالار دوم (توافقی)',
      supplierName: supplierName.trim() || `${originPref.split(' ')[0]} — تأمین‌کننده (نامشخص)`,
      // امتیاز اعتبار از تحلیل ریسک واقعی مشتق می‌شود؛ بدون اجرای ممیزی، امتیاز خنثی ثبت می‌شود
      supplierRating: supplierReport ? Math.round(Math.max(0, Math.min(100, 100 - supplierReport.report.riskScore))) : 50,
      complianceGate: 'در حال بازرسی استاندارد (COI)',
      lastUpdated: 'هم‌اکنون',
    };

    // ثبت پرونده ارزیابی در آرشیو سرور (به‌صورت آسان با شکست کنار می‌شود)
    try {
      if (onAddDossier) {
        await onAddDossier({
          title: `${productFa} — ${qtyNumber.toLocaleString('fa-IR')} ${unit}`,
          productFa,
          productEn,
          category,
          specs,
          qty: String(qtyNumber),
          unit,
          originPref,
          targetCustomer,
          application: targetCustomer,
          estimatedLandedCostToman: landedInMillionToman,
          suggestedHsCode: selectedHsCode,
          samtGroup,
          customsDutyRate: customsDutyPct + commercialProfitPct,
          vatRate,
          status: verdictOk ? 'آماده ثبت سفارش' : 'در حال ارزیابی فنی و استاندارد',
          evidenceScore: Math.round(Math.max(40, Math.min(98, margin.marginPct * 2.2 + 30))),
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      // خطای آرشیو مانع ثبت انبار نمی‌شود
    } finally {
      setSavingDossier(false);
    }

    onAddToInventory(newUnit);
    onClose();
  };

  const sampleRfqText = `Subject: Official RFQ - Commercial Inquiry for ${productEn} - Iranian Import Sector

Dear Export & International Sales Management,

We are conducting an official procurement evaluation for bulk commercial import into Iran:
• Product: ${productEn} (${productFa})
• Technical Specifications: ${specs}
• Target Quantity: ${qty}
• Destination Port: Bandar Abbas Port / Dubai Jebel Ali (Incoterms 2020: FOB & CIF)

Please submit your official Commercial Quotation including:
1. FOB price per unit & CIF Bandar Abbas shipping matrix
2. Packaging specifications & container loading layout (40ft HQ container capacity)
3. Quality certificates: ISO 9001, CE, TÜV Test Reports, and Certificate of Conformity (CoC / COI)
4. Production lead time and accepted payment terms (Direct TT / Irrevocable Documentary L/C via UAE/Oman intermediaries)

Looking forward to your formal proforma quotation and cooperation.

Best regards,
Procurement & Trade Directorate
TejaratYar Commercial Platform (Iran)`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                موتور ارزیابی امکان‌سنجی واردات و ممیزی تأمین‌کننده (تجارت‌یار)
              </h3>
              <p className="text-[11px] text-slate-500">
                بررسی شواهدمحور، مجوزهای صمت و استاندارد، محاسبه بهای تمام‌شده و بسته صدور RFQ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 grid grid-cols-4 gap-2 flex-shrink-0">
          {stages.map((st, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`text-right px-3 py-2 rounded-xl border text-xs transition-all ${
                currentStep === idx
                  ? 'bg-white border-blue-500 shadow-xs text-blue-700 font-bold'
                  : currentStep > idx
                  ? 'bg-slate-100 border-emerald-300 text-emerald-800 font-semibold'
                  : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold font-mono ${
                  currentStep === idx ? 'bg-indigo-600 text-white' : currentStep > idx ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {idx + 1}
                </span>
                <span className="truncate">{st.title}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 text-right">
          {/* Preset Quick Chips */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500">
              بارگذاری سناریوهای آماده و تجاری واردات ایران:
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_SCENARIOS.map((sc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => loadScenario(sc)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition-all ${
                    productEn === sc.en
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>{sc.fa}</span>
                  <span className="text-[10px] opacity-75 mr-1 font-mono">({sc.tag})</span>
                </button>
              ))}
            </div>
          </div>

          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نام فارسی کالا *</label>
                  <input
                    type="text"
                    value={productFa}
                    onChange={(e) => setProductFa(e.target.value)}
                    placeholder="مثلاً پنل خورشیدی مونوکریستال ۵۵۰ وات"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نام بین‌المللی کالا (International Description) *</label>
                  <input
                    type="text"
                    value={productEn}
                    onChange={(e) => setProductEn(e.target.value)}
                    placeholder="Monocrystalline Solar PV Module 550W"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">مشخصات فنی، کاتالوگ و گواهی‌های استاندارد *</label>
                <textarea
                  rows={2}
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                  placeholder="توان، فناوری، بازدهی و گواهی‌های استاندارد کالای موردنظر"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">تعداد / حجم سفارش هدف *</label>
                  <input
                    type="text"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">تعداد عددی (مبنای محاسبات) *</label>
                  <input
                    type="number"
                    min={1}
                    value={qtyNumber}
                    onChange={(e) => setQtyNumber(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">واحد سنجش</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">کشور و بندر مبدأ بارگیری</label>
                  <input
                    type="text"
                    value={originPref}
                    onChange={(e) => setOriginPref(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-500/10 via-indigo-50/50 to-blue-50/40 border border-amber-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-amber-600" />
                    <span>مرحله تفکیک و انتخاب هوشمند کد تعرفه (HS Code) از بین کدهای مشابه</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    جلوگیری از جریمه ماده ۱۰۸ ق.ا.گ
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  بر اساس دسته‌بندی کالا، کدهای تعرفه رقیب زیر بررسی شدند. لطفاً با توجه به مشخصات فیزیکی کالا، کد نهایی و معافیت‌های مربوطه را تعیین کنید:
                </p>

                {/* Competing HS Code Cards in Modal */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                  {matchedDispute.competingCodes.map((codeItem) => {
                    const isSelected = selectedHsCode === codeItem.code;
                    return (
                      <button
                        key={codeItem.code}
                        type="button"
                        onClick={() => {
                          setSelectedHsCode(codeItem.code);
                          setCustomsDutyPct(codeItem.customsDuty);
                          setCommercialProfitPct(codeItem.commercialProfit);
                          setSamtGroup(codeItem.samtGroup);
                          setVatRate(codeItem.vatRate);
                        }}
                        className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-white border-indigo-600 ring-2 ring-indigo-600/30 shadow-sm'
                            : 'bg-white/80 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border">
                              {codeItem.code}
                            </span>
                            {codeItem.isRecommended && (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                گزینه پیشنهادی
                              </span>
                            )}
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          </div>
                          <div className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-snug">
                            {codeItem.titleFa}
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 text-[10px]">
                          <div className="flex justify-between text-slate-600">
                            <span>حقوق ورودی کل:</span>
                            <span className="font-bold font-mono text-slate-900">{codeItem.totalTariffPercent}٪</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>گروه ارزی صمت:</span>
                            <span className="font-semibold text-slate-800">{codeItem.samtGroup.split(' ')[0]} {codeItem.samtGroup.split(' ')[1]}</span>
                          </div>
                          <div className="text-slate-500 line-clamp-1">
                            {codeItem.technicalDiscriminator}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">گمرک ورودی و ترخیص کالا</label>
                  <input
                    type="text"
                    value={customsPort}
                    onChange={(e) => setCustomsPort(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">بازار و مشتری هدف در ایران</label>
                  <input
                    type="text"
                    value={targetCustomer}
                    onChange={(e) => setTargetCustomer(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-500 block text-[10px] mb-0.5">مجوزهای فنی و استاندارد الزامی برای ترخیص:</span>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    تأییدیه سازمان ملی استاندارد (ISIRI)، بازرسی در مبدأ (COI)، ثبت منشأ ارز در بانک مرکزی و سامانه EPL گمرک جمهوری اسلامی ایران بر مبنای ارزش شناسه TSC.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>اعتبارسنجی تأمین‌کننده خارجی (Due Diligence)</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    {supplierReport ? (supplierReport.engine === 'gemini' ? 'تحلیل هوش مصنوعی' : 'موتور قاعده‌محور') : 'بدون تحلیل'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">نام کامل شرکت *</label>
                    <input
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="مثل Jiangsu XYZ Energy Co., Ltd"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">کشور اعلامی</label>
                    <input
                      type="text"
                      value={supplierCountry}
                      onChange={(e) => setSupplierCountry(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">وب‌سایت / دامنه</label>
                    <input
                      type="text"
                      value={supplierDomain}
                      onChange={(e) => setSupplierDomain(e.target.value)}
                      placeholder="xyz-solar.com"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={runSupplierCheck}
                    disabled={supplierBusy || !supplierName.trim()}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                  >
                    {supplierBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    {supplierBusy ? 'در حال تحلیل...' : 'تحلیل ریسک تأمین‌کننده'}
                  </button>
                  {!supplierReport && !supplierErr && !supplierBusy && (
                    <span className="text-[11px] text-slate-400">نام شرکت را وارد و تحلیل را اجرا کنید — نتیجه جایگزین استعلام رسمی نیست.</span>
                  )}
                </div>

                {supplierErr && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-[11px] text-rose-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {supplierErr}
                  </div>
                )}

                {supplierReport && (
                  <div className="space-y-2.5 border border-slate-200 rounded-xl p-3.5 bg-slate-50">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          supplierReport.report.riskLevel === 'کم'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : supplierReport.report.riskLevel === 'متوسط'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          ریسک {supplierReport.report.riskLevel}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-700">{supplierReport.report.riskScore}/100</span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {supplierReport.engine === 'gemini' ? 'Gemini' : 'موتور محلی قاعده‌محور'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed">{supplierReport.report.summary}</p>
                    {supplierReport.report.redFlags?.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-rose-700">پرچم‌های قرمز:</span>
                        <ul className="space-y-1 pr-4 list-disc text-[11px] text-slate-700">
                          {supplierReport.report.redFlags.map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                      </div>
                    )}
                    {supplierReport.report.recommendedChecks?.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-700">اقدامات پیشنهادی:</span>
                        <ul className="space-y-1 pr-4 list-disc text-[11px] text-slate-600">
                          {supplierReport.report.recommendedChecks.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                    {supplierReport.disclaimer && (
                      <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-200 pt-2">{supplierReport.disclaimer}</p>
                    )}
                  </div>
                )}
              </div>

              {/* RFQ Preview snippet */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>پیش‌نویس استعلام رسمی قیمت و مشخصات (Official RFQ Package)</span>
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sampleRfqText);
                      setCopiedRfq(true);
                      setTimeout(() => setCopiedRfq(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedRfq ? 'کپی شد ✓' : 'کپی متن انگلیسی استعلام'}</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-slate-700 bg-slate-50 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap border border-slate-100 max-h-36 text-left" dir="ltr">
                  {sampleRfqText}
                </pre>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      موتور محاسبه بهای تمام‌شده نهایی ترخیص کالا (Landed Cost Engine)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      مبنای محاسبات: ارزش CIF × نرخ ارز → حقوق ورودی → سود بازرگانی → مالیات ارزش افزوده → هزینه‌های محلی
                    </p>
                  </div>
                  <div className="text-left flex gap-2" dir="ltr">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center">
                      <span className="text-[9px] text-slate-400 block">CIF هر واحد</span>
                      <span className="text-sm font-black text-white font-mono">${(fobPriceUsd + freightUsd + insuranceUsd).toFixed(2)}</span>
                    </div>
                    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center">
                      <span className="text-[9px] text-slate-400 block">مجموع تعرفه</span>
                      <span className="text-sm font-black text-amber-400 font-mono">{(customsDutyPct + commercialProfitPct).toLocaleString('fa-IR')}٪</span>
                    </div>
                    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center">
                      <span className="text-[9px] text-slate-400 block">تعداد</span>
                      <span className="text-sm font-black text-white font-mono">{qtyNumber.toLocaleString('fa-IR')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ماشین‌حساب کامل بهای تمام‌شده */}
              <LandedCostCalculator
                key={`calc-${currentStep}`}
                initial={{
                  fobUsd: fobPriceUsd,
                  freightUsd,
                  insuranceUsd,
                  qty: qtyNumber,
                  fxRateToman,
                  customsDutyPct,
                  commercialProfitPct,
                  vatPct: vatRate,
                  clearanceFeeToman,
                  inlandFreightToman,
                  brokerAndBankToman,
                  otherFeeToman,
                }}
                sellPricePerUnitToman={sellPricePerUnitToman || Math.round(landed.landedPerUnitToman * 1.3)}
                onSellPriceChange={setSellPricePerUnitToman}
                onResult={handleCalcResult}
              />
              <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                نرخ ارز پیش‌فرض از تنظیمات سامانه ({settings.fx.usdNimaToman.toLocaleString('fa-IR')} تومان نیما) بارگذاری شده و در همین ماشین‌حساب قابل تغییر است؛ حکم نهایی بر همین اعداد محاسبه می‌شود.
              </p>

              {/* Final Decision Gate Verdict */}
              <div className={`border rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 ${margin.profitPerUnitToman > 0 ? 'border-emerald-200 bg-emerald-50/80' : 'border-rose-200 bg-rose-50/80'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${margin.profitPerUnitToman > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {margin.profitPerUnitToman > 0 ? '✓' : '!'}
                  </div>
                  <div>
                    <h5 className={`text-xs font-bold ${margin.profitPerUnitToman > 0 ? 'text-emerald-950' : 'text-rose-950'}`}>
                      نتیجه بررسی پرونده: {margin.profitPerUnitToman > 0 ? 'توجیه‌پذیری اقتصادی تأیید شد' : 'حاشیه سود منفی — نیازمند بازنگری قیمت یا نرخ ارز'}
                    </h5>
                    <p className={`text-[11px] ${margin.profitPerUnitToman > 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                      حاشیه سود {margin.marginPct.toLocaleString('fa-IR')}٪ — بازده سرمایه {margin.roiPct.toLocaleString('fa-IR')}٪ — سود کل محموله {Math.round(margin.profitTotalToman / 1_000_000).toLocaleString('fa-IR')} میلیون تومان — نرخ سربه‌سر ارز {margin.breakEvenFxToman.toLocaleString('fa-IR')} تومان.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCreateAndAdd}
                  disabled={savingDossier || !productFa.trim() || !selectedHsCode}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{savingDossier ? 'در حال ثبت...' : 'ثبت در سامانه و ورود به کارتابل انبار'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            مرحله قبل
          </button>

          <div className="flex items-center gap-2">
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(3, prev + 1))}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 flex items-center gap-1.5 transition-colors"
              >
                <span>مرحله بعد</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCreateAndAdd}
                disabled={!productFa.trim() || !selectedHsCode}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 flex items-center gap-1.5 transition-colors"
              >
                <span>تکمیل و ورود به انبار</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


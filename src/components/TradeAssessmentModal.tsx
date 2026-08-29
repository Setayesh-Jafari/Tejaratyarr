import React, { useState } from 'react';
import { PRESET_SCENARIOS } from '../data/mockData';
import { HS_DISPUTE_SCENARIOS } from '../data/hscodeScenarios';
import { 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Scale, 
  ShieldCheck, 
  FileText, 
  TrendingUp, 
  Download, 
  Copy,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Anchor,
  DollarSign,
  AlertTriangle,
  Zap,
  Check
} from 'lucide-react';
import { InventoryUnit } from '../types';

interface TradeAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToInventory: (newItem: InventoryUnit) => void;
  initialScenario?: typeof HS_DISPUTE_SCENARIOS[0];
}

export const TradeAssessmentModal: React.FC<TradeAssessmentModalProps> = ({
  isOpen,
  onClose,
  onAddToInventory,
  initialScenario,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [copiedRfq, setCopiedRfq] = useState(false);

  // Form State
  const [productFa, setProductFa] = useState(initialScenario?.productNameFa || 'پنل خورشیدی مونوکریستال ۵۵۰ وات');
  const [productEn, setProductEn] = useState(initialScenario?.productNameEn || 'Monocrystalline Solar PV Module 550W');
  const [category, setCategory] = useState<any>(initialScenario?.category || 'تجهیزات خورشیدی و برق');
  const [selectedHsCode, setSelectedHsCode] = useState<string>(
    initialScenario?.competingCodes.find(c => c.isRecommended)?.code || '8541.43.00'
  );
  const [samtGroup, setSamtGroup] = useState('گروه ۲۱ (اولویت اول تجدیدپذیر)');
  const [specs, setSpecs] = useState('توان ۵۵۰ وات، فناوری N-Type TOPCon، بازدهی ۲۲.۸٪، گواهینامه TÜV و استاندارد IEC 61215');
  const [qty, setQty] = useState('یک کانتینر ۴۰ فوت های‌کیوب (۶۲۰ عدد)');
  const [unit, setUnit] = useState('عدد');
  const [originPref, setOriginPref] = useState('چین (بندر شانگهای)');
  const [customsPort, setCustomsPort] = useState('گمرک شهید رجایی بندرعباس');
  const [targetCustomer, setTargetCustomer] = useState('نیروگاه‌سازان تجدیدپذیر و شهرک‌های صنعتی');
  
  // Pricing & Landed Cost state
  const [fobPriceUsd, setFobPriceUsd] = useState<number>(62);
  const [freightUsd, setFreightUsd] = useState<number>(4.5);
  const [insuranceUsd, setInsuranceUsd] = useState<number>(1.2);
  const [usdFxRateToman, setUsdFxRateToman] = useState<number>(68000); // 68,000 Tomans per USD
  const [tariffRate, setTariffRate] = useState<number>(4); // 4% Customs Duty
  const [vatRate, setVatRate] = useState<number>(10); // 10% VAT
  const [clearanceAndPortCostToman, setClearanceAndPortCostToman] = useState<number>(180000); // per unit in Tomans

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
    setTariffRate(sc.customsDuty + sc.commercialProfit);
    setVatRate(sc.vat);
  };

  // Landed Cost calculations (in Tomans & USD)
  const cifUsd = fobPriceUsd + freightUsd + insuranceUsd;
  const baseCostToman = cifUsd * usdFxRateToman;
  const dutyCostToman = (baseCostToman * tariffRate) / 100;
  const landedPreVatToman = baseCostToman + dutyCostToman + clearanceAndPortCostToman;
  const vatCostToman = (landedPreVatToman * vatRate) / 100;
  const totalLandedCostToman = landedPreVatToman + vatCostToman;
  
  // Total in millions or thousands
  const landedInMillionToman = Number((totalLandedCostToman / 1000000).toFixed(2));
  const estimatedMarketPriceToman = Number((landedInMillionToman * 1.30).toFixed(2)); // 30% margin

  const stages = [
    { title: '۱. کالا و مشخصات', desc: 'پارامترهای فنی کاتالوگ' },
    { title: '۲. تفکیک تعرفه HS', desc: 'انتخاب کد قطعی و صمت' },
    { title: '۳. اعتبارسنجی خارجی', desc: 'ممیزی حقوقی و RFQ' },
    { title: '۴. بهای تمام‌شده', desc: 'Landed Cost و سود' },
  ];

  const handleCreateAndAdd = () => {
    const newUnit: InventoryUnit = {
      id: `CARGO-IR-${Date.now().toString().slice(-4)}`,
      sku: `IMP-${Date.now().toString().slice(-4)}`,
      vinOrCode: `HS-${selectedHsCode.replace(/\./g, '')}-${Date.now().toString().slice(-3)}`,
      name: productFa,
      category: category,
      specifications: specs,
      originCountry: originPref,
      customsPort: customsPort,
      yearOrBatch: '۱۴۰۳ / پارت مصوب',
      status: 'در انتظار تخصیص ارز و ثبت سفارش',
      stockQty: 50,
      unit: unit,
      costPriceUsd: fobPriceUsd,
      landedCostToman: landedInMillionToman,
      marketPriceToman: estimatedMarketPriceToman,
      hsCode: selectedHsCode,
      samtGroup: samtGroup,
      orderRegCode: `1403${Math.floor(100000 + Math.random() * 900000)}`,
      fxType: samtGroup.includes('۲۱') ? 'ارز نیمایی (سامانه نیما)' : 'ارز تالار دوم (توافقی)',
      supplierName: `${originPref.split(' ')[0]} Certified Manufacturer`,
      supplierRating: 96,
      complianceGate: 'تأیید استاندارد و بهداشت',
      lastUpdated: 'هم‌اکنون',
    };
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
        <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                موتور ارزیابی امکان‌سنجی واردات و ممیزی تأمین‌کننده (تجارت‌یار)
              </h3>
              <p className="text-[11px] text-slate-400">
                بررسی شواهدمحور، مجوزهای صمت و استاندارد، محاسبه بهای تمام‌شده و بسته صدور RFQ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
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
                  currentStep === idx ? 'bg-blue-600 text-white' : currentStep > idx ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
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
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
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
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نام بین‌المللی کالا (International Description) *</label>
                  <input
                    type="text"
                    value={productEn}
                    onChange={(e) => setProductEn(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">مشخصات فنی، کاتالوگ و گواهی‌های استاندارد *</label>
                <textarea
                  rows={2}
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">تعداد / حجم سفارش هدف *</label>
                  <input
                    type="text"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">واحد سنجش</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">کشور و بندر مبدأ بارگیری</label>
                  <input
                    type="text"
                    value={originPref}
                    onChange={(e) => setOriginPref(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                          setTariffRate(codeItem.totalTariffPercent);
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
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">بازار و مشتری هدف در ایران</label>
                  <input
                    type="text"
                    value={targetCustomer}
                    onChange={(e) => setTargetCustomer(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>اعتبارسنجی حقوقی و بررسی ریسک تحریم تأمین‌کننده خارجی</span>
                  </h4>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    امتیاز اعتبار ۹۸ از ۱۰۰
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] mb-0.5">شناسه ثبت بین‌المللی:</span>
                    <strong className="text-slate-800 font-mono">HRB-782194 / CN-91320</strong>
                    <p className="text-[10px] text-emerald-600 mt-1 font-bold">✓ کارخانه مستقیم احراز شد</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] mb-0.5">استانداردهای خط تولید:</span>
                    <strong className="text-slate-800">ISO 9001, CE, TÜV Rheinland</strong>
                    <p className="text-[10px] text-emerald-600 mt-1 font-bold">✓ ممیزی فنی معتبر ۲۰۲۴</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] mb-0.5">انتقال حواله و ارزی:</span>
                    <strong className="text-slate-800">مسیر امارات / عمان / چین</strong>
                    <p className="text-[10px] text-emerald-600 mt-1 font-bold">✓ کانال امن صرافی تضامنی</p>
                  </div>
                </div>
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
              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      موتور محاسبه بهای تمام‌شده نهایی ترخیص کالا (Landed Cost Engine)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      محاسبه قیمت خرید ارزی، حمل بین‌المللی، بیمه، حقوق ورودی گمرکی، سود بازرگانی و مالیات ارزش افزوده
                    </p>
                  </div>
                  <div className="text-left" dir="ltr">
                    <span className="text-[10px] text-slate-400 block">بهای تمام‌شده هر واحد:</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {landedInMillionToman.toLocaleString('fa-IR')} <span className="text-xs font-normal text-emerald-200">میلیون تومان</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block mb-1">قیمت FOB خرید ($):</span>
                    <input
                      type="number"
                      value={fobPriceUsd}
                      onChange={(e) => setFobPriceUsd(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block mb-1">کرایه حمل کانتینر ($):</span>
                    <input
                      type="number"
                      value={freightUsd}
                      onChange={(e) => setFreightUsd(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block mb-1">نرخ برابری ارز (تومان):</span>
                    <input
                      type="number"
                      value={usdFxRateToman}
                      onChange={(e) => setUsdFxRateToman(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block mb-1">حقوق ورودی و سود بازرگانی (%):</span>
                    <input
                      type="number"
                      value={tariffRate}
                      onChange={(e) => setTariffRate(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block mb-1">قیمت فروش پیشنهادی در بازار:</span>
                    <div className="text-xs font-bold text-blue-400 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono">
                      {estimatedMarketPriceToman.toLocaleString('fa-IR')} م.ت (+۳۰٪)
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Decision Gate Verdict */}
              <div className="border border-emerald-200 bg-emerald-50/80 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg">
                    ✓
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-950">نتیجه بررسی پرونده: توجیه‌پذیری اقتصادی تأیید شد</h5>
                    <p className="text-[11px] text-emerald-800">
                      شاخص ریسک پایین (امتیاز ۹۶)، حاشیه سود پیش‌بینی شده بالای ۳۰٪ و مسیر تأمین ارز بدون مانع حقوقی.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCreateAndAdd}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ثبت در سامانه و ورود به کارتابل انبار</span>
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm shadow-blue-200 flex items-center gap-1.5 transition-colors"
              >
                <span>مرحله بعد</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCreateAndAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm shadow-blue-200 flex items-center gap-1.5 transition-colors"
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


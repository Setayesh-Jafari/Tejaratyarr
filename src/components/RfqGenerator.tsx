import React, { useState } from 'react';
import { SupplierRecord } from '../types';
import { Send, Copy, FileText, CheckCircle2, Download, Sparkles, Building2 } from 'lucide-react';

interface RfqGeneratorProps {
  suppliers: SupplierRecord[];
  activeSupplier?: SupplierRecord | null;
}

export const RfqGenerator: React.FC<RfqGeneratorProps> = ({ suppliers, activeSupplier }) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    activeSupplier ? activeSupplier.id : suppliers[0]?.id || ''
  );
  const [productTitle, setProductTitle] = useState('Monocrystalline Solar PV Module 550W TOPCon');
  const [quantity, setQuantity] = useState('Two 40ft HQ Containers (approx 1,240 panels)');
  const [incoterms, setIncoterms] = useState('CIF Bandar Abbas / Dubai Jebel Ali (Incoterms 2020)');
  const [targetTargetSpecs, setTargetSpecs] = useState('Tier-1 Bloomberg, N-Type TOPCon 144 half-cut cells, IEC 61215/61730 certified');
  const [copied, setCopied] = useState(false);

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

  const generatedEmail = `To: ${selectedSupplier?.email || 'sales@supplier.com'}
Attn: ${selectedSupplier?.contactPerson || 'International Export Dept.'} (${selectedSupplier?.name})
Subject: Formal RFQ [Procurement ID: IR-RFQ-${Date.now().toString().slice(-6)}] - ${productTitle}

Dear ${selectedSupplier?.contactPerson || 'International Export Team'},

On behalf of Iranian Commercial & Import Directorate, we are issuing this formal Request for Quotation (RFQ) for the following commercial batch:

1. PRODUCT SPECIFICATIONS & TECHNICAL REQUIREMENTS:
   - Item Description: ${productTitle}
   - Technical Standard: ${targetTargetSpecs}
   - Required Quality Certifications: ${selectedSupplier?.certifications?.join(', ') || 'ISO 9001, CE, TÜV Rheinland'}
   - Certificate of Conformity / Pre-Shipment Inspection: COI / VOC required for customs clearance

2. COMMERCIAL & SHIPPING TERMS:
   - Target Order Volume: ${quantity}
   - Delivery Incoterms: ${incoterms}
   - Packing: Standard Export Sea-Worthy Palletized Crates with Moisture Protection
   - Target Dispatch Window: Q3/Q4 2024
   - Accepted Payment Terms: Irrevocable Documentary L/C or Direct Telegraphic Transfer (TT) via verified exchange channels (UAE / Oman / China)

3. REQUIRED SUBMISSIONS IN YOUR PROFORMA:
   Please reply with your official Proforma Invoice / Quotation Sheet including:
   a) Unit FOB & CIF price per unit/pallet
   b) Net/Gross Weight & CBM loading calculation per container
   c) Certificate of Origin & Factory Test Inspection Reports (TUV/CE)
   d) Validity period of the commercial quotation

Thank you for your prompt cooperation.

Best regards,
Commercial & Sourcing Operations
TejaratYar Global Trade Platform
Email: procurement@tejaratyar-trade.ir`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedEmail], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RFQ_${selectedSupplier?.name?.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-right">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/60">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <Send className="w-4 h-4 text-blue-600" />
            <span>سامانه هوشمند صدور استعلام رسمی بازرگانی (RFQ Generator)</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            تولید متن استاندارد و رسمی مذاکرات بین‌المللی B2B همراه با مشخصات فنی، اینکوترمز و الزامات بازرسی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 shadow-2xs transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-blue-600" />
            <span>{copied ? 'در کلیپ‌بورد کپی شد ✓' : 'کپی متن استعلام'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>دانلود فایل متنی</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Left Config Column */}
        <div className="col-span-5 border-l border-slate-200 p-5 overflow-y-auto space-y-4 bg-slate-50/40">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">تأمین‌کننده خارجی طرف مذاکره</label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.country} - {s.tier})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">عنوان تجاری کالا (انگلیسی)</label>
            <input
              type="text"
              value={productTitle}
              onChange={(e) => setProductTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-left"
              dir="ltr"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">شرح استانداردها و مشخصات فنی</label>
            <textarea
              rows={3}
              value={targetTargetSpecs}
              onChange={(e) => setTargetSpecs(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-left leading-relaxed"
              dir="ltr"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">حجم و تعداد مورد سفارش</label>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-left"
              dir="ltr"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">قواعد اینکوترمز و گمرک مقصد</label>
            <input
              type="text"
              value={incoterms}
              onChange={(e) => setIncoterms(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-left"
              dir="ltr"
            />
          </div>

          {selectedSupplier && (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">مشخصات طرف خارجی و رابط فروش:</span>
              <div className="text-slate-900 font-bold">{selectedSupplier.contactPerson}</div>
              <div className="text-slate-500 font-mono text-[11px]" dir="ltr">{selectedSupplier.email}</div>
              <div className="text-slate-500 font-mono text-[11px]" dir="ltr">{selectedSupplier.phone}</div>
            </div>
          )}
        </div>

        {/* Right Preview Column */}
        <div className="col-span-7 p-5 overflow-y-auto flex flex-col bg-white">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>پیش‌نمایش زنده سند رسمی استعلام تجاری</span>
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
              آماده ارسال به کمپانی
            </span>
          </div>

          <div className="flex-1 bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-2xl border border-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner text-left" dir="ltr">
            {generatedEmail}
          </div>
        </div>
      </div>
    </div>
  );
};


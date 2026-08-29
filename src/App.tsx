import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Boxes, Workflow, Scale, Sparkles, FileCheck2, Globe2, Send, BarChart3, Database,
} from 'lucide-react';
import { ActiveView, isSettledStatus } from './types';
import { HS_DISPUTE_SCENARIOS } from './data/hscodeScenarios';
import { AppStoreProvider, useStore } from './store/AppStore';
import { ToastHost, ViewSkeleton, FatalError } from './components/ui/Feedback';
import { PageHero } from './components/ui/Chrome';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { InventoryTable } from './components/InventoryTable';
import { PerformanceSection } from './components/PerformanceSection';
import { SupplierEvaluation } from './components/SupplierEvaluation';
import { TradeIntelligenceSearch } from './components/TradeIntelligenceSearch';
import { RfqGenerator } from './components/RfqGenerator';
import { FinancialLedger } from './components/FinancialLedger';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { CargoPipeline } from './components/CargoPipeline';
import { TradeAssessmentModal } from './components/TradeAssessmentModal';
import { UnitDetailModal } from './components/UnitDetailModal';
import { AddUnitModal } from './components/AddUnitModal';
import { HsCodeResolver } from './components/HsCodeResolver';
import { DataProvenanceView } from './components/DataProvenanceView';
import { fmtBillion } from './lib/format';
import type { InventoryUnit, SupplierRecord, TradeAssessmentDossier } from './types';

const Workspace: React.FC = () => {
  const {
    ready, error, retry,
    inventory, suppliers,
    addUnit, updateUnitStatus, patchUnit, saveAssessment,
  } = useStore();

  const [activeView, setActiveView] = useState<ActiveView>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [assessmentScenario, setAssessmentScenario] = useState<typeof HS_DISPUTE_SCENARIOS[0] | undefined>(undefined);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<InventoryUnit | null>(null);
  const [activeRfqSupplier, setActiveRfqSupplier] = useState<SupplierRecord | null>(null);

  const selectedUnitLive = selectedUnit ? inventory.find((u) => u.id === selectedUnit.id) ?? selectedUnit : null;

  const handleAddUnit = async (newUnit: InventoryUnit) => {
    await addUnit(newUnit);
  };

  const handleOpenRfqWithSupplier = (supplier: SupplierRecord) => {
    setActiveRfqSupplier(supplier);
    setActiveView('rfq');
  };

  const handleOpenRfqFromIntelligence = (_title: string, origin: string) => {
    const matchedSup = suppliers.find((s) => s.country.includes(origin.split(' ')[0])) || suppliers[0];
    if (matchedSup) setActiveRfqSupplier(matchedSup);
    setActiveView('rfq');
  };

  const handleStartAssessmentWithScenario = (scenario: typeof HS_DISPUTE_SCENARIOS[0]) => {
    setAssessmentScenario(scenario);
    setIsAssessmentOpen(true);
  };

  const handleAddDossier = async (dossier: Omit<TradeAssessmentDossier, 'id'>) => {
    await saveAssessment({ ...dossier, id: `DOSS-${Date.now().toString(36)}` });
  };

  /* شاخص‌های زنده برای سربرگ هر نما */
  const activeShipments = inventory.filter((u) => !isSettledStatus(u.status)).length;
  const customsCount = inventory.filter((u) => u.status === 'در گمرک (در حال ترخیص)').length;
  const portfolioValue = inventory.reduce((s, u) => s + u.landedCostToman * u.stockQty, 0);

  const heroFor = (view: ActiveView) => {
    switch (view) {
      case 'inventory':
        return (
          <PageHero
            icon={<Boxes className="w-5 h-5" />}
            eyebrow="کارتابل عملیات"
            title="مدیریت کارگو و موجودی انبار"
            subtitle="پرونده‌های وارداتی، وضعیت ترخیص، ارزش‌گذاری سبد و خروجی CSV — همگی متصل به سرور و ذخیره‌شده."
            stats={[
              { label: 'پرونده فعال', value: activeShipments.toLocaleString('fa-IR'), tone: 'text-indigo-600' },
              { label: 'در گمرک', value: customsCount.toLocaleString('fa-IR'), tone: 'text-amber-600' },
              { label: 'ارزش سبد', value: `${fmtBillion(portfolioValue)} میلیارد ت`, tone: 'text-emerald-600' },
            ]}
          />
        );
      case 'pipeline':
        return (
          <PageHero
            icon={<Workflow className="w-5 h-5" />}
            eyebrow="چرخه عمر پرونده"
            title="گردش کار واردات — از ثبت سفارش تا انبار"
            subtitle="کارت‌ها را بین مراحل جابه‌جا کنید؛ هر حرکت در تایم‌لاین پرونده ثبت و روی سرور ذخیره می‌شود."
            stats={[
              { label: 'در گمرک', value: customsCount.toLocaleString('fa-IR'), tone: 'text-amber-600' },
              { label: 'در جریان', value: activeShipments.toLocaleString('fa-IR'), tone: 'text-indigo-600' },
            ]}
          />
        );
      case 'hscode_resolver':
        return (
          <PageHero
            icon={<Scale className="w-5 h-5" />}
            eyebrow="تعرفه گمرکی"
            title="تفکیک هوشمند کد تعرفه (HS Code)"
            subtitle="پیشنهاد هوشمند + دایرکتوری رسمی تعرفه‌ها با حقوق ورودی، سود بازرگانی، مجوزها و شناسنامه استنادی هر کد."
          />
        );
      case 'intelligence':
        return (
          <PageHero
            icon={<Sparkles className="w-5 h-5" />}
            eyebrow="هوش تجاری"
            title="کاوشگر اسناد و موتورهای استنادی تجارت"
            subtitle="نتایج ساختاریافته از منابع بین‌المللی با وضعیت راستی‌آزمایی و امتیاز اطمینان."
          />
        );
      case 'assessment':
        return (
          <PageHero
            icon={<FileCheck2 className="w-5 h-5" />}
            eyebrow="ویزارد ۴ مرحله‌ای"
            title="ارزیابی جامع امکان‌سنجی واردات"
            subtitle="تعرفه، تأمین‌کننده، بهای تمام‌شده و حاشیه سود — با موتور محاسباتی رسمی و آرشیو پرونده."
          />
        );
      case 'sourcing':
        return (
          <PageHero
            icon={<Globe2 className="w-5 h-5" />}
            eyebrow="Due Diligence"
            title="اعتبارسنجی تأمین‌کنندگان خارجی"
            subtitle={`ماتریس ممیزی ${suppliers.length.toLocaleString('fa-IR')} تأمین‌کننده + تحلیل هوشمند ریسک واسطه‌ها و تحریم‌ها.`}
          />
        );
      case 'rfq':
        return (
          <PageHero
            icon={<Send className="w-5 h-5" />}
            eyebrow="مکاتبات خرید"
            title="صدور استعلام قیمت بین‌المللی (RFQ)"
            subtitle="پیش‌نویس رسمی پروفرما با اینکوترمز ۲۰۲۰، شرایط پرداخت امن و گواهی‌های الزامی."
          />
        );
      case 'analytics':
        return (
          <PageHero
            icon={<BarChart3 className="w-5 h-5" />}
            eyebrow="تحلیل و مالی"
            title="داشبورد تحلیلی سبد وارداتی"
            subtitle="نمودارهای زنده از داده واقعی کارتابل + موتور بهای تمام‌شده و تنظیمات نرخ ارز."
            stats={[{ label: 'ارزش سبد', value: `${fmtBillion(portfolioValue)} میلیارد ت`, tone: 'text-emerald-600' }]}
          />
        );
      case 'provenance':
        return (
          <PageHero
            icon={<Database className="w-5 h-5" />}
            eyebrow="شفافیت داده"
            title="شناسنامه منابع داده و استنادهای رسمی"
            subtitle="مرجع هر داده، متدولوژی محاسبات و تاریخ بازبینی کدهای تعرفه."
          />
        );
      default:
        return null;
    }
  };

  return (
    <div dir="rtl" className="flex h-screen w-screen overflow-hidden tj-canvas font-sans antialiased text-slate-900 select-none">
      {/* سایدبار تیره — سمت راست در RTL */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAssessment={() => setIsAssessmentOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* بوم کار روشن */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeView={activeView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenAddUnit={() => setIsAddUnitOpen(true)}
          onOpenAssessment={() => setIsAssessmentOpen(true)}
          onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
          totalUnits={inventory.length}
        />

        <div className="p-3 md:p-5 space-y-3.5 flex-1 overflow-hidden flex flex-col min-h-0">
          {!ready && <ViewSkeleton />}
          {ready && error && <FatalError message={error} onRetry={retry} />}

          {ready && !error && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="flex-1 flex flex-col min-h-0 gap-3.5"
              >
                {heroFor(activeView)}

                {activeView === 'inventory' && (
                  <>
                    <MetricsOverview inventory={inventory} />
                    <InventoryTable
                      inventory={inventory}
                      searchQuery={searchQuery}
                      onSelectUnit={(unit) => setSelectedUnit(unit)}
                    />
                    <PerformanceSection />
                  </>
                )}

                {activeView === 'pipeline' && <CargoPipeline />}

                {activeView === 'hscode_resolver' && (
                  <div className="flex-1 overflow-y-auto min-h-0 pr-0.5 space-y-3.5">
                    <HsCodeResolver onSelectForAssessment={handleStartAssessmentWithScenario} />
                  </div>
                )}

                {activeView === 'provenance' && (
                  <div className="flex-1 overflow-y-auto min-h-0 pr-0.5 space-y-3.5">
                    <DataProvenanceView />
                  </div>
                )}

                {activeView === 'intelligence' && (
                  <TradeIntelligenceSearch
                    onOpenAssessment={() => setIsAssessmentOpen(true)}
                    onOpenRfq={handleOpenRfqFromIntelligence}
                  />
                )}

                {activeView === 'sourcing' && (
                  <SupplierEvaluation
                    suppliers={suppliers}
                    onOpenRfqWithSupplier={handleOpenRfqWithSupplier}
                  />
                )}

                {activeView === 'rfq' && (
                  <RfqGenerator suppliers={suppliers} activeSupplier={activeRfqSupplier} />
                )}

                {activeView === 'analytics' && (
                  <>
                    <AnalyticsDashboard />
                    <FinancialLedger inventory={inventory} />
                  </>
                )}

                {activeView === 'assessment' && (
                  <div className="flex-1 tj-card flex flex-col items-center justify-center p-10 text-center space-y-4">
                    <div className="tj-grad tj-grad-ring w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-lg">
                      <FileCheck2 className="w-7 h-7" />
                    </div>
                    <div className="max-w-md space-y-1.5">
                      <h3 className="text-base font-black text-slate-800">سامانه ارزیابی جامع واردات و ترخیص (۴ مرحله‌ای)</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        مشخصات کالا ← تفکیک تعرفه ← اعتبارسنجی تأمین‌کننده ← محاسبه بهای تمام‌شده و ثبت در کارتابل.
                      </p>
                    </div>
                    <button onClick={() => setIsAssessmentOpen(true)} className="tj-btn tj-btn-primary">
                      شروع ویزارد ارزیابی کالا
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* مودال‌ها */}
      <TradeAssessmentModal
        isOpen={isAssessmentOpen}
        onClose={() => {
          setIsAssessmentOpen(false);
          setAssessmentScenario(undefined);
        }}
        onAddToInventory={handleAddUnit}
        onAddDossier={handleAddDossier}
        initialScenario={assessmentScenario}
      />

      <UnitDetailModal
        key={selectedUnitLive?.id ?? 'none'}
        unit={selectedUnitLive}
        onClose={() => setSelectedUnit(null)}
        onUpdateStatus={updateUnitStatus}
        onPatchUnit={patchUnit}
      />

      <AddUnitModal
        isOpen={isAddUnitOpen}
        onClose={() => setIsAddUnitOpen(false)}
        onAdd={handleAddUnit}
      />

      <ToastHost />
    </div>
  );
};

export default function App() {
  return (
    <AppStoreProvider>
      <Workspace />
    </AppStoreProvider>
  );
}

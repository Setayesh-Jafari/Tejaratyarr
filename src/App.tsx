import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ActiveView } from './types';
import { HS_DISPUTE_SCENARIOS } from './data/hscodeScenarios';
import { AppStoreProvider, useStore } from './store/AppStore';
import { ToastHost, ViewSkeleton, FatalError } from './components/ui/Feedback';
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
import type { InventoryUnit, SupplierRecord, TradeAssessmentDossier } from './types';

const Workspace: React.FC = () => {
  const {
    ready, error, retry,
    inventory, suppliers,
    addUnit, updateUnitStatus, saveAssessment,
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

  // نسخه به‌روزشده واحد پس از تغییر وضعیت در مودال جزئیات
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

  return (
    <div dir="rtl" className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans antialiased text-slate-900 select-none">
      {/* Dark Sidebar — سمت راست در RTL */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAssessment={() => setIsAssessmentOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC]">
        <Header
          activeView={activeView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenAddUnit={() => setIsAddUnitOpen(true)}
          onOpenAssessment={() => setIsAssessmentOpen(true)}
          onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
          totalUnits={inventory.length}
        />

        <div className="p-3 md:p-6 space-y-4 flex-1 overflow-hidden flex flex-col min-h-0">
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
                className="flex-1 flex flex-col min-h-0"
              >
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
                  <div className="flex-1 overflow-y-auto min-h-0 pr-0.5">
                    <HsCodeResolver onSelectForAssessment={handleStartAssessmentWithScenario} />
                  </div>
                )}

                {activeView === 'provenance' && (
                  <div className="flex-1 overflow-y-auto min-h-0 pr-0.5">
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
                  <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold border border-blue-100 shadow-xs">
                      ✨
                    </div>
                    <div className="max-w-md space-y-1.5">
                      <h3 className="text-base font-bold text-slate-800">سامانه ارزیابی جامع واردات و ترخیص (۷ مرحله‌ای)</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        جهت بررسی سودآوری، طبقه‌بندی تعرفه، گروه‌بندی کالایی صمت، اعتبارسنجی تأمین‌کننده خارجی و محاسبه بهای تمام‌شده روی دکمه زیر کلیک نمایید.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAssessmentOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors"
                    >
                      شروع ویزارد ارزیابی کالا
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Modals */}
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
        unit={selectedUnitLive}
        onClose={() => setSelectedUnit(null)}
        onUpdateStatus={updateUnitStatus}
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

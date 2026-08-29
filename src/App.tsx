import React, { useState } from 'react';
import { InventoryUnit, SupplierRecord, ActiveView } from './types';
import { INITIAL_INVENTORY, INITIAL_SUPPLIERS } from './data/mockData';
import { HS_DISPUTE_SCENARIOS } from './data/hscodeScenarios';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { InventoryTable } from './components/InventoryTable';
import { PerformanceSection } from './components/PerformanceSection';
import { SupplierEvaluation } from './components/SupplierEvaluation';
import { TradeIntelligenceSearch } from './components/TradeIntelligenceSearch';
import { RfqGenerator } from './components/RfqGenerator';
import { FinancialLedger } from './components/FinancialLedger';
import { TradeAssessmentModal } from './components/TradeAssessmentModal';
import { UnitDetailModal } from './components/UnitDetailModal';
import { AddUnitModal } from './components/AddUnitModal';
import { HsCodeResolver } from './components/HsCodeResolver';
import { DataProvenanceView } from './components/DataProvenanceView';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [inventory, setInventory] = useState<InventoryUnit[]>(INITIAL_INVENTORY);
  const [suppliers] = useState<SupplierRecord[]>(INITIAL_SUPPLIERS);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [assessmentScenario, setAssessmentScenario] = useState<typeof HS_DISPUTE_SCENARIOS[0] | undefined>(undefined);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<InventoryUnit | null>(null);
  const [activeRfqSupplier, setActiveRfqSupplier] = useState<SupplierRecord | null>(null);

  const handleAddUnit = (newUnit: InventoryUnit) => {
    setInventory((prev) => [newUnit, ...prev]);
  };

  const handleUpdateUnitStatus = (unitId: string, status: InventoryUnit['status']) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === unitId ? { ...item, status } : item))
    );
    if (selectedUnit && selectedUnit.id === unitId) {
      setSelectedUnit((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const handleOpenRfqWithSupplier = (supplier: SupplierRecord) => {
    setActiveRfqSupplier(supplier);
    setActiveView('rfq');
  };

  const handleOpenRfqFromIntelligence = (title: string, origin: string) => {
    // Find or create dummy supplier context for quick RFQ
    const matchedSup = suppliers.find(s => s.country.includes(origin.split(' ')[0])) || suppliers[0];
    setActiveRfqSupplier(matchedSup);
    setActiveView('rfq');
  };

  const handleStartAssessmentWithScenario = (scenario: typeof HS_DISPUTE_SCENARIOS[0]) => {
    setAssessmentScenario(scenario);
    setIsAssessmentOpen(true);
  };

  return (
    <div dir="rtl" className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans antialiased text-slate-900 select-none">
      {/* Dark Sidebar - Rendered on the Right side in RTL */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAssessment={() => setIsAssessmentOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main High-Density Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC]">
        {/* Top Header */}
        <Header
          activeView={activeView}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenAddUnit={() => setIsAddUnitOpen(true)}
          onOpenAssessment={() => setIsAssessmentOpen(true)}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(prev => !prev)}
          totalUnits={inventory.length}
        />

        {/* View Switcher Container */}
        <div className="p-3 md:p-6 space-y-4 flex-1 overflow-hidden flex flex-col min-h-0">
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
            <RfqGenerator
              suppliers={suppliers}
              activeSupplier={activeRfqSupplier}
            />
          )}

          {activeView === 'analytics' && (
            <FinancialLedger inventory={inventory} />
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
        initialScenario={assessmentScenario}
      />

      <UnitDetailModal
        unit={selectedUnit}
        onClose={() => setSelectedUnit(null)}
        onUpdateStatus={handleUpdateUnitStatus}
      />

      <AddUnitModal
        isOpen={isAddUnitOpen}
        onClose={() => setIsAddUnitOpen(false)}
        onAdd={handleAddUnit}
      />
    </div>
  );
}


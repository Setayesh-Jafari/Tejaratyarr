/**
 * فروشگاه مرکزی برنامه — منبع یگانه حقیقت (Single Source of Truth)
 * ------------------------------------------------------------------
 * داده‌ها در startup از سرور بارگذاری و هر تغییر از مسیر API ثبت می‌شود.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { InventoryUnit, SupplierRecord, TradeAssessmentDossier, AppSettings, HealthResponse } from '../types';
import { api } from '../lib/api';

/* ------------------------------ Toasts ------------------------------ */

export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info';
  message: string;
}

/* ------------------------------ Context ----------------------------- */

interface AppStoreShape {
  ready: boolean;
  error: string | null;
  retry: () => void;
  inventory: InventoryUnit[];
  suppliers: SupplierRecord[];
  assessments: TradeAssessmentDossier[];
  settings: AppSettings;
  health: HealthResponse | null;
  toasts: Toast[];
  toast: (kind: Toast['kind'], message: string) => void;
  dismissToast: (id: number) => void;
  addUnit: (u: InventoryUnit) => Promise<InventoryUnit>;
  updateUnitStatus: (id: string, status: InventoryUnit['status'], note?: string) => Promise<void>;
  patchUnit: (id: string, patch: Partial<InventoryUnit>) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  saveAssessment: (a: TradeAssessmentDossier) => Promise<TradeAssessmentDossier>;
  saveSettings: (patch: Partial<AppSettings> & { fx?: Partial<AppSettings['fx']> }) => Promise<void>;
}

const AppStoreCtx = createContext<AppStoreShape | null>(null);

export const useStore = (): AppStoreShape => {
  const ctx = useContext(AppStoreCtx);
  if (!ctx) throw new Error('useStore باید داخل AppStoreProvider استفاده شود.');
  return ctx;
};

const DEFAULT_SETTINGS: AppSettings = {
  fx: { usdNimaToman: 68000, usdAzadToman: 92500, eurToman: 76500, updatedAt: new Date().toISOString() },
  vatDefaultPct: 10,
  orgName: 'شرکت بازرگانی بین‌المللی آریا',
};

export const AppStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadTick, setLoadTick] = useState(0);
  const [inventory, setInventory] = useState<InventoryUnit[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [assessments, setAssessments] = useState<TradeAssessmentDossier[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((kind: Toast['kind'], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-3), { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* بارگذاری اولیه */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [boot, h] = await Promise.all([api.bootstrap(), api.health()]);
        if (cancelled) return;
        setInventory(boot.inventory);
        setSuppliers(boot.suppliers);
        setAssessments(boot.assessments);
        setSettings(boot.settings);
        setHealth(h);
        setError(null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'اتصال به سرور برقرار نشد.');
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [loadTick]);

  const retry = useCallback(() => setLoadTick((t) => t + 1), []);

  /* ----------------------------- Actions ---------------------------- */

  const addUnit = useCallback(async (u: InventoryUnit) => {
    const saved = await api.createUnit(u);
    setInventory((prev) => [saved, ...prev]);
    toast('success', `پرونده «${saved.name}» در کارتابل ثبت شد.`);
    return saved;
  }, [toast]);

  const updateUnitStatus = useCallback(async (id: string, status: InventoryUnit['status'], note?: string) => {
    try {
      const updated = await api.setStatus(id, status, note);
      setInventory((prev) => prev.map((it) => (it.id === id ? updated : it)));
      toast('info', `وضعیت به «${status}» تغییر کرد.`);
    } catch (e: any) {
      toast('error', e?.message ?? 'ثبت تغییر وضعیت ناموفق بود.');
    }
  }, [toast]);

  const patchUnit = useCallback(async (id: string, patch: Partial<InventoryUnit>) => {
    try {
      const updated = await api.patchUnit(id, patch);
      setInventory((prev) => prev.map((it) => (it.id === id ? updated : it)));
    } catch (e: any) {
      toast('error', e?.message ?? 'ذخیره تغییرات ناموفق بود.');
    }
  }, [toast]);

  const deleteUnit = useCallback(async (id: string) => {
    try {
      await api.deleteUnit(id);
      setInventory((prev) => prev.filter((it) => it.id !== id));
      toast('info', 'پرونده از کارتابل حذف شد.');
    } catch (e: any) {
      toast('error', e?.message ?? 'حذف ناموفق بود.');
    }
  }, [toast]);

  const saveAssessment = useCallback(async (a: TradeAssessmentDossier) => {
    const saved = await api.addAssessment(a);
    setAssessments((prev) => [saved, ...prev]);
    return saved;
  }, []);

  const saveSettings = useCallback(async (patch: Partial<AppSettings> & { fx?: Partial<AppSettings['fx']> }) => {
    try {
      const saved = await api.patchSettings(patch);
      setSettings(saved);
      toast('success', 'تنظیمات ذخیره شد.');
    } catch (e: any) {
      toast('error', e?.message ?? 'ذخیره تنظیمات ناموفق بود.');
    }
  }, [toast]);

  const value = useMemo<AppStoreShape>(() => ({
    ready, error, retry,
    inventory, suppliers, assessments, settings, health,
    toasts, toast, dismissToast,
    addUnit, updateUnitStatus, patchUnit, deleteUnit, saveAssessment, saveSettings,
  }), [ready, error, retry, inventory, suppliers, assessments, settings, health, toasts, toast, dismissToast, addUnit, updateUnitStatus, patchUnit, deleteUnit, saveAssessment, saveSettings]);

  return <AppStoreCtx.Provider value={value}>{children}</AppStoreCtx.Provider>;
};

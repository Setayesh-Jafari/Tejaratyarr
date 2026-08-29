/**
 * لایه ذخیره‌سازی داده — فایل JSON اتمیک با کش درون‌حافظه‌ای
 * ------------------------------------------------------------------
 * برای مقیاس فعلی (صدها رکورد) کاملاً پاسخگوست؛ مسیر ارتقا به
 * SQLite/better-sqlite3 بدون تغییر رابط توابع زیر ممکن است.
 */
import fs from 'fs';
import path from 'path';
import { InventoryUnit, SupplierRecord, TradeAssessmentDossier, AppSettings, CargoEvent } from '../src/types';
import { INITIAL_INVENTORY, INITIAL_SUPPLIERS } from '../src/data/mockData';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'appstore.json');

interface DbShape {
  inventory: InventoryUnit[];
  suppliers: SupplierRecord[];
  assessments: TradeAssessmentDossier[];
  settings: AppSettings;
}

let cache: DbShape | null = null;
let flushTimer: NodeJS.Timeout | null = null;

export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/* ------------------------------ Seed ------------------------------ */

const daysAgo = (n: number): string => new Date(Date.now() - n * 86400000).toISOString();

function seed(): DbShape {
  // برای هر واحد، تایم‌لاین معقول بر اساس وضعیت فعلی ساخته می‌شود
  const stageIndex: Record<string, number> = {
    'در انتظار تخصیص ارز و ثبت سفارش': 0,
    'در حال ترانزیت بین‌المللی': 1,
    'در گمرک (در حال ترخیص)': 2,
    'موجود در انبار (ترخیص شده)': 3,
    'رزرو مشتری / پیش‌فروش': 3,
  };

  const inventory: InventoryUnit[] = INITIAL_INVENTORY.map((u, i) => {
    const idx = stageIndex[u.status] ?? 3;
    const createdDays = 95 - i * 9; // پراکندگی زمانی بین ۲۰ تا ۹۵ روز قبل
    const events: CargoEvent[] = [
      { id: uid('EV'), at: daysAgo(createdDays), kind: 'created', title: 'ثبت اولیه پرونده در سامانه', detail: `ثبت سفارش ${u.orderRegCode} — تأمین ارز: ${u.fxType}`, by: 'کارشناس بازرگانی' },
    ];
    const stageDay = (s: string, d: number): CargoEvent => ({
      id: uid('EV'),
      at: daysAgo(d),
      kind: 'status_change',
      title: s,
      by: 'کارتابل عملیات',
    });
    if (idx >= 1) events.push(stageDay('در حال ترانزیت بین‌المللی', createdDays - 18));
    if (idx >= 2) events.push(stageDay('در گمرک (در حال ترخیص)', createdDays - 34));
    if (idx >= 3) events.push(stageDay('موجود در انبار (ترخیص شده)', createdDays - 50));
    if (u.status === 'رزرو مشتری / پیش‌فروش')
      events.push({ id: uid('EV'), at: daysAgo(6), kind: 'note', title: 'رزرو مشتری / پیش‌فروش', detail: 'تخصیص بخشی از موجودی به سفارش مشتری', by: 'واحد فروش' });

    return {
      ...u,
      events,
      createdAt: daysAgo(createdDays),
      stageEnteredAt: daysAgo(idx >= 3 ? createdDays - 50 : idx === 2 ? createdDays - 34 : idx === 1 ? createdDays - 18 : createdDays),
    };
  });

  return {
    inventory,
    suppliers: INITIAL_SUPPLIERS,
    assessments: [],
    settings: {
      fx: { usdNimaToman: 68000, usdAzadToman: 92500, eurToman: 76500, updatedAt: new Date().toISOString() },
      vatDefaultPct: 10,
      orgName: 'ستایش جعفری',
    },
  };
}

/* ------------------------------ IO ------------------------------- */

function load(): DbShape {
  if (cache) return cache;
  try {
    if (fs.existsSync(DB_FILE)) {
      cache = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as DbShape;
      // محافظت در برابر schema drift
      if (!cache.settings || !Array.isArray(cache.inventory)) throw new Error('schema');
      return cache;
    }
  } catch {
    // فایل خراب یا ناسازگار → بازسازی از seed
  }
  cache = seed();
  flush(true);
  return cache;
}

function flush(sync = false): void {
  if (!cache) return;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.tmp`;
  const json = JSON.stringify(cache, null, 2);
  if (sync) {
    fs.writeFileSync(tmp, json);
    fs.renameSync(tmp, DB_FILE);
    return;
  }
  // نوشتن به‌تعویق‌افتاده (debounce) برای عملیات پرتکرار
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    try {
      fs.writeFileSync(tmp, json);
      fs.renameSync(tmp, DB_FILE);
    } catch (e) {
      console.error('[db] flush failed:', e);
    }
  }, 120);
}

export const db = {
  /* ---------- Inventory ---------- */
  getInventory(): InventoryUnit[] {
    return load().inventory;
  },
  addUnit(unit: InventoryUnit): InventoryUnit {
    const now = new Date().toISOString();
    const events = unit.events?.length ? unit.events : [
      { id: uid('EV'), at: now, kind: 'created' as const, title: 'ثبت پرونده در سامانه', detail: `کد تعرفه ${unit.hsCode} — گمرک ${unit.customsPort}`, by: 'کارشناس بازرگانی' },
    ];
    const enriched: InventoryUnit = { ...unit, events, createdAt: unit.createdAt ?? now, stageEnteredAt: unit.stageEnteredAt ?? now, lastUpdated: 'هم‌اکنون' };
    load().inventory = [enriched, ...load().inventory];
    flush();
    return enriched;
  },
  patchUnit(id: string, patch: Partial<InventoryUnit>): InventoryUnit | undefined {
    const list = load().inventory;
    const i = list.findIndex((u) => u.id === id);
    if (i === -1) return undefined;
    const next: InventoryUnit = { ...list[i], ...patch, lastUpdated: 'هم‌اکنون' };
    list[i] = next;
    flush();
    return next;
  },
  setStatus(id: string, status: InventoryUnit['status'], note?: string): InventoryUnit | undefined {
    const list = load().inventory;
    const i = list.findIndex((u) => u.id === id);
    if (i === -1) return undefined;
    const now = new Date().toISOString();
    const prev = list[i];
    const ev: CargoEvent = { id: uid('EV'), at: now, kind: 'status_change', title: status, detail: note || `تغییر وضعیت از «${prev.status}»`, by: 'کارتابل عملیات' };
    const updated: InventoryUnit = {
      ...prev,
      status,
      stageEnteredAt: now,
      events: [...(prev.events ?? []), ev],
      lastUpdated: 'هم‌اکنون',
    };
    list[i] = updated;
    flush();
    return updated;
  },
  addEvent(id: string, event: CargoEvent): InventoryUnit | undefined {
    const list = load().inventory;
    const i = list.findIndex((u) => u.id === id);
    if (i === -1) return undefined;
    const updated: InventoryUnit = { ...list[i], events: [...(list[i].events ?? []), event], lastUpdated: 'هم‌اکنون' };
    list[i] = updated;
    flush();
    return updated;
  },
  deleteUnit(id: string): boolean {
    const d = load();
    const before = d.inventory.length;
    d.inventory = d.inventory.filter((u) => u.id !== id);
    if (d.inventory.length === before) return false;
    flush();
    return true;
  },

  /* ---------- Suppliers ---------- */
  getSuppliers(): SupplierRecord[] {
    return load().suppliers;
  },
  upsertSupplier(rec: SupplierRecord): SupplierRecord {
    const d = load();
    const i = d.suppliers.findIndex((s) => s.id === rec.id);
    if (i === -1) d.suppliers = [rec, ...d.suppliers];
    else d.suppliers[i] = rec;
    flush();
    return rec;
  },
  deleteSupplier(id: string): boolean {
    const d = load();
    const before = d.suppliers.length;
    d.suppliers = d.suppliers.filter((s) => s.id !== id);
    if (d.suppliers.length === before) return false;
    flush();
    return true;
  },

  /* ---------- Assessments ---------- */
  getAssessments(): TradeAssessmentDossier[] {
    return load().assessments;
  },
  addAssessment(a: TradeAssessmentDossier): TradeAssessmentDossier {
    load().assessments = [a, ...load().assessments].slice(0, 200);
    flush();
    return a;
  },
  patchAssessment(id: string, patch: Partial<TradeAssessmentDossier>): TradeAssessmentDossier | undefined {
    const list = load().assessments;
    const i = list.findIndex((a) => a.id === id);
    if (i === -1) return undefined;
    list[i] = { ...list[i], ...patch };
    flush();
    return list[i];
  },

  /* ---------- Settings ---------- */
  getSettings(): AppSettings {
    return load().settings;
  },
  patchSettings(patch: Partial<AppSettings> & { fx?: Partial<AppSettings['fx']> }): AppSettings {
    const d = load();
    d.settings = {
      ...d.settings,
      ...patch,
      fx: { ...d.settings.fx, ...(patch.fx ?? {}), updatedAt: new Date().toISOString() },
    };
    flush(true); // تنظیمات کم‌تغییر ولی حیاتی → نوشتن هم‌زمان
    return d.settings;
  },

  /** بازنشانی به داده‌های اولیه (برای دمو/توسعه) */
  reset(): DbShape {
    cache = seed();
    flush(true);
    return cache;
  },
};

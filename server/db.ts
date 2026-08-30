/**
 * لایه ذخیره‌سازی داده — فایل JSON اتمیک با کش درون‌حافظه‌ای
 * ------------------------------------------------------------------
 * برای مقیاس فعلی (صدها رکورد) کاملاً پاسخگوست؛ مسیر ارتقا به
 * SQLite/better-sqlite3 بدون تغییر رابط توابع زیر ممکن است.
 */
import fs from 'fs';
import path from 'path';
import { InventoryUnit, SupplierRecord, TradeAssessmentDossier, AppSettings, CargoEvent } from '../src/types';
import { INITIAL_INVENTORY, INITIAL_SUPPLIERS, PRESET_SCENARIOS } from '../src/data/mockData';
import { computeLandedCost } from '../src/lib/costing';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'appstore.json');

interface DbShape {
  inventory: InventoryUnit[];
  suppliers: SupplierRecord[];
  assessments: TradeAssessmentDossier[];
  settings: AppSettings;
  /** این فروشگاه با داده‌ی نمونه (حالت ارائه) پر شده است؟ برای هشدار در اجرای عادی */
  demoSeeded?: boolean;
}

let cache: DbShape | null = null;
let flushTimer: NodeJS.Timeout | null = null;

export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/* ------------------------------ Seed ------------------------------ */

const DAY_MS = 86_400_000;
const isoDaysAgo = (days: number) => new Date(Date.now() - days * DAY_MS).toISOString();

function defaultSettings(): AppSettings {
  return {
    fx: { usdNimaToman: 68000, usdAzadToman: 92500, eurToman: 76500, updatedAt: new Date().toISOString() },
    vatDefaultPct: 10,
    orgName: 'ستایش جعفری',
  };
}

/**
 * حالت ارائه/دمو — فقط وقتی `SEED_DEMO=1` (یا DEMO_DATA=1) تنظیم شده باشد.
 * برای دمو/ارائه، کارتابل خالی یعنی «نمایش هیچ‌چیز»؛ بنابراین با داده‌ی
 * نمونه‌ی خود مخزن (`src/data/mockData.ts`) پر می‌شود. این حالت در
 * `/api/health` و در هدر UI صریح اعلام می‌شود تا با داده‌ی واقعی اشتباه نشود.
 */
export function isDemoMode(): boolean {
  const raw = (process.env.SEED_DEMO ?? process.env.DEMO_DATA ?? '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

/**
 * حالت اولیه‌ی سامانه: کاملاً خالی و صادق.
 * هیچ پرونده، تأمین‌کننده یا ارزیابی ساختگی از پیش ساخته نمی‌شود؛
 * کاربر (واردکننده) خودش اولین داده‌ی واقعی را ثبت می‌کند.
 */
function emptyState(): DbShape {
  return { inventory: [], suppliers: [], assessments: [], settings: defaultSettings(), demoSeeded: false };
}

/** پرونده‌های نمونه با تایم‌لاین رویداد (تا کانبان و تایم‌لاین در دمو معنادار باشد) */
function demoInventory(): InventoryUnit[] {
  return INITIAL_INVENTORY.map((u, i) => {
    const createdAt = isoDaysAgo(60 - i * 3);
    const stageEnteredAt = isoDaysAgo(Math.max(1, 24 - i));
    return {
      ...u,
      createdAt,
      stageEnteredAt,
      lastUpdated: 'هم‌اکنون',
      events: [
        {
          id: uid('EV'),
          at: createdAt,
          kind: 'created' as const,
          title: 'ثبت پرونده در سامانه',
          detail: `کد تعرفه ${u.hsCode} — ${u.customsPort}`,
          by: 'کارشناس بازرگانی',
        },
        {
          id: uid('EV'),
          at: stageEnteredAt,
          kind: 'status_change' as const,
          title: u.status,
          detail: 'به‌روزرسانی وضعیت در کارتابل عملیات',
          by: 'کارتابل عملیات',
        },
      ],
    };
  });
}

/**
 * پرونده‌های ارزیابی نمونه — از سناریوهای آماده‌ی خود برنامه.
 * بهای تمام‌شده hard-code نیست: با همان موتور `computeLandedCost` که
 * ویزارد ارزیابی استفاده می‌کند محاسبه می‌شود، پس عدد دمو با ماشین‌حساب
 * سامانه سازگار است.
 */
function demoAssessments(settings: AppSettings): TradeAssessmentDossier[] {
  const DEMO_TAGS = ['PV-550', 'INV-5K', 'US-DOP', 'COF-GRN'];
  const STATUS_BY_TAG: Record<string, TradeAssessmentDossier['status']> = {
    'PV-550': 'تأیید نهایی کمیته خرید',
    'INV-5K': 'آماده ثبت سفارش',
    'US-DOP': 'در حال ارزیابی فنی و استاندارد',
    'COF-GRN': 'آماده ثبت سفارش',
  };
  const inventory = INITIAL_INVENTORY;

  return PRESET_SCENARIOS.filter((sc) => DEMO_TAGS.includes(sc.tag)).map((sc, i) => {
    const unit = inventory.find((u) => u.name === sc.fa);
    const qty = unit?.stockQty ?? 40;
    const fobUsd = unit?.costPriceUsd ?? 100;
    const fx = settings.fx.usdNimaToman;

    // سهم حمل و بیمه و هزینه‌های محلی به‌صورت درصدی از CIF مشتق می‌شود
    // (قاعده‌ی متعارف برآورد؛ همان ورودی‌هایی که کاربر در ویزارد می‌تواند عوض کند).
    const cifUsdPerUnit = fobUsd * 1.035; // FOB + ~۳٪ حمل + ~۰.۵٪ بیمه
    const cifTomanPerUnit = cifUsdPerUnit * fx;

    const landed = computeLandedCost({
      fobUsd,
      freightUsd: fobUsd * 0.03,
      insuranceUsd: fobUsd * 0.005,
      qty,
      fxRateToman: fx,
      customsDutyPct: sc.customsDuty,
      commercialProfitPct: sc.commercialProfit,
      vatPct: sc.vat,
      clearanceFeeToman: Math.round(cifTomanPerUnit * 0.0035),
      inlandFreightToman: Math.round(cifTomanPerUnit * 0.0025),
      brokerAndBankToman: Math.round(cifTomanPerUnit * 0.003),
      otherFeeToman: Math.round(cifTomanPerUnit * 0.002),
    });

    return {
      id: `DOSS-DEMO-${i + 1}`,
      title: `${sc.fa} — ${sc.qty}`,
      productFa: sc.fa,
      productEn: sc.en,
      category: sc.category,
      specs: sc.specs,
      qty: String(qty),
      unit: sc.unit,
      originPref: sc.origin,
      targetCustomer: sc.target,
      application: sc.target,
      estimatedLandedCostToman: Math.round(landed.landedPerUnitMillionToman * 100) / 100,
      suggestedHsCode: sc.hsCode,
      samtGroup: sc.samtGroup,
      customsDutyRate: sc.customsDuty + sc.commercialProfit,
      vatRate: sc.vat,
      status: STATUS_BY_TAG[sc.tag] ?? 'آماده ثبت سفارش',
      evidenceScore: 82 + i * 3,
      createdAt: isoDaysAgo(30 - i * 5),
    };
  });
}

/** حالت دمو: موجودی + تأمین‌کنندگان + پرونده‌های ارزیابی نمونه */
function demoState(): DbShape {
  const settings = defaultSettings();
  return {
    inventory: demoInventory(),
    suppliers: INITIAL_SUPPLIERS.map((s) => ({ ...s })),
    assessments: demoAssessments(settings),
    settings,
    demoSeeded: true,
  };
}

function seed(): DbShape {
  return isDemoMode() ? demoState() : emptyState();
}

const isEmptyState = (d: DbShape): boolean =>
  d.inventory.length === 0 && d.suppliers.length === 0 && d.assessments.length === 0;

/* ------------------------------ IO ------------------------------- */

function load(): DbShape {
  if (cache) return cache;
  try {
    if (fs.existsSync(DB_FILE)) {
      cache = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as DbShape;
      // محافظت در برابر schema drift
      if (!cache.settings || !Array.isArray(cache.inventory)) throw new Error('schema');
      // اگر حالت ارائه فعال است ولی فروشگاه از اجرای قبلی خالی مانده،
      // داده‌ی نمونه جایگزین می‌شود (وگرنه دمو با کارتابل خالی بالا می‌آید).
      if (isDemoMode() && isEmptyState(cache)) {
        cache = demoState();
        flush(true);
      }
      // اجرای عادی روی فروشگاهی که قبلاً با داده‌ی نمونه پر شده → هشدار صریح
      if (!isDemoMode() && cache.demoSeeded) {
        console.warn(
          '[db] هشدار: فایل data/appstore.json حاوی «داده‌ی نمونه‌ی حالت ارائه» است ولی سرور بدون SEED_DEMO=1 اجرا شده. ' +
          'برای شروع با داده‌ی واقعی، فایل data/appstore.json را پاک کنید.',
        );
      }
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

  /** بازنشانی به داده‌های اولیه (برای دمو/توسعه) — در حالت ارائه، داده‌ی نمونه برمی‌گردد */
  reset(): DbShape {
    cache = seed();
    flush(true);
    return cache;
  },

  /** خالی‌سازی کامل فروشگاه (فقط در حالت ارائه قابل صدا زدن است) */
  resetToEmpty(): DbShape {
    cache = emptyState();
    flush(true);
    return cache;
  },
};

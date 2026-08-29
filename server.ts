/**
 * تجارت‌یار — سرور یکپارچه برنامه (Express + Vite)
 * ------------------------------------------------------------------
 * این سرور در پورت ۳۰۰۰ اجرا می‌شود و در حالت توسعه (Development) با Vite Middleware
 * و در محیط تولید با سرو فایل‌های استاتیک پوشه dist کار می‌کند.
 */
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db, uid } from './server/db';
import { hsSuggest, supplierCheck, isAiEnabled, modelName } from './server/ai';
import type { InventoryUnit, SupplierRecord, TradeAssessmentDossier, AppSettings } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  /* CORS برای توسعه محلی */
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  const wrap = (fn: (req: Request, res: Response) => Promise<unknown> | unknown) =>
    (req: Request, res: Response, next: NextFunction) => {
      try {
        const r = fn(req, res);
        if (r instanceof Promise) r.catch(next);
      } catch (e) {
        next(e);
      }
    };

  const bad = (res: Response, status: number, message: string) => res.status(status).json({ ok: false, error: message });

  /* ----------------------------- سلامت ----------------------------- */

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, aiEnabled: isAiEnabled(), model: modelName(), version: '2.0.0' });
  });

  /* ---------------------------- Bootstrap --------------------------- */

  app.get('/api/bootstrap', wrap((_req, res) => {
    res.json({
      inventory: db.getInventory(),
      suppliers: db.getSuppliers(),
      assessments: db.getAssessments(),
      settings: db.getSettings(),
    });
  }));

  /* ---------------------------- Inventory --------------------------- */

  app.get('/api/inventory', wrap((_req, res) => res.json(db.getInventory())));

  app.post('/api/inventory', wrap((req, res) => {
    const u = req.body as InventoryUnit;
    if (!u || !u.name || !u.id) return bad(res, 400, 'ساختار واحد نامعتبر است (id و name الزامی است).');
    res.status(201).json(db.addUnit(u));
  }));

  app.patch('/api/inventory/:id', wrap((req, res) => {
    const updated = db.patchUnit(req.params.id, req.body as Partial<InventoryUnit>);
    if (!updated) return bad(res, 404, 'واحد یافت نشد.');
    res.json(updated);
  }));

  app.post('/api/inventory/:id/status', wrap((req, res) => {
    const { status, note } = req.body as { status: InventoryUnit['status']; note?: string };
    if (!status) return bad(res, 400, 'وضعیت جدید ارسال نشده است.');
    const updated = db.setStatus(req.params.id, status, note);
    if (!updated) return bad(res, 404, 'واحد یافت نشد.');
    res.json(updated);
  }));

  app.post('/api/inventory/:id/events', wrap((req, res) => {
    const { title, kind, detail } = req.body as { title: string; kind?: string; detail?: string };
    if (!title) return bad(res, 400, 'عنوان رویداد الزامی است.');
    const updated = db.addEvent(req.params.id, {
      id: uid('EV'),
      at: new Date().toISOString(),
      kind: (kind as any) ?? 'note',
      title,
      detail,
      by: 'کارشناس بازرگانی',
    });
    if (!updated) return bad(res, 404, 'واحد یافت نشد.');
    res.json(updated);
  }));

  app.delete('/api/inventory/:id', wrap((req, res) => {
    if (!db.deleteUnit(req.params.id)) return bad(res, 404, 'واحد یافت نشد.');
    res.json({ ok: true });
  }));

  /* ---------------------------- Suppliers --------------------------- */

  app.get('/api/suppliers', wrap((_req, res) => res.json(db.getSuppliers())));

  app.post('/api/suppliers', wrap((req, res) => {
    const s = req.body as SupplierRecord;
    if (!s || !s.name) return bad(res, 400, 'نام تأمین‌کننده الزامی است.');
    res.status(201).json(db.upsertSupplier({ ...s, id: s.id || uid('SUP') }));
  }));

  app.patch('/api/suppliers/:id', wrap((req, res) => {
    const existing = db.getSuppliers().find((x) => x.id === req.params.id);
    if (!existing) return bad(res, 404, 'تأمین‌کننده یافت نشد.');
    res.json(db.upsertSupplier({ ...existing, ...(req.body as Partial<SupplierRecord>), id: existing.id }));
  }));

  /* --------------------------- Assessments -------------------------- */

  app.get('/api/assessments', wrap((_req, res) => res.json(db.getAssessments())));

  app.post('/api/assessments', wrap((req, res) => {
    const a = req.body as TradeAssessmentDossier;
    if (!a || !a.title) return bad(res, 400, 'عنوان پرونده ارزیابی الزامی است.');
    res.status(201).json(db.addAssessment({ ...a, id: a.id || uid('DOSS') }));
  }));

  app.patch('/api/assessments/:id', wrap((req, res) => {
    const updated = db.patchAssessment(req.params.id, req.body as Partial<TradeAssessmentDossier>);
    if (!updated) return bad(res, 404, 'پرونده ارزیابی یافت نشد.');
    res.json(updated);
  }));

  /* ---------------------------- Settings ---------------------------- */

  app.get('/api/settings', wrap((_req, res) => res.json(db.getSettings())));

  app.patch('/api/settings', wrap((req, res) => {
    const p = req.body as Partial<AppSettings> & { fx?: Partial<AppSettings['fx']> };
    res.json(db.patchSettings(p));
  }));

  /* ------------------------------- AI ------------------------------- */

  app.post('/api/ai/hs-suggest', wrap(async (req, res) => {
    const { productName, description, category } = req.body ?? {};
    if (!productName || typeof productName !== 'string') return bad(res, 400, 'نام کالا برای پیشنهاد تعرفه الزامی است.');
    res.json(await hsSuggest({ productName, description, category }));
  }));

  app.post('/api/ai/supplier-check', wrap(async (req, res) => {
    const { name, country, domain, categories, extra } = req.body ?? {};
    if (!name || typeof name !== 'string') return bad(res, 400, 'نام تأمین‌کننده الزامی است.');
    res.json(await supplierCheck({ name, country, domain, categories, extra }));
  }));

  /* ---------------------- Frontend / Vite Serving ------------------- */

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  /* ---------------------------- Errors ------------------------------ */

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[server]', err?.message ?? err);
    res.status(500).json({ ok: false, error: 'خطای داخلی سرور — لطفاً دوباره تلاش کنید.' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 سرور تجارت‌یار روی http://0.0.0.0:${PORT} آماده است. وضعیت هوش مصنوعی: ${isAiEnabled() ? `فعال (${modelName()})` : 'غیرفعال (موتور محلی فعال است)'}`);
  });
}

startServer();

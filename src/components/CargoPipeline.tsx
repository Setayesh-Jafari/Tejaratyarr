/**
 * گردش کار پرونده‌های کارگو — تخته کانبان چرخه‌ی عمر واردات
 * ثبت سفارش → ترانزیت → گمرک → انبار (+ هشدار معطل‌کاری و روزهای سپری‌شده)
 */
import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Clock, AlertTriangle, Warehouse, Ship, Landmark, FileSignature, Trash2, ChevronDown, StickyNote } from 'lucide-react';
import { useStore } from '../store/AppStore';
import { STATUS_FLOW, ALL_STATUSES } from '../types';
import type { InventoryUnit, ItemStatus } from '../types';
import { fmtToman, fmtMillion, daysSince, faTimeAgo, faDateShort } from '../lib/format';

const COLUMN_META: Array<{ status: ItemStatus; icon: React.ElementType; tone: string; chip: string }> = [
  { status: 'در انتظار تخصیص ارز و ثبت سفارش', icon: FileSignature, tone: 'text-violet-600 bg-violet-50 border-violet-200', chip: 'bg-violet-100 text-violet-700' },
  { status: 'در حال ترانزیت بین‌المللی', icon: Ship, tone: 'text-sky-600 bg-sky-50 border-sky-200', chip: 'bg-sky-100 text-sky-700' },
  { status: 'در گمرک (در حال ترخیص)', icon: Landmark, tone: 'text-amber-600 bg-amber-50 border-amber-200', chip: 'bg-amber-100 text-amber-700' },
  { status: 'موجود در انبار (ترخیص شده)', icon: Warehouse, tone: 'text-emerald-600 bg-emerald-50 border-emerald-200', chip: 'bg-emerald-100 text-emerald-700' },
];

/** آستانه هشدار معطل‌کاری در گمرک (روز) */
const DEMURRAGE_DAYS = 25;

const daysInStage = (u: InventoryUnit): number => daysSince(u.stageEnteredAt ?? u.createdAt);

export const CargoPipeline: React.FC = () => {
  const { inventory, updateUnitStatus, deleteUnit, addEvent } = useStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const byColumn = useMemo(() => {
    const map = new Map<ItemStatus, InventoryUnit[]>();
    for (const s of STATUS_FLOW) map.set(s, []);
    for (const u of inventory) {
      const key = u.status === 'رزرو مشتری / پیش‌فروش' ? 'موجود در انبار (ترخیص شده)' : u.status;
      map.get(key as ItemStatus)?.push(u);
    }
    return map;
  }, [inventory]);

  const customsCount = byColumn.get('در گمرک (در حال ترخیص)')?.length ?? 0;
  const stuckValue = (byColumn.get('در گمرک (در حال ترخیص)') ?? [])
    .filter((u) => daysInStage(u) > DEMURRAGE_DAYS)
    .reduce((s, u) => s + u.landedCostToman * u.stockQty, 0);

  const move = (unit: InventoryUnit, dir: 1 | -1) => {
    const idx = STATUS_FLOW.indexOf(unit.status === 'رزرو مشتری / پیش‌فروش' ? 'موجود در انبار (ترخیص شده)' : unit.status);
    const next = STATUS_FLOW[Math.min(STATUS_FLOW.length - 1, Math.max(0, idx + dir))];
    if (next !== unit.status) updateUnitStatus(unit.id, next);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-4">
      {/* هدر خلاصه */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-slate-700">{customsCount.toLocaleString('fa-IR')} پرونده در گمرک</span>
        </div>
        <div className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 border ${stuckValue > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
          <AlertTriangle className={`w-4 h-4 ${stuckValue > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          <span className={`text-xs font-bold ${stuckValue > 0 ? 'text-rose-800' : 'text-slate-600'}`}>
            {stuckValue > 0
              ? `ریسک معطل‌کاری: ${fmtMillion(stuckValue)} م.ت سرمایه بالای ${DEMURRAGE_DAYS.toLocaleString('fa-IR')} روز در گمرک`
              : 'بدون ریسک معطل‌کاری فعال'}
          </span>
        </div>
      </div>

      {/* تخته کانبان */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto pb-2">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 min-h-full items-start">
          {COLUMN_META.map((col) => {
            const items = byColumn.get(col.status) ?? [];
            const Icon = col.icon;
            const colValue = items.reduce((s, u) => s + u.landedCostToman * u.stockQty, 0);
            return (
              <div key={col.status} className="bg-slate-100/70 rounded-2xl border border-slate-200 p-2.5 min-h-[320px] flex flex-col gap-2.5">
                {/* سرستون */}
                <div className={`rounded-xl border px-3 py-2.5 flex items-center justify-between ${col.tone}`}>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Icon className="w-4 h-4" />
                    <span className="leading-tight max-w-[9rem]">{col.status.replace(' (', '\u200C(')}</span>
                  </div>
                  <span className={`text-[10px] font-black rounded-full px-2 py-0.5 ${col.chip}`}>{items.length.toLocaleString('fa-IR')}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium px-1">
                  ارزش ستون: <span className="font-mono font-bold text-slate-700">{fmtMillion(colValue)} م.ت</span>
                </div>

                {/* کارت‌ها */}
                <AnimatePresence mode="popLayout">
                  {items.map((u) => {
                    const d = daysInStage(u);
                    const isCustoms = col.status === 'در گمرک (در حال ترخیص)';
                        const risk = isCustoms && d > DEMURRAGE_DAYS;
                    const isOpen = expanded === u.id;
                    return (
                      <motion.div
                        key={u.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`bg-white rounded-xl border p-3 space-y-2.5 shadow-xs ${risk ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 flex-1">{u.name}</p>
                          <span className="text-[9px] font-mono text-slate-400 bg-slate-50 border rounded px-1.5 py-0.5 shrink-0" dir="ltr">{u.hsCode}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="bg-slate-100 text-slate-600 rounded-md px-1.5 py-0.5 font-medium">{u.customsPort.replace('گمرک ', '')}</span>
                          <span className="bg-slate-100 text-slate-600 rounded-md px-1.5 py-0.5 font-mono">{u.stockQty.toLocaleString('fa-IR')} {u.unit.split(' ')[0]}</span>
                          {u.status === 'رزرو مشتری / پیش‌فروش' && (
                            <span className="bg-indigo-100 text-indigo-700 rounded-md px-1.5 py-0.5 font-bold">رزرو مشتری</span>
                          )}
                        </div>

                        <div className={`flex items-center justify-between text-[10px] ${risk ? 'text-rose-700 font-bold' : 'text-slate-500'}`}>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {d.toLocaleString('fa-IR')} روز در این مرحله
                          </span>
                          <span className="font-mono" title={faDateShort(u.stageEnteredAt)}>{faTimeAgo(u.stageEnteredAt ?? u.createdAt)}</span>
                        </div>

                        {risk && (
                          <div className="bg-rose-50 border border-rose-200 rounded-lg px-2 py-1.5 text-[10px] text-rose-800 font-medium leading-relaxed">
                            هشدار معطل‌کاری: احتمال جریمه روزانه انبار و ابطال ارز نیمایی — پیگیری ترخیص‌کار لازم است.
                          </div>
                        )}

                        {/* جزئیات: جابه‌جایی مستقیم + یادداشت + تایم‌لاین */}
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
                            <div className="border-t border-dashed border-slate-200 pt-2 space-y-2">
                              {/* جابه‌جایی مستقیم به هر مرحله */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 shrink-0">جابه‌جایی مستقیم:</span>
                                <select
                                  value={u.status}
                                  onChange={(e) => updateUnitStatus(u.id, e.target.value as ItemStatus)}
                                  className="flex-1 text-[10px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-400 focus:outline-none cursor-pointer"
                                >
                                  {ALL_STATUSES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </div>

                              {/* ثبت یادداشت عملیاتی */}
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const t = noteText.trim();
                                  if (!t) return;
                                  addEvent(u.id, { title: t });
                                  setNoteText('');
                                }}
                                className="flex items-center gap-1.5"
                              >
                                <StickyNote className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <input
                                  value={noteText}
                                  onChange={(e) => setNoteText(e.target.value)}
                                  placeholder="یادداشت عملیاتی (مثلاً: هماهنگی با ترخیص‌کار انجام شد)…"
                                  className="flex-1 text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                                />
                                <button
                                  type="submit"
                                  disabled={!noteText.trim()}
                                  className="text-[10px] font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg px-2.5 py-1.5 disabled:opacity-40 shrink-0 transition-colors"
                                >
                                  ثبت
                                </button>
                              </form>

                              {/* تایم‌لاین */}
                              <div className="space-y-1.5">
                                {[...(u.events ?? [])].reverse().slice(0, 5).map((ev) => (
                                  <div key={ev.id} className="flex items-start gap-2 text-[10px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                                    <div className="flex-1">
                                      <p className="font-bold text-slate-700">{ev.title}</p>
                                      {ev.detail && <p className="text-slate-400 leading-snug">{ev.detail}</p>}
                                    </div>
                                    <span className="text-slate-400 shrink-0" title={faDateShort(ev.at)}>{faTimeAgo(ev.at)}</span>
                                  </div>
                                ))}
                                {(u.events ?? []).length === 0 && <p className="text-[10px] text-slate-400">رویدادی ثبت نشده است.</p>}
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* اکشن‌ها */}
                        <div className="flex items-center gap-1.5 pt-0.5 border-t border-slate-100">
                          <button
                            onClick={() => move(u, -1)}
                            disabled={STATUS_FLOW.indexOf(u.status) <= 0 && u.status !== 'رزرو مشتری / پیش‌فروش'}
                            className="flex-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg py-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                          >
                            <ArrowLeft className="w-3 h-3 rotate-180" /> مرحله قبل
                          </button>
                          <button
                            onClick={() => move(u, 1)}
                            disabled={u.status === 'موجود در انبار (ترخیص شده)' || u.status === 'رزرو مشتری / پیش‌فروش'}
                            className="flex-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg py-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                          >
                            مرحله بعد <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button onClick={() => setExpanded(isOpen ? null : u.id)} className="text-slate-400 hover:text-slate-700 rounded-lg p-1.5 hover:bg-slate-100 transition-colors" title="جزئیات، یادداشت و جابه‌جایی">
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                          <button onClick={() => { if (confirm(`حذف پرونده «${u.name}»؟`)) deleteUnit(u.id); }} className="text-slate-300 hover:text-rose-600 rounded-lg p-1.5 hover:bg-rose-50 transition-colors" title="حذف پرونده">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {items.length === 0 && (
                  <div className="text-center text-[10px] text-slate-400 py-6 border border-dashed border-slate-300 rounded-xl">
                    پرونده‌ای در این مرحله نیست
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

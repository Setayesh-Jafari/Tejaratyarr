/**
 * کلاینت typed ارتباط با سرور — همه فراخوانی‌ها از همین‌جا عبور می‌کنند
 */
import type {
  InventoryUnit, SupplierRecord, TradeAssessmentDossier, AppSettings,
  HealthResponse, BootstrapResponse, AiHsSuggestResponse, AiSupplierCheckResponse,
} from '../types';

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    let msg = `خطای ارتباط با سرور (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch { /* بدنه خطا JSON نبود */ }
    throw new ApiError(res.status, msg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => req<HealthResponse>('/health'),
  bootstrap: () => req<BootstrapResponse>('/bootstrap'),

  createUnit: (unit: InventoryUnit) => req<InventoryUnit>('/inventory', { method: 'POST', body: JSON.stringify(unit) }),
  patchUnit: (id: string, patch: Partial<InventoryUnit>) => req<InventoryUnit>(`/inventory/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  setStatus: (id: string, status: InventoryUnit['status'], note?: string) =>
    req<InventoryUnit>(`/inventory/${encodeURIComponent(id)}/status`, { method: 'POST', body: JSON.stringify({ status, note }) }),
  deleteUnit: (id: string) => req<{ ok: true }>(`/inventory/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  addEvent: (id: string, payload: { title: string; kind?: string; detail?: string }) =>
    req<InventoryUnit>(`/inventory/${encodeURIComponent(id)}/events`, { method: 'POST', body: JSON.stringify(payload) }),

  upsertSupplier: (rec: SupplierRecord) => req<SupplierRecord>('/suppliers', { method: 'POST', body: JSON.stringify(rec) }),
  patchSupplier: (id: string, patch: Partial<SupplierRecord>) =>
    req<SupplierRecord>(`/suppliers/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteSupplier: (id: string) => req<{ ok: true }>(`/suppliers/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  addAssessment: (a: TradeAssessmentDossier) => req<TradeAssessmentDossier>('/assessments', { method: 'POST', body: JSON.stringify(a) }),
  patchAssessment: (id: string, patch: Partial<TradeAssessmentDossier>) =>
    req<TradeAssessmentDossier>(`/assessments/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  patchSettings: (patch: Partial<AppSettings> & { fx?: Partial<AppSettings['fx']> }) =>
    req<AppSettings>('/settings', { method: 'PATCH', body: JSON.stringify(patch) }),

  aiHsSuggest: (payload: { productName: string; description?: string; category?: string }) =>
    req<AiHsSuggestResponse>('/ai/hs-suggest', { method: 'POST', body: JSON.stringify(payload) }),
  aiSupplierCheck: (payload: { name: string; country?: string; domain?: string; categories?: string; extra?: string }) =>
    req<AiSupplierCheckResponse>('/ai/supplier-check', { method: 'POST', body: JSON.stringify(payload) }),
};

export { ApiError };

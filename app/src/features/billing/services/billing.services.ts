import { apiFetch, jsonInit } from "@/utils/apiClient";
import type { PurchaseRecordDto, TokenPackDto, TokenUsageRecordDto } from "@/features/billing/interfaces/billing.interfaces";

export function getBalance() {
  return apiFetch<{ balance: number }>("/api/billing/balance");
}

export function getPacks() {
  return apiFetch<TokenPackDto[]>("/api/billing/packs");
}

export function getHistory() {
  return apiFetch<PurchaseRecordDto[]>("/api/billing/history");
}

export function getUsage(limit = 50) {
  const q = new URLSearchParams({ limit: String(limit) });
  return apiFetch<TokenUsageRecordDto[]>(`/api/billing/usage?${q.toString()}`);
}

export function checkout(packId: string) {
  return apiFetch<{ url: string }>("/api/billing/checkout", { method: "POST", ...jsonInit({ packId }) });
}

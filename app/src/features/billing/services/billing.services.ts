import { apiFetch, jsonInit } from "@/utils/apiClient";
import type { PurchaseRecordDto, TokenPackDto, TokenUsagePageDto } from "@/features/billing/interfaces/billing.interfaces";

export function getBalance() {
  return apiFetch<{ balance: number }>("/api/billing/balance");
}

export function getPacks() {
  return apiFetch<TokenPackDto[]>("/api/billing/packs");
}

export function getHistory() {
  return apiFetch<PurchaseRecordDto[]>("/api/billing/history");
}

export function getUsage(params: { limit: number; offset: number }) {
  const q = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  return apiFetch<TokenUsagePageDto>(`/api/billing/usage?${q.toString()}`);
}

export function checkout(packId: string) {
  return apiFetch<{ url: string }>("/api/billing/checkout", { method: "POST", ...jsonInit({ packId }) });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { checkout, getBalance, getHistory, getPacks, getUsage } from "@/features/billing/services/billing.services";

export function useBalance(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["billing", "balance"],
    queryFn: getBalance,
    refetchInterval: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function usePacks() {
  return useQuery({ queryKey: ["billing", "packs"], queryFn: getPacks, staleTime: 60_000 });
}

export function usePurchaseHistory() {
  return useQuery({ queryKey: ["billing", "history"], queryFn: getHistory });
}

export function useTokenUsage(options?: { enabled?: boolean; limit?: number }) {
  const limit = options?.limit ?? 50;
  return useQuery({
    queryKey: ["billing", "usage", limit],
    queryFn: () => getUsage(limit),
    enabled: options?.enabled ?? true,
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkout,
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["billing", "balance"] });
      void queryClient.invalidateQueries({ queryKey: ["billing", "history"] });
      void queryClient.invalidateQueries({ queryKey: ["billing", "usage"] });
    },
  });
}

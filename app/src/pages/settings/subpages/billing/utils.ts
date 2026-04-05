export function formatEur(amount: number, fromCents: boolean): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    fromCents ? amount / 100 : amount,
  );
}

export function formatUsageKind(kind: string): string {
  const map: Record<string, string> = { image: "Image", trippo: "Tripo", chat: "Chat" };
  return map[kind] ?? kind;
}

export function formatPricePer1kTokens(priceEur: number, tokens: number): string | null {
  if (!tokens || tokens <= 0) return null;
  return formatEur((priceEur / tokens) * 1000, false);
}

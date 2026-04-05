import { MARKUP_FACTOR, TOKENS_PER_EUR, DOLLARS_TO_EUR_RATE, TOKENS_PER_EUR_TRIPPO } from "../../config/models/pricing";

export const usdToTokens = (usdPrice: number, markup: boolean = true) => Math.ceil((usdPrice * DOLLARS_TO_EUR_RATE) * TOKENS_PER_EUR * (markup ? MARKUP_FACTOR : 1));

/**
 * Indicative provider cost in EUR → wallet tokens debited (post-markup).
 * Single `ceil` on (EUR × pack token rate × markup), same as `usdToTokens(usd, true)` when `eur === usd * DOLLARS_TO_EUR_RATE`.
 */
export function walletTokensFromProviderEur(eur: number): number {
  return Math.ceil(eur * TOKENS_PER_EUR * MARKUP_FACTOR);
}

/**
 * Tripo “provider credits” (fixed token cost from Tripo) → indicative EUR **before** wallet markup.
 * Uses `TOKENS_PER_EUR_TRIPPO` (Tripo’s credits-per-euro), not pack rate `TOKENS_PER_EUR`.
 */
export function trippoProviderCreditsToEur(providerCredits: number): number {
    return providerCredits / TOKENS_PER_EUR_TRIPPO;
}

export function roundEur(value: number, decimals = 4): number {
    const f = 10 ** decimals;
    return Math.round(value * f) / f;
}

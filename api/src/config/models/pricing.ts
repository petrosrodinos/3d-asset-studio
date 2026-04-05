export const TOKENS_PER_EUR = 100;
export const MARKUP_FACTOR = 1.1;

/** Wallet tokens debited per agent chat request (post-markup units). */
export const CHAT_DEBIT_TOKENS = 4;
export const DOLLARS_TO_EUR_RATE = 0.90;

/** Pre-markup ledger fields for `TokenUsage` on chat debits. */
export const CHAT_TOKENS_ORIGINAL = CHAT_DEBIT_TOKENS / MARKUP_FACTOR;
export const CHAT_PRICE_ORIGINAL_USD = CHAT_TOKENS_ORIGINAL / TOKENS_PER_EUR;
export const TOKEN_PER_USD = 100;
export const MARKUP_FACTOR = 1.05;

/** Wallet tokens debited per agent chat request (post-markup units). */
export const CHAT_DEBIT_TOKENS = 2;

/** Pre-markup ledger fields for `TokenUsage` on chat debits. */
export const CHAT_TOKENS_ORIGINAL = CHAT_DEBIT_TOKENS / MARKUP_FACTOR;
export const CHAT_PRICE_ORIGINAL_USD = CHAT_TOKENS_ORIGINAL / TOKEN_PER_USD;
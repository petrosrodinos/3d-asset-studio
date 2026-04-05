import { MARKUP_FACTOR, TOKENS_PER_EUR, DOLLARS_TO_EUR_RATE, TOKENS_PER_EUR_TRIPPO } from "../../config/models/pricing";

export const usdToTokens = (usdPrice: number, markup: boolean = true) => Math.ceil((usdPrice * DOLLARS_TO_EUR_RATE) * TOKENS_PER_EUR * (markup ? MARKUP_FACTOR : 1));

export const tokensToEur = (tokens: number, markup: boolean = true) => ((tokens / TOKENS_PER_EUR_TRIPPO)) / (markup ? MARKUP_FACTOR : 1);

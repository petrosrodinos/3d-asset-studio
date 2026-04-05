import { MARKUP_FACTOR, TOKENS_PER_EUR } from "../../config/models/pricing";

export const usdToTokens = (usdPrice: number, markup: boolean = true) => Math.ceil(usdPrice * TOKENS_PER_EUR * (markup ? MARKUP_FACTOR : 1));

export const tokensToUsd = (tokens: number, markup: boolean = true) => tokens / TOKENS_PER_EUR / (markup ? MARKUP_FACTOR : 1);

import { MARKUP_FACTOR, TOKEN_PER_USD } from "../../config/models/pricing";

export const usdToTokens = (usdPrice: number, markup: boolean = true) => Math.ceil(usdPrice * TOKEN_PER_USD * (markup ? MARKUP_FACTOR : 1));

export const tokensToUsd = (tokens: number, markup: boolean = true) => tokens / TOKEN_PER_USD / (markup ? MARKUP_FACTOR : 1);

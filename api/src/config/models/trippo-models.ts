import { tokensToUsd } from "../../lib/models-cost";
import { MARKUP_FACTOR } from "./pricing";

const trippoModels = [
    {
        id: "animate_prerigcheck",
        tokens_original: 0,
        price_original: tokensToUsd(0, false).toFixed(2),
        tokens: null,
        price: null,
    },
    {
        id: "animate_retarget",
        tokens_original: 4,
        price_original: tokensToUsd(4, false).toFixed(2),
        tokens: null,
        price: null,
    },
    {
        id: "animate_rig",
        tokens_original: 7,
        price_original: tokensToUsd(7, false).toFixed(2),
        tokens: null,
        price: null,
    },
    {
        id: "image_to_model",
        tokens_original: 7,
        price_original: tokensToUsd(7, false).toFixed(2),
        tokens: null,
        price: null,
    }
];

export const TrippoModels = trippoModels.map((model: any) => ({
    ...model,
    tokens: model.tokens_original * MARKUP_FACTOR,
    price: model.price_original * MARKUP_FACTOR,
}));
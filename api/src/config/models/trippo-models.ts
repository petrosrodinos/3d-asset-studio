import { tokensToEur } from "../../lib/models-cost";
import { MARKUP_FACTOR } from "./pricing";

const trippoModels = [
    {
        id: "animate_prerigcheck",
        tokens_original: 0,
        price_original: tokensToEur(0, false).toFixed(2),
        tokens: null,
        price: null,
    },
    {
        id: "animate_retarget",
        tokens_original: 10,
        price_original: tokensToEur(10, false).toFixed(2),
        tokens: null,
        price: null,
    },
    {
        id: "animate_rig",
        tokens_original: 25,
        price_original: tokensToEur(25, false).toFixed(2),
        tokens: null,
        price: null,
    },
    {
        id: "image_to_model",
        tokens_original: 30,
        price_original: tokensToEur(30, false).toFixed(2),
        tokens: null,
        price: null,
    }
];

export const TrippoModels = trippoModels.map((model: any) => ({
    ...model,
    tokens: model.tokens_original * MARKUP_FACTOR,
    price: model.price_original * MARKUP_FACTOR,
}));
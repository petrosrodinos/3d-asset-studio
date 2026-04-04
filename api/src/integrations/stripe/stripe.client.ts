import { env } from "../../config/env/env-validation";

// Stripe's CJS callable export is awkward for `new` under strict TS; runtime supports `new` and call.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const StripeSdk = require("stripe") as (key: string, config?: { apiVersion?: string }) => import("stripe").Stripe;

export const stripe: import("stripe").Stripe = StripeSdk(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia",
});

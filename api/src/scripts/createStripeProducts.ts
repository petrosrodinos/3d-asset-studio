/**
 * One-off Stripe catalog seed: products + EUR prices for token packs (`npm run stripe:setup`).
 * `pack.price` is major units (e.g. 5 = €5.00); `unit_amount` is euro cents.
 *
 * EUR prices use `lookup_key` `{packId}_eur` so they do not collide with legacy USD prices
 * that still use `lookup_key` `{packId}`.
 */
import { stripe } from "../integrations/stripe/stripe.client";
import { TOKEN_PACKS } from "../config/models/tokenPacks";

/** Stripe price currency; amounts are in this currency’s minor units (e.g. euro cents). */
const STRIPE_PACK_CURRENCY = "eur" as const;

function eurLookupKey(packId: string): string {
  return `${packId}_eur`;
}

async function main() {
  for (const pack of TOKEN_PACKS) {
    const lookupKey = eurLookupKey(pack.id);

    const existing = await stripe.prices.list({
      lookup_keys: [lookupKey],
      limit: 1,
      active: true,
    });
    if (existing.data.length > 0) {
      const p = existing.data[0];
      console.log(`${pack.id}: "${p.id}" (existing, lookup_key=${lookupKey})`);
      continue;
    }

    const product = await stripe.products.create({
      name: pack.name,
      description: `${pack.tokens} tokens — €${pack.price.toFixed(2)} EUR`,
      metadata: { token_pack_id: pack.id, currency: "EUR" },
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(pack.price * 100),
      currency: STRIPE_PACK_CURRENCY,
      lookup_key: lookupKey,
      nickname: `${pack.name} (EUR)`,
    });
    console.log(`${pack.id}: "${price.id}"`);
  }
}

main().catch(console.error);

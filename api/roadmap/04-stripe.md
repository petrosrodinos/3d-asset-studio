# Phase 04 — Token Purchases & Billing (Stripe)

**Goal:** Add a token wallet per user, sell token packs via Stripe Checkout, and gate every AI/3D API operation behind a token cost check. Every AIML image generation, Tripo animation costs tokens.

**Depends on:** Phase 02 (`User.tokenBalance`) and Phase 03 (React billing page stub).

---

## Token cost table

`src/services/pricing/model-costs.ts`:

| Operation           | Tokens | Note                                       |
| ------------------- | ------ | ------------------------------------------ |
| `image`             | 5      | Per AIML generation call                   |
| `tripoMesh`         | 8      | Mesh-only (no rig/animate)                 |
| `rig`               | 10     | Per rig generation call                    |
| `animationRetarget` | 5      | Per additional animation on existing model |

---

## New backend additions

```
src/
├── modules/
│   └── billing/
│       ├── billing.router.ts          # GET /packs, POST /checkout, GET /balance, GET /history
│       ├── billing.service.ts         # createCheckoutSession, getBalance, history, creditTokens
│       └── billing.types.ts
├── integrations/
│   └── stripe/
│       ├── stripe.client.ts           # Stripe singleton
│       └── stripe.webhook.router.ts   # POST /api/stripe/webhook (raw body — before express.json)
├── services/pricing/
│   ├── model-costs.ts
│   └── packs.ts
└── middleware/
    └── requireTokens.ts
```

---

## Tasks

### 1. Install dependencies

```bash
npm install stripe
```

Add to `.env.example`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
APP_URL=http://localhost:3000
```

Extend `src/config/env.ts`:

```ts
STRIPE_SECRET_KEY:     z.string().min(1),
STRIPE_WEBHOOK_SECRET: z.string().min(1),
STRIPE_PUBLISHABLE_KEY:z.string().min(1),
APP_URL:               z.string().url().default("http://localhost:3000"),
```

---

### 2. Stripe client singleton

File: `src/integrations/stripe/stripe.client.ts`

```ts
import Stripe from "stripe";
import { env } from "../../config/env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" });
```

---

### 3. Token costs

File: `api\src\config\models`

---

### 4. Token packs

File: `src/lib/tokenPacks.ts`

```ts
export interface TokenPack {
  id: string;
  name: string;
  tokens: number;
  price: number;
  stripePriceId: string; // populate after running createStripeProducts script
}

export const TOKEN_PACKS: TokenPack[] = [
  { id: "starter", name: "Starter", tokens: 100, price: 5, stripePriceId: "" },
  { id: "creator", name: "Creator", tokens: 500, price: 20, stripePriceId: "" },
  { id: "studio", name: "Studio", tokens: 1500, price: 50, stripePriceId: "" },
];

export const getPackById = (id: string) => TOKEN_PACKS.find((p) => p.id === id);
```

---

### 5. Create Stripe products (one-time setup)

File: `src/scripts/createStripeProducts.ts`

```ts
import { stripe } from "../integrations/stripe/stripe.client";
import { TOKEN_PACKS } from "../lib/tokenPacks";

async function main() {
  for (const pack of TOKEN_PACKS) {
    const product = await stripe.products.create({
      name: pack.name,
      description: `${pack.tokens} tokens`,
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: pack.price * 100,
      currency: "usd",
      lookup_key: pack.id,
    });
    console.log(`${pack.id}: "${price.id}"`);
  }
}
main().catch(console.error);
```

Run: `npm run stripe:setup`  
Copy printed price IDs into `TOKEN_PACKS[*].stripePriceId`.

---

### 6. Extend Prisma schema

`prisma/schema.prisma` — add `TokenPurchase`:

```prisma
model TokenPurchase {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  userId          String   @db.ObjectId
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  packId          String
  tokens          Int
  amountCents     Int
  stripeSessionId String   @unique   // idempotency key
  createdAt       DateTime @default(now())

  @@index([userId])
}
```

Run: `npx prisma db push`

---

### 6b. Token usage ledger (per debit)

**Goal:** Every time tokens are deducted for an AI or Tripo call, append an immutable row for analytics, support, and cost reconciliation. Values should match the config the charge was based on (`api/src/config/models/image-models.ts` → `ImageModels[].id`, `trippo-models.ts` → `TrippoModels[].id`, and `./pricing` → `MARKUP_FACTOR`).

| Column            | Type     | Notes                                                                                                                         |
| ----------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `id`              | ObjectId | Primary key                                                                                                                   |
| `userId`          | ObjectId | Who was charged                                                                                                               |
| `usageKind`       | enum     | `image` \| `trippo` (or extend later, e.g. `chat`)                                                                            |
| `modelId`         | string   | Same string as `ImageModels.id` or `TrippoModels.id` for that request                                                         |
| `operation`       | string?  | Optional coarse gate, e.g. `image`, `tripoMesh`, `rig`, `animationRetarget` — useful if `requireTokens` stays operation-based |
| `tokens_original` | number   | Pre-markup token units from provider/cost table (`tokens_original` on the model)                                              |
| `price_original`  | number   | Pre-markup USD basis (`price_original` on the model)                                                                          |
| `tokens`          | number   | Tokens actually debited (`tokens` / post-markup side of config)                                                               |
| `price`           | number   | Post-markup USD equivalent if you store it (`price` on the model), else derivable                                             |
| `markup_factor`   | number   | Snapshot of `MARKUP_FACTOR` at charge time so historical rows stay correct if config changes                                  |
| `balance_after`   | int?     | Optional: `User.tokenBalance` after decrement (debugging and statements)                                                      |
| `idempotency_key` | string?  | Optional unique key per job/request to avoid double-logging on retries                                                        |
| `metadata`        | Json?    | Optional: job id, pipeline step, Stripe-irrelevant request refs                                                               |
| `created_at`      | DateTime | When the debit occurred                                                                                                       |

`prisma/schema.prisma` — add something like:

```prisma
enum TokenUsageKind {
  image
  trippo
}

model TokenUsage {
  id               String         @id @default(auto()) @map("_id") @db.ObjectId
  userId           String         @db.ObjectId
  user             User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  usageKind        TokenUsageKind
  modelId          String
  operation        String?
  tokens_original  Float
  price_original   Float
  tokens           Float
  price            Float
  markup_factor    Float
  balance_after    Int?
  idempotencyKey   String?        @unique
  metadata         Json?
  createdAt        DateTime       @default(now())

  @@index([userId, createdAt])
  @@index([usageKind, modelId])
}
```

On `User`, add `tokenUsages TokenUsage[]` alongside other relations.

**Implementation note:** `requireTokens` only knows the coarse `TokenOperation`, not `modelId`. Create `TokenUsage` rows in the same place you resolve the model and debit tokens (e.g. image-generation and Tripo pipeline services), ideally in the **same transaction** as `tokenBalance` decrement. If you keep a generic middleware-only decrement, either pass `modelId` / pricing snapshot into the request context after validation, or migrate to “debit + log” helpers shared by those routes.

Add a read endpoint when needed, e.g. `GET /api/billing/usage?limit=50`, mirroring purchase history.

---

### 7. requireTokens middleware

File: `src/middleware/requireTokens.ts`

Uses an atomic Prisma filter update — the update only fires if `tokenBalance >= cost`. If Prisma throws (no document matched), the user doesn't have enough tokens.

```ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/client";
import { TOKEN_COSTS, type TokenOperation } from "../lib/tokenCosts";

export function requireTokens(operation: TokenOperation) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const cost = TOKEN_COSTS[operation];

    try {
      await prisma.user.update({
        where: { id: req.userId, tokenBalance: { gte: cost } },
        data: { tokenBalance: { decrement: cost } },
      });
      next();
    } catch {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { tokenBalance: true },
      });
      res.status(402).json({
        error: "Insufficient tokens",
        required: cost,
        balance: user?.tokenBalance ?? 0,
      });
    }
  };
}
```

---

### 8. Billing types

File: `src/modules/billing/billing.types.ts`

```ts
export interface CheckoutInput {
  packId: string;
}
export interface PurchaseRecord {
  id: string;
  packId: string;
  tokens: number;
  amountCents: number;
  createdAt: string;
}
export interface BalanceResponse {
  balance: number;
}
```

---

### 9. Billing service

File: `src/modules/billing/billing.service.ts`

```ts
import { stripe } from "../../integrations/stripe/stripe.client";
import { prisma } from "../../integrations/db/client";
import { env } from "../../config/env";
import { getPackById, TOKEN_PACKS } from "../../lib/tokenPacks";

export async function createCheckoutSession(userId: string, packId: string) {
  const pack = getPackById(packId);
  if (!pack) {
    const e = new Error("Invalid pack");
    (e as any).status = 400;
    throw e;
  }
  if (!pack.stripePriceId) {
    const e = new Error("Pack not configured");
    (e as any).status = 500;
    throw e;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: pack.stripePriceId, quantity: 1 }],
    success_url: `${env.APP_URL}/billing?success=1`,
    cancel_url: `${env.APP_URL}/billing?cancelled=1`,
    metadata: { userId, packId: pack.id, tokens: String(pack.tokens) },
  });
  return { url: session.url };
}

export async function getBalance(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { tokenBalance: true } });
  return { balance: user?.tokenBalance ?? 0 };
}

export async function getPurchaseHistory(userId: string) {
  return prisma.tokenPurchase.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
}

export const getTokenPacks = () => TOKEN_PACKS.map(({ id, name, tokens, price }) => ({ id, name, tokens, price }));

/** Called by webhook — idempotent via stripeSessionId unique index */
export async function creditTokensFromWebhook(userId: string, packId: string, tokens: number, amountCents: number, stripeSessionId: string) {
  if (await prisma.tokenPurchase.findUnique({ where: { stripeSessionId } })) return;

  await prisma.$transaction([prisma.user.update({ where: { id: userId }, data: { tokenBalance: { increment: tokens } } }), prisma.tokenPurchase.create({ data: { userId, packId, tokens, amountCents, stripeSessionId } })]);
}
```

---

### 10. Billing router

File: `src/modules/billing/billing.router.ts`

```ts
import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import * as billing from "./billing.service";

const router = Router();

router.get("/packs", async (_req, res, next) => {
  try {
    res.json(billing.getTokenPacks());
  } catch (e) {
    next(e);
  }
});

router.post("/checkout", requireAuth, async (req, res, next) => {
  try {
    res.json(await billing.createCheckoutSession(req.userId, req.body.packId));
  } catch (e) {
    next(e);
  }
});

router.get("/balance", requireAuth, async (req, res, next) => {
  try {
    res.json(await billing.getBalance(req.userId));
  } catch (e) {
    next(e);
  }
});

router.get("/history", requireAuth, async (req, res, next) => {
  try {
    res.json(await billing.getPurchaseHistory(req.userId));
  } catch (e) {
    next(e);
  }
});

export default router;
```

---

### 11. Stripe webhook router

File: `src/integrations/stripe/stripe.webhook.router.ts`

**Must be registered before `express.json()`** in `server.ts`.

```ts
import { Router } from "express";
import express from "express";
import type Stripe from "stripe";
import { stripe } from "./stripe.client";
import { env } from "../../config/env";
import { creditTokensFromWebhook } from "../../modules/billing/billing.service";

const router = Router();

router.post("/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${(err as Error).message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, packId, tokens } = session.metadata!;

    try {
      await creditTokensFromWebhook(userId, packId, parseInt(tokens, 10), session.amount_total ?? 0, session.id);
    } catch (err) {
      console.error("Webhook processing error:", err);
      return res.status(500).json({ error: "Failed to credit tokens" });
    }
  }

  res.json({ received: true });
});

export default router;
```

---

### 12. Register everything in `src/server.ts`

```ts
import stripeWebhookRouter from "./integrations/stripe/stripe.webhook.router";
import billingRouter from "./modules/billing/billing.router";
import { requireTokens } from "./middleware/requireTokens";

// MUST be before express.json()
app.use("/api", stripeWebhookRouter);

app.use(express.json());

// Billing
app.use("/api/billing", billingRouter);

// Token-gated routes
app.post("/api/chat", requireAuth, requireTokens("chat"), chatRouter);
app.post("/api/image-gen", requireAuth, requireTokens("image"), imageGenRouter);
app.post("/api/pipeline", requireAuth, requireTokens("pipeline"), pipelineRouter);
// Additional animation retargeting on an existing model (cheaper than full pipeline)
app.post("/api/models3d/:id/animate", requireAuth, requireTokens("animationRetarget"), animateRouter);
```

---

### 13. Local webhook testing

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the printed whsec_... into .env as STRIPE_WEBHOOK_SECRET
stripe trigger checkout.session.completed
```

---

### 14. React billing feature

Complete the stub from Phase 03.

**`features/billing/api.ts`**:

```ts
export const getBalance = () => apiFetch<{ balance: number }>("/api/billing/balance");
export const getPacks = () => apiFetch<TokenPack[]>("/api/billing/packs");
export const getHistory = () => apiFetch<PurchaseRecord[]>("/api/billing/history");
export const checkout = (packId: string) => apiFetch<{ url: string }>("/api/billing/checkout", { method: "POST", ...json({ packId }) });
```

**`features/billing/hooks/useBilling.ts`**:

```ts
export function useBalance() {
  return useQuery({ queryKey: ["billing", "balance"], queryFn: getBalance, refetchInterval: 30_000 });
}
export function useCheckout() {
  return useMutation({
    mutationFn: checkout,
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });
}
```

**`pages/settings/credits/components/BillingPage.tsx`** — three sections:

1. **Balance card** — large token count, last updated timestamp.
2. **Pack grid** — three cards: Starter / Creator / Studio. Each shows token count, price, "Buy" button. Disable while checkout mutation is pending. Show a loading spinner on the active button.
3. **Purchase history** — table: Pack name | Tokens | Amount | Date. Empty state if no purchases.

On return from Stripe (`/credits?success=1`): show a toast + invalidate balance query.
On `/credits?cancelled=1`: show a neutral toast "Purchase cancelled".

**`app/layout/TopBar.tsx`** — token balance display:

```tsx
const { data } = useBalance();
<span className="font-mono text-accent-light">{data?.balance ?? "—"} tokens</span>
<Link to="/credits" className="text-xs text-slate-400 hover:text-white ml-2">Buy</Link>
```

---

## Acceptance criteria

- [ ] `POST /api/billing/checkout` returns a Stripe Checkout URL (test mode).
- [ ] Completing Stripe Checkout increments `User.tokenBalance` in MongoDB.
- [ ] Re-delivering the same webhook event does **not** double-credit (idempotent).
- [ ] `POST /api/pipeline` with zero tokens returns `402 { error, required, balance }`.
- [ ] Pipeline deducts 20 tokens before running (not after — user pays for the API call regardless of result).
- [ ] `POST /api/models3d/:id/animate` deducts 5 tokens for adding animations to an existing model.
- [ ] Billing page shows balance, all packs, purchase history.
- [ ] Balance in `TopBar` refreshes every 30 s without page reload.
- [ ] Missing `STRIPE_SECRET_KEY` → `env.ts` aborts server startup.
- [ ] Stripe webhook signature mismatch → `400` (not `500`).
- [ ] All Stripe interactions use test keys in development.
- [ ] No Prisma calls outside `*.service.ts` files.
- [ ] Each token debit for a model-backed call writes a `TokenUsage` row with `modelId`, `tokens_original` / `price_original`, charged `tokens` / `price`, and `markup_factor` at charge time (idempotent when `idempotencyKey` is set).

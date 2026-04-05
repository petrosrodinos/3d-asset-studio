import { Router } from "express";
import express from "express";
import { stripe } from "./stripe.client";
import { env } from "../../config/env/env-validation";
import {
  creditTokensFromWebhook,
  updatePurchaseStripeFeeBySession,
} from "../../modules/billing/billing.service";

const router = Router();

type BalanceTransactionRef = string | { fee?: number | null } | null | undefined;

/**
 * Stripe’s fee on the charge (`BalanceTransaction.fee`), in minor units.
 * Resolves expanded objects or retrieves by id (same pattern as `charge.updated` handlers).
 */
async function balanceTransactionFeeCents(balanceTransaction: BalanceTransactionRef): Promise<number | null> {
  if (balanceTransaction == null) return null;
  try {
    const bt =
      typeof balanceTransaction === "object"
        ? balanceTransaction
        : await stripe.balanceTransactions.retrieve(balanceTransaction);
    const fee = bt.fee ?? 0;
    return typeof fee === "number" && fee >= 0 ? fee : null;
  } catch (err) {
    console.warn("[stripe webhook] could not resolve balance transaction fee:", err);
    return null;
  }
}

/** Stripe’s fee for a Checkout session’s charge, in minor units; null if unavailable. */
async function stripeFeeCentsForCheckoutSession(sessionId: string): Promise<number | null> {
  try {
    const full = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent.latest_charge.balance_transaction"],
    });
    const pi = full.payment_intent;
    if (!pi || typeof pi === "string") return null;
    const charge = pi.latest_charge;
    if (!charge || typeof charge === "string") return null;
    return balanceTransactionFeeCents(charge.balance_transaction);
  } catch (err) {
    console.warn("[stripe webhook] could not resolve checkout session fee:", err);
    return null;
  }
}

router.post("/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  if (typeof sig !== "string") {
    return res.status(400).send("Missing stripe-signature header");
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      metadata?: Record<string, string | undefined> | null;
      amount_total?: number | null;
    };
    const meta = session.metadata;
    if (!meta?.userId || !meta?.packId || meta.tokens == null || meta.tokens === "") {
      console.warn("[stripe webhook] checkout.session.completed missing metadata");
      return res.json({ received: true });
    }

    const tokens = parseInt(meta.tokens, 10);
    if (!Number.isFinite(tokens) || tokens < 1) {
      console.warn("[stripe webhook] invalid tokens in metadata");
      return res.json({ received: true });
    }

    try {
      const stripeFeeCents = await stripeFeeCentsForCheckoutSession(session.id);
      await creditTokensFromWebhook(
        meta.userId,
        meta.packId,
        tokens,
        session.amount_total ?? 0,
        session.id,
        stripeFeeCents,
      );
    } catch (err) {
      console.error("Webhook processing error:", err);
      return res.status(500).json({ error: "Failed to credit tokens" });
    }
  } else if (event.type === "charge.updated") {
    const charge = event.data.object as {
      payment_intent?: string | { id: string } | null;
      balance_transaction?: BalanceTransactionRef;
    };
    const pi = charge.payment_intent;
    const piId = typeof pi === "string" ? pi : pi?.id;
    if (!piId) {
      return res.json({ received: true });
    }

    const fee = await balanceTransactionFeeCents(charge.balance_transaction);
    if (fee == null) {
      return res.json({ received: true });
    }

    try {
      const sessions = await stripe.checkout.sessions.list({ payment_intent: piId, limit: 1 });
      const sessionId = sessions.data[0]?.id;
      if (sessionId) {
        await updatePurchaseStripeFeeBySession(sessionId, fee);
      }
    } catch (err) {
      console.warn("[stripe webhook] charge.updated: could not map payment intent to session:", err);
    }
  }

  res.json({ received: true });
});

export default router;

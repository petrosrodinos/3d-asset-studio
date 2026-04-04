import type { Prisma } from "../../generated/prisma/client";
import { TokenUsageKind } from "../../generated/prisma/enums";
import { prisma } from "../../integrations/db/client";
import { ImageModels } from "../../config/models/image-models";
import { TrippoModels } from "../../config/models/trippo-models";
import {
  CHAT_PRICE_ORIGINAL_USD,
  CHAT_TOKENS_ORIGINAL,
  MARKUP_FACTOR,
  TOKEN_PER_USD,
} from "../../config/models/pricing";
import {
  getTokenOperationDebit,
  getTrippoRowOrThrow,
  PIPELINE_TRIPPO_MODEL_IDS,
  type TokenOperation,
  trippoWalletDebitFromRow,
} from "../../config/models/token-operations";
import { env } from "../../config/env/env-validation";

export class InsufficientTokensError extends Error {
  readonly statusCode = 402;
  readonly required: number;
  readonly balance: number;

  constructor(required: number, balance: number) {
    super("Insufficient tokens");
    this.name = "InsufficientTokensError";
    this.required = required;
    this.balance = balance;
  }
}

function trippoNumericPriceOriginal(m: (typeof TrippoModels)[number]): number {
  const p = m.price_original;
  return typeof p === "number" ? p : parseFloat(String(p));
}

async function debitWithUsageTx(
  tx: Prisma.TransactionClient,
  args: {
    userId: string;
    cost: number;
    usageKind: (typeof TokenUsageKind)[keyof typeof TokenUsageKind];
    modelId: string;
    operation?: string | null;
    tokensOriginal: number;
    priceOriginal: number;
    price: number;
    markupFactor: number;
    idempotencyKey?: string | null;
    metadata?: Prisma.InputJsonValue | null;
  },
): Promise<void> {
  const {
    userId,
    cost,
    usageKind,
    modelId,
    operation,
    tokensOriginal,
    priceOriginal,
    price,
    markupFactor,
    idempotencyKey,
    metadata,
  } = args;

  if (cost <= 0) return;

  if (idempotencyKey) {
    const existing = await tx.tokenUsage.findUnique({ where: { idempotencyKey } });
    if (existing) return;
  }

  const updated = await tx.user.updateMany({
    where: { id: userId, tokenBalance: { gte: cost } },
    data: { tokenBalance: { decrement: cost } },
  });

  if (updated.count === 0) {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { tokenBalance: true } });
    throw new InsufficientTokensError(cost, user?.tokenBalance ?? 0);
  }

  const userAfter = await tx.user.findUnique({ where: { id: userId }, select: { tokenBalance: true } });

  await tx.tokenUsage.create({
    data: {
      userId,
      usageKind,
      modelId,
      operation: operation ?? undefined,
      tokensOriginal,
      priceOriginal,
      tokens: cost,
      price,
      markupFactor,
      balanceAfter: userAfter?.tokenBalance ?? undefined,
      idempotencyKey: idempotencyKey ?? undefined,
      metadata: metadata ?? undefined,
    },
  });
}

export async function debitForOperation(userId: string, operation: TokenOperation, idempotencyKey?: string | null) {
  const cost = getTokenOperationDebit(operation);
  if (cost <= 0) return;

  let usageKind: (typeof TokenUsageKind)[keyof typeof TokenUsageKind] = TokenUsageKind.trippo;
  let modelId = "trippo";
  let tokensOriginal = cost;
  let priceOriginal = cost / TOKEN_PER_USD;
  let price = cost / TOKEN_PER_USD;

  if (operation === "chat") {
    usageKind = TokenUsageKind.chat;
    modelId = env.AGENT_MODEL;
    tokensOriginal = CHAT_TOKENS_ORIGINAL;
    priceOriginal = CHAT_PRICE_ORIGINAL_USD;
    price = CHAT_PRICE_ORIGINAL_USD * MARKUP_FACTOR;
  }

  if (operation === "pipeline") {
    const mesh = getTrippoRowOrThrow(PIPELINE_TRIPPO_MODEL_IDS[0]);
    const rig = getTrippoRowOrThrow(PIPELINE_TRIPPO_MODEL_IDS[1]);
    tokensOriginal = mesh.tokens_original + rig.tokens_original;
    priceOriginal = trippoNumericPriceOriginal(mesh) + trippoNumericPriceOriginal(rig);
    price = Number(mesh.price) + Number(rig.price);
    modelId = "image_to_model";
  }

  if (operation === "animationRetarget") {
    const m = getTrippoRowOrThrow("animate_retarget");
    modelId = m.id;
    tokensOriginal = m.tokens_original;
    priceOriginal = trippoNumericPriceOriginal(m);
    price = Number(m.price);
  }

  if (operation === "trippoMesh") {
    const m = getTrippoRowOrThrow("image_to_model");
    modelId = m.id;
    tokensOriginal = m.tokens_original;
    priceOriginal = trippoNumericPriceOriginal(m);
    price = Number(m.price);
  }

  if (operation === "rig") {
    const m = getTrippoRowOrThrow("animate_rig");
    modelId = m.id;
    tokensOriginal = m.tokens_original;
    priceOriginal = trippoNumericPriceOriginal(m);
    price = Number(m.price);
  }

  await prisma.$transaction((tx) =>
    debitWithUsageTx(tx, {
      userId,
      cost,
      usageKind,
      modelId,
      operation,
      tokensOriginal,
      priceOriginal,
      price,
      markupFactor: MARKUP_FACTOR,
      idempotencyKey,
    }),
  );
}

export async function debitForImageModel(
  userId: string,
  modelId: string,
  idempotencyKey?: string | null,
) {
  const m = ImageModels.find((x) => x.id === modelId);
  if (!m) {
    const err = new Error(`Unknown image model: ${modelId}`);
    (err as Error & { status?: number }).status = 400;
    throw err;
  }

  const cost = Math.ceil(m.tokens);

  await prisma.$transaction((tx) =>
    debitWithUsageTx(tx, {
      userId,
      cost,
      usageKind: TokenUsageKind.image,
      modelId: m.id,
      operation: "image",
      tokensOriginal: m.tokens_original,
      priceOriginal: m.price_original,
      price: m.price,
      markupFactor: MARKUP_FACTOR,
      idempotencyKey,
    }),
  );
}

export async function debitForTrippoModelId(
  userId: string,
  trippoModelId: string,
  operation: string,
  idempotencyKey?: string | null,
) {
  const m = TrippoModels.find((x) => x.id === trippoModelId);
  if (!m) {
    const err = new Error(`Unknown Tripo model: ${trippoModelId}`);
    (err as Error & { status?: number }).status = 400;
    throw err;
  }

  const cost = trippoWalletDebitFromRow(m);
  if (cost <= 0) return;

  await prisma.$transaction((tx) =>
    debitWithUsageTx(tx, {
      userId,
      cost,
      usageKind: TokenUsageKind.trippo,
      modelId: m.id,
      operation,
      tokensOriginal: m.tokens_original,
      priceOriginal: trippoNumericPriceOriginal(m),
      price: m.price,
      markupFactor: MARKUP_FACTOR,
      idempotencyKey,
    }),
  );
}

export async function debitImageThenTrippoMesh(
  userId: string,
  imageModelId: string,
  idempotencyKey?: string | null,
) {
  const img = ImageModels.find((x) => x.id === imageModelId);
  if (!img) {
    const err = new Error(`Unknown image model: ${imageModelId}`);
    (err as Error & { status?: number }).status = 400;
    throw err;
  }

  const mesh = TrippoModels.find((x) => x.id === "image_to_model");
  if (!mesh) throw new Error("Tripo image_to_model config missing");

  const imageCost = Math.ceil(img.tokens);
  const meshCost = Math.ceil(mesh.tokens);
  const kImg = idempotencyKey ? `${idempotencyKey}:image` : null;
  const kMesh = idempotencyKey ? `${idempotencyKey}:trippo` : null;

  await prisma.$transaction(async (tx) => {
    if (kImg && kMesh) {
      const [e1, e2] = await Promise.all([
        tx.tokenUsage.findUnique({ where: { idempotencyKey: kImg } }),
        tx.tokenUsage.findUnique({ where: { idempotencyKey: kMesh } }),
      ]);
      if (e1 && e2) return;
    }

    await debitWithUsageTx(tx, {
      userId,
      cost: imageCost,
      usageKind: TokenUsageKind.image,
      modelId: img.id,
      operation: "image",
      tokensOriginal: img.tokens_original,
      priceOriginal: img.price_original,
      price: img.price,
      markupFactor: MARKUP_FACTOR,
      idempotencyKey: kImg,
    });

    await debitWithUsageTx(tx, {
      userId,
      cost: meshCost,
      usageKind: TokenUsageKind.trippo,
      modelId: mesh.id,
      operation: "trippoMesh",
      tokensOriginal: mesh.tokens_original,
      priceOriginal: trippoNumericPriceOriginal(mesh),
      price: mesh.price,
      markupFactor: MARKUP_FACTOR,
      idempotencyKey: kMesh,
    });
  });
}

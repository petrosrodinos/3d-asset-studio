import { TrippoModels } from "./trippo-models";
import { CHAT_DEBIT_TOKENS } from "./pricing";

/** Coarse HTTP / middleware operations → wallet debits derived from `TrippoModels` + `pricing`. */
export const TOKEN_OPERATIONS = [
  "pipeline",
  "animationRetarget",
  "chat",
  "trippoMesh",
  "rig",
] as const;

export type TokenOperation = (typeof TOKEN_OPERATIONS)[number];

/** Tripo steps included in the mesh→rig pipeline gate (before SSE). Default mesh step is single-image. */
export const PIPELINE_TRIPPO_MODEL_IDS = ["image_to_model", "animate_rig"] as const;

export type PipelineMeshTrippoModelId = "image_to_model" | "multiview_to_model";

export type DebitForOperationOptions = {
  pipelineMeshModelId?: PipelineMeshTrippoModelId;
};

export function getPipelineDebitTokens(meshModelId: PipelineMeshTrippoModelId): number {
  return trippoWalletDebitByModelId(meshModelId) + trippoWalletDebitByModelId("animate_rig");
}

export function getTrippoRowOrThrow(modelId: string) {
  const m = TrippoModels.find((x) => x.id === modelId);
  if (!m) throw new Error(`Unknown Tripo model: ${modelId}`);
  return m;
}

/** Wallet tokens to debit for one Tripo model row (`tokens` is post-markup). */
export function trippoWalletDebitFromRow(m: (typeof TrippoModels)[number]): number {
  return Math.max(0, Math.ceil(Number(m.tokens)));
}

export function trippoWalletDebitByModelId(modelId: string): number {
  return trippoWalletDebitFromRow(getTrippoRowOrThrow(modelId));
}

export function getTokenOperationDebit(operation: TokenOperation): number {
  switch (operation) {
    case "trippoMesh":
      return trippoWalletDebitByModelId("image_to_model");
    case "rig":
      return trippoWalletDebitByModelId("animate_rig");
    case "animationRetarget":
      return trippoWalletDebitByModelId("animate_retarget");
    case "pipeline":
      return getPipelineDebitTokens("image_to_model");
    case "chat":
      return CHAT_DEBIT_TOKENS;
    default: {
      const _exhaustive: never = operation;
      return _exhaustive;
    }
  }
}

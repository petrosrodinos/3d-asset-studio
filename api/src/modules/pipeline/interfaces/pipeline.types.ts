import type { Prisma } from "../../../generated/prisma/client";

export type PipelineProgressEmitter = (payload: {
  step: string;
  status: string;
  data?: Record<string, unknown>;
}) => void;

export type PipelineSseEventEmitter = (
  event: string,
  data: Record<string, unknown>,
) => void;

export type PipelineRasterView = {
  buffer: Buffer;
  filename: string;
  mimeType: "image/png" | "image/jpeg";
};

export interface RunPipelineOpts {
  figureId: string;
  variantId: string;
  /** Existing skin image id for the primary view (first raster). Omit when sources are new file uploads. */
  existingPrimarySkinImageId?: string;
  /** One image → `image_to_model`; two or more → Tripo `multiview_to_model`. */
  views: PipelineRasterView[];
  modelVersion: string;

  emitProgress: PipelineProgressEmitter;
  emitEvent: PipelineSseEventEmitter;

  /** Fires when Tripo accepts the mesh task (for token-usage provider metadata). */
  onMeshTaskCostsMetadata?: (costsMetadata: Prisma.InputJsonValue) => void | Promise<void>;
}

import { getTripo } from "../../services";
import { tripoTaskRasterType } from "../../integrations/trippo/tripoTaskFileType";
import { extractTripoUploadToken } from "../../integrations/trippo/uploadToken";
import type { StandardModelVersion } from "../../integrations/trippo/types";
import { uploadBuffer } from "../../integrations/gcs/gcs.service";
import * as skinImageSvc from "../skin-images/skin-images.service";
import * as model3dSvc from "../models3d/models3d.service";
import type { RunPipelineOpts } from "./interfaces/pipeline.types";
import { PIPELINE_CONFIG } from "./config/pipeline.config";
import { TRIPO_CONFIG } from "../tripo/config/tripo.config";

const STANDARD_TRIPPO_MODEL_VERSIONS = new Set<string>([
  "v3.1-20260211",
  "v3.0-20250812",
  "v2.5-20250123",
  "v2.0-20240919",
  "v1.4-20240625",
]);

function standardModelVersionForMultiview(requested: string): StandardModelVersion {
  if (STANDARD_TRIPPO_MODEL_VERSIONS.has(requested)) {
    return requested as StandardModelVersion;
  }
  return TRIPO_CONFIG.DEFAULT_TRIPO_MODEL_VERSION as StandardModelVersion;
}

export async function runPipeline(opts: RunPipelineOpts) {
  const { figureId, variantId, existingPrimarySkinImageId, views, modelVersion, emitProgress, emitEvent } = opts;

  if (views.length === 0) {
    emitEvent(PIPELINE_CONFIG.PIPELINE_SSE_EVENTS.ERROR, { message: "No image views provided" });
    return;
  }

  let model: Awaited<ReturnType<typeof model3dSvc.createModel3D>> | undefined;
  const tripo = getTripo();

  try {
    let resolvedSkinImageId: string;
    if (existingPrimarySkinImageId) {
      resolvedSkinImageId = existingPrimarySkinImageId;
    } else if (views.length === 1) {
      const v = views[0];
      const ext = v.mimeType === "image/jpeg" ? "jpg" : "png";
      const gcsKey = `images/figures/${figureId}/${variantId}/${Date.now()}-source.${ext}`;
      const { gcsUrl } = await uploadBuffer(v.buffer, gcsKey, v.mimeType);
      const skinImage = await skinImageSvc.createSkinImage(variantId, figureId, gcsUrl);
      resolvedSkinImageId = skinImage.id;
    } else {
      let firstId: string | undefined;
      for (const v of views) {
        const img = await skinImageSvc.createSkinImageFromUpload(variantId, figureId, v.buffer, v.mimeType);
        if (!firstId) firstId = img.id;
      }
      resolvedSkinImageId = firstId!;
    }

    model = await model3dSvc.createModel3D(resolvedSkinImageId);

    emitProgress({ step: PIPELINE_CONFIG.PIPELINE_STEPS.UPLOAD, status: PIPELINE_CONFIG.PIPELINE_STATUSES.RUNNING });
    const fileTokens: string[] = [];
    for (let i = 0; i < views.length; i++) {
      const v = views[i];
      const uploadResult = await tripo.uploadFile(v.buffer, v.filename, v.mimeType);
      fileTokens.push(extractTripoUploadToken(uploadResult));
    }
    emitProgress({ step: PIPELINE_CONFIG.PIPELINE_STEPS.UPLOAD, status: PIPELINE_CONFIG.PIPELINE_STATUSES.SUCCESS });

    emitProgress({ step: PIPELINE_CONFIG.PIPELINE_STEPS.MESH, status: PIPELINE_CONFIG.PIPELINE_STATUSES.RUNNING });

    const isMultiview = views.length >= 2;
    const { createTaskResponse: meshTask, costsMetadata: meshCostsMetadata } = isMultiview
      ? await tripo.createTask({
          type: TRIPO_CONFIG.TRIPO_TASK_TYPES.MULTIVIEW_TO_MODEL,
          files: views.map((v, i) => ({
            type: tripoTaskRasterType(v.mimeType),
            file_token: fileTokens[i],
          })),
          model_version: standardModelVersionForMultiview(modelVersion),
          texture: true,
          pbr: true,
        } as never)
      : await tripo.createTask({
          type: TRIPO_CONFIG.TRIPO_TASK_TYPES.IMAGE_TO_MODEL,
          file: {
            type: tripoTaskRasterType(views[0].mimeType),
            file_token: fileTokens[0],
          },
          model_version: modelVersion as never,
          texture: true,
          pbr: true,
        } as never);

    const meshTaskId = (meshTask.data as { task_id?: string }).task_id as string;
    await opts.onMeshTaskCostsMetadata?.(meshCostsMetadata);

    await model3dSvc.updateModel3DProcessing(model.id, { meshTaskId });
    emitProgress({
      step: PIPELINE_CONFIG.PIPELINE_STEPS.MESH,
      status: PIPELINE_CONFIG.PIPELINE_STATUSES.QUEUED,
      data: { taskId: meshTaskId },
    });

    const meshResult = await tripo.pollTask(meshTaskId, {
      intervalMs: PIPELINE_CONFIG.DEFAULT_POLL_INTERVAL_MS,
      timeoutMs: PIPELINE_CONFIG.MESH_POLL_TIMEOUT_MS,
    });
    const pbrModelUrl = meshResult.output?.pbr_model ?? meshResult.output?.model ?? "";
    const meshModelUrl = meshResult.output?.model ?? pbrModelUrl;
    emitProgress({
      step: PIPELINE_CONFIG.PIPELINE_STEPS.MESH,
      status: PIPELINE_CONFIG.PIPELINE_STATUSES.SUCCESS,
      data: { taskId: meshTaskId },
    });

    await model3dSvc.finalizeModel3D(model.id, model.id, {
      pbrModelSourceUrl: pbrModelUrl,
      modelSourceUrl: meshModelUrl,
    });

    const finishedModel = await model3dSvc.getModel3D(model.id);
    emitEvent(PIPELINE_CONFIG.PIPELINE_SSE_EVENTS.COMPLETE, {
      model3dId: model.id,
      gcsPbrModelUrl: finishedModel?.gcsPbrModelUrl,
      gcsModelUrl: finishedModel?.gcsModelUrl,
    });
  } catch (err) {
    if (model) await model3dSvc.failModel3D(model.id, String(err));
    emitEvent(PIPELINE_CONFIG.PIPELINE_SSE_EVENTS.ERROR, { message: String(err) });
  }
}

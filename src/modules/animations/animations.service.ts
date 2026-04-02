import { archiveRemoteUrl } from "../../integrations/gcs/gcs.service";
import {
  createAnimation as createAnimationRepo,
  listAnimations as listAnimationsRepo,
  setAnimationFailed,
  setAnimationSuccess,
} from "./repositories/animations.repository";
import { MODELS3D_CONFIG } from "../models3d/config/models3d.config";

export async function createAnimation(model3dId: string, animationKey: string) {
  return createAnimationRepo(model3dId, animationKey);
}

export async function finalizeAnimation(
  id: string,
  model3dId: string,
  animationKey: string,
  tripoGlbUrl: string,
) {
  const safeKey = animationKey.replace(/[^a-z0-9_:.-]/gi, "_");
  const gcsKey  = `animations/${model3dId}/${safeKey}_${id}.glb`;
  const { gcsUrl } = await archiveRemoteUrl(tripoGlbUrl, gcsKey, MODELS3D_CONFIG.MODEL_GLTF_BINARY_CONTENT_TYPE);

  return setAnimationSuccess({ id, tripoGlbUrl, gcsGlbUrl: gcsUrl, gcsGlbKey: gcsKey });
}

export async function failAnimation(id: string, error: string) {
  return setAnimationFailed(id, error);
}

export async function listAnimations(model3dId: string) {
  return listAnimationsRepo(model3dId);
}

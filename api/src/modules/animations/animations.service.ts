import { prisma } from "../../integrations/db/client";
import { archiveRemoteUrl, deleteGcsFiles } from "../../integrations/gcs/gcs.service";
import {
  createAnimation as createAnimationRepo,
  deleteAnimationById,
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

function httpError(status: number, message: string): Error {
  const e = new Error(message);
  (e as Error & { status: number }).status = status;
  return e;
}

export async function deleteAnimationForUser(userId: string, model3dId: string, animationId: string) {
  const anim = await prisma.animation.findUnique({
    where: { id: animationId },
    include: {
      model3d: {
        include: {
          image: { include: { variant: { include: { skin: true } } } },
        },
      },
    },
  });

  if (!anim || anim.model3dId !== model3dId) throw httpError(404, "Animation not found");

  const figureId = anim.model3d.image.variant.skin.figureId;
  const figure = await prisma.figure.findFirst({ where: { id: figureId, userId } });
  if (!figure) throw httpError(404, "Animation not found");

  if (anim.gcsGlbKey) await deleteGcsFiles([anim.gcsGlbKey]);
  await deleteAnimationById(animationId);
}

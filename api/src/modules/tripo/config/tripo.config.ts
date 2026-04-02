export const TRIPO_CONFIG = {
  PROXY_MAX_BYTES: 150 * 1024 * 1024,
  DEFAULT_TRIPO_MODEL_VERSION: "v2.5-20250123",

  TRIPO_TASK_TYPES: {
    IMAGE_TO_MODEL: "image_to_model",
    ANIMATE_PRERIGCHECK: "animate_prerigcheck",
    ANIMATE_RIG: "animate_rig",
    ANIMATE_RETARGET: "animate_retarget",
  } as const,

  TRIPO_OUT_FORMAT_GLb: "glb",
};


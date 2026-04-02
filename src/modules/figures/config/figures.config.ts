export const FIGURES_CONFIG = {
  // Used when choosing an image model for AI-variant generation.
  AI_VARIANT_MODEL_PREFERENCE: [
    // Prefer models that generally do well with structured prompts.
    "flux-pro/v1.1-ultra",
    "flux-pro/v1.1",
    "blackforestlabs/flux-2-max",
    "blackforestlabs/flux-2-pro",
    "flux/schnell",
    "flux/pro",
    "flux/dev",
  ] as string[],
};


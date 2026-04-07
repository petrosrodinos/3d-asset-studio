/** Must match `PRICING_COST_KEYS` in api `pricing-costs.ts`. */
export const PRICING_COST_KEYS = {
  AGENT_CHAT: "agent_chat",
  TRIPPO_MESH_STANDALONE: "trippo_mesh_standalone",
  PIPELINE_MESH: "pipeline_mesh",
  PIPELINE_MESH_MULTIVIEW: "pipeline_mesh_multiview",
  RIGGING: "rigging",
  ANIMATION_RETARGET: "animation_retarget",
  IMAGE_GENERATION: "image_generation",
} as const;

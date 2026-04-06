/**
 * Prompts for turning a user sketch (img2i source) into a mesh-friendly concept image.
 * Kept concise for model context limits; mirrors rig/mesh goals from aiVariant.prompts.
 */

const SKETCH_NEGATIVE_COMMON = [
  "blurry",
  "low resolution",
  "watermark",
  "logo",
  "text",
  "multiple subjects",
  "cropped",
  "extreme perspective",
  "side view only",
  "duplicate limbs",
  "extra fingers",
  "melted geometry",
  "dark silhouette only",
  "heavy fog",
  "sketch lines visible",
  "pencil texture",
  "notebook paper",
].join(", ");

export function buildSketchTo3dPrompts(input: { figureType?: string; sketchHint?: string }): {
  prompt: string;
  negativePrompt: string;
} {
  const figureType = (input.figureType ?? "figure").toLowerCase();
  const hint = input.sketchHint?.trim();
  const hintBlock = hint ? `\n\nUser notes: ${hint}` : "";

  if (figureType !== "figure") {
    return {
      prompt: [
        "Recreate this rough sketch as a polished, production-ready concept render for single-object 3D reconstruction.",
        "Straight-on front view, eye-level, centered, full object in frame, not cropped.",
        "Clean plain light-gray or white studio background, soft even lighting, crisp edges, readable silhouette.",
        "Preserve the design intent of the sketch while upgrading line art into solid forms, believable materials, and clear part boundaries (hinges, wheels, segments must stay separable, not fused).",
        "Game-ready look: coherent proportions, no clutter, no extra props or characters.",
        hintBlock,
      ]
        .filter(Boolean)
        .join(" "),
      negativePrompt: `${SKETCH_NEGATIVE_COMMON}, people, characters, hands, faces, crowd, scenery`,
    };
  }

  return {
    prompt: [
      "Recreate this rough sketch as a polished, production-ready character concept for 3D mesh and rigging.",
      "Strict front view, eye-level, full body head to feet visible, centered, neutral T-pose or A-pose.",
      "Clean plain light-gray or white studio background, soft even lighting, crisp silhouette.",
      "Preserve the character design from the sketch while upgrading to clear anatomy, fitted or simple clothing so shoulders, elbows, wrists, hips, knees, and ankles remain readable (no crossed limbs, no hidden hands or feet).",
      "Single character only, facing the camera, symmetrical where appropriate for rigging.",
      hintBlock,
    ]
      .filter(Boolean)
      .join(" "),
    negativePrompt: SKETCH_NEGATIVE_COMMON,
  };
}

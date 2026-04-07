/**
 * Tripo `image_to_model.file.type` and `multiview_to_model.files[].type`.
 * The official Python SDK uses `jpg` (not `jpeg`); `jpeg` can trigger API error 1004.
 */
export function tripoTaskRasterType(mimeType: "image/png" | "image/jpeg"): "jpg" | "png" {
  return mimeType === "image/jpeg" ? "jpg" : "png";
}

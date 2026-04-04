export interface DeleteSkinImageParams {
  figureId: string;
  skinId: string;
  variantId: string;
  imageId: string;
}

export interface UploadSkinImageParams {
  figureId: string;
  skinId: string;
  variantId: string;
  file: File;
  /** When set, replaces that image’s file and clears its 3D models (no mesh run). */
  imageId?: string;
}

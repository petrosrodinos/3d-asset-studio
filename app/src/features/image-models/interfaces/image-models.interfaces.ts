/** Matches GET /api/models items */
export interface ImageModel {
  id: string;
  label: string;
  provider: string;
  tokens: number;
  isImageToImage: boolean;
}

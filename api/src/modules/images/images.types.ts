/** Public JSON shape for GET /api/models */
export interface ListedImageModelDto {
  id: string;
  label: string;
  provider: string;
  tokens: number;
  isImageToImage: boolean;
}

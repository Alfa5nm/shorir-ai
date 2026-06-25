export interface NormalizedImage {
  mimeType: string;
  base64: string;
  sizeBytes: number;
}

export interface ImageProcessor {
  validateImage(input: { mimeType: string; sizeBytes: number }): Promise<void>;
  normalizeImage(buffer: Buffer, mimeType: string): Promise<NormalizedImage>;
}

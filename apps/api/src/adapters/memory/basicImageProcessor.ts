import type { ImageProcessor, NormalizedImage } from "../../ports/imageProcessor.js";

export function createBasicImageProcessor(): ImageProcessor {
  return {
    async validateImage({ mimeType, sizeBytes }) {
      if (!mimeType.startsWith("image/")) {
        throw new Error("Only image uploads are accepted.");
      }
      if (sizeBytes > 5 * 1024 * 1024) {
        throw new Error("Image must be 5 MB or smaller for the MVP.");
      }
    },
    async normalizeImage(buffer: Buffer, mimeType: string): Promise<NormalizedImage> {
      await this.validateImage({ mimeType, sizeBytes: buffer.byteLength });
      return {
        mimeType,
        base64: buffer.toString("base64"),
        sizeBytes: buffer.byteLength
      };
    }
  };
}

/**
 * Image Processor Utility
 * Handles client-side resizing and format conversion using the Canvas API.
 * This eliminates the need for runtime transformations on Vercel or Cloudinary.
 * Simplified to only provide WebP (display) and JPG (download) variants.
 */

export interface ImageVariantConfig {
  quality: number;
}

/**
 * Resizes and converts an image file to a specific format and dimension.
 */
export async function processImage(
  file: File | Blob,
  quality: number,
  format: "image/webp" | "image/jpeg"
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const targetWidth = img.width;
      const targetHeight = img.height;

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Background fill for JPEGs
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        format,
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

/**
 * Generates two variants: WebP (display) and JPG (download).
 * Returns a Map of "format" to Blobs.
 */
export async function generateAllVariants(file: File | Blob): Promise<Map<string, Blob>> {
  const variants = new Map<string, Blob>();
  
  // Generate WebP (Display) - using 80% quality for balance
  const webpBlob = await processImage(file, 0.8, "image/webp");
  variants.set(`webp`, webpBlob);

  // Generate JPG (Download) - using 90% quality for archival
  const jpgBlob = await processImage(file, 0.9, "image/jpeg");
  variants.set(`jpg`, jpgBlob);

  return variants;
}

/**
 * Image Storage Abstraction Layer
 * Centralizes all image URL generation to eliminate hardcoded URLs.
 * Simplified to support only two formats: WebP (display) and JPG (download).
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dwpxiiiep';
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}`;

export interface ImageSource {
  webp: string;
  jpg: string;
}

/**
 * Returns URLs for the optimized WebP (display) and high-quality JPG (download).
 * We maintain the function names for backward compatibility, but they all return 
 * the same high-quality optimized source now.
 */
export const getAssetSources = (publicId: string): ImageSource => {
  if (!publicId) return { webp: "", jpg: "" };
  
  // 1. If it's already a full URL or a local path, use it.
  // We check if it's a Cloudinary URL and strip any transformation segments to ensure zero-credit.
  if (publicId.startsWith("http")) {
    if (publicId.includes("res.cloudinary.com")) {
      // Strips the transformation segment (e.g., /upload/v123/... or /upload/f_auto,q_auto/v123/...)
      // to return the raw high-quality uploaded image.
      const cleanedUrl = publicId.replace(/\/image\/upload\/(?:[a-z]_[^\/]+\/)+(v\d+\/)?/, "/image/upload/$1");
      const webpUrl = cleanedUrl.replace(/\.[a-zA-Z0-9]+$/, ".webp");
      return { webp: webpUrl, jpg: cleanedUrl };
    }
    return { webp: publicId, jpg: publicId };
  }

  if (publicId.startsWith("/")) {
    return { webp: publicId, jpg: publicId };
  }

  // 2. For raw IDs, return the raw uploaded image directly.
  return { 
    webp: `${BASE_URL}/image/upload/${publicId}.webp`, 
    jpg: `${BASE_URL}/image/upload/${publicId}` 
  };
};

// Aliases for compatibility with existing components
export const getAvatar = getAssetSources;
export const getFaceCard = getAssetSources;
export const getGallery = getAssetSources;
export const getPreview = getAssetSources;

/**
 * For videos, we return the original secure URL.
 */
export const getVideo = (publicId: string, format: string = 'mp4'): string => {
  if (!publicId) return "";
  if (publicId.startsWith("http")) return publicId;
  return `${BASE_URL}/video/upload/${publicId}.${format}`;
};

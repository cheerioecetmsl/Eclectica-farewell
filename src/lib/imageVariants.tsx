import React from "react";
import * as storage from "./imageStorage";

export type ImageVariantName = "avatar" | "faceCard" | "gallery" | "preview";

interface CheerioImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  baseId?: string; // This is the publicId (e.g., 'profiles/user123/avatar')
  fallbackUrl?: string;
  variant?: ImageVariantName;
  priority?: boolean;
}

/**
 * A specialized Image component that serves WebP by default using a standard <picture> tag,
 * with a fallback to the raw raw format. Zero dynamic transformation credits used.
 */
export const CheerioImage: React.FC<CheerioImageProps> = ({ 
  baseId, 
  fallbackUrl, 
  src,
  variant = "gallery", 
  alt = "Memory",
  className = "",
  priority,
  ...props 
}) => {
  const isDirect = (s?: string) => typeof s === 'string' && (s.startsWith('http') || s.startsWith('/'));
  const srcStr = typeof src === 'string' ? src : undefined;
  const fullUrl = (isDirect(srcStr) ? srcStr : null) || (isDirect(fallbackUrl) ? fallbackUrl : null);
  const id = fullUrl || baseId || srcStr || fallbackUrl || "";

  // If we have a full URL or local path, render it directly and immediately.
  if (id.startsWith('http') || id.startsWith('/')) {
    return (
      <img 
        src={id} 
        alt={alt} 
        className={className} 
        loading={priority ? "eager" : "lazy"}
        crossOrigin="anonymous"
        {...props} 
      />
    );
  }

  // Get raw URLs directly from storage layer
  const urls = storage.getAssetSources(id);

  return (
    <picture className={className}>
      <source srcSet={urls.webp} type="image/webp" />
      <img 
        src={urls.jpg || fallbackUrl || ""} 
        alt={alt} 
        className={className}
        loading={priority ? "eager" : "lazy"}
        crossOrigin="anonymous"
        {...props}
        onError={(e) => {
          if (fallbackUrl && e.currentTarget.src !== fallbackUrl) {
            e.currentTarget.src = fallbackUrl;
          }
        }}
      />
    </picture>
  );
};

/**
 * Returns a WebP optimized variant URL for internal use.
 */
export const getVariantUrl = (
  publicId: string, 
  _variant: ImageVariantName = "gallery",
  _format?: string,
  _folder?: string
): string => {
  if (!publicId) return "";
  if (publicId.startsWith("http")) return publicId;
  return storage.getAssetSources(publicId).webp;
};

/**
 * Helper to ensure a URL is valid for cross-origin loading.
 */
export const getProxiedUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return getVariantUrl(url, "preview");
};

/**
 * Returns the raw high-quality URL for downloading.
 */
export const getDownloadUrl = (publicId: string): string => {
  if (!publicId) return "";
  if (publicId.startsWith("http")) return publicId;
  return storage.getAssetSources(publicId).jpg;
};

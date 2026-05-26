import { uploadProcessedImage } from "./uploadHelper";
import { getDownloadUrl } from "./imageVariants";

export interface ArchiveResult {
  url: string;
  baseId?: string;
}

export async function archiveProfilePhoto(photoURL: string): Promise<ArchiveResult> {
  // Only process Google profile photos
  if (!photoURL || !photoURL.includes('googleusercontent.com')) {
    return { url: photoURL };
  }

  try {
    // 1. Fetch the image via our server-side proxy (to bypass CORS)
    const proxyUrl = `/api/img-proxy?url=${encodeURIComponent(photoURL)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      console.warn("[archiveProfilePhoto] Proxy fetch failed, falling back to original URL");
      return { url: photoURL };
    }

    const blob = await response.blob();

    // 2. Process and Upload all variants to Cloudinary
    const { baseId } = await uploadProcessedImage(blob, "Cheerio/Archives/Images");
    const url = getDownloadUrl(baseId);
    
    console.log("[archiveProfilePhoto] Successfully archived to Firebase Storage:", baseId);
    return { url, baseId };

  } catch (err) {
    console.error("[archiveProfilePhoto] Error during archiving:", err);
    return { url: photoURL };
  }
}

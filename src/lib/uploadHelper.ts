import { storage } from "./firebase";
// We no longer use firebase/storage directly for uploads, everything goes to Cloudinary.

// We no longer use firebase/storage directly for uploads, everything goes to Cloudinary.

export interface UploadResult {
  baseId: string;
  version: number;
  url: string;
}

/**
 * Fetch Cloudinary config
 */
async function getCloudinaryConfig() {
  const res = await fetch("/api/config");
  if (!res.ok) throw new Error("Failed to fetch Cloudinary config");
  return res.json();
}

/**
 * Orchestrates the processing and uploading to Cloudinary natively.
 */
export async function uploadProcessedImage(
  file: File | Blob,
  subfolder: string = "Images",
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const config = await getCloudinaryConfig();
  if (!config.cloudName || !config.uploadPreset) {
    throw new Error("Cloudinary credentials missing from /api/config");
  }

  const baseId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const folderPath = subfolder.startsWith("Cheerio/") 
    ? subfolder 
    : `Cheerio/Archives/${subfolder}`;

  console.log(`[UploadHelper] Archiving variants for ${baseId} to ${folderPath}`);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", config.uploadPreset);
  formData.append("public_id", baseId);
  formData.append("folder", folderPath);

  const result: any = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed for ${baseId}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`);
    xhr.send(formData);
  });

  const fullBaseId = `${folderPath}/${baseId}`;

  return { 
    baseId: fullBaseId, 
    version: result.version || 1, 
    url: `https://res.cloudinary.com/${config.cloudName}/image/upload/${fullBaseId}`
  };
}

/**
 * Sequentially uploads a batch of files.
 */
export async function uploadBatch(
  files: FileList | File[],
  type: 'image' | 'video' | 'audio',
  subfolder: string = "Archives",
  onItemProgress?: (index: number, progress: number) => void
): Promise<{ url: string; type: string }[]> {
  const results = [];
  const filesArray = Array.from(files);

  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i];
    try {
      let result;
      if (type === 'image') {
        const uploadRes = await uploadProcessedImage(file, subfolder, (p) => {
          if (onItemProgress) onItemProgress(i, p);
        });
        result = { url: uploadRes.url, type };
      } else {
        const uploadRes = await uploadGenericFile(file, subfolder, (p) => {
          if (onItemProgress) onItemProgress(i, p);
        });
        result = { url: uploadRes.url, type };
      }
      results.push(result);
    } catch (err) {
      console.error(`Failed to upload file ${i}:`, err);
    }
  }

  return results;
}

/**
 * Generic file upload to Cloudinary (supports Video and Files).
 */
export async function uploadGenericFile(
  file: File | Blob,
  subfolder: string = "Archives",
  onProgress?: (progress: number) => void
): Promise<{ url: string; publicId: string }> {
  const config = await getCloudinaryConfig();
  if (!config.cloudName || !config.uploadPreset) {
    throw new Error("Cloudinary credentials missing from /api/config");
  }

  // Determine resource type
  let resourceType = "raw";
  if (file.type.startsWith("video/")) resourceType = "video";
  if (file.type.startsWith("image/")) resourceType = "image";

  const API_URL = `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`;
  const folderPath = subfolder.startsWith("Cheerio/") ? subfolder : `Cheerio/Archives/${subfolder}`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", config.uploadPreset);
  formData.append("folder", folderPath);

  const xhr = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        resolve({ url: response.secure_url, publicId: response.public_id });
      } else {
        reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.open("POST", API_URL);
    xhr.send(formData);
  });
}

/**
 * Profile photo upload.
 */
export const uploadProfilePhoto = uploadProcessedImage;

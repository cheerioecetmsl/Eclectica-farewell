/**
 * Utility to strip Cloudinary transformation parameters from a URL.
 * Cloudinary URLs look like: https://res.cloudinary.com/cloud_name/image/upload/v12345/path/to/image.jpg
 * Transformed: https://res.cloudinary.com/cloud_name/image/upload/w_100,c_fill/v12345/path/to/image.jpg
 * 
 * This function removes any transformation strings between '/upload/' and the version/path.
 */
export function getRawCloudinaryUrl(url: string): string {
  if (!url || !url.includes("res.cloudinary.com")) {
    return url;
  }

  // Look for '/upload/'
  const uploadPart = "/upload/";
  const uploadIndex = url.indexOf(uploadPart);
  
  if (uploadIndex === -1) return url;

  const prefix = url.substring(0, uploadIndex + uploadPart.length);
  const suffix = url.substring(uploadIndex + uploadPart.length);

  // The suffix might start with transformations like 'w_100,c_fill/'
  // We want to skip everything until we hit a version ('v123...') or the filename.
  // Version parts usually look like /v[0-9]+/
  
  // Split the suffix by '/'
  const parts = suffix.split("/");
  
  // Find where the transformations end.
  // Transformations are parts that don't look like versions (v123...) and aren't folders/filenames.
  // However, it's safer to just look for the FIRST part that looks like a version OR skip known transformation keys.
  
  // Cloudinary documentation says the structure is:
  // res.cloudinary.com/<cloud_name>/<resource_type>/<type>/<transformations>/<version>/<public_id>.<format>
  
  let transformationEndIndex = 0;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    // If we find a version part (starts with 'v' followed by digits) or we've reached the end
    if (/^v\d+/.test(part) || i === parts.length - 1) {
      transformationEndIndex = i;
      break;
    }
    // If it's a known transformation key (like w_, h_, c_, q_, f_), we definitely want to skip it.
    // But Cloudinary transformations can be complex.
    // Usually, the first part after 'upload/' that doesn't look like a transformation is the version or public_id.
  }

  // Re-assemble the URL without the transformation parts
  const cleanSuffix = parts.slice(transformationEndIndex).join("/");
  return `${prefix}${cleanSuffix}`;
}

"use client";

import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, setDoc, query, where, limit, orderBy } from "firebase/firestore";
import * as faceapi from "face-api.js";
import { getRawCloudinaryUrl } from "@/lib/cloudinary";
import { getProxiedUrl, getVariantUrl } from "@/lib/imageVariants";

const MODEL_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/";

export interface PulseResult {
  success: boolean;
  count?: number;
  urls?: string[];
  error?: string;
}

export interface PulseProgress {
  percent: number;
  current: number;
  total: number;
  found: number;
  status: string;
}

const loadCrossDomainImage = (url: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const proxiedUrl = getProxiedUrl(url);
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => resolve(img);
  img.onerror = (e) => reject(new Error(`Failed to load image: ${proxiedUrl}`));
  img.src = proxiedUrl;
});

export const runPulseScan = async (
  onProgress?: (progress: PulseProgress) => void, 
  forceAll = true
): Promise<PulseResult> => {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "AUTH_REQUIRED" };

  console.log("[Pulse Engine] Initializing Neural Discovery for User:", user.uid);

  try {
    // 1. Get User Data
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { success: false, error: "USER_MISSING" };
    
    const userData = userSnap.data();
    const lastScanAt = forceAll ? "1970-01-01T00:00:00Z" : (userData.lastScanAt || "1970-01-01T00:00:00Z");
    
    if (!userData.photoURL) return { success: false, error: "PHOTO_MISSING" };

    onProgress?.({ percent: 2, current: 0, total: 0, found: 0, status: "Warming Neural Cores..." });

    // 2. Load Models
    console.log("[Pulse Engine] Loading Neural Weights...");
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    onProgress?.({ percent: 10, current: 0, total: 0, found: 0, status: "Loading Vision Weights..." });
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    onProgress?.({ percent: 15, current: 0, total: 0, found: 0, status: "Loading Landmark Net..." });
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    onProgress?.({ percent: 20, current: 0, total: 0, found: 0, status: "Syncing Recognition Models..." });

    // 3. Get Reference Descriptor
    console.log("[Pulse Engine] Analyzing Profile Portrait:", userData.photoURL);
    let refImg: HTMLImageElement;
    try {
      refImg = await loadCrossDomainImage(userData.photoURL);
    } catch (e) {
      console.warn("[Pulse Engine] Profile picture unavailable. Falling back to native fetch.", e);
      refImg = await faceapi.fetchImage(userData.photoURL);
    }
    const refDetection = await faceapi.detectSingleFace(refImg).withFaceLandmarks().withFaceDescriptor();
    
    if (!refDetection) {
      console.error("[Pulse Engine] Identity Extraction Failed.");
      return { 
        success: false, 
        error: "IDENT_MISSING: Could not extract biometric signature from profile photo. Please ensure your photo is a clear, human-like portrait." 
      };
    }
    
    // STRICTER THRESHOLD: 0.45 for precise identification (Differentiates individuals, not just gender)
    const faceMatcher = new faceapi.FaceMatcher(refDetection, 0.45);
    console.log("[Pulse Engine] Neural Signature Synchronized.");
    onProgress?.({ percent: 25, current: 0, total: 0, found: 0, status: "Neural Signature Active" });

    // 4. Fetch ALL Archive Images from Cloudinary API
    console.log("[Pulse Engine] Accessing Cloudinary Port...");
    
    const response = await fetch('/api/cloudinary/archive');
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(`Cloudinary Error: ${result.error || response.statusText}`);
    }
    
    const archiveImages = result.data;
    
    const validDocs = archiveImages.filter((data: any) => {
      return data.type === "image" && (forceAll || data.createdAt > lastScanAt);
    });
    
    console.log(`[Pulse Engine] Found ${validDocs.length} candidate frames.`);

    if (validDocs.length === 0) {
      await updateDoc(userRef, { lastScanAt: new Date().toISOString() });
      onProgress?.({ percent: 100, current: 0, total: 0, found: 0, status: "Archive Fully Scanned" });
      return { success: true, count: 0 };
    }

    onProgress?.({ percent: 30, current: 0, total: validDocs.length, found: 0, status: "Initializing Archival Scan..." });

    // 5. Scan and Update with DYNAMIC progress
    let matchCount = 0;
    const matchedUrls: string[] = [];
    const totalDocs = validDocs.length;

    for (let i = 0; i < totalDocs; i++) {
      const item = validDocs[i];
      const optimizedUrl = getRawCloudinaryUrl(item.url);
      
      try {
        let img: HTMLImageElement;
        // Optimization: Use the 'preview' variant if baseId exists for faster detection
        const scanUrl = item.baseId 
          ? getVariantUrl(item.baseId, "preview", "webp", "Cheerio/Archives/Images")
          : getRawCloudinaryUrl(item.url);

        try {
          img = await loadCrossDomainImage(scanUrl);
        } catch (e) {
          img = await loadCrossDomainImage(getRawCloudinaryUrl(item.url));
        }

        const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
        const results = detections.map(d => faceMatcher.findBestMatch(d.descriptor));
        const isMe = results.some(r => r.label !== 'unknown' && r.distance < 0.45);

        if (isMe) {
          console.log("[Pulse Engine] MATCH FOUND!");
          const matchId = btoa(item.baseId || item.url).replace(/[^a-zA-Z0-9]/g, "");
          const memoryRef = doc(db, "users", user.uid, "found_memories", matchId);
          await setDoc(memoryRef, {
            ...item,
            detectedAt: new Date().toISOString(),
            isVerified: true
          });
          matchCount++;
          matchedUrls.push(item.url);
        }
      } catch (err: any) {
        console.warn(`[Pulse Engine] Skipped broken/deleted image: ${item.url} (Cloudinary sync delay)`);
      }

      const stepProgress = 30 + ((i + 1) / totalDocs) * 70;
      onProgress?.({ 
        percent: stepProgress, 
        current: i + 1, 
        total: totalDocs, 
        found: matchCount,
        status: `Scanning Memory ${i + 1} of ${totalDocs}...`
      });
    }

    // 6. Update lastScanAt
    await updateDoc(userRef, { lastScanAt: new Date().toISOString() });

    console.log(`[Pulse Engine] Discovery Cycle Complete. ${matchCount} moments reclaimed.`);
    onProgress?.({ percent: 100, current: totalDocs, total: totalDocs, found: matchCount, status: "Discovery Complete" });
    return { success: true, count: matchCount, urls: matchedUrls };
  } catch (err: any) {
    console.error("[Pulse Engine] Critical failure:", err);
    return { success: false, error: err.message || "TECHNICAL_FAILURE" };
  }
};

export const verifyIdentity = async () => {
  const user = auth.currentUser;
  if (!user) return { success: false, error: "AUTH_REQUIRED" };

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { success: false, error: "USER_MISSING" };
    
    const userData = userSnap.data();
    if (!userData.photoURL) return { success: false, error: "PHOTO_MISSING" };

    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);

    // Get Reference Descriptor again for single verification
    let refImg: HTMLImageElement;
    try {
      refImg = await loadCrossDomainImage(userData.photoURL);
    } catch (e) {
      refImg = await faceapi.fetchImage(userData.photoURL);
    }
    const refDetection = await faceapi.detectSingleFace(refImg).withFaceLandmarks().withFaceDescriptor();
    
    if (!refDetection) {
      throw new Error("Could not extract biometric signature from profile photo.");
    }

    return { success: true };
  } catch (err) {
    console.error("[Identity Check] Failed:", err);
    return { success: false, error: "TECHNICAL_FAILURE" };
  }
};

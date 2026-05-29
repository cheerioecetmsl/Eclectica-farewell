"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import {
  Image as ImageIcon, Upload, CheckCircle, X, Loader2,
  Camera, SwitchCamera, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { uploadProcessedImage } from "@/lib/uploadHelper";

export default function ImageUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [strikes, setStrikes] = useState<number>(0);
  const [strikeWarningDismissed, setStrikeWarningDismissed] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUser(user.uid);
      } else {
        setLoadingUser(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const addFiles = (newFiles: File[]) => {
    const imgs = newFiles.filter(f => f.type.startsWith("image/"));
    if (!imgs.length) return;
    setFiles(p => [...p, ...imgs]);
    setPreviews(p => [...p, ...imgs.map(f => URL.createObjectURL(f))]);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = "";
  };

  const removeFile = (i: number) => {
    setFiles(p => p.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, []);

  const openCamera = async (facing = cameraFacing) => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Your browser does not support camera access. Please use Chrome or Safari over HTTPS.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch (err: any) {
      const msg =
        err.name === "NotAllowedError" ? "Camera permission denied. Please allow camera access in your browser/system settings." :
        err.name === "NotFoundError"   ? "No camera found on this device." :
        err.name === "NotReadableError"? "Camera is already in use by another app." :
                                         "Could not start camera. Make sure the page is loaded over HTTPS.";
      setCameraError(msg);
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  };

  const switchCamera = () => {
    const next = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(next);
    closeCamera();
    setTimeout(() => openCamera(next), 150);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    c.toBlob(blob => {
      if (!blob) return;
      addFiles([new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })]);
      closeCamera();
    }, "image/jpeg", 0.92);
  };

  const uploadType = "memory";
  const [userYear, setUserYear] = useState<string>("");
  const [userCategory, setUserCategory] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  const fetchUser = async (uid: string) => {
    try {
      const docRef = doc(db, "users", uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setStrikes(data.strikes || 0);
        setUserYear(data.year || "");
        setUserCategory(data.category || "");
        setUserName(data.name || data.displayName || "");
      }
    } catch (err) {
      console.error("Failed to fetch user data", err);
    } finally {
      setLoadingUser(false);
    }
  };

  const uploadBatchAction = async () => {
    if (!files.length || !auth.currentUser) return;
    
    setUploading(true);
    setUploadedCount(0);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { baseId, url: uploadedUrl } = await uploadProcessedImage(file, "Cheerio/Archives/Images");
        
        await addDoc(collection(db, "archives"), {
          baseId,
          url: uploadedUrl,
          type: "image",
          userId: auth.currentUser!.uid,
          userName: userName || auth.currentUser!.displayName || "Unknown",
          createdAt: new Date().toISOString(),
          tag: "General",
          isEntry: false,
          status: "approved",
          isPublic: true,
        });
        
        setUploadedCount(i + 1);
      }

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        xp: increment(10 * files.length),
        photoCount: increment(files.length),
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (loadingUser) {
    return (
      <main className="w-full flex items-center justify-center min-h-[50vh]">
        <Loader2 size={32} className="animate-spin text-[#2d2d2d]" strokeWidth={3} />
      </main>
    );
  }

  const isBanned = strikes >= 3;
  const showStrikeWarning = (strikes === 1 || strikes === 2) && !strikeWarningDismissed;



  return (
    <div className="max-w-2xl mx-auto py-8">
      {isBanned && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#2d2d2d]/20 backdrop-blur-sm" />
          <div className="relative hand-card bg-white p-8 max-w-md text-center space-y-6 animate-in zoom-in-95">
            <AlertCircle size={48} className="mx-auto text-[#ff4d4d]" strokeWidth={2.5} />
            <h2 className="text-3xl font-bold font-kalam text-[#2d2d2d]">Uploads Disabled</h2>
            <p className="font-patrick text-xl text-[#2d2d2d]/70 leading-relaxed">
              Due to three strikes, you are no longer able to upload images.
            </p>
            <Link href="/dashboard" className="block w-full py-3 bg-[#ffca28] hover:bg-[#ffe066] border-[2px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] text-lg font-bold font-patrick text-[#2d2d2d] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#2d2d2d] active:translate-y-1 active:shadow-none uppercase">
              Return to Dashboard
            </Link>
          </div>
        </div>
      )}

      {showStrikeWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#2d2d2d]/20 backdrop-blur-sm" />
          <div className="relative hand-card bg-[#fff9c4] p-8 max-w-md text-center space-y-6 animate-in zoom-in-95 border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d]">
            <AlertCircle size={48} className="mx-auto text-[#ff8c00]" strokeWidth={2.5} />
            <h2 className="text-3xl font-bold font-kalam text-[#2d2d2d]">Moderator Warning</h2>
            <p className="font-patrick text-xl text-[#2d2d2d]/80 leading-relaxed">
              You have been given strikes by moderators. Please do not engage in such content any more.
            </p>
            <button onClick={() => setStrikeWarningDismissed(true)} className="block w-full py-3 bg-white hover:bg-gray-50 border-[2px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] text-lg font-bold font-patrick text-[#2d2d2d] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#2d2d2d] active:translate-y-1 active:shadow-none uppercase">
              I Understand
            </button>
          </div>
        </div>
      )}

      <div className={`transition-opacity ${isBanned ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* Live camera modal */}
        {cameraOpen && (
          <div className="fixed inset-0 z-[200] bg-[#fdfbf7] flex flex-col">
            <div className="flex-1 w-full bg-black relative border-[4px] border-[#2d2d2d] m-4 rounded-[var(--radius-wobbly)] overflow-hidden shadow-[8px_8px_0_0_#2d2d2d]">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex items-center justify-around p-6 pb-12">
              <button onClick={closeCamera} className="w-14 h-14 rounded-full bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] flex items-center justify-center text-[#ff4d4d] hover:-translate-y-1 transition-all active:translate-y-1 active:shadow-none">
                <X size={28} strokeWidth={3} />
              </button>
              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full bg-[#ffca28] border-[4px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] flex items-center justify-center text-[#2d2d2d] hover:-translate-y-1 transition-all active:translate-y-1 active:shadow-none"
              >
                <Camera size={36} strokeWidth={2.5} />
              </button>
              <button onClick={switchCamera} className="w-14 h-14 rounded-full bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] flex items-center justify-center text-[#2d5da1] hover:-translate-y-1 transition-all active:translate-y-1 active:shadow-none">
                <SwitchCamera size={28} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        <div className="hand-card bg-white p-8 md:p-12 text-center space-y-10 border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ffca28]/20 border-[2px] border-[#ffca28] rounded-full text-[#2d2d2d] font-patrick font-bold text-lg">
              <ImageIcon size={20} strokeWidth={2.5} /> Image Archival
            </div>
            <h1 className="text-5xl font-bold text-[#2d2d2d] font-kalam">Seal Memories.</h1>
            <p className="font-patrick text-xl text-[#2d2d2d]/70">Upload frames to earn +10 Legacy XP per image.</p>

          </div>

          {!success ? (
            <div className="space-y-8">
              {cameraError && (
                <div className="flex items-start gap-3 p-4 rounded-[var(--radius-wobbly)] bg-[#ff4d4d]/10 border-[2px] border-[#ff4d4d] text-left">
                  <AlertCircle size={24} className="text-[#ff4d4d] shrink-0 mt-0.5" strokeWidth={2.5} />
                  <p className="font-patrick text-lg text-[#2d2d2d] font-bold">{cameraError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <label className="group flex flex-col items-center gap-4 p-8 rounded-[var(--radius-wobbly)] border-[3px] border-dashed border-[#2d2d2d]/30 bg-white hover:border-[#2d2d2d] hover:bg-[#fff9c4] transition-all cursor-pointer shadow-[4px_4px_0_0_transparent] hover:shadow-[4px_4px_0_0_#2d2d2d] hover:-translate-y-1">
                  <div className="w-16 h-16 rounded-full bg-[#fdfbf7] border-[2px] border-[#2d2d2d] flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all shadow-[2px_2px_0_0_#2d2d2d]">
                    <ImageIcon size={28} className="text-[#2d5da1]" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xl font-bold font-kalam text-[#2d2d2d]">Choose File</p>
                    <p className="font-patrick text-lg text-[#2d2d2d]/50 mt-1">From Gallery</p>
                  </div>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleInput} />
                </label>

                <button
                  onClick={() => openCamera()}
                  className="group flex flex-col items-center gap-4 p-8 rounded-[var(--radius-wobbly)] border-[3px] border-dashed border-[#2d2d2d]/30 bg-white hover:border-[#2d2d2d] hover:bg-[#fff9c4] transition-all shadow-[4px_4px_0_0_transparent] hover:shadow-[4px_4px_0_0_#2d2d2d] hover:-translate-y-1"
                >
                  <div className="w-16 h-16 rounded-full bg-[#fdfbf7] border-[2px] border-[#2d2d2d] flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all shadow-[2px_2px_0_0_#2d2d2d]">
                    <Camera size={28} className="text-[#ff8c00]" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xl font-bold font-kalam text-[#2d2d2d]">Live Camera</p>
                    <p className="font-patrick text-lg text-[#2d2d2d]/50 mt-1">Snap a memory</p>
                  </div>
                </button>
              </div>

              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`min-h-[120px] rounded-[var(--radius-wobbly)] border-[3px] border-dashed transition-all flex flex-col items-center justify-center gap-3 p-6 ${
                  isDragging ? "border-[#2d5da1] bg-[#2d5da1]/5 scale-[1.02]" : "border-[#2d2d2d]/20 bg-[#fdfbf7]"
                }`}
              >
                <Upload size={32} strokeWidth={2.5} className={isDragging ? "text-[#2d5da1] animate-bounce" : "text-[#2d2d2d]/30"} />
                <p className="font-patrick text-xl font-bold text-[#2d2d2d]/50">
                  {isDragging ? "Release to add" : "Drag & drop photos here"}
                </p>
              </div>

              {previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {previews.map((src, idx) => (
                    <div key={idx} className="relative aspect-square rounded-[var(--radius-wobbly)] overflow-hidden border-[2px] border-[#2d2d2d] bg-white group shadow-[4px_4px_0_0_#2d2d2d]">
                      <img src={src} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
                      <button
                        onClick={() => removeFile(idx)}
                        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-[#ff4d4d] border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] text-white rounded-full z-20 transition-all hover:scale-110 sm:opacity-0 sm:group-hover:opacity-100 opacity-100"
                      >
                        <X size={16} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={uploadBatchAction}
                disabled={!files.length || uploading}
                className="w-full py-5 rounded-[var(--radius-wobbly)] font-kalam font-bold text-2xl border-[3px] border-[#2d2d2d] disabled:opacity-50 flex items-center justify-center gap-3 transition-all bg-[#ffca28] text-[#2d2d2d] hover:bg-[#ffe066] hover:-translate-y-1 shadow-[4px_4px_0_0_#2d2d2d] hover:shadow-[6px_6px_0_0_#2d2d2d] active:translate-y-1 active:shadow-none"
              >
                {uploading ? (
                  <><Loader2 size={28} className="animate-spin" strokeWidth={3} /> Locking {uploadedCount}/{files.length} Memories...</>
                ) : (
                  `Archive ${files.length > 0 ? files.length + " " : ""}Memories`
                )}
              </button>
            </div>
          ) : (
            <div className="py-12 space-y-8 animate-in zoom-in duration-500">
              <div className="w-28 h-28 bg-green-400 rounded-full flex items-center justify-center text-white mx-auto border-[4px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d]">
                <CheckCircle size={64} strokeWidth={3} />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-bold font-kalam text-[#2d2d2d]">Legacy Preserved!</h3>
                <p className="font-patrick text-2xl font-bold text-[#ff8c00]">+{10 * files.length} XP Awarded</p>
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => { setSuccess(false); setPreviews([]); setFiles([]); setUploadedCount(0); }}
                  className="flex-1 py-4 border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] bg-white hover:bg-gray-50 rounded-[var(--radius-wobbly)] font-kalam font-bold text-xl text-[#2d2d2d] transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-none">
                  Add More
                </button>
                <Link href="/dashboard" className="flex-1 py-4 bg-[#ffca28] border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] hover:bg-[#ffe066] rounded-[var(--radius-wobbly)] font-kalam font-bold text-xl text-[#2d2d2d] text-center transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-none">
                  Back to Hub
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

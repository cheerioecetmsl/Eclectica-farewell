"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, increment, collection, addDoc, getDoc } from "firebase/firestore";
import {
  Video as VideoIcon, Upload, CheckCircle, X, Loader2,
  Camera, SwitchCamera, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { uploadGenericFile } from "@/lib/uploadHelper";

export default function VideoUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [strikes, setStrikes] = useState<number | null>(null);
  const [strikeWarningDismissed, setStrikeWarningDismissed] = useState(false);
  const [banned, setBanned] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStrikes = () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const userStrikes = userDoc.data()?.strikes || 0;
              setStrikes(userStrikes);
              if (userStrikes >= 3) {
                setBanned(true);
              }
            }
          } catch (error) {
            console.error("Error fetching user strikes:", error);
          }
        }
        setLoading(false);
      });
      return unsubscribe;
    };

    const unsub = checkStrikes();
    return () => unsub();
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const addFiles = async (newFiles: File[]) => {
    const vids = newFiles.filter(f =>
      f.type.startsWith("video/") || /\.(mp4|mov|webm|mkv|avi|m4v|3gp|ogv)$/i.test(f.name)
    );
    if (!vids.length) return;
    
    for (const file of vids) {
      setFiles(p => [...p, file]);
      setPreviews(p => [...p, URL.createObjectURL(file)]);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = "";
  };

  const removeFile = (i: number) => {
    setFiles(p => p.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }, []);

  const openCamera = async (facing = cameraFacing) => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera not supported. Use Chrome or Firefox over HTTPS.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: true,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setIsRecording(false);
      setRecordingSeconds(0);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      }, 80);
    } catch (err: any) {
      const msg =
        err.name === "NotAllowedError"    ? "Camera/microphone permission denied. Please allow access in your browser settings and try again." :
        err.name === "NotFoundError"       ? "No camera found on this device." :
        err.name === "NotReadableError"    ? "Camera is already in use by another app." :
                                             "Could not access camera. Make sure the page is on HTTPS.";
      setCameraError(msg);
    }
  };

  const closeCamera = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const switchCamera = () => {
    const next = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(next);
    closeCamera();
    setTimeout(() => openCamera(next), 200);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];

    const mimeType = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ].find(t => MediaRecorder.isTypeSupported(t)) || "";

    try {
      const mr = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);

      mr.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blobType = mimeType || "video/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        const ext = blobType.includes("mp4") ? "mp4" : "webm";
        const file = new File([blob], `recording-${Date.now()}.${ext}`, { type: blobType });
        addFiles([file]);
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setCameraOpen(false);
        setIsRecording(false);
      };

      mr.start(250);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch (err) {
      console.error("MediaRecorder error:", err);
      setCameraError("Screen recording is not supported in this browser. Try Chrome or Firefox.");
      closeCamera();
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    setIsRecording(false);
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const uploadBatch = async () => {
    if (!files.length || !auth.currentUser) return;
    setUploading(true);
    setUploadedCount(0);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { url: uploadedUrl } = await uploadGenericFile(file, "Cheerio/Archives/Videos");
        
        await addDoc(collection(db, "archives"), {
          url: uploadedUrl,
          type: "video",
          userId: auth.currentUser!.uid,
          userName: auth.currentUser!.displayName || "Unknown",
          createdAt: new Date().toISOString(),
          tag: "General",
        });
        
        setUploadedCount(i + 1);
      }

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        xp: increment(25 * files.length),
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <main className="w-full flex items-center justify-center min-h-[50vh]">
        <Loader2 size={32} className="animate-spin text-[#2d2d2d]" strokeWidth={3} />
      </main>
    );
  }

  const showStrikeWarning = strikes !== null && (strikes === 1 || strikes === 2) && !strikeWarningDismissed;

  return (
    <div className="max-w-2xl mx-auto py-8">
      {banned && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#2d2d2d]/20 backdrop-blur-sm" />
          <div className="relative hand-card bg-white p-8 max-w-md text-center space-y-6 animate-in zoom-in-95">
            <AlertCircle size={48} className="mx-auto text-[#ff4d4d]" strokeWidth={2.5} />
            <h2 className="text-3xl font-bold font-kalam text-[#2d2d2d]">Uploads Disabled</h2>
            <p className="font-patrick text-xl text-[#2d2d2d]/70 leading-relaxed">
              Your account has accumulated 3 or more strikes due to community guidelines violations. 
              Media upload privileges have been permanently revoked.
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

      <div className={`transition-opacity ${banned ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {cameraOpen && (
          <div className="fixed inset-0 z-[200] bg-[#fdfbf7] flex flex-col">
            <div className="flex-1 w-full bg-black relative border-[4px] border-[#2d2d2d] m-4 rounded-[var(--radius-wobbly)] overflow-hidden shadow-[8px_8px_0_0_#2d2d2d]">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-[#ff4d4d]/90 border-[2px] border-[#2d2d2d] px-4 py-2 rounded-full shadow-[2px_2px_0_0_#2d2d2d]">
                  <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
                  <span className="text-white font-bold font-patrick tracking-widest">{fmt(recordingSeconds)}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-around p-6 pb-12">
              <button onClick={closeCamera} className="w-14 h-14 rounded-full bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] flex items-center justify-center text-[#ff4d4d] hover:-translate-y-1 transition-all active:translate-y-1 active:shadow-none">
                <X size={28} strokeWidth={3} />
              </button>
              
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="w-20 h-20 rounded-full bg-white border-[4px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] flex items-center justify-center hover:-translate-y-1 transition-all active:translate-y-1 active:shadow-none"
                >
                  <span className="w-8 h-8 rounded-full bg-[#ff4d4d] border-[2px] border-[#2d2d2d]" />
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="w-20 h-20 rounded-full bg-[#ffca28] border-[4px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] flex items-center justify-center hover:-translate-y-1 transition-all active:translate-y-1 active:shadow-none"
                >
                  <span className="w-8 h-8 rounded-[4px] bg-[#2d2d2d]" />
                </button>
              )}

              <button onClick={switchCamera} disabled={isRecording} className={`w-14 h-14 rounded-full bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] flex items-center justify-center text-[#2d5da1] transition-all ${isRecording ? 'opacity-50' : 'hover:-translate-y-1 active:translate-y-1 active:shadow-none'}`}>
                <SwitchCamera size={28} strokeWidth={2.5} />
              </button>
            </div>
            
            {!isRecording && (
              <div className="absolute bottom-32 left-1/2 -translate-x-1/2 font-patrick font-bold text-[#2d2d2d] text-center w-full px-4 text-lg">
                Tap the circle to start recording
              </div>
            )}
          </div>
        )}

        <div className="hand-card bg-white p-8 md:p-12 text-center space-y-10 border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ffca28]/20 border-[2px] border-[#ffca28] rounded-full text-[#2d2d2d] font-patrick font-bold text-lg">
              <VideoIcon size={20} strokeWidth={2.5} /> Motion Archival
            </div>
            <h1 className="text-5xl font-bold text-[#2d2d2d] font-kalam">Archive Reels.</h1>
            <p className="font-patrick text-xl text-[#2d2d2d]/70">Upload motion memories to earn +25 Legacy XP per reel.</p>
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
                    <VideoIcon size={28} className="text-[#2d5da1]" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xl font-bold font-kalam text-[#2d2d2d]">Choose File</p>
                    <p className="font-patrick text-lg text-[#2d2d2d]/50 mt-1">From Gallery</p>
                  </div>
                  <input type="file" accept="video/*" multiple className="hidden" onChange={handleInput} />
                </label>

                <button
                  onClick={() => openCamera()}
                  className="group flex flex-col items-center gap-4 p-8 rounded-[var(--radius-wobbly)] border-[3px] border-dashed border-[#2d2d2d]/30 bg-white hover:border-[#2d2d2d] hover:bg-[#fff9c4] transition-all shadow-[4px_4px_0_0_transparent] hover:shadow-[4px_4px_0_0_#2d2d2d] hover:-translate-y-1"
                >
                  <div className="w-16 h-16 rounded-full bg-[#fdfbf7] border-[2px] border-[#2d2d2d] flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all shadow-[2px_2px_0_0_#2d2d2d]">
                    <Camera size={28} className="text-[#ff8c00]" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xl font-bold font-kalam text-[#2d2d2d]">Record Live</p>
                    <p className="font-patrick text-lg text-[#2d2d2d]/50 mt-1">Webcam / Camera</p>
                  </div>
                </button>
              </div>

              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`min-h-[140px] rounded-[var(--radius-wobbly)] border-[3px] border-dashed transition-all flex flex-col items-center justify-center gap-3 p-6 ${
                  isDragging ? "border-[#2d5da1] bg-[#2d5da1]/5 scale-[1.02]" : "border-[#2d2d2d]/20 bg-[#fdfbf7]"
                }`}
              >
                <Upload size={32} strokeWidth={2.5} className={isDragging ? "text-[#2d5da1] animate-bounce" : "text-[#2d2d2d]/30"} />
                <p className="font-patrick text-xl font-bold text-[#2d2d2d]/50">
                  {isDragging ? "Release to add videos" : "Drag & drop video files here"}
                </p>
                <p className="font-patrick text-sm font-bold text-[#2d2d2d]/40 uppercase tracking-wider">
                  MP4 · MOV · WEBM · MKV
                </p>
              </div>

              {previews.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {previews.map((src, idx) => (
                    <div key={idx} className="relative aspect-video rounded-[var(--radius-wobbly)] overflow-hidden border-[2px] border-[#2d2d2d] bg-black group shadow-[4px_4px_0_0_#2d2d2d]">
                      <video src={src} controls className="w-full h-full object-cover" />
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
                onClick={uploadBatch}
                disabled={!files.length || uploading}
                className="w-full py-5 rounded-[var(--radius-wobbly)] font-kalam font-bold text-2xl border-[3px] border-[#2d2d2d] disabled:opacity-50 flex items-center justify-center gap-3 transition-all bg-[#ffca28] text-[#2d2d2d] hover:bg-[#ffe066] hover:-translate-y-1 shadow-[4px_4px_0_0_#2d2d2d] hover:shadow-[6px_6px_0_0_#2d2d2d] active:translate-y-1 active:shadow-none"
              >
                {uploading ? (
                  <><Loader2 size={28} className="animate-spin" strokeWidth={3} /> Locking {uploadedCount}/{files.length} Reels...</>
                ) : (
                  `Archive ${files.length > 0 ? files.length + " " : ""}Reels`
                )}
              </button>
            </div>
          ) : (
            <div className="py-12 space-y-8 animate-in zoom-in duration-500">
              <div className="w-28 h-28 bg-green-400 rounded-full flex items-center justify-center text-white mx-auto border-[4px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d]">
                <CheckCircle size={64} strokeWidth={3} />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-bold font-kalam text-[#2d2d2d]">Motion Preserved!</h3>
                <p className="font-patrick text-2xl font-bold text-[#ff8c00]">+{25 * files.length} XP Awarded</p>
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

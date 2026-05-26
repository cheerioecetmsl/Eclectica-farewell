"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Video, Save, Loader2, CheckCircle, Upload } from "lucide-react";
import { uploadGenericFile } from "@/lib/uploadHelper";

export default function AdminVideoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [desktopVideoUrl, setDesktopVideoUrl] = useState("");
  const [mobileVideoUrl, setMobileVideoUrl] = useState("");
  const [desktopUploading, setDesktopUploading] = useState(false);
  const [mobileUploading, setMobileUploading] = useState(false);
  const [desktopProgress, setDesktopProgress] = useState(0);
  const [mobileProgress, setMobileProgress] = useState(0);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const docRef = doc(db, "config", "landing");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDesktopVideoUrl(data.desktopVideoUrl || "");
          setMobileVideoUrl(data.mobileVideoUrl || "");
        }
      } catch (err) {
        console.error("Failed to fetch video config", err);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "config", "landing"), {
        desktopVideoUrl,
        mobileVideoUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleVideoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    type: 'desktop' | 'mobile'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'desktop') {
      setDesktopUploading(true);
      setDesktopProgress(0);
    } else {
      setMobileUploading(true);
      setMobileProgress(0);
    }

    try {
      const { url } = await uploadGenericFile(file, "Cheerio/Archives/Videos", (p) => {
        if (type === 'desktop') setDesktopProgress(p);
        else setMobileProgress(p);
      });

      if (type === 'desktop') setDesktopVideoUrl(url);
      else setMobileVideoUrl(url);

    } catch (err) {
      console.error("Video upload failed:", err);
      alert("Failed to upload video");
    } finally {
      if (type === 'desktop') setDesktopUploading(false);
      else setMobileUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-[#2d2d2d]" size={48} strokeWidth={3} />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <div className="hand-card-yellow inline-flex items-center gap-2 px-4 py-2 font-patrick font-bold text-[#2d2d2d] text-sm tracking-widest uppercase rotate-2">
          <Video size={16} strokeWidth={2.5} /> Landing Config
        </div>
        <h1 className="text-6xl font-bold font-kalam text-[#2d2d2d] -rotate-1">Login Videos.</h1>
        <p className="font-patrick text-[#2d2d2d]/80 text-xl rotate-1">
          Configure the fullscreen videos that play when a user clicks "Sign the Register" on the landing page.
        </p>
      </div>

      <div className="hand-card bg-white p-8 space-y-10">
        <div className="tack-decoration" />
        
        {/* Desktop Video */}
        <div className="space-y-4 bg-[#fdfbf7] p-6 border-[3px] border-[#2d2d2d] rounded-[var(--radius-wobbly)] shadow-[4px_4px_0_0_#2d2d2d] rotate-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold font-kalam text-[#2d2d2d]">Desktop Video</h2>
              <p className="font-patrick text-lg text-[#2d2d2d]/60">Landscape orientation (16:9)</p>
            </div>
            <label className="hand-button px-4 py-2 bg-[#e8f4f8] text-[#2d2d2d] font-patrick font-bold text-sm tracking-widest uppercase cursor-pointer hover:-translate-y-1 flex items-center gap-2">
              <Upload size={16} strokeWidth={3} /> Upload
              <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => handleVideoUpload(e, 'desktop')} />
            </label>
          </div>
          
          {desktopUploading && (
            <div className="w-full bg-[#2d2d2d]/10 h-4 rounded-full overflow-hidden border-2 border-[#2d2d2d]">
               <div className="h-full bg-[#ff4d4d] transition-all duration-300" style={{ width: `${desktopProgress}%` }} />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-patrick font-bold uppercase tracking-widest text-[#2d2d2d]">Video URL</label>
            <input 
              type="text" 
              value={desktopVideoUrl}
              onChange={(e) => setDesktopVideoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full hand-input p-4 text-xl font-patrick text-[#2d2d2d]"
            />
          </div>

          {desktopVideoUrl && (
            <div className="mt-4 aspect-video bg-black rounded-lg overflow-hidden border-4 border-[#2d2d2d]">
               <video src={desktopVideoUrl} controls className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        {/* Mobile Video */}
        <div className="space-y-4 bg-[#fdfbf7] p-6 border-[3px] border-[#2d2d2d] rounded-[var(--radius-wobbly)] shadow-[4px_4px_0_0_#2d2d2d] -rotate-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold font-kalam text-[#2d2d2d]">Mobile Video</h2>
              <p className="font-patrick text-lg text-[#2d2d2d]/60">Portrait orientation (9:16)</p>
            </div>
            <label className="hand-button px-4 py-2 bg-[#fff9c4] text-[#2d2d2d] font-patrick font-bold text-sm tracking-widest uppercase cursor-pointer hover:-translate-y-1 flex items-center gap-2">
              <Upload size={16} strokeWidth={3} /> Upload
              <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => handleVideoUpload(e, 'mobile')} />
            </label>
          </div>

          {mobileUploading && (
            <div className="w-full bg-[#2d2d2d]/10 h-4 rounded-full overflow-hidden border-2 border-[#2d2d2d]">
               <div className="h-full bg-[#ff4d4d] transition-all duration-300" style={{ width: `${mobileProgress}%` }} />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-patrick font-bold uppercase tracking-widest text-[#2d2d2d]">Video URL</label>
            <input 
              type="text" 
              value={mobileVideoUrl}
              onChange={(e) => setMobileVideoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full hand-input p-4 text-xl font-patrick text-[#2d2d2d]"
            />
          </div>

          {mobileVideoUrl && (
            <div className="mt-4 aspect-[9/16] max-w-[300px] mx-auto bg-black rounded-lg overflow-hidden border-4 border-[#2d2d2d]">
               <video src={mobileVideoUrl} controls className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        <div className="pt-6">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="hand-button w-full py-6 bg-[#ff4d4d] text-white font-bold tracking-widest uppercase text-2xl flex items-center justify-center gap-3 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#2d2d2d] disabled:opacity-50 transition-all rotate-1"
          >
            {saving ? <Loader2 className="animate-spin" size={28} /> : success ? <CheckCircle size={28} /> : <Save size={28} strokeWidth={3} />}
            {saving ? "Saving..." : success ? "Saved!" : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Camera, Check, GraduationCap, Star, User, BookOpen, Hash, FileText, RefreshCw, ArrowRight, Loader2, CheckCircle2, AlertTriangle, X, Compass, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { User as FirebaseUser } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { archiveProfilePhoto } from "@/lib/image-archive";
import { uploadProcessedImage } from "@/lib/uploadHelper";

interface OnboardingFormData {
  name: string;
  year: string;
  section: string;
  photoURL: string;
  photoBaseId: string;
  role: string;
  narrative: string;
  univRollNo: string;
  gender: "Sir" | "Madam" | "";
  category: "STUDENT" | "LEGEND" | "FACULTY";
  tags: string[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [faceStatus, setFaceStatus] = useState<'idle'|'checking'|'face-found'|'no-face'|'error'>('idle');
  const [gmailPhotoURL, setGmailPhotoURL] = useState('');
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const hiddenImgRef = useRef<HTMLImageElement | null>(null);
  const [formData, setFormData] = useState<OnboardingFormData>({
    name: "",
    year: "1st Year",
    section: "A",
    photoURL: "",
    photoBaseId: "",
    role: "",
    narrative: "",
    univRollNo: "",
    gender: "",
    category: "STUDENT",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    e?.preventDefault();
    const trimmed = tagInput.trim();
    if (trimmed && formData.tags.length < 8 && !formData.tags.includes(trimmed)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  // ── Face Detection ─────────────────────────────────────────
  const runFaceDetection = async (url: string) => {
    setFaceStatus('checking');
    try {
      const faceapi = await import('face-api.js');
      if (!faceapi.nets.tinyFaceDetector.isLoaded) {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      }

      // Proxy URL for canvas reading
      const detectionUrl = url.includes('googleusercontent.com')
        ? `/api/img-proxy?url=${encodeURIComponent(url)}`
        : url;

      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = detectionUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload  = () => resolve();
        img.onerror = () => reject(new Error('load failed'));
      });
      hiddenImgRef.current = img;
      const result = await faceapi.detectSingleFace(
        img,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 })
      );
      setFaceStatus(result ? 'face-found' : 'no-face');
    } catch {
      setFaceStatus('error');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setFormData(prev => ({ ...prev, name: u.displayName || '' }));

        const googleProvider = u.providerData.find((p) => p.providerId === 'google.com');
        const gmailPhoto = googleProvider?.photoURL || u.photoURL;

        if (gmailPhoto) {
          setGmailPhotoURL(gmailPhoto);
          setFormData(prev => ({ ...prev, photoURL: gmailPhoto }));
          runFaceDetection(gmailPhoto);
        }
      } else {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (step === 3 && formData.year === "4th Year") {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [step, formData.year]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const { baseId, url } = await uploadProcessedImage(file, "Cheerio/Archives/Images");
      setFormData(prev => ({ ...prev, photoURL: url, photoBaseId: baseId }));
      setGmailPhotoURL(''); 
      runFaceDetection(url);
    } catch (err) {
      console.error(err);
      alert('Photo upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    finalizeOnboarding(true);
  };

  const finalizeOnboarding = async (skipped: boolean) => {
    if (!user) return;
    setLoading(true);
    try {
      const isPending = formData.year === "4th Year" || formData.year === "Faculty";
      
      const { url: archivedPhotoURL, baseId: archivedBaseId } = await archiveProfilePhoto(formData.photoURL);
      const finalBaseId = archivedBaseId || formData.photoBaseId;
      
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        ...formData,
        photoURL: archivedPhotoURL,
        photoBaseId: finalBaseId,
        xp: 0,
        photoCount: 0,
        createdAt: new Date().toISOString(),
        status: isPending ? "pending" : "approved",
        hasSeenTutorial: true, 
      }, { merge: true });
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFacultyOrSenior = formData.year === "4th Year" || formData.year === "Faculty";

  return (
    <main className="bg-[#fdfbf7] min-h-screen flex items-center justify-center p-6 py-24 relative overflow-hidden">
      
      {/* Hand-Drawn Grid Background */}
      <div className="absolute inset-0 pointer-events-none flex justify-center items-center opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2d2d2d" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
        
        <StepIndicator step={step} />

        {step === 1 && (
          <div className="hand-card p-8 md:p-12 bg-white relative rotate-1">
            <div className="tack-decoration" />
            <div className="space-y-4 mb-8">
              <h1 className="text-6xl font-bold font-kalam text-[#2d2d2d] -rotate-2">The Identity Forge</h1>
              <p className="font-patrick text-[#2d2d2d]/80 text-2xl rotate-1">Capture your portrait and sign the registry.</p>
            </div>

            {/* ── Smart Photo Section ── */}
            <div className="flex flex-col items-center gap-6 mb-10">

              {/* Photo circle */}
              <div className="relative w-48 h-48 mx-auto -rotate-2 hover:rotate-1 transition-transform group">
                <div
                  className="w-full h-full rounded-[var(--radius-wobbly)] border-[4px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] overflow-hidden flex items-center justify-center bg-[#fdfbf7]"
                >
                  {formData.photoURL ? (
                    <img 
                      src={formData.photoURL} 
                      alt="Profile"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <Camera size={48} strokeWidth={2.5} className="text-[#2d2d2d]/30" />
                  )}
                </div>

                {/* Status badge */}
                {faceStatus === 'checking' && (
                  <div className="absolute -bottom-4 -right-4 p-3 rounded-full border-2 border-[#2d2d2d] bg-[#fdfbf7] shadow-[2px_2px_0_0_#2d2d2d] rotate-12">
                    <Loader2 size={24} strokeWidth={3} className="text-[#2d2d2d] animate-spin" />
                  </div>
                )}
                {faceStatus === 'face-found' && (
                  <div className="absolute -bottom-4 -right-4 p-3 rounded-full border-2 border-[#2d2d2d] bg-[#8de08a] shadow-[2px_2px_0_0_#2d2d2d] rotate-12">
                    <CheckCircle2 size={24} strokeWidth={3} className="text-[#2d2d2d]" />
                  </div>
                )}
                {faceStatus === 'no-face' && (
                  <div className="absolute -bottom-4 -right-4 p-3 rounded-full border-2 border-[#2d2d2d] bg-[#ff4d4d] shadow-[2px_2px_0_0_#2d2d2d] -rotate-12">
                    <AlertTriangle size={24} strokeWidth={3} className="text-white" />
                  </div>
                )}

                {/* Hidden upload input */}
                <input
                  type="file"
                  onChange={handlePhotoUpload}
                  id="photo-upload-input"
                  className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                  accept="image/*"
                />
              </div>

              {/* ── Contextual Callout ── */}
              <div className="h-24 flex items-center justify-center">
                {faceStatus === 'checking' && (
                  <p className="text-lg font-patrick text-[#2d2d2d]/60 animate-pulse uppercase tracking-widest">Checking your photo...</p>
                )}

                {faceStatus === 'face-found' && (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-xl font-kalam font-bold text-[#2d2d2d]">
                      Your Google photo looks great!
                    </p>
                    <div className="flex gap-4">
                      <button type="button" className="hand-card-yellow px-4 py-2 text-sm font-patrick font-bold uppercase border-2 border-[#2d2d2d] rotate-1 shadow-[2px_2px_0_0_#2d2d2d] flex items-center gap-2">
                        <Check size={16} strokeWidth={3} /> Use this photo
                      </button>
                      <label htmlFor="photo-upload-input" className="bg-white px-4 py-2 text-sm font-patrick font-bold uppercase border-2 border-dashed border-[#2d2d2d]/50 hover:border-[#2d2d2d] -rotate-1 cursor-pointer flex items-center gap-2 transition-colors">
                        <RefreshCw size={16} strokeWidth={2.5} /> Change it
                      </label>
                    </div>
                  </div>
                )}

                {faceStatus === 'no-face' && (
                  <div className="flex flex-col items-center gap-3 bg-[#ffcccb] p-4 border-[3px] border-[#2d2d2d] rounded-[var(--radius-wobbly)] shadow-[4px_4px_0_0_#2d2d2d] -rotate-1">
                    <p className="text-lg font-patrick font-bold text-[#2d2d2d]">
                      <AlertTriangle size={16} className="inline mr-2 -mt-1" /> No face detected. A close-up is recommended!
                    </p>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setFaceStatus('idle')} className="bg-white px-4 py-2 text-sm font-patrick font-bold uppercase border-2 border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] rotate-1">
                        Keep Anyway
                      </button>
                      <label htmlFor="photo-upload-input" className="bg-[#ff4d4d] text-white px-4 py-2 text-sm font-patrick font-bold uppercase border-2 border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] -rotate-1 cursor-pointer flex items-center gap-2 hover:-translate-y-1 transition-transform">
                        <Camera size={16} strokeWidth={3} /> Try New Photo
                      </label>
                    </div>
                  </div>
                )}

                {(faceStatus === 'idle' || faceStatus === 'error') && !formData.photoURL && (
                  <label htmlFor="photo-upload-input" className="bg-[#e8f4f8] text-[#2d2d2d] px-6 py-3 text-lg font-patrick font-bold uppercase border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rotate-2 cursor-pointer flex items-center gap-2 hover:-translate-y-1 transition-transform">
                    <Camera size={20} strokeWidth={3} /> Upload your photo
                  </label>
                )}
                {faceStatus === 'error' && formData.photoURL && (
                  <p className="text-lg font-patrick text-[#2d2d2d]/60 uppercase tracking-widest">Photo loaded. (Face scan bypassed)</p>
                )}
              </div>
            </div>

            <div className="space-y-10 text-left">
              <div className="space-y-4">
                <label className="text-sm font-patrick font-bold uppercase tracking-widest text-[#2d2d2d]">Current Academic Station</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {["1st Year", "2nd Year", "3rd Year", "4th Year", "Faculty"].map(y => (
                    <button 
                      key={y}
                      onClick={() => setFormData({ 
                        ...formData, 
                        year: y,
                        category: y === "4th Year" ? "LEGEND" : y === "Faculty" ? "FACULTY" : "STUDENT"
                      })}
                      className={`p-4 border-[3px] border-[#2d2d2d] rounded-[var(--radius-wobbly)] transition-all font-bold uppercase tracking-tight text-sm font-patrick flex flex-col items-center justify-center gap-2 shadow-[2px_2px_0_0_#2d2d2d] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#2d2d2d] ${
                        formData.year === y ? "bg-[#fff9c4] scale-105" : "bg-white text-[#2d2d2d]/70"
                      }`}
                    >
                      {y === "4th Year" ? <Star size={24} strokeWidth={2.5} className="text-[#ff4d4d]" /> : y === "Faculty" ? <GraduationCap size={24} strokeWidth={2.5} className="text-[#2d5da1]" /> : <User size={24} strokeWidth={2.5} />}
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              {formData.year !== "Faculty" && (
                <div className="space-y-4 animate-in slide-in-from-top-4">
                  <label className="text-sm font-patrick font-bold uppercase tracking-widest text-[#2d2d2d]">Univ Roll No (Mandatory)</label>
                  <div className="relative">
                    <Hash size={24} strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2d2d2d]/40" />
                    <input 
                      type="text"
                      placeholder="e.g. 12345678"
                      value={formData.univRollNo}
                      onChange={(e) => setFormData({ ...formData, univRollNo: e.target.value })}
                      className="w-full hand-input p-4 pl-12 text-2xl font-kalam text-[#2d2d2d]"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="text-sm font-patrick font-bold uppercase tracking-widest text-[#2d2d2d]">Legal Name</label>
                <input 
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full hand-input p-4 text-3xl font-kalam text-[#2d2d2d]"
                />
              </div>

              <button 
                disabled={!formData.name || !formData.photoURL || (formData.year !== "Faculty" && !formData.univRollNo) || loading}
                onClick={() => setStep(2)}
                className="hand-button w-full py-6 bg-[#2d5da1] text-white text-2xl font-bold tracking-widest uppercase disabled:opacity-50 mt-8 rotate-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#2d2d2d]"
              >
                {loading ? <Loader2 className="animate-spin inline mr-2" /> : null}
                {loading ? "Forging..." : "Forge Identity"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="hand-card p-8 md:p-12 bg-white relative -rotate-1">
            <div className="tack-decoration" />
            <div className="space-y-4 mb-10">
              <h1 className="text-6xl font-bold font-kalam text-[#2d2d2d] rotate-2">Station & Legacy</h1>
              <p className="font-patrick text-[#2d2d2d]/80 text-2xl -rotate-1">Refining your archives in the Batch of 2026.</p>
            </div>

            <div className="grid grid-cols-1 gap-10 text-left">

              {formData.year !== "Faculty" && (
                <div className="space-y-4">
                  <label className="text-sm font-patrick font-bold uppercase tracking-widest text-[#2d2d2d]">Assigned Section</label>
                  <div className="flex gap-4">
                    {["A", "B", "C", "D"].map(s => (
                      <button 
                        key={s}
                        onClick={() => setFormData({ ...formData, section: s })}
                        className={`flex-1 p-4 border-[3px] border-[#2d2d2d] rounded-[var(--radius-wobbly)] transition-all font-bold uppercase tracking-widest text-xl font-kalam shadow-[2px_2px_0_0_#2d2d2d] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#2d2d2d] ${
                          formData.section === s ? "bg-[#e8f4f8] scale-105" : "bg-white text-[#2d2d2d]/70"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isFacultyOrSenior && (
                <div className="space-y-8 animate-in slide-in-from-top-4">
                  {formData.year === "4th Year" && (
                    <div className="space-y-4">
                      <label className="text-sm font-patrick font-bold uppercase tracking-widest text-[#2d2d2d] flex items-center gap-2">
                        <BookOpen size={18} strokeWidth={2.5} /> Write something fun about yourself
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Code by day, gamer by night"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full hand-input p-4 text-xl font-patrick text-[#2d2d2d]"
                      />
                    </div>
                  )}
                  {formData.year === "Faculty" && (
                    <div className="space-y-4">
                      <label className="text-sm font-patrick font-bold uppercase tracking-widest text-[#2d2d2d]">Honorific Station</label>
                      <div className="flex gap-4">
                        {["Sir", "Madam"].map((g) => (
                          <button
                            key={g}
                            onClick={() => setFormData({ ...formData, gender: g as "Sir" | "Madam" })}
                            className={`flex-1 p-4 border-[3px] border-[#2d2d2d] rounded-[var(--radius-wobbly)] transition-all font-bold uppercase tracking-widest text-lg font-patrick flex items-center justify-center gap-3 shadow-[2px_2px_0_0_#2d2d2d] ${
                              formData.gender === g ? "bg-[#fff9c4] scale-105" : "bg-white text-[#2d2d2d]/70"
                            }`}
                          >
                            <User size={20} strokeWidth={2.5} /> {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    <label className="text-sm font-patrick font-bold uppercase tracking-widest text-[#2d2d2d] flex items-center gap-2">
                      <FileText size={18} strokeWidth={2.5} /> Brief Narrative
                    </label>
                    <textarea 
                      rows={4}
                      placeholder="A brief legacy note for the archives..."
                      value={formData.narrative}
                      onChange={(e) => setFormData({ ...formData, narrative: e.target.value })}
                      className="w-full hand-input p-4 text-xl font-patrick text-[#2d2d2d] resize-none"
                    />
                  </div>
                  
                  {/* Dynamic Tags */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-sm font-patrick font-bold uppercase tracking-widest text-[#2d2d2d] flex items-center gap-2">
                        <Hash size={18} strokeWidth={2.5} /> Identity Tags (Max 8)
                      </label>
                      <span className="text-[10px] font-bold text-[#2d2d2d]/50 uppercase tracking-widest">{formData.tags.length}/8 Tags</span>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="Favorite anime, food, novel..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        disabled={formData.tags.length >= 8}
                        className="flex-1 hand-input p-4 text-lg font-patrick text-[#2d2d2d] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button 
                        onClick={handleAddTag}
                        type="button"
                        disabled={!tagInput.trim() || formData.tags.length >= 8}
                        className="hand-card-yellow px-6 py-2 border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] font-bold uppercase tracking-widest font-patrick disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 transition-transform rotate-1"
                      >
                        Add
                      </button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {formData.tags.map((tag) => (
                          <div key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-[#e8f4f8] border-[2px] border-[#2d2d2d] rounded-full shadow-[2px_2px_0_0_#2d2d2d] group">
                            <span className="text-sm font-bold font-patrick text-[#2d2d2d]">#{tag}</span>
                            <button 
                              onClick={() => removeTag(tag)}
                              className="text-[#2d2d2d]/40 hover:text-[#ff4d4d] transition-colors"
                            >
                              <X size={14} strokeWidth={3} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            <button 
              disabled={isFacultyOrSenior && (!formData.narrative || (formData.year === "4th Year" && !formData.role) || (formData.year === "Faculty" && !formData.gender))}
              onClick={() => setStep(3)}
              className="hand-button w-full py-6 bg-[#ff4d4d] text-white text-2xl font-bold tracking-widest uppercase disabled:opacity-50 mt-10 rotate-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#2d2d2d]"
            >
              Seal Station
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="hand-card p-12 bg-white relative py-20 text-center rotate-2">
            <div className="tack-decoration" />
            <div className="w-32 h-32 bg-[#8de08a] border-[4px] border-[#2d2d2d] rounded-full flex items-center justify-center text-[#2d2d2d] mx-auto mb-10 shadow-[6px_6px_0_0_#2d2d2d] -rotate-6 animate-pulse">
              <Check size={64} strokeWidth={3} />
            </div>
            <div className="space-y-6 mb-12">
              <h1 className="text-6xl md:text-7xl font-bold font-kalam text-[#2d2d2d] leading-tight">
                {formData.year === "4th Year" ? "A Legend Emerges." : "Identity Verified."}
              </h1>
              <p className="font-patrick text-[#2d2d2d]/80 text-2xl max-w-sm mx-auto">
                {isFacultyOrSenior 
                  ? "Your profile is being processed for the community archives. You may access the dashboard while we verify your legacy."
                  : "The ledger is ready. Your journey with the 2026 batch begins now."}
              </p>
            </div>

            <button
              onClick={handleComplete}
              className="hand-button w-full py-6 bg-[#2d2d2d] text-white text-2xl font-bold tracking-widest uppercase transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.2)] -rotate-1 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" size={28} /> : <Sparkles size={28} strokeWidth={2.5} />}
              {loading ? 'Sealing...' : 'Begin the Journey'}
            </button>
          </div>
        )}

      </div>
    </main>
  );
}

const StepIndicator = ({ step }: { step: number }) => (
  <div className="flex items-center justify-center gap-6 mb-12">
    {[1, 2, 3].map((s) => (
      <div 
        key={s}
        className={`h-3 rounded-[var(--radius-wobbly)] transition-all duration-500 border-2 border-[#2d2d2d] ${
          s <= step ? "bg-[#2d2d2d] w-16" : "bg-transparent border-dashed w-8 opacity-30"
        }`}
      />
    ))}
  </div>
);

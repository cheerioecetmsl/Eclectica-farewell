"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { Camera, Save, User, Mail, GraduationCap, School, CheckCircle, Loader2, Star, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { archiveProfilePhoto } from "@/lib/image-archive";
import { uploadProcessedImage } from "@/lib/uploadHelper";
import { CheerioImage, getDownloadUrl } from "@/lib/imageVariants";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    year: "",
    section: "",
    photoURL: "",
    photoBaseId: "",
    category: "STUDENT",
    narrative: "",
    role: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const docRef = doc(db, "users", u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            name: data.name || u.displayName || "",
            year: data.year || "1st Year",
            section: data.section || "A",
            photoURL: data.photoURL || u.photoURL || "",
            photoBaseId: data.photoBaseId || "",
            category: data.category || "STUDENT",
            narrative: data.narrative || "",
            role: data.role || "",
          });
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      const { baseId, url } = await uploadProcessedImage(file, "Cheerio/Archives/Images");
      setFormData(prev => ({ ...prev, photoURL: url, photoBaseId: baseId }));
    } catch (err) {
      console.error(err);
      alert("Photo upload failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { url: archivedPhotoURL, baseId: archivedBaseId } = await archiveProfilePhoto(formData.photoURL);
      const finalBaseId = archivedBaseId || formData.photoBaseId;

      await updateDoc(doc(db, "users", user.uid), {
        name: formData.name,
        year: formData.year,
        section: formData.section,
        photoURL: archivedPhotoURL,
        photoBaseId: finalBaseId,
        narrative: formData.narrative,
        role: formData.role
      });

      await updateProfile(user, {
        displayName: formData.name,
        photoURL: archivedPhotoURL
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
        <Loader2 className="w-16 h-16 text-[#2d2d2d] animate-spin" strokeWidth={2.5} />
      </div>
    );
  }

  return (
    <main className="min-h-screen py-16 px-6 relative bg-[#fdfbf7]">
      <div className="max-w-3xl mx-auto space-y-12 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-white border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] rounded-full text-[#2d2d2d] text-sm font-bold font-patrick uppercase hover:-translate-y-1 transition-transform mb-6">
            <ArrowLeft size={16} strokeWidth={2.5} /> Return to Hub
          </Link>
          <div className="hand-card bg-white p-10 border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] relative overflow-hidden inline-block w-full rotate-1">
            <div className="tack-decoration" />
            <h1 className="text-5xl md:text-6xl font-bold text-[#2d2d2d] font-kalam uppercase leading-tight -rotate-2">
              Identity Forge
            </h1>
            <p className="text-[#2d2d2d]/80 font-patrick text-2xl mt-4 rotate-1">
              Refine how you are remembered in the archives.
            </p>
          </div>
        </div>

        <div className="hand-card bg-white p-10 border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] relative -rotate-1">
          <form onSubmit={handleSave} className="space-y-12">
            
            {/* Profile Photo Section */}
            <div className="flex flex-col items-center gap-6">
              <div className="relative group w-48 h-48">
                <div className="w-full h-full rounded-full border-[4px] border-[#2d2d2d] overflow-hidden bg-[#e8f4f8] flex items-center justify-center group-hover:border-[#ff8c00] transition-all duration-300 shadow-[4px_4px_0_0_#2d2d2d] hover:-translate-y-2">
                  {formData.photoURL || formData.photoBaseId ? (
                    <CheerioImage 
                      baseId={formData.photoBaseId}
                      fallbackUrl={formData.photoURL}
                      variant="avatar"
                      alt="Profile" 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'placeholder'}`;
                      }}
                    />
                  ) : (
                    <User size={60} className="text-[#2d2d2d]/40" />
                  )}
                  <div className="absolute inset-0 bg-[#2d2d2d]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={40} strokeWidth={2.5} className="text-white" />
                  </div>
                </div>
                <input 
                  type="file" 
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  accept="image/*"
                />
              </div>
              <span className="text-sm font-bold font-patrick text-[#2d2d2d] uppercase tracking-[0.2em] bg-[#ffca28] px-4 py-1 rounded-full border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] rotate-2">Update Portrait</span>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Name */}
              <div className="space-y-3">
                <label className="text-sm font-bold font-patrick text-[#2d2d2d]/60 uppercase tracking-widest flex items-center gap-2">
                  <User size={16} /> Display Name
                </label>
                <input 
                  type="text"
                  required
                  className="w-full hand-input p-4 rounded-[var(--radius-wobbly)] border-[3px] border-[#2d2d2d] text-xl font-patrick text-[#2d2d2d] shadow-[inset_2px_2px_0_0_#2d2d2d] focus:bg-[#ffca28]/10 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-3">
                <label className="text-sm font-bold font-patrick text-[#2d2d2d]/60 uppercase tracking-widest flex items-center gap-2">
                  <Mail size={16} /> Ledger Email
                </label>
                <div className="w-full p-4 rounded-[var(--radius-wobbly)] border-[3px] border-dashed border-[#2d2d2d]/30 text-xl font-patrick text-[#2d2d2d]/60 bg-[#fdfbf7]">
                  {user?.email}
                </div>
              </div>

              {/* Year Selection */}
              {formData.category !== "FACULTY" && (
                <div className="space-y-3">
                  <label className="text-sm font-bold font-patrick text-[#2d2d2d]/60 uppercase tracking-widest flex items-center gap-2">
                    <GraduationCap size={16} /> Academic Year
                  </label>
                  <select 
                    className="w-full hand-input p-4 rounded-[var(--radius-wobbly)] border-[3px] border-[#2d2d2d] text-xl font-patrick text-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] bg-white cursor-pointer"
                    value={formData.year}
                    onChange={e => setFormData({...formData, year: e.target.value})}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year (Legend)</option>
                  </select>
                </div>
              )}

              {/* Section Selection */}
              {formData.category === "STUDENT" && (
                <div className="space-y-3">
                  <label className="text-sm font-bold font-patrick text-[#2d2d2d]/60 uppercase tracking-widest flex items-center gap-2">
                    <School size={16} /> Assigned Section
                  </label>
                  <select 
                    className="w-full hand-input p-4 rounded-[var(--radius-wobbly)] border-[3px] border-[#2d2d2d] text-xl font-patrick text-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] bg-white cursor-pointer"
                    value={formData.section}
                    onChange={e => setFormData({...formData, section: e.target.value})}
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
              )}

              {/* Role/Category Badge */}
              {formData.category !== "STUDENT" && (
                <div className="space-y-3">
                  <label className="text-sm font-bold font-patrick text-[#2d2d2d]/60 uppercase tracking-widest flex items-center gap-2">
                    <Star size={16} /> Archival Status
                  </label>
                  <div className="w-full p-4 rounded-[var(--radius-wobbly)] border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] bg-[#ffca28] text-xl font-bold font-kalam uppercase text-[#2d2d2d]">
                    {formData.category}
                  </div>
                </div>
              )}
            </div>

            {/* Extended Profile Information */}
            <div className="space-y-8 pt-8 border-t-[3px] border-dashed border-[#2d2d2d]/20">
              <div className="space-y-3">
                <label className="text-sm font-bold font-patrick text-[#2d2d2d]/60 uppercase tracking-widest flex items-center gap-2">
                  <Star size={16} className="text-[#ff8c00]" /> Write something fun about yourself
                </label>
                <input 
                  type="text"
                  className="w-full hand-input p-4 rounded-[var(--radius-wobbly)] border-[3px] border-[#2d2d2d] text-xl font-patrick text-[#2d2d2d] shadow-[inset_2px_2px_0_0_#2d2d2d] focus:bg-[#ffca28]/10 outline-none"
                  placeholder="e.g. Code by day, gamer by night"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold font-patrick text-[#2d2d2d]/60 uppercase tracking-widest flex items-center gap-2">
                  <Star size={16} className="text-[#2d5da1]" /> About Brief
                </label>
                <textarea 
                  rows={3}
                  className="w-full hand-input p-4 rounded-[var(--radius-wobbly)] border-[3px] border-[#2d2d2d] text-xl font-patrick text-[#2d2d2d] shadow-[inset_2px_2px_0_0_#2d2d2d] focus:bg-[#ffca28]/10 outline-none resize-none"
                  placeholder="A brief legacy note for the archives..."
                  value={formData.narrative}
                  onChange={e => setFormData({...formData, narrative: e.target.value})}
                />
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-8">
              <button 
                type="submit"
                disabled={saving}
                className="w-full py-5 bg-[#8de08a] hover:bg-[#7ad577] border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] hover:shadow-[6px_6px_0_0_#2d2d2d] text-[#2d2d2d] font-bold font-kalam text-3xl uppercase tracking-wider rounded-[var(--radius-wobbly)] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#2d2d2d] flex items-center justify-center gap-3"
              >
                {saving ? (
                  <><Loader2 size={28} className="animate-spin" /> Forging Identity...</>
                ) : success ? (
                  <><CheckCircle size={28} strokeWidth={3} /> Changes Saved</>
                ) : (
                  <><Save size={28} strokeWidth={2.5} /> Seal Changes</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, CheckCircle2, Circle, Grid, PlusCircle, X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import Link from "next/link";
import { Pagination } from "@/components/Pagination";
import { getRawCloudinaryUrl } from "@/lib/cloudinary";
import { CheerioImage, getDownloadUrl } from "@/lib/imageVariants";

interface ArchivePhoto {
  id: string;
  url: string;
  baseId?: string;
  event?: string;
  createdAt?: string | number | Date;
  uploadedBy?: string;
  isPublic?: boolean;
}

export default function ImageArchive() {
  const [photos, setPhotos] = useState<ArchivePhoto[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const q = query(
          collection(db, "archives"), 
          where("type", "==", "image"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as ArchivePhoto))
          .filter(doc => doc.isPublic !== false);
        setPhotos(docs);
      } catch (err) {
        console.error("Firestore Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  const totalPages = Math.ceil(photos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPhotos = photos.slice(startIndex, startIndex + itemsPerPage);

  const handleNext = useCallback(() => {
    if (viewIndex !== null) {
      setViewIndex((viewIndex + 1) % photos.length);
    }
  }, [viewIndex, photos.length]);

  const handlePrev = useCallback(() => {
    if (viewIndex !== null) {
      setViewIndex((viewIndex - 1 + photos.length) % photos.length);
    }
  }, [viewIndex, photos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewIndex === null) return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") setViewIndex(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewIndex, handleNext, handlePrev]);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const downloadAsZip = async () => {
    if (selected.length === 0) return;
    setDownloadingAll(true);
    const zip = new JSZip();
    const folder = zip.folder("Farewell-Memories");

    try {
      for (let i = 0; i < selected.length; i++) {
        const photo = photos.find(p => p.id === selected[i]);
        if (!photo) continue;
        
        const downloadUrl = (photo.url?.startsWith('http') ? photo.url : null) || 
                          (photo.baseId ? getDownloadUrl(photo.baseId) : photo.url);
          
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const filename = `${photo.event || 'memory'}-${photo.id}.jpg`;
        folder?.file(filename, blob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "Farewell-Memories.zip");
    } catch (err) {
      console.error(err);
      alert("Failed to create archive. Some images might be restricted.");
    } finally {
      setDownloadingAll(false);
      setSelected([]);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center font-kalam text-3xl font-bold text-[#2d2d2d] animate-pulse">
      Opening the scrapbook...
    </div>
  );

  const currentPhoto = viewIndex !== null ? photos[viewIndex] : null;

  return (
    <main className="py-8">
      <div className="space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 hand-card bg-[#fff9c4] p-8 border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl" />
          
          <div className="space-y-4 relative z-10">
            <span className="inline-block px-3 py-1 border-[2px] border-[#2d2d2d] rounded-full text-[#2d2d2d] text-xs font-bold font-patrick uppercase bg-white">
              The Scrapbook
            </span>
            <h1 className="text-5xl font-bold text-[#2d2d2d] font-kalam">Image Legacy</h1>
            <p className="text-[#2d2d2d]/70 font-patrick text-xl">Preserving every frame of our story.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 relative z-10">
            {selected.length > 0 && (
              <button 
                onClick={downloadAsZip}
                disabled={downloadingAll}
                className="px-6 py-3 bg-[#2d5da1] hover:bg-[#1a4480] text-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] flex items-center gap-2 text-sm font-bold font-patrick uppercase transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-none"
              >
                <Download size={20} strokeWidth={2.5} />
                {downloadingAll ? "Archiving..." : `Download Zip (${selected.length})`}
              </button>
            )}
            <Link 
              href="/dashboard/upload/image"
              className="p-4 bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] text-[#2d2d2d] hover:-translate-y-1 transition-all active:translate-y-1 active:shadow-none hover:bg-gray-50 flex items-center justify-center"
              title="Upload New Memory"
            >
              <PlusCircle size={28} strokeWidth={2.5} />
            </Link>
          </div>
        </div>

        {/* Gallery Grid or Empty State */}
        {photos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {paginatedPhotos.map((photo, index) => {
                const actualIndex = startIndex + index;
                const isSelected = selected.includes(photo.id);
                return (
                  <div 
                    key={photo.id}
                    onClick={() => setViewIndex(actualIndex)}
                    className={`relative aspect-[4/5] rounded-[var(--radius-wobbly)] overflow-hidden cursor-pointer group border-[3px] border-[#2d2d2d] transition-all bg-white
                      ${isSelected ? 'shadow-none translate-y-1 scale-[0.98]' : 'shadow-[6px_6px_0_0_#2d2d2d] hover:shadow-[8px_8px_0_0_#2d2d2d] hover:-translate-y-1 hover:-translate-x-1'}
                    `}
                  >
                    <CheerioImage 
                      baseId={photo.baseId}
                      fallbackUrl={photo.url}
                      variant="gallery"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      alt={photo.event || "Memory"}
                    />
                    
                    {/* Overlay */}
                    <div className={`absolute inset-0 bg-[#fff9c4]/20 transition-opacity duration-300 ${
                      isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    } flex items-center justify-center`}>
                      <Maximize2 size={40} className="text-[#2d2d2d] drop-shadow-md opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100" strokeWidth={3} />
                    </div>

                    {/* Selection Icon */}
                    <div 
                      className="absolute top-4 right-4 z-10"
                      onClick={(e) => toggleSelect(photo.id, e)}
                    >
                      {isSelected ? (
                        <div className="w-8 h-8 rounded-full bg-[#ffca28] border-[2px] border-[#2d2d2d] flex items-center justify-center">
                          <CheckCircle2 className="text-[#2d2d2d]" size={20} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/50 border-[2px] border-[#2d2d2d] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white">
                          <Circle className="text-[#2d2d2d]" size={20} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* Tag/Metadata */}
                    <div className="absolute bottom-4 left-4">
                      <span className="text-xs font-bold text-[#2d2d2d] bg-white border-[2px] border-[#2d2d2d] px-3 py-1 rounded-[var(--radius-wobbly)] uppercase tracking-widest font-patrick shadow-[2px_2px_0_0_#2d2d2d]">
                        {photo.event || "General"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 flex justify-center">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 hand-card bg-white border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)]">
            <div className="w-24 h-24 rounded-full bg-[#fdfbf7] flex items-center justify-center border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d]">
              <Grid size={48} className="text-[#2d2d2d]/40" strokeWidth={2.5} />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-bold font-kalam text-[#2d2d2d] uppercase">The Vault is Empty</h2>
              <p className="text-[#2d2d2d]/60 font-patrick text-xl max-w-md mx-auto">No memories have been pinned yet. Be the first to add a frame to the scrapbook.</p>
            </div>
            <Link 
              href="/dashboard/upload/image"
              className="px-8 py-4 bg-[#ffca28] hover:bg-[#ffe066] border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] flex items-center gap-3 text-lg font-bold font-kalam transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#2d2d2d] active:translate-y-1 active:shadow-none text-[#2d2d2d]"
            >
              <PlusCircle size={24} strokeWidth={2.5} />
              Begin the Archive (+10 XP)
            </Link>
          </div>
        )}
      </div>

      {/* Media Viewer Overlay */}
      {currentPhoto && (
        <div 
          className="fixed inset-0 z-[200] flex flex-col bg-[#fdfbf7]/95 backdrop-blur-sm cursor-default"
          onClick={() => setViewIndex(null)}
        >
          <div className="absolute top-0 inset-x-0 z-[210] flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] flex items-center justify-center text-[#2d2d2d]">
                <Maximize2 size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-[#2d2d2d] font-bold font-kalam uppercase text-xl">{currentPhoto.event || "Memory"}</h2>
                <p className="text-[#2d2d2d]/60 text-sm font-bold font-patrick uppercase">Frame {viewIndex! + 1} of {photos.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href={getRawCloudinaryUrl(currentPhoto.url)} 
                download
                onClick={(e) => e.stopPropagation()}
                className="w-12 h-12 bg-white hover:bg-[#ffca28] border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] flex items-center justify-center transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-none text-[#2d2d2d]"
              >
                <Download size={24} strokeWidth={2.5} />
              </a>
              <button 
                onClick={(e) => { e.stopPropagation(); setViewIndex(null); }}
                className="w-12 h-12 bg-white hover:bg-[#ff4d4d] hover:text-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] flex items-center justify-center transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-none text-[#2d2d2d]"
              >
                <X size={28} strokeWidth={3} />
              </button>
            </div>
          </div>

          <div className="flex-grow flex items-center justify-center relative p-8 md:p-24 overflow-hidden">
            <button 
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-4 md:left-8 z-[210] w-14 h-14 bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-full flex items-center justify-center text-[#2d2d2d] hover:-translate-y-1 hover:bg-[#fff9c4] transition-all active:translate-y-1 active:shadow-none"
              aria-label="Previous image"
            >
              <ChevronLeft size={32} strokeWidth={2.5} />
            </button>

            <div className="relative w-full h-full max-w-5xl flex items-center justify-center">
              <div className="w-fit h-fit max-w-full max-h-full bg-white p-4 border-[4px] border-[#2d2d2d] shadow-[12px_12px_0_0_#2d2d2d] rounded-sm transform rotate-[-1deg]">
                <CheerioImage 
                  baseId={currentPhoto.baseId}
                  fallbackUrl={currentPhoto.url}
                  variant="preview"
                  className="max-w-full max-h-[70vh] object-contain pointer-events-none"
                  alt={currentPhoto.event || "Large View"}
                />
              </div>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-4 md:right-8 z-[210] w-14 h-14 bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-full flex items-center justify-center text-[#2d2d2d] hover:-translate-y-1 hover:bg-[#fff9c4] transition-all active:translate-y-1 active:shadow-none"
              aria-label="Next image"
            >
              <ChevronRight size={32} strokeWidth={2.5} />
            </button>
          </div>


        </div>
      )}
    </main>
  );
}

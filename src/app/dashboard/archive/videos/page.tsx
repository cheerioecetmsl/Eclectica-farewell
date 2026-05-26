"use client";

import { useState, useEffect, useCallback } from "react";
import { Video, Play, Download, UploadCloud, Film, X, Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { Pagination } from "@/components/Pagination";

interface ArchiveVideo {
  id: string;
  url: string;
  thumbnail?: string;
  title: string;
  event?: string;
  duration?: string;
  uploadedBy?: string;
  createdAt?: string | number | Date;
}

export default function VideoArchive() {
  const [videos, setVideos] = useState<ArchiveVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const q = query(
          collection(db, "archives"), 
          where("type", "==", "video"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArchiveVideo));
        setVideos(docs);
      } catch (err) {
        console.error("Firestore Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const totalPages = Math.ceil(videos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVideos = videos.slice(startIndex, startIndex + itemsPerPage);

  const handleNext = useCallback(() => {
    if (viewIndex !== null) {
      setViewIndex((viewIndex + 1) % videos.length);
    }
  }, [viewIndex, videos.length]);

  const handlePrev = useCallback(() => {
    if (viewIndex !== null) {
      setViewIndex((viewIndex - 1 + videos.length) % videos.length);
    }
  }, [viewIndex, videos.length]);

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

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center font-kalam text-3xl font-bold text-[#2d2d2d] animate-pulse">
      Consulting the reel...
    </div>
  );

  const currentVideo = viewIndex !== null ? videos[viewIndex] : null;

  return (
    <main className="py-8">
      <div className="space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 hand-card bg-[#fff9c4] p-8 border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl" />
          
          <div className="space-y-4 relative z-10">
            <span className="inline-block px-3 py-1 border-[2px] border-[#2d2d2d] rounded-full text-[#2d2d2d] text-xs font-bold font-patrick uppercase bg-white shadow-[2px_2px_0_0_#2d2d2d]">
              The Archive
            </span>
            <h1 className="text-5xl font-bold text-[#2d2d2d] font-kalam">Motion Legacy</h1>
            <p className="text-[#2d2d2d]/70 font-patrick text-xl">Cinematic captures of our shared timeline.</p>
          </div>
          
          <Link 
            href="/dashboard/upload/video"
            className="px-6 py-4 bg-[#ffca28] hover:bg-[#ffe066] text-[#2d2d2d] border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] flex items-center gap-3 text-sm font-bold font-patrick uppercase transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#2d2d2d] active:translate-y-1 active:shadow-none relative z-10"
          >
            <UploadCloud size={20} strokeWidth={2.5} />
            Add New Reel (+25 XP)
          </Link>
        </div>

        {/* Video Grid or Empty State */}
        {videos.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedVideos.map((video, index) => {
                const actualIndex = startIndex + index;
                return (
                  <div key={video.id} className="hand-card bg-white rounded-[var(--radius-wobbly)] border-[3px] border-[#2d2d2d] overflow-hidden group shadow-[6px_6px_0_0_#2d2d2d] hover:shadow-[8px_8px_0_0_#2d2d2d] hover:-translate-y-1 hover:-translate-x-1 transition-all flex flex-col">
                    <div className="relative aspect-video cursor-pointer border-b-[3px] border-[#2d2d2d]" onClick={() => setViewIndex(actualIndex)}>
                      <img 
                        src={video.thumbnail || video.url.replace('.mp4', '.jpg')} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        alt={`Thumbnail for ${video.title || 'Video'}`} 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/640x360.png?text=Video';
                        }}
                      />
                      <div className="absolute inset-0 bg-[#fff9c4]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="w-16 h-16 rounded-full bg-[#ffca28] border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] flex items-center justify-center scale-75 group-hover:scale-100 transition-transform">
                          <Play size={28} className="text-[#2d2d2d] ml-1" strokeWidth={3} fill="currentColor" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-white border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] text-[#2d2d2d] text-xs px-2 py-1 rounded-[var(--radius-wobbly)] font-bold font-patrick tracking-widest">
                        {video.duration || "HD"}
                      </div>
                    </div>
                    <div className="p-6 flex items-center justify-between mt-auto bg-[#fdfbf7]">
                      <div>
                        <h3 className="font-bold font-kalam text-[#2d2d2d] text-xl truncate max-w-[180px]">{video.title || "Untitled Reel"}</h3>
                        <p className="text-xs text-[#2d2d2d]/60 font-bold font-patrick uppercase tracking-widest mt-1">
                          {video.event || "Archival Reel"} | {video.uploadedBy || "Archivist"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setViewIndex(actualIndex)}
                          className="w-10 h-10 bg-white border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] hover:bg-[#fff9c4] rounded-full flex items-center justify-center transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-none"
                          title="Play Video"
                        >
                          <Maximize2 size={18} className="text-[#2d2d2d]" strokeWidth={2.5} />
                        </button>
                        <a 
                          href={video.url} 
                          download 
                          target="_blank"
                          className="w-10 h-10 bg-white border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] hover:bg-[#fff9c4] rounded-full flex items-center justify-center transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-none"
                        >
                          <Download size={18} className="text-[#2d2d2d]" strokeWidth={2.5} />
                        </a>
                      </div>
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
              <Film size={48} className="text-[#2d2d2d]/40" strokeWidth={2.5} />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-bold font-kalam text-[#2d2d2d] uppercase">The Reels are Silent</h2>
              <p className="text-[#2d2d2d]/60 font-patrick text-xl max-w-md mx-auto">No cinematic memories have been recorded yet. Lead the production of the scrapbook.</p>
            </div>
            <Link 
              href="/dashboard/upload/video"
              className="px-8 py-4 bg-[#ffca28] hover:bg-[#ffe066] border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] flex items-center gap-3 text-lg font-bold font-kalam transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#2d2d2d] active:translate-y-1 active:shadow-none text-[#2d2d2d]"
            >
              <UploadCloud size={24} strokeWidth={2.5} />
              Drop the First Reel (+25 XP)
            </Link>
          </div>
        )}

      </div>

      {/* Immersive Video Player Overlay */}
      {currentVideo && (
        <div 
          className="fixed inset-0 z-[200] flex flex-col bg-[#fdfbf7]/95 backdrop-blur-sm cursor-default"
          onClick={() => setViewIndex(null)}
        >
          <div className="absolute top-0 inset-x-0 z-[210] flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#ffca28] border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] flex items-center justify-center text-[#2d2d2d]">
                <Film size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-[#2d2d2d] font-bold font-kalam uppercase text-xl">{currentVideo.title || "Untitled Reel"}</h2>
                <p className="text-[#2d2d2d]/60 text-sm font-bold font-patrick uppercase">Reel {viewIndex! + 1} of {videos.length} | {currentVideo.event || "Archive"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href={currentVideo.url} 
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
              aria-label="Previous video"
            >
              <ChevronLeft size={32} strokeWidth={2.5} />
            </button>

            <div 
              className="relative w-full max-w-5xl aspect-video bg-black rounded-[var(--radius-wobbly)] border-[4px] border-[#2d2d2d] shadow-[12px_12px_0_0_#2d2d2d] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <video 
                src={currentVideo.url}
                controls
                autoPlay
                className="w-full h-full outline-none"
                poster={currentVideo.thumbnail || currentVideo.url.replace('.mp4', '.jpg')}
              />
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-4 md:right-8 z-[210] w-14 h-14 bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-full flex items-center justify-center text-[#2d2d2d] hover:-translate-y-1 hover:bg-[#fff9c4] transition-all active:translate-y-1 active:shadow-none"
              aria-label="Next video"
            >
              <ChevronRight size={32} strokeWidth={2.5} />
            </button>
          </div>

          <div className="absolute bottom-0 inset-x-0 p-8 text-center bg-white border-t-[3px] border-[#2d2d2d]">
            <div className="flex flex-col items-center gap-2">
              <p className="text-[#2d2d2d] text-sm font-bold font-patrick uppercase tracking-widest">Motion Protocol Active</p>
              <p className="text-[#2d2d2d]/50 text-xs font-bold font-kalam uppercase italic">Captured by {currentVideo.uploadedBy || "Archivist"}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

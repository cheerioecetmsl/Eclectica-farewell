'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, BookOpen, Sparkles, Heart, Award } from 'lucide-react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  doc
} from 'firebase/firestore';

interface PhotoMemory {
  url: string;
  title: string;
  caption: string;
}

interface HeroCollageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: string;
  stats?: { value: string; label: string }[];
}

// Hand-Drawn interactive scrapbook styles
const handDrawnStyles = `
  .scrapbook-perspective {
    perspective: 2500px;
    perspective-origin: 50% 50%;
  }
  
  .scrapbook-container {
    transform-style: preserve-3d;
    position: relative;
    transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 12px 12px 0px #2d2d2d;
  }
  
  .scrapbook-container:hover {
    transform: rotateX(1deg) translateY(-4px);
  }
  
  .sheet-3d {
    transform-style: preserve-3d;
    position: absolute;
    right: 0;
    top: 0;
    width: 50%;
    height: 100%;
    transform-origin: left center;
    transition: transform 0.9s cubic-bezier(0.645, 0.045, 0.355, 1);
    will-change: transform;
  }
  
  .sheet-face {
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at 30% 30%, #ffffff 0%, #fbfbf9 100%);
    border: 3px solid #2d2d2d;
  }
  
  .sheet-face-left {
    clip-path: url(#deckled-left);
    border-radius: 25px 0 0 25px / 12px 0 0 12px;
    border-right-width: 1.5px;
  }
  
  .sheet-face-right {
    clip-path: url(#deckled-right);
    border-radius: 0 25px 25px 0 / 0 12px 12px 0;
    border-left-width: 1.5px;
  }
  
  .sheet-face-back {
    transform: rotateY(180deg);
  }
  
  .spine-shadow-left {
    background: linear-gradient(to left, rgba(45, 45, 45, 0.25) 0%, rgba(45, 45, 45, 0.0) 100%);
  }
  
  .spine-shadow-right {
    background: linear-gradient(to right, rgba(45, 45, 45, 0.25) 0%, rgba(45, 45, 45, 0.0) 100%);
  }

  /* Paper texture overlay */
  .paper-grain::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0.06;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    pointer-events: none;
    mix-blend-mode: multiply;
  }

  /* Sweeping shadow that passes over sheets during page turns */
  .flip-shadow {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 50;
    background: linear-gradient(to right, rgba(45,45,45,0) 0%, rgba(45,45,45,0.2) 50%, rgba(45,45,45,0) 100%);
    opacity: 0;
    transition: opacity 0.9s ease;
  }
  
  .is-turning .flip-shadow {
    opacity: 1;
  }

  /* Hand-Drawn Cardboard book cover styling */
  .cardboard-cover {
    background-color: #d5cfc4;
    border: 3.5px solid #2d2d2d;
    box-shadow: inset 0 0 30px rgba(45, 45, 45, 0.08);
    position: absolute;
    inset: -14px -16px -14px -16px;
    border-radius: 20px 8px 12px 20px / 12px 20px 20px 8px;
    z-index: 0;
  }

  /* Double pencil borders for visual flavor */
  .sketchy-border {
    position: absolute;
    inset: 6px;
    border: 2px dashed rgba(45, 45, 45, 0.35);
    border-radius: 12px;
    pointer-events: none;
  }
  
  .sketchy-border-inner {
    position: absolute;
    inset: 12px;
    border: 1px solid rgba(45, 45, 45, 0.15);
    border-radius: 8px;
    pointer-events: none;
  }
`;

const HeroCollage = React.forwardRef<HTMLDivElement, HeroCollageProps>(
  ({ className, title, subtitle, stats: customStats, ...props }, ref) => {
    const [images, setImages] = useState<PhotoMemory[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0); // Index representing the active sheets turned
    const [isFlipping, setIsFlipping] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Mobile specific deck indices
    const [mobileIndex, setMobileIndex] = useState(0);
    const [mobileFlipState, setMobileFlipState] = useState(false);

    // Statistics state from Firestore
    const [stats, setStats] = useState([
      { value: 'Class of 2026', label: 'Graduating Batch' },
      { value: '4 Years', label: 'Of Nostalgic Memories' },
      { value: '150+', label: 'Lifelong Friends' },
    ]);

    // Cover settings state from Firestore
    const [coverSettings, setCoverSettings] = useState({
      coverTitle: 'Eclectica Farewell',
      coverDesc: 'A handwritten scrapbook of the moments that shaped our journey, the classroom laughter, and friendships that will last forever.',
      coverClass: 'Established Class of 2026'
    });

    // 1. Fetch dynamic stats and cover settings from settings doc
    useEffect(() => {
      const unsubStats = onSnapshot(doc(db, 'settings', 'album'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.stats && Array.isArray(data.stats)) {
            setStats(data.stats);
          }
          setCoverSettings({
            coverTitle: data.coverTitle || 'Eclectica Farewell',
            coverDesc: data.coverDesc || 'A handwritten scrapbook of the moments that shaped our journey, the classroom laughter, and friendships that will last forever.',
            coverClass: data.coverClass || 'Class of 2026'
          });
        }
      });

      return () => unsubStats();
    }, []);

    // 2. Fetch farewell images in real-time from Firestore partitioned by batch year
    useEffect(() => {
      const sanitizedBatch = coverSettings.coverClass.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'class_of_2026';
      const collectionName = `memories_${sanitizedBatch}`;
      const q = query(collection(db, collectionName), orderBy('createdAt', 'asc'));
      
      const unsubMemories = onSnapshot(q, (snapshot) => {
        const list: PhotoMemory[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            url: data.url,
            title: data.title || 'Campus Moment',
            caption: data.caption || 'A beautiful campus moment.',
          });
        });

        setImages(list);
        setLoading(false);
      }, (err) => {
        console.error('Firestore memories fetch error:', err);
        setLoading(false);
      });

      return () => unsubMemories();
    }, [coverSettings.coverClass]);

    // Width detection
    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Total book sheets
    const totalSheets = Math.max(1, Math.ceil(images.length / 2));

    // Handle turns
    const handleNextPage = () => {
      if (isFlipping || images.length === 0) return;
      if (currentPage >= totalSheets) {
        // Return to cover
        setIsFlipping(true);
        setTimeout(() => {
          setCurrentPage(0);
          setIsFlipping(false);
        }, 900);
        return;
      }

      setIsFlipping(true);
      setCurrentPage((prev) => prev + 1);
      setTimeout(() => {
        setIsFlipping(false);
      }, 900);
    };

    const handlePrevPage = () => {
      if (isFlipping || currentPage === 0 || images.length === 0) return;

      setIsFlipping(true);
      setCurrentPage((prev) => prev - 1);
      setTimeout(() => {
        setIsFlipping(false);
      }, 900);
    };

    // Mobile turns
    const handleMobileNext = () => {
      if (mobileFlipState || images.length === 0) return;
      setMobileFlipState(true);
      setTimeout(() => {
        setMobileIndex((prev) => (prev + 1) % images.length);
        setMobileFlipState(false);
      }, 450);
    };

    const handleMobilePrev = () => {
      if (mobileFlipState || images.length === 0) return;
      setMobileFlipState(true);
      setTimeout(() => {
        setMobileIndex((prev) => (prev - 1 + images.length) % images.length);
        setMobileFlipState(false);
      }, 450);
    };

    // Respect custom prop override, otherwise use firestore state
    const displayStats = customStats || stats;

    return (
      <>
        <style>{handDrawnStyles}</style>

        {/* Embedded SVG for organic hand-drawn wobbly page clipping */}
        <svg width="0" height="0" className="absolute pointer-events-none">
          <defs>
            {/* Left deckled wobbly clipping (rougher handmade card boundary) */}
            <clipPath id="deckled-left" clipPathUnits="objectBoundingBox">
              <path d="M 1,0.01 
                       C 0.80,0.015 0.65,0.005 0.48,0.012 C 0.31,0.005 0.15,0.018 0.05,0.01 
                       C 0.025,0.04 0.048,0.09 0.020,0.13 C 0.038,0.18 0.015,0.23 0.032,0.28 
                       C 0.015,0.33 0.045,0.38 0.025,0.43 C 0.038,0.48 0.018,0.53 0.030,0.58 
                       C 0.012,0.63 0.048,0.68 0.022,0.73 C 0.038,0.78 0.015,0.83 0.032,0.88 
                       C 0.012,0.93 0.045,0.96 0.048,0.99
                       C 0.15,0.985 0.31,0.995 0.48,0.982 C 0.65,0.995 0.80,0.985 1,0.99 
                       Z" />
            </clipPath>
            {/* Right deckled wobbly clipping (straight spine on left, rough on top, right, bottom) */}
            <clipPath id="deckled-right" clipPathUnits="objectBoundingBox">
              <path d="M 0,0.01 
                       C 0.20,0.015 0.35,0.005 0.52,0.012 C 0.69,0.005 0.85,0.018 0.95,0.01 
                       C 0.975,0.04 0.952,0.09 0.980,0.13 C 0.962,0.18 0.985,0.23 0.968,0.28 
                       C 0.985,0.33 0.955,0.38 0.975,0.43 C 0.962,0.48 0.982,0.53 0.970,0.58 
                       C 0.988,0.63 0.952,0.68 0.978,0.73 C 0.962,0.78 0.985,0.83 0.968,0.88 
                       C 0.988,0.93 0.955,0.96 0.952,0.99
                       C 0.85,0.985 0.69,0.995 0.52,0.982 C 0.35,0.995 0.20,0.985 0,0.99 
                       Z" />
            </clipPath>
          </defs>
        </svg>

        <section
          ref={ref}
          className={cn(
            'relative w-full bg-[#fdfbf7] text-[#2d2d2d] font-patrick pt-28 pb-12 md:py-16 overflow-hidden',
            className
          )}
          {...props}
        >
          {/* Ambient sketched background accent doodles */}
          <div className="absolute top-10 left-10 w-24 h-24 border-2 border-dashed border-[#2d2d2d]/10 rounded-full animate-jiggle pointer-events-none z-0" />
          <div className="absolute bottom-10 right-10 w-32 h-32 border-2 border-dashed border-[#2d2d2d]/10 radius-wobbly pointer-events-none z-0" />

          {/* Heading */}
          <div className="container relative z-10 mx-auto px-6 text-center max-w-4xl">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 border-[3px] border-[#2d2d2d] radius-wobbly bg-[#fff9c4] shadow-hard text-stone-850 text-md font-bold tracking-wider font-kalam uppercase mb-6 animate-pulse">
              <Sparkles className="w-4 h-4 text-[#2d5da1]" strokeWidth={2.5} />
              Nostalgic Album
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6.5xl font-extrabold tracking-tight text-[#2d2d2d] leading-none font-kalam">
              {title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg md:text-xl text-[#2d2d2d]/85 font-patrick leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Album Section */}
          <div className="relative z-10 mt-10 md:mt-12 w-full max-w-6xl mx-auto px-4 flex flex-col items-center justify-center min-h-[500px]">
            {loading ? (
              // Hand-Drawn Retro Loader
              <div className="flex flex-col items-center justify-center gap-4 py-16 bg-white border-[3px] border-[#2d2d2d] radius-wobbly p-10 shadow-hard max-w-md w-full">
                <div className="relative w-12 h-16 border-[3px] border-[#2d5da1] border-t-transparent radius-wobbly animate-spin flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#2d5da1] animate-pulse" strokeWidth={2.5} />
                </div>
                <p className="text-[#2d2d2d] font-kalam font-bold text-lg tracking-wide animate-pulse">Skitching memory layers...</p>
              </div>
            ) : images.length === 0 ? (
              // Empty State
              <div className="text-center bg-white border-[3px] border-[#2d2d2d] radius-wobbly p-12 shadow-hard max-w-lg">
                <BookOpen className="w-16 h-16 mx-auto text-[#2d2d2d]/30 mb-4 animate-bounce" strokeWidth={2.5} />
                <p className="text-[#2d2d2d] text-xl font-bold font-kalam">No student polaroids found!</p>
                <p className="text-[#2d2d2d]/70 text-md mt-2">Wire up Cloudinary or fill mock arrays to populate this album.</p>
              </div>
            ) : isMobile ? (
              // ==================== MOBILE LAYOUT: PORTABLE RETRO COLLAGE CARD DECK ====================
              <div className="w-full max-w-md flex flex-col items-center select-none">
                <div className="relative w-[285px] h-[375px] xs:w-[315px] xs:h-[415px] flex items-center justify-center">
                  {/* Outer stacked polaroid shadows */}
                  <div className="absolute w-[94%] h-[96%] bg-white border-[3px] border-[#2d2d2d] radius-wobbly shadow-hard rotate-[-3deg] translate-y-3 opacity-60 z-0" />
                  <div className="absolute w-[97%] h-[98%] bg-white border-[3px] border-[#2d2d2d] radius-wobbly shadow-hard rotate-[2deg] translate-y-1.5 opacity-90 z-10" />

                  {/* Active Hand-Drawn Polaroid Memory Card */}
                  <div
                    onClick={handleMobileNext}
                    className={cn(
                      'absolute w-full h-full bg-[#fcfbf9] p-4 rounded-xl border-[3px] border-[#2d2d2d] shadow-hard flex flex-col justify-between cursor-pointer transition-all duration-500 ease-out z-20 paper-grain hover:-translate-y-2 hover:rotate-[1deg]',
                      mobileFlipState && 'translate-x-[150%] rotate-[20deg] scale-90 opacity-0 pointer-events-none'
                    )}
                  >
                    {/* Tape accent holding card together */}
                    <div className="absolute -top-3 left-[30%] w-24 h-6 bg-[#e5e0d8]/75 border-x-2 border-dashed border-[#2d2d2d]/30 rotate-[-3deg] z-30 flex items-center justify-center font-kalam text-[9px] uppercase tracking-widest text-[#2d2d2d]/60 font-bold">
                      Class of '26
                    </div>

                    {/* Polaroid Photo Frame */}
                    <div className="relative w-full h-[88%] rounded-lg overflow-hidden border-[2.5px] border-[#2d2d2d] shadow-inner bg-stone-150 mt-1">
                      <img
                        src={images[mobileIndex]?.url}
                        alt="Farewell Memory"
                        className="w-full h-full object-cover grayscale-[10%] contrast-[105%]"
                        loading="eager"
                      />
                    </div>

                    {/* Page tag marker */}
                    <div className="absolute bottom-2 right-4 font-kalam text-[10px] text-[#2d2d2d]/40 font-bold uppercase tracking-wider">
                      PAGE {mobileIndex + 1} / {images.length}
                    </div>
                  </div>
                </div>

                {/* Mobile controls */}
                <div className="flex items-center gap-6 mt-10">
                  <button
                    onClick={handleMobilePrev}
                    aria-label="Previous card"
                    className="p-3 radius-wobbly border-[3px] border-[#2d2d2d] bg-white text-[#2d2d2d] shadow-hard hover:bg-[#fff9c4] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-hard active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                  <span className="text-md font-bold text-[#2d2d2d] font-kalam uppercase tracking-wide">
                    Tap polaroid to flip
                  </span>
                  <button
                    onClick={handleMobileNext}
                    aria-label="Next card"
                    className="p-3 radius-wobbly border-[3px] border-[#2d2d2d] bg-white text-[#2d2d2d] shadow-hard hover:bg-[#fff9c4] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-hard active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
                  >
                    <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ) : (
              // ==================== DESKTOP LAYOUT: REDESIGNED HAND-DRAWN 3D SCRAPBOOK ====================
              <div className="w-full flex flex-col items-center select-none">
                
                {/* 3D Perspective Scrapbook Frame */}
                <div className="scrapbook-perspective w-full max-w-5xl h-[560px] flex items-center justify-center">
                  
                  {/* The Vintage Scrapbook Container */}
                  <div className="scrapbook-container w-full h-[490px] flex relative bg-[#fdfbf7] rounded-xl">
                    
                    {/* 1. Heavy Cardboard Outer Cover (Drawn bounds) */}
                    <div className="cardboard-cover">
                      <div className="sketchy-border" />
                      <div className="sketchy-border-inner" />

                      {/* Thumbtacks at top-left and top-right of cover */}
                      <div className="absolute -top-7 left-12 w-6 h-6 rounded-full bg-[#ff4d4d] border-[3px] border-[#2d2d2d] shadow-hard z-30 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80 -translate-x-0.5 -translate-y-0.5" />
                      </div>
                      <div className="absolute -top-7 right-12 w-6 h-6 rounded-full bg-[#2d5da1] border-[3px] border-[#2d2d2d] shadow-hard z-30 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80 -translate-x-0.5 -translate-y-0.5" />
                      </div>
                    </div>

                    {/* 2. LAYERED PAGE STACKS (Visual wobbly cardboard depth on left and right) */}
                    {/* Left Stack */}
                    <div className="absolute left-0 top-0 w-1/2 h-full bg-[#e5e0d8] border-[3px] border-[#2d2d2d] radius-wobbly shadow-hard opacity-90 origin-right transform -rotate-[1.5deg] -translate-x-[4px] z-1 paper-grain" style={{ clipPath: 'url(#deckled-left)' }} />
                    <div className="absolute left-0 top-0 w-1/2 h-full bg-[#f3efe8] border-[3px] border-[#2d2d2d] radius-wobbly shadow-hard opacity-95 origin-right transform -rotate-[0.7deg] -translate-x-[2px] z-2 paper-grain" style={{ clipPath: 'url(#deckled-left)' }} />
                    
                    {/* Right Stack */}
                    <div className="absolute right-0 top-0 w-1/2 h-full bg-[#e5e0d8] border-[3px] border-[#2d2d2d] radius-wobbly shadow-hard opacity-90 origin-left transform rotate-[1.5deg] translate-x-[4px] z-1 paper-grain" style={{ clipPath: 'url(#deckled-right)' }} />
                    <div className="absolute right-0 top-0 w-1/2 h-full bg-[#f3efe8] border-[3px] border-[#2d2d2d] radius-wobbly shadow-hard opacity-95 origin-left transform rotate-[0.7deg] translate-x-[2px] z-2 paper-grain" style={{ clipPath: 'url(#deckled-right)' }} />

                    {/* ==============================================
                        DUAL-SIDED STATIC BACKDROPS
                        ============================================== */}
                    
                    {/* STATIC LEFT BACKDROP PAGE */}
                    <div 
                      className="w-1/2 h-full bg-gradient-to-r from-white via-[#fcfbf9] to-[#faf8f5] border-[3px] border-[#2d2d2d] p-8 relative flex flex-col justify-between overflow-hidden shadow-[inset_-6px_0_20px_rgba(45,45,45,0.03)] z-10 paper-grain"
                      style={{ clipPath: 'url(#deckled-left)' }}
                    >
                      <div className="absolute right-0 top-0 w-16 h-full spine-shadow-left opacity-15 pointer-events-none" />
                      
                      {currentPage > 0 ? (
                        <PageContent 
                          photo={images[(currentPage - 1) * 2 + 1]} 
                          pageNum={(currentPage - 1) * 2 + 2} 
                          total={images.length} 
                          tilt="0.8deg"
                          side="left"
                        />
                      ) : (
                        <BookLeftCoverTitle 
                          coverTitle={coverSettings.coverTitle}
                          coverDesc={coverSettings.coverDesc}
                          coverClass={coverSettings.coverClass}
                        />
                      )}
                    </div>

                    {/* STATIC RIGHT BACKDROP PAGE */}
                    <div 
                      className="w-1/2 h-full bg-gradient-to-l from-white via-[#fcfbf9] to-[#faf8f5] border-[3px] border-[#2d2d2d] p-8 relative flex flex-col justify-between overflow-hidden shadow-[inset_6px_0_20px_rgba(45,45,45,0.03)] z-10 paper-grain"
                      style={{ clipPath: 'url(#deckled-right)' }}
                    >
                      <div className="absolute left-0 top-0 w-16 h-full spine-shadow-right opacity-15 pointer-events-none" />

                      {currentPage < totalSheets ? (
                        <PageContent 
                          photo={images[currentPage * 2]} 
                          pageNum={currentPage * 2 + 1} 
                          total={images.length} 
                          tilt="-0.8deg"
                          side="right"
                        />
                      ) : (
                        <NotebookBlankSignatures pageNum={images.length + 1} />
                      )}
                    </div>

                    {/* ==============================================
                        DYNAMIC DUAL-SIDED FLIPPING SHEETS
                        ============================================== */}
                    {Array.from({ length: totalSheets }).map((_, sheetIdx) => {
                      const isTurned = sheetIdx < currentPage;
                      const zIndex = isTurned ? 20 + sheetIdx : 20 + (totalSheets - sheetIdx);
                      const frontPhoto = images[sheetIdx * 2];
                      const backPhoto = images[sheetIdx * 2 + 1];

                      return (
                        <div
                          key={sheetIdx}
                          className={cn(
                            'sheet-3d',
                            isFlipping && 'is-turning'
                          )}
                          style={{
                            transform: isTurned ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                            zIndex: zIndex,
                          }}
                        >
                          {/* FRONT FACE (Right Stack Flat) */}
                          <div className="sheet-face sheet-face-right p-8 flex flex-col justify-between overflow-hidden paper-grain">
                            <div className="absolute left-0 top-0 w-16 h-full spine-shadow-right opacity-10 pointer-events-none" />
                            <div className="flip-shadow" />
                            
                            <PageContent 
                              photo={frontPhoto} 
                              pageNum={sheetIdx * 2 + 1} 
                              total={images.length} 
                              tilt="0.8deg"
                              side="right"
                            />
                          </div>

                          {/* BACK FACE (Left Stack Flat) */}
                          <div className="sheet-face sheet-face-left sheet-face-back p-8 flex flex-col justify-between overflow-hidden paper-grain">
                            <div className="absolute right-0 top-0 w-16 h-full spine-shadow-left opacity-10 pointer-events-none" />
                            <div className="flip-shadow" />

                            {backPhoto ? (
                              <PageContent 
                                photo={backPhoto} 
                                pageNum={sheetIdx * 2 + 2} 
                                total={images.length} 
                                tilt="-0.8deg"
                                side="left"
                              />
                            ) : (
                              <NotebookBlankSignatures pageNum={sheetIdx * 2 + 2} />
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* ==============================================
                        3. PHYSICAL SPIRAL RING BINDER DOWN CENTER SPINE
                        ============================================== */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 h-[103%] w-5 z-50 pointer-events-none flex flex-col justify-between py-6">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div 
                          key={i} 
                          className="w-7 h-4.5 border-[3px] border-[#2d2d2d] bg-[#e5e0d8] rounded-full shadow-hard -translate-x-[5px] rotate-[18deg]"
                        />
                      ))}
                    </div>

                    {/* 4. TURN NAVIGATION EDGE HOTSPOTS */}
                    {/* Prev spread target */}
                    <div
                      onClick={handlePrevPage}
                      className={cn(
                        'absolute left-0 top-0 w-[15%] h-full z-50 transition-colors cursor-pointer group flex items-center justify-start pl-6 select-none',
                        currentPage === 0 ? 'pointer-events-none' : 'hover:bg-[#2d2d2d]/[0.01]'
                      )}
                    >
                      {currentPage > 0 && (
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 w-10 h-10 radius-wobbly border-[3px] border-[#2d2d2d] bg-white text-[#2d2d2d] shadow-hard flex items-center justify-center">
                          <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                      )}
                    </div>

                    {/* Next spread target */}
                    <div
                      onClick={handleNextPage}
                      className="absolute right-0 top-0 w-[15%] h-full z-50 transition-colors cursor-pointer group flex items-center justify-end pr-6 select-none hover:bg-[#2d2d2d]/[0.01]"
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 w-10 h-10 radius-wobbly border-[3px] border-[#2d2d2d] bg-white text-[#2d2d2d] shadow-hard flex items-center justify-center">
                        <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Desktop Navigation controls */}
                <div className="mt-8 flex items-center justify-center gap-10 select-none">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 0 || isFlipping}
                    className="flex items-center gap-1.5 text-md font-bold font-kalam uppercase tracking-wider text-[#2d2d2d]/60 hover:text-[#ff4d4d] transition-colors disabled:opacity-30 disabled:hover:text-[#2d2d2d]/60 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" strokeWidth={2.5} /> Prev Page
                  </button>
                  <span className="text-sm font-bold font-kalam px-6 py-2 border-[2.5px] border-[#2d2d2d] radius-wobbly bg-white text-[#2d2d2d] shadow-hard flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#2d5da1]" strokeWidth={2.5} />
                    Turn scrapbook pages by clicking the left/right margins!
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={isFlipping}
                    className="flex items-center gap-1.5 text-md font-bold font-kalam uppercase tracking-wider text-[#2d2d2d]/60 hover:text-[#ff4d4d] transition-colors cursor-pointer"
                  >
                    Next Page <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Redesigned Corkboard Stats Grid */}
          <div className="container relative z-10 mx-auto mt-16 px-6">
            <div className="max-w-4xl mx-auto border-[3px] border-[#2d2d2d] radius-wobbly bg-white p-8 shadow-hard relative overflow-hidden">
              {/* Decorative thumbtack pinning the stats grid */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#ff4d4d] border-2 border-[#2d2d2d] shadow-hard z-10 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-white opacity-85" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 pt-2">
                {displayStats.map((stat, index) => {
                  const tilts = ['rotate-[-1.5deg]', 'rotate-[2deg]', 'rotate-[-1deg]'];
                  const bgColors = ['bg-white', 'bg-[#fff9c4]', 'bg-white'];
                  return (
                    <div 
                      key={index} 
                      className={cn(
                        "p-5 border-[3px] border-[#2d2d2d] radius-wobbly shadow-hard flex flex-col justify-center items-center transform transition-transform hover:scale-105 duration-200",
                        tilts[index % tilts.length],
                        bgColors[index % bgColors.length]
                      )}
                    >
                      <p className="text-4xl md:text-5xl font-black font-kalam text-[#2d5da1] tracking-tight">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-sm font-bold uppercase tracking-wider text-[#2d2d2d]/80 font-kalam text-center">
                        {stat.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }
);

HeroCollage.displayName = 'HeroCollage';

/* ========================================================
   SUB-COMPONENTS (Page Contents & Notebook Blanks)
   ======================================================== */

interface PageContentProps {
  photo?: PhotoMemory;
  pageNum: number;
  total: number;
  tilt?: string;
  side: 'left' | 'right';
}

const PageContent: React.FC<PageContentProps> = ({ photo, pageNum, total, tilt = '0deg', side }) => {
  if (!photo) return null;
  
  return (
    <div className="w-full h-full flex flex-col justify-center items-center text-[#2d2d2d] select-none font-kalam relative py-2">
      {/* Polaroid Hand-Drawn Memory Frame */}
      <div 
        className="w-[90%] h-[88%] bg-white p-3.5 pb-8 border-[3px] border-[#2d2d2d] shadow-hard flex flex-col justify-between relative origin-center radius-wobbly hover:scale-[1.02] transition-transform"
        style={{ transform: `rotate(${tilt})` }}
      >
        {/* Transparent Masking tape across photo corner */}
        <div className="absolute -top-3.5 left-[30%] w-16 h-5.5 bg-[#e5e0d8]/75 border-x-2 border-dashed border-[#2d2d2d]/30 rotate-[-4deg] z-30" />

        {/* Real photo shine border */}
        <div className="relative w-full h-full overflow-hidden border-2 border-[#2d2d2d] bg-stone-100">
          <img src={photo.url} alt="Yearbook Memory" className="w-full h-full object-cover grayscale-[8%] contrast-[105%]" loading="eager" />
        </div>
      </div>

      {/* Tiny page number footer tucked away cleanly */}
      <div className="absolute bottom-1 font-kalam text-[10px] text-[#2d2d2d]/40 font-bold tracking-wider select-none uppercase">
        PAGE {pageNum} OF {total}
      </div>
    </div>
  );
};

/* Left cover welcoming book spread */
interface BookLeftCoverTitleProps {
  coverTitle?: string;
  coverDesc?: string;
  coverClass?: string;
}

const BookLeftCoverTitle: React.FC<BookLeftCoverTitleProps> = ({ coverTitle, coverDesc, coverClass }) => {
  return (
    <div className="w-full h-full flex flex-col justify-between text-[#2d2d2d] select-none font-kalam">
      <div className="border-b-[2px] border-dashed border-[#2d2d2d]/25 pb-1">
        <h4 className="font-semibold text-xs tracking-wider uppercase text-[#2d5da1]">
          Album Cover
        </h4>
      </div>

      <div className="flex-grow flex flex-col justify-center items-center py-4 px-2 my-1 text-center relative">
        {/* Sticky note welcoming tag */}
        <div className="absolute top-[-5px] right-[-10px] bg-[#fff9c4] border-[2px] border-[#2d2d2d] shadow-hard px-3 py-0.5 rotate-[8deg] text-[10px] font-bold uppercase tracking-wider">
          Open Me! ✍
        </div>

        <div className="mb-2 text-[#ff4d4d]">
          <BookOpen className="w-12 h-12 mx-auto stroke-[2]" />
        </div>
        <h2 className="text-2.5xl font-black text-[#2d2d2d] leading-none tracking-tight">
          {coverTitle || 'Eclectica Farewell'}
        </h2>
        <div className="h-[3px] w-14 bg-[#2d5da1] my-3 mx-auto rounded" />
        <p className="font-patrick italic text-sm text-[#2d2d2d]/85 leading-relaxed">
          "{coverDesc || 'A handwritten scrapbook of the moments that shaped our journey, the classroom laughter, and friendships that will last forever.'}"
        </p>
        <span className="text-[10px] font-bold text-[#2d5da1] uppercase tracking-widest mt-4">
          {coverClass || 'Established Class of 2026'}
        </span>
      </div>

      <div className="flex items-center justify-between border-t-[2px] border-dashed border-[#2d2d2d]/25 pt-1.5 text-[10px] text-[#2d2d2d]/40 font-bold tracking-wider select-none">
        <span>WELCOME</span>
        <span>PAGE 0</span>
      </div>
    </div>
  );
};

/* Lined notebook Signature page blank */
/* Lined notebook Signature page guestbook */
const NotebookBlankSignatures: React.FC<{ pageNum: number }> = ({ pageNum }) => {
  const [signatures, setSignatures] = useState<any[]>([]);
  const [isSigning, setIsSigning] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'signatures'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setSignatures(list.slice(0, 3)); // Display the 3 most recent signatures
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'signatures'), {
        name: name.trim(),
        message: message.trim(),
        createdAt: serverTimestamp()
      });
      setName('');
      setMessage('');
      setIsSigning(false);
    } catch (e) {
      console.error('Failed to post signature:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between text-[#2d2d2d] font-kalam">
      <div className="border-b-[2px] border-dashed border-[#2d2d2d]/25 pb-1 flex items-center justify-between">
        <h4 className="font-semibold text-xs tracking-wider uppercase text-[#2d5da1]">
          Ruled Signatures
        </h4>
        <span className="text-[10px] text-[#2d2d2d]/40">🖊 Visitor Log</span>
      </div>

      {/* Lined ruled notebook signatures paper */}
      <div className="flex-grow flex flex-col justify-between p-4 lined-notebook border-2 border-[#2d2d2d]/20 rounded-lg shadow-inner my-2 relative overflow-hidden min-h-[280px]">
        {/* Draw a pencil signature placeholder */}
        <div className="absolute top-1 right-2 text-[9px] text-[#ff4d4d] border border-dashed border-[#ff4d4d]/40 px-1 py-0.5 rounded rotate-[-4deg] select-none">
          Sign Book! ✒
        </div>
        
        {isSigning ? (
          <form onSubmit={handleSubmit} className="w-full flex-grow flex flex-col justify-center space-y-2 pt-4 bg-[#fcfbf9]/95 z-10 px-1 relative select-text">
            <h5 className="text-[11px] font-black uppercase text-[#2d5da1] tracking-wider leading-none">Leave Your Chapter:</h5>
            <input 
              type="text"
              placeholder="Your Name / Nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-2 py-0.5 border-b-2 border-[#2d2d2d] bg-transparent text-xs focus:outline-none focus:border-[#2d5da1] font-kalam text-[#2d2d2d] font-bold"
              required
              disabled={submitting}
              maxLength={25}
            />
            <input
              type="text"
              placeholder="Your short message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-2 py-0.5 border-b-2 border-[#2d2d2d] bg-transparent text-xs focus:outline-none focus:border-[#2d5da1] font-patrick text-[#2d2d2d]"
              required
              disabled={submitting}
              maxLength={60}
            />
            <div className="flex items-center justify-end gap-2 pt-2 select-none">
              <button
                type="button"
                onClick={() => setIsSigning(false)}
                className="px-2.5 py-1 border border-[#2d2d2d] radius-wobbly text-[10px] font-bold hover:bg-stone-100 cursor-pointer"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 border-[2px] border-[#2d2d2d] bg-[#2d5da1] text-white radius-wobbly text-[10px] font-bold hover:bg-[#2d5da1]/95 cursor-pointer shadow-hard"
                disabled={submitting}
              >
                {submitting ? 'Signing...' : 'Sign ✒'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col justify-between h-full select-none">
            {/* Signatures List inside lined notebook lines */}
            <div className="space-y-1.5 flex-grow pt-2 select-text">
              {signatures.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center py-6">
                  <p className="font-patrick italic text-[12px] text-[#2d2d2d]/60">
                    No signatures yet! Be the first to leave a message...
                  </p>
                </div>
              ) : (
                signatures.map((sig, idx) => (
                  <div key={sig.id || idx} className="border-b border-dashed border-[#2d2d2d]/10 pb-0.5 select-text">
                    <p className="text-[12.5px] leading-relaxed text-[#2d2d2d] font-patrick font-medium line-clamp-1">
                      "{sig.message}"
                    </p>
                    <p className="text-[10px] font-bold text-[#2d5da1] text-right font-kalam pr-2 leading-none mt-0.5">
                      — {sig.name}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Pencil button to leave signature */}
            <div className="pt-2 text-center select-none border-t border-dashed border-[#2d2d2d]/10 mt-2">
              <button
                onClick={() => setIsSigning(true)}
                className="px-3.5 py-1 border-[2.5px] border-[#2d2d2d] radius-wobbly bg-[#ff4d4d] hover:bg-[#fff9c4] text-white hover:text-[#2d2d2d] font-bold text-xs uppercase tracking-wider shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer inline-flex items-center gap-1"
              >
                Sign Scrapbook 🖊
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Page number footer */}
      <div className="flex items-center justify-between border-t-[2px] border-dashed border-[#2d2d2d]/25 pt-1.5 text-[10px] text-[#2d2d2d]/40 font-bold tracking-wider select-none">
        <span>MEMORIES FOREVER</span>
        <span>PAGE {pageNum}</span>
      </div>
    </div>
  );
};

export { HeroCollage };
export type { HeroCollageProps };

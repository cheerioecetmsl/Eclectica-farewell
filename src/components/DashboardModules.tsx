"use client";

import { TrendingUp, Award, Zap, X, Megaphone } from "lucide-react";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { calculateLevel, formatXP } from "@/lib/xp";
import Link from "next/link";

export interface HypeUpdate {
  id: string;
  title: string;
  content: string;
  tag?: string;
  createdAt?: any;
  mediaGallery?: string[];
  mediaBaseIds?: string[];
  date?: string;
}

export const HypeBoard = () => {
  const [updates, setUpdates] = useState<HypeUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [latestNotice, setLatestNotice] = useState<HypeUpdate | null>(null);

  useEffect(() => {
    const q = query(collection(db, "hype_board"), orderBy("createdAt", "desc"), limit(3));
    
    // Real-time listener for instant notifications broadcast
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HypeUpdate));
      setUpdates(docs);
      setLoading(false);

      if (docs.length > 0) {
        const latest = docs[0];
        const lastClosed = localStorage.getItem("lastClosedNotificationId");
        if (lastClosed !== latest.id) {
          setLatestNotice(latest);
          setShowPopup(true);
        }
      }
    }, (error) => {
      console.error("Error subscribing to hype board:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const closePopup = () => {
    if (latestNotice) {
      localStorage.setItem("lastClosedNotificationId", latestNotice.id);
    }
    setShowPopup(false);
  };

  return (
    <div className="hand-card p-8 flex flex-col bg-[#fdfbf7] relative mt-4">
      <div className="tape-decoration" />
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ff4d4d] border-[3px] border-[#2d2d2d] rounded-[var(--radius-wobbly)] text-white rotate-3">
            <TrendingUp size={24} strokeWidth={2.5} />
          </div>
          <h3 className="font-kalam font-bold uppercase tracking-widest text-2xl text-[#2d2d2d]">Notification Bar</h3>
        </div>
        <span className="text-xs font-patrick font-bold text-[#2d2d2d] bg-[#fff9c4] border-[2px] border-[#2d2d2d] px-3 py-1 rounded-[var(--radius-wobbly)] shadow-[2px_2px_0_0_#2d2d2d] animate-pulse -rotate-2">LIVE</span>
      </div>

      <div className="space-y-6 flex-grow">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-[#2d2d2d]/5 rounded-[var(--radius-wobbly)] border-[3px] border-dashed border-[#2d2d2d]/20 animate-pulse" />
            ))}
          </div>
        ) : updates.length > 0 ? (
          updates.map((update) => (
            <div key={update.id} className="group cursor-pointer hand-card p-5 bg-white hover:-rotate-1 transition-transform">
              <div className="flex justify-between items-start mb-3 border-b-[3px] border-dashed border-[#2d2d2d]/20 pb-3">
                <span className="text-[10px] font-patrick font-bold tracking-[0.2em] text-[#fdfbf7] bg-[#2d2d2d] px-3 py-1 rounded-full uppercase rotate-1">{update.tag || "Update"}</span>
                <span className="text-sm text-[#2d2d2d] font-patrick font-bold uppercase -rotate-1">
                  {update.createdAt?.toDate ? new Date(update.createdAt.toDate()).toLocaleDateString() : "Just now"}
                </span>
              </div>
              <h4 className="font-bold font-kalam text-xl text-[#2d2d2d] group-hover:text-[#ff4d4d] transition-colors">{update.title}</h4>
              <p className="text-lg font-patrick text-[#2d2d2d]/80 leading-relaxed mt-2">{update.content}</p>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-[3px] border-dashed border-[#2d2d2d] rounded-[var(--radius-wobbly)] bg-white">
            <p className="font-kalam text-[#2d2d2d]/50 italic text-2xl">The vault is silent... for now.</p>
          </div>
        )}
      </div>

      <Link href="/dashboard/feeds" className="mt-8 font-patrick font-bold text-xl uppercase tracking-widest text-[#2d2d2d] hover:text-[#ff4d4d] hover:underline decoration-wavy transition-colors underline-offset-4 text-center block">
        Our Feeds
      </Link>

      {/* Hand-Drawn Popup Alert Overlay */}
      {showPopup && latestNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#2d2d2d]/30 backdrop-blur-sm" onClick={closePopup} />
          
          <div className="relative hand-card bg-white p-8 max-w-md w-full text-center space-y-6 animate-in zoom-in-95 border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d] rotate-1">
            <div className="tape-decoration" />
            <button 
              onClick={closePopup}
              className="absolute top-4 right-4 text-[#2d2d2d]/50 hover:text-[#2d2d2d] transition-colors"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
            
            <div className="w-16 h-16 bg-[#ff4d4d] border-[3px] border-[#2d2d2d] rounded-full flex items-center justify-center text-white mx-auto shadow-[4px_4px_0_0_#2d2d2d] -rotate-3">
              <Megaphone size={32} strokeWidth={2.5} className="-ml-1 rotate-12" />
            </div>

            <div className="space-y-3">
              <div className="inline-block bg-[#ffca28]/20 border-[2px] border-[#ffca28] text-[#2d2d2d] px-3 py-1 rounded-full font-patrick font-bold text-xs uppercase">
                {latestNotice.tag || "Broadcast Alert"}
              </div>
              <h2 className="text-3xl font-bold font-kalam text-[#2d2d2d] leading-none">
                {latestNotice.title}
              </h2>
              <p className="font-patrick text-lg text-[#2d2d2d]/80 leading-relaxed max-h-48 overflow-y-auto pr-2">
                {latestNotice.content}
              </p>
            </div>

            <button 
              onClick={closePopup}
              className="w-full py-3 bg-[#ffca28] hover:bg-[#ffe066] border-[2px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] font-patrick font-bold text-lg uppercase tracking-widest hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#2d2d2d] transition-all active:translate-y-1 active:shadow-none"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const UserStats = () => {
  const [xp, setXp] = useState(0);
  const [name, setName] = useState("Archivist");

  useEffect(() => {
    let unsubDoc: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Real-time listener so XP updates instantly after upload
        unsubDoc = onSnapshot(doc(db, "users", user.uid), (snap) => {
          if (snap.exists()) {
            setXp(snap.data().xp || 0);
            setName(snap.data().name || snap.data().displayName || user.displayName || "Archivist");
          }
        });
      }
    });

    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  const { level, nextLevelXP, progress } = calculateLevel(xp);

  return (
    <div className="hand-card-yellow p-8 relative rotate-1">
      <div className="tack-decoration" />
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-4xl md:text-5xl font-kalam font-bold text-[#2d2d2d] truncate max-w-[200px] md:max-w-[300px]">{name}</h2>
          <p className="text-lg font-patrick font-bold uppercase tracking-wider mt-1 text-[#2d2d2d]/70">Archivist Rank</p>
        </div>
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-[var(--radius-wobbly)] border-[3px] border-[#2d2d2d] bg-white flex items-center justify-center text-[#ff4d4d] font-kalam font-bold text-3xl md:text-4xl shadow-[4px_4px_0_0_#2d2d2d] flex-shrink-0 -rotate-6">
          {level}
        </div>
      </div>

      <div className="space-y-8 mt-8">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-lg font-patrick font-bold uppercase tracking-widest text-[#2d2d2d]/80">Legacy Progress</span>
            <span className="text-xl font-kalam font-bold text-[#2d2d2d] tabular-nums">{formatXP(xp)} / {formatXP(nextLevelXP)} XP</span>
          </div>
          <div className="h-6 w-full bg-white border-[3px] border-[#2d2d2d] rounded-[var(--radius-wobbly)] overflow-hidden shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.1)] p-0.5">
            <div 
              className="h-full bg-[#ff4d4d] rounded-[var(--radius-wobbly)] transition-all duration-1000 ease-out border-r-[3px] border-[#2d2d2d]"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-6">
          <div className="hand-card p-6 hover:-rotate-2 bg-white">
            <div className="flex items-center gap-3 mb-3">
              <Award size={28} strokeWidth={2.5} className="text-[#ff4d4d]" />
              <span className="text-lg font-patrick font-bold uppercase tracking-widest text-[#2d2d2d]">Badges</span>
            </div>
            <div className="text-4xl font-kalam font-bold text-[#2d2d2d]">--</div>
          </div>
          <div className="hand-card p-6 hover:rotate-2 bg-white">
            <div className="flex items-center gap-3 mb-3">
              <Zap size={28} strokeWidth={2.5} className="text-[#2d5da1]" />
              <span className="text-lg font-patrick font-bold uppercase tracking-widest text-[#2d2d2d]">Streaks</span>
            </div>
            <div className="text-4xl font-kalam font-bold text-[#2d2d2d]">--</div>
          </div>
        </div>
      </div>
    </div>
  );
};

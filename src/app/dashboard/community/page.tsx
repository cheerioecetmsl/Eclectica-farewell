"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { GraduationCap, Star, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import { Member, classifyMember } from "./shared";

export default function CommunityLandingPage() {
  const [counts, setCounts] = useState({ juniors: 0, legends: 0, mentors: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), snap => {
      const list = snap.docs.map(d => ({ year: d.data().year || "" } as Member));
      
      let juniors = 0, legends = 0, mentors = 0;
      list.forEach(m => {
        const div = classifyMember(m);
        if (div === "juniors") juniors++;
        else if (div === "legends") legends++;
        else if (div === "mentors") mentors++;
      });
      
      setCounts({ juniors, legends, mentors, total: list.length });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-[#2d2d2d]/40 animate-spin" />
        <p className="font-patrick font-bold text-[#2d2d2d]/50 uppercase tracking-widest text-sm animate-pulse">Gathering the crew...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">

      {/* Page Header */}
      <div className="relative text-center">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#d4af37]/10 rounded-full blur-2xl" />
        <h1 className="text-5xl md:text-6xl font-kalam font-bold text-[#2d2d2d] tracking-wide relative z-10">
          The <span className="text-[#d4af37] underline decoration-wavy decoration-2 underline-offset-4">Community</span>
        </h1>
        <p className="font-patrick text-xl text-[#2d2d2d]/70 mt-4 max-w-xl mx-auto">
          Every face, every story. Explore the ranks of the {counts.total} archivists currently active.
        </p>
      </div>

      {/* Division Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        
        {/* Legends */}
        <Link 
          href="/dashboard/community/legends"
          className="group hand-card bg-[#fff9c4] border-[3px] border-[#d4af37] shadow-[6px_6px_0_0_#2d2d2d] p-8 rounded-[var(--radius-wobbly)] flex flex-col items-center text-center transition-all hover:-translate-y-2 hover:shadow-[10px_10px_0_0_#2d2d2d] relative overflow-hidden"
        >
          <div className="w-20 h-20 bg-[#d4af37] border-[3px] border-[#2d2d2d] rounded-[var(--radius-wobbly)] flex items-center justify-center text-white shadow-[4px_4px_0_0_#2d2d2d] -rotate-6 group-hover:rotate-0 transition-transform mb-6">
            <Star size={40} strokeWidth={2.5} />
          </div>
          <h2 className="font-kalam font-bold text-4xl text-[#b8860b] mb-2">Legends</h2>
          <p className="font-patrick text-[#2d2d2d]/70 text-lg mb-6">4th Year · The Final Chapter</p>
          <div className="mt-auto inline-flex items-center gap-2 bg-white/60 px-4 py-1.5 rounded-full border-[2px] border-[#d4af37]/30">
            <span className="font-bold font-kalam text-xl text-[#b8860b]">{counts.legends}</span>
            <span className="text-xs font-bold font-patrick uppercase tracking-widest text-[#2d2d2d]/50">Members</span>
          </div>
        </Link>

        {/* Juniors */}
        <Link 
          href="/dashboard/community/juniors"
          className="group hand-card bg-[#e8f4f8] border-[3px] border-[#2d5da1] shadow-[6px_6px_0_0_#2d2d2d] p-8 rounded-[var(--radius-wobbly)] flex flex-col items-center text-center transition-all hover:-translate-y-2 hover:shadow-[10px_10px_0_0_#2d2d2d] relative overflow-hidden md:mt-8"
        >
          <div className="w-20 h-20 bg-[#2d5da1] border-[3px] border-[#2d2d2d] rounded-[var(--radius-wobbly)] flex items-center justify-center text-white shadow-[4px_4px_0_0_#2d2d2d] rotate-3 group-hover:rotate-0 transition-transform mb-6">
            <BookOpen size={40} strokeWidth={2.5} />
          </div>
          <h2 className="font-kalam font-bold text-4xl text-[#2d5da1] mb-2">Juniors</h2>
          <p className="font-patrick text-[#2d2d2d]/70 text-lg mb-6">1st, 2nd & 3rd Year</p>
          <div className="mt-auto inline-flex items-center gap-2 bg-white/60 px-4 py-1.5 rounded-full border-[2px] border-[#2d5da1]/30">
            <span className="font-bold font-kalam text-xl text-[#2d5da1]">{counts.juniors}</span>
            <span className="text-xs font-bold font-patrick uppercase tracking-widest text-[#2d2d2d]/50">Members</span>
          </div>
        </Link>

        {/* Mentors */}
        <Link 
          href="/dashboard/community/mentors"
          className="group hand-card bg-[#ffe8e8] border-[3px] border-[#ff4d4d] shadow-[6px_6px_0_0_#2d2d2d] p-8 rounded-[var(--radius-wobbly)] flex flex-col items-center text-center transition-all hover:-translate-y-2 hover:shadow-[10px_10px_0_0_#2d2d2d] relative overflow-hidden"
        >
          <div className="w-20 h-20 bg-[#ff4d4d] border-[3px] border-[#2d2d2d] rounded-[var(--radius-wobbly)] flex items-center justify-center text-white shadow-[4px_4px_0_0_#2d2d2d] -rotate-3 group-hover:rotate-0 transition-transform mb-6">
            <GraduationCap size={40} strokeWidth={2.5} />
          </div>
          <h2 className="font-kalam font-bold text-4xl text-[#cc0000] mb-2">Mentors</h2>
          <p className="font-patrick text-[#2d2d2d]/70 text-lg mb-6">Faculty · The Guides</p>
          <div className="mt-auto inline-flex items-center gap-2 bg-white/60 px-4 py-1.5 rounded-full border-[2px] border-[#ff4d4d]/30">
            <span className="font-bold font-kalam text-xl text-[#cc0000]">{counts.mentors}</span>
            <span className="text-xs font-bold font-patrick uppercase tracking-widest text-[#2d2d2d]/50">Members</span>
          </div>
        </Link>

      </div>
    </div>
  );
}

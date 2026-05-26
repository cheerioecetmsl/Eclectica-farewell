"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { ArrowLeft, Bell, Calendar, Megaphone, Loader2 } from "lucide-react";
import Link from "next/link";

interface FeedNotification {
  id: string;
  title: string;
  content: string;
  tag: string;
  createdAt: any;
}

export default function FeedsPage() {
  const [notifications, setNotifications] = useState<FeedNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        const q = query(collection(db, "hype_board"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedNotification));
        setNotifications(list);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeeds();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
        <Loader2 className="w-16 h-16 text-[#2d2d2d] animate-spin" strokeWidth={2.5} />
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-6 relative bg-[#fdfbf7]">
      <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Header */}
        <div className="text-center space-y-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full border-2 border-[#2d2d2d]/20 hover:border-[#2d2d2d] hover:bg-[#2d2d2d] hover:text-[#fdfbf7] transition-all font-bold tracking-widest text-sm uppercase"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold font-kalam text-[#2d2d2d] drop-shadow-sm -rotate-1">
              Our Feeds
            </h1>
            <p className="font-patrick text-xl text-[#2d2d2d]/70 max-w-xl mx-auto rotate-1">
              "Chronicles of the Class of 2026. Every announcement, event notice, and game desk update live to date."
            </p>
          </div>
        </div>

        {/* List of feeds */}
        <div className="space-y-8 max-w-2xl mx-auto">
          {notifications.map((notice, idx) => (
            <div 
              key={notice.id} 
              className={`hand-card p-6 md:p-8 bg-white border-[3px] border-[#2d2d2d] shadow-hard relative transition-transform hover:-translate-y-1 duration-200 ${
                idx % 2 === 0 ? "rotate-1" : "-rotate-1"
              }`}
            >
              {/* Paper decorations */}
              <div className="tape-decoration" />

              <div className="flex justify-between items-start gap-4 mb-4 border-b-[3px] border-dashed border-[#2d2d2d]/10 pb-4">
                <span className="text-xs font-patrick font-bold tracking-[0.2em] text-[#fdfbf7] bg-[#ff4d4d] px-3.5 py-1 rounded-full uppercase">
                  {notice.tag || "Broadcast"}
                </span>
                <span className="text-sm text-[#2d2d2d]/60 font-patrick font-bold uppercase flex items-center gap-1">
                  <Calendar size={14} className="text-[#2d2d2d]/40" />
                  {notice.createdAt?.toDate ? new Date(notice.createdAt.toDate()).toLocaleDateString() : "Recently"}
                </span>
              </div>

              <h2 className="font-bold font-kalam text-2xl md:text-3xl text-[#2d2d2d] mb-4">
                {notice.title}
              </h2>
              <p className="text-lg font-patrick text-[#2d2d2d]/80 leading-relaxed whitespace-pre-wrap">
                {notice.content}
              </p>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="hand-card bg-white p-16 border-[3px] border-[#2d2d2d] shadow-hard text-center flex flex-col items-center justify-center space-y-4">
              <Bell className="w-16 h-16 text-[#2d2d2d]/20" strokeWidth={1.5} />
              <h3 className="font-kalam text-2xl text-[#2d2d2d]/60">The airwaves are quiet</h3>
              <p className="font-patrick text-lg text-[#2d2d2d]/50 max-w-sm">No announcements or feeds have been posted yet. Check back later!</p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

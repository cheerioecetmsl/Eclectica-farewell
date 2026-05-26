"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, ArrowRight } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { UserStats, HypeBoard } from "@/components/DashboardModules";
import { LeaderboardWidget } from "@/components/LeaderboardWidget";

export default function DashboardPage() {
  const [userName, setUserName] = useState("Friend");
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [userCategory, setUserCategory] = useState<"Student" | "Faculty" | "Legend">("Student");
  
  useEffect(() => {
    let unsubChat: (() => void) | null = null;
    
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName?.split(" ")[0] || "Friend");
        
        // Setup unread chat listener
        const lastRead = localStorage.getItem("lastReadChatTime");
        const q = query(
          collection(db, "messages"),
          where("timestamp", ">", lastRead ? new Date(parseInt(lastRead)) : new Date(0))
        );
        unsubChat = onSnapshot(q, (snap) => {
          setUnreadChatCount(snap.docs.length);
        });
      } else {
        if (unsubChat) {
          unsubChat();
          unsubChat = null;
        }
      }
    });
    return () => {
      unsubAuth();
      if (unsubChat) unsubChat();
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Welcome Header */}
      <div className="relative">
        <div className="absolute -top-6 -left-4 w-12 h-12 bg-[#ff4d4d]/10 rounded-full blur-xl" />
        <h1 className="text-4xl md:text-5xl font-kalam font-bold text-[#2d2d2d] relative z-10 -rotate-1 tracking-wide">
          Welcome back, <span className="text-[#ff4d4d] underline decoration-wavy decoration-2 underline-offset-4">{userName}</span>!
        </h1>
        <p className="font-patrick text-xl text-[#2d2d2d]/70 mt-2 rotate-1 max-w-xl">
          The archives are waiting. What memory will you preserve today?
        </p>
      </div>

      {/* Main Grid: UserStats + HypeBoard + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Stats & Chat & Hype) */}
        <div className="col-span-1 lg:col-span-7 space-y-8">
          <UserStats />
          
          {/* Main Action: Community Chat */}
          <Link 
            href="/dashboard/chat" 
            className="block hand-card p-6 md:p-8 group hover:-translate-y-2 hover:rotate-1"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[var(--radius-wobbly)] bg-white border-[3px] border-[#2d2d2d] flex items-center justify-center text-[#2d5da1] shadow-[2px_2px_0_0_#2d2d2d] group-hover:-rotate-12 transition-transform">
                  <MessageSquare size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-kalam font-bold text-[#2d2d2d]">Community Chat</h3>
                  <p className="font-patrick text-[#2d2d2d]/70 text-lg">Talk with everyone in real-time.</p>
                </div>
              </div>
              <ArrowRight size={28} strokeWidth={3} className="text-[#2d2d2d]/30 group-hover:text-[#2d2d2d] group-hover:translate-x-2 transition-all" />
            </div>
            
            {unreadChatCount > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 bg-[#ff4d4d] text-white px-3 py-1 rounded-full font-patrick font-bold border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] animate-bounce">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {unreadChatCount} new messages
              </div>
            )}
          </Link>

          <HypeBoard />
        </div>

        {/* Right Column (Leaderboard) */}
        <div className="col-span-1 lg:col-span-5">
          <LeaderboardWidget />
        </div>
        
      </div>
    </div>
  );
}

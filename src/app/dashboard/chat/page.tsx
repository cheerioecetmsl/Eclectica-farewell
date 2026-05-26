"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { CommunityChat } from "@/components/chat/CommunityChat";
import { ArrowLeft, MessageSquare, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ChatPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#fdfbf7]">
      {/* Navigation Bar */}
      <div className="flex items-center gap-4 p-4 border-b-[3px] border-[#2d2d2d] bg-white sticky top-0 z-50">
        <Link 
          href="/dashboard"
          className="p-2 rounded-[var(--radius-wobbly)] border-[2px] border-[#2d2d2d] bg-white hover:bg-[#fff9c4] transition-colors shadow-[2px_2px_0_0_#2d2d2d] active:translate-y-1 active:shadow-none"
        >
          <ArrowLeft size={20} className="text-[#2d2d2d]" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-[2px] border-[#2d2d2d] bg-[#ff4d4d] flex items-center justify-center shadow-[2px_2px_0_0_#2d2d2d]">
            <MessageSquare size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-[#2d2d2d] font-kalam">Community Chat</h1>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-hidden">
        {user ? (
          <CommunityChat currentUser={user} />
        ) : (
          <div className="flex items-center justify-center h-full flex-col gap-4">
            <Loader2 className="w-12 h-12 text-[#2d2d2d] animate-spin" strokeWidth={3} />
            <p className="font-patrick text-xl text-[#2d2d2d]/60">Checking credentials...</p>
          </div>
        )}
      </div>
    </div>
  );
}

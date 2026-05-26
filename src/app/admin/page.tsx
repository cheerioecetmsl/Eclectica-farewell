"use client";

import { Sparkles, LayoutDashboard } from "lucide-react";

export default function AdminOverviewPage() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <div className="hand-card-yellow inline-flex items-center gap-2 px-4 py-2 font-patrick font-bold text-[#2d2d2d] text-sm tracking-widest uppercase rotate-2">
          <LayoutDashboard size={16} strokeWidth={2.5} /> Command Center
        </div>
        <h1 className="text-6xl font-bold font-kalam text-[#2d2d2d] -rotate-1">Overview.</h1>
        <p className="font-patrick text-[#2d2d2d]/80 text-xl rotate-1">
          Welcome to the Eclectica Admin Panel. Use the sidebar to navigate to specific management tasks.
        </p>
      </div>

      <div className="hand-card bg-white p-8 rotate-1">
        <div className="tack-decoration" />
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 bg-[#e8f4f8] border-[3px] border-[#2d2d2d] rounded-full flex items-center justify-center shadow-[2px_2px_0_0_#2d2d2d] -rotate-6">
            <Sparkles size={32} strokeWidth={2.5} className="text-[#2d5da1]" />
          </div>
          <div className="space-y-2 flex-1">
            <h2 className="text-3xl font-bold font-kalam text-[#2d2d2d]">Getting Started</h2>
            <p className="font-patrick text-xl text-[#2d2d2d]/80">
              Configure the landing page videos by navigating to the <strong className="text-[#2d2d2d] font-bold">Landing Video</strong> tab in the sidebar. More features will be added here soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

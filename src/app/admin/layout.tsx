"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Menu, X } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#fdfbf7] text-[#2d2d2d] overflow-hidden">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none flex justify-center items-center opacity-[0.03] z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2d2d2d" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#fdfbf7]/80 backdrop-blur-sm z-[100] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-[110] transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:h-screen lg:sticky lg:top-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <AdminSidebar onSelect={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Mobile Header */}
        <header className="lg:hidden p-4 border-b-4 border-[#2d2d2d] flex justify-between items-center bg-white">
          <h1 className="text-2xl font-bold font-kalam text-[#2d2d2d]">
            ECLECTICA <span className="text-[#2d2d2d]/50 font-patrick text-sm">ADMIN</span>
          </h1>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-[#2d2d2d]"
          >
            {isSidebarOpen ? <X size={28} strokeWidth={3} /> : <Menu size={28} strokeWidth={3} />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

"use client";

import { DashboardSidebar } from "@/components/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#2d2d2d] relative selection:bg-[#fff9c4] selection:text-[#2d2d2d]">
      
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none flex justify-center items-center opacity-[0.03] z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2d2d2d" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Responsive Fixed Sidebar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="pl-0 lg:pl-24 min-h-screen transition-all duration-500 w-full relative z-10 flex flex-col">
        {/* Page Content */}
        <main className="w-full max-w-7xl mx-auto p-4 pt-24 lg:p-8 flex-1">
          {children}
        </main>
      </div>

    </div>
  );
}

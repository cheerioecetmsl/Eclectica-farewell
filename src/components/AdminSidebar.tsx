"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Video, LogOut } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export function AdminSidebar({ onSelect }: { onSelect?: () => void }) {
  const pathname = usePathname();

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out of the command center?")) {
      await signOut(auth);
    }
  };

  return (
    <aside className="w-72 border-r border-[#2d2d2d] bg-white h-full flex flex-col">
      <div className="p-8 border-b border-[#2d2d2d] bg-[#fdfbf7]">
        <h1 className="text-3xl font-bold font-kalam text-[#2d2d2d]">
          ECLECTICA <span className="text-[#2d2d2d]/50 font-patrick text-xl">ADMIN</span>
        </h1>
      </div>

      <nav className="flex-1 p-6 space-y-4 overflow-y-auto">
        <NavItem href="/admin" icon={<LayoutDashboard size={24} strokeWidth={2.5} />} label="Overview" active={pathname === "/admin"} onClick={onSelect} />
        <NavItem href="/admin/video" icon={<Video size={24} strokeWidth={2.5} />} label="Landing Video" active={pathname === "/admin/video"} onClick={onSelect} />
      </nav>

      <div className="p-6 border-t border-[#2d2d2d] bg-[#fdfbf7]">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-[#ff4d4d] hover:bg-[#ff4d4d]/10 rounded-xl transition-colors w-full text-left font-patrick font-bold text-lg uppercase tracking-widest"
        >
          <LogOut size={24} strokeWidth={2.5} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, active, onClick }: { href: string, icon: React.ReactNode, label: string, active: boolean, onClick?: () => void }) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-4 rounded-[var(--radius-wobbly)] transition-all duration-300 font-patrick font-bold uppercase tracking-widest text-lg ${
        active 
          ? "bg-[#fff9c4] text-[#2d2d2d] border-[3px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] rotate-1" 
          : "text-[#2d2d2d]/70 hover:bg-[#e8f4f8] hover:text-[#2d2d2d] border-[3px] border-transparent hover:border-[#2d2d2d] hover:shadow-[2px_2px_0_0_#2d2d2d] hover:-rotate-1"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

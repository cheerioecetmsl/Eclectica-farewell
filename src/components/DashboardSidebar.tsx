"use client";

import { useState, useEffect } from "react";
import { 
  Home, 
  MessageSquare, 
  Zap, 
  Ghost, 
  Image as ImageIcon, 
  Trophy, 
  Settings, 
  Menu,
  X,
  LogOut,
  ChevronRight,
  Calendar,
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
// We no longer have LogoutModal, using a standard confirm dialog like the Hand-Drawn one used temporarily.

const navItems = [
  { name: "Dashboard Hub", href: "/dashboard", icon: Home, id: "home-nav" },
  { name: "Community Chat", href: "/dashboard/chat", icon: MessageSquare, id: "chat-nav" },
  { name: "Anonymous Wall", href: "/dashboard/anonymous-wall", icon: Ghost, id: "wall-nav" },
  { name: "Image Archive", href: "/dashboard/archive/images", icon: ImageIcon, id: "archive-img-nav" },
  { name: "Video Archive", href: "/dashboard/archive/videos", icon: Zap, id: "archive-vid-nav" },
  { name: "Upload Image", href: "/dashboard/upload/image", icon: ImageIcon, id: "upload-img-nav" },
  { name: "Upload Video", href: "/dashboard/upload/video", icon: Zap, id: "upload-vid-nav" },
  { name: "Events", href: "/dashboard/events", icon: Calendar, id: "events-nav" },
  { name: "Community", href: "/dashboard/community", icon: Users, id: "community-nav" },
  { name: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy, id: "leaderboard-nav" },
];

export const DashboardSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarHeight, setSidebarHeight] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateHeight = () => setSidebarHeight(window.innerHeight);
    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isMounted) return null;

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      router.push("/");
    } catch (err) {
      console.error(err);
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className={`fixed top-0 left-0 right-0 z-[40] lg:hidden bg-[#fdfbf7]/90 backdrop-blur-md border-b-[3px] border-[#2d2d2d]/10 flex items-center justify-between px-4 py-3 ${isExpanded ? 'hidden' : ''}`}>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsExpanded(true)}
            className={`p-2 rounded-xl transition-all duration-300 hover:bg-[#d4af37]/10 active:scale-95`}
            style={{ color: '#6b4423' }}
          >
            <Menu size={26} />
          </button>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#8e6b4e] leading-tight">Eclectica</span>
            <span className="text-lg font-bold font-kalam tracking-[0.1em] text-[#6b4423] leading-tight">Farewell</span>
          </div>
        </div>
      </div>

      {/* Blur Overlay — soft parchment tint */}
      <div 
        className={`fixed inset-0 transition-opacity duration-500 z-[55] ${
          isExpanded ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ backdropFilter: isExpanded ? 'blur(20px)' : 'none', background: 'rgba(245,230,204,0.4)' }}
        onClick={() => setIsExpanded(false)}
      />

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 z-[60] transition-all duration-700 ease-in-out flex flex-col
          lg:border-r lg:translate-y-0
          w-full h-[100dvh] overflow-hidden
          ${isExpanded 
            ? "translate-y-0 opacity-100 lg:w-64" 
            : "-translate-y-full opacity-0 lg:opacity-100 lg:translate-x-0 lg:w-20"
          }
        `}
        style={{
          height: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${sidebarHeight}px` : undefined,
          /* Collapsed: near-invisible glass */
          /* Expanded: solid parchment panel */
          background: isExpanded
            ? 'rgba(245, 230, 204, 0.95)'
            : 'rgba(245, 230, 204, 0.3)',
          backdropFilter: isExpanded ? 'blur(24px)' : 'blur(8px)',
          WebkitBackdropFilter: isExpanded ? 'blur(24px)' : 'blur(8px)',
          borderColor: 'rgba(212, 175, 55, 0.2)',
          boxShadow: isExpanded
            ? '4px 0 40px rgba(107, 68, 35, 0.15)'
            : '2px 0 16px rgba(107, 68, 35, 0.06)',
        }}
      >
        {/* Close Button */}
        <button 
          onClick={() => setIsExpanded(false)}
          className={`absolute top-6 right-4 p-2 rounded-full transition-all z-[70] ${
            isExpanded ? "opacity-100 scale-100" : "opacity-0 scale-0 pointer-events-none"
          }`}
          style={{ color: '#6b4423', background: 'rgba(212,175,55,0.15)' }}
        >
          <X size={24} />
        </button>

        {/* Header Branding */}
        <div className={`h-24 flex items-center transition-all duration-500 ${isExpanded ? "px-8" : "justify-center"}`}>
          {isExpanded ? (
            <div className="flex flex-col pt-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8e6b4e]">Eclectica</span>
              <span className="text-xl font-bold font-kalam tracking-[0.1em] text-[#6b4423]">Farewell</span>
            </div>
          ) : (
             <button
               onClick={() => setIsExpanded(true)}
               className="p-3 rounded-2xl transition-all hover:bg-[#d4af37]/10 text-[#6b4423]"
             >
               <Menu size={24} />
             </button>
          )}
        </div>

        {/* Scrollable Nav Area */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style dangerouslySetInnerHTML={{__html: `
            div::-webkit-scrollbar { display: none; }
          `}} />
          <nav className={`mt-4 lg:mt-6 flex flex-col h-auto pb-8 ${isExpanded ? "items-stretch px-6" : "items-center"}`}>
          <div className={`space-y-3 lg:space-y-4 ${isExpanded ? "w-full" : ""}`}>
            {navItems.map((item) => {
              const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <div key={item.name} id={item.id} className={`flex flex-col relative ${isExpanded ? "w-full" : "items-center"}`}>
                  <a 
                    href={item.href}
                    onClick={() => setIsExpanded(false)}
                    className={`flex items-center rounded-2xl transition-all duration-300 ${
                      isExpanded ? "w-full p-4 gap-5" : "w-12 h-12 justify-center"
                    }`}
                    style={isActive ? {
                      background: '#d4af37', /* gold-primary */
                      color: '#fdfbf7',
                      boxShadow: '0 0 18px rgba(212,175,55,0.35)',
                    } : {
                      color: '#6b4423', /* brown-primary */
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.18)'; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <Icon size={isExpanded ? 24 : 22} className="flex-shrink-0" />
                    {isExpanded && (
                      <span className="font-bold tracking-widest uppercase text-xs">
                        {item.name}
                      </span>
                    )}
                  </a>
                </div>
              );
            })}

            </div>
          </nav>
        </div>

        {/* Frozen Bottom Section (Settings & Logout) */}
        <div className={`flex-shrink-0 flex flex-col pb-6 pt-4 bg-transparent transition-all duration-500 ${isExpanded ? "px-6 items-stretch" : "items-center"}`}>
          {isExpanded && <div className="h-px w-full mb-4 bg-[#6b4423]/15" />}
          
          <Link 
            href="/dashboard/settings"
            className={`flex items-center rounded-2xl transition-all duration-300 mb-2 ${
              isExpanded ? "w-full p-4 gap-5" : "w-12 h-12 justify-center"
            }`}
            style={{ color: '#6b4423' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.18)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Settings size={isExpanded ? 24 : 22} className="flex-shrink-0" />
            {isExpanded && <span className="font-bold tracking-widest uppercase text-xs">Settings</span>}
          </Link>

          <button 
            onClick={() => setShowLogoutModal(true)}
            className={`flex items-center gap-5 rounded-2xl text-red-600/80 hover:text-red-600 hover:bg-red-500/10 transition-all duration-500 ${
              isExpanded ? "w-full p-4 justify-start" : "w-12 h-12 justify-center"
            }`}
          >
            <LogOut size={isExpanded ? 24 : 20} className="flex-shrink-0" />
            {isExpanded && <span className="font-bold uppercase tracking-widest text-[10px]">Logout Account</span>}
          </button>
        </div>
      </aside>

      {/* Hand-Drawn Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#2d2d2d]/20 backdrop-blur-sm" 
            onClick={() => !isLoggingOut && setShowLogoutModal(false)}
          />
          <div className="relative hand-card bg-white p-8 max-w-sm text-center space-y-6 animate-in zoom-in-95 -rotate-1 border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d]">
            <div className="tack-decoration" />
            <div className="w-16 h-16 bg-[#ff4d4d] border-[3px] border-[#2d2d2d] rounded-full flex items-center justify-center text-white mx-auto shadow-[4px_4px_0_0_#2d2d2d] rotate-3">
              <LogOut size={32} strokeWidth={2.5} className="-ml-1" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold font-kalam text-[#2d2d2d]">Leaving so soon?</h2>
              <p className="font-patrick text-xl text-[#2d2d2d]/80 leading-snug">
                Are you sure you want to log out of the archives?
              </p>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button 
                disabled={isLoggingOut}
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 bg-white border-[2px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] font-patrick font-bold text-lg uppercase tracking-widest hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#2d2d2d] transition-all disabled:opacity-50"
              >
                Stay
              </button>
              <button 
                disabled={isLoggingOut}
                onClick={handleLogoutConfirm}
                className="flex-1 py-3 bg-[#ff4d4d] text-white border-[2px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] font-patrick font-bold text-lg uppercase tracking-widest hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#2d2d2d] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoggingOut ? (
                  <><span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> ...</>
                ) : (
                  "Log Out"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

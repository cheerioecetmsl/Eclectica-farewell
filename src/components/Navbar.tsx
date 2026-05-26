"use client";

import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image"; // Stabilizes Next.js 16 module evaluation on Cloudflare
import { User as FirebaseUser } from "firebase/auth";

// @ts-ignore - Explicitly keep next/image in the bundle
const _unused = Image;

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Hide Navbar completely on dashboard routes to prevent clashing with Sidebar & mobile layout
  const isDashboard = pathname?.startsWith("/dashboard");

  const handleSignIn = useCallback(async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    
    try {
      const provider = new GoogleAuthProvider();
      // By not forcing 'select_account', Google will often auto-login if only one account exists
      const result = await signInWithPopup(auth, provider);
      
      setLoading(true); // Show loading while checking DB
      const docRef = doc(db, "users", result.user.uid);
      const docSnap = await getDoc(docRef);
      
      // Set the auth-token cookie so proxy.ts allows the redirect
      document.cookie = `auth-token=${await result.user.getIdToken()}; path=/; max-age=86400;`;

      if (docSnap.exists() && docSnap.data()?.hasSeenTutorial) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err as { code?: string }).code !== "auth/cancelled-popup-request") {
        console.error("Auth Error:", err);
      }
      setLoading(false);
    } finally {
      setIsSigningIn(false);
    }
  }, [isSigningIn, router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    const handleOpenAuth = () => handleSignIn();
    window.addEventListener('open-auth', handleOpenAuth);

    return () => {
      unsubscribe();
      window.removeEventListener('open-auth', handleOpenAuth);
    };
  }, [handleSignIn]);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isDashboard) return null;

  const isHome = pathname === "/";

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-[110] px-4 md:px-8 py-4 md:py-6 flex justify-between items-center transition-all duration-700 ${
        isHome 
          ? (isScrolled ? "bg-[#fdfbf7]/90 backdrop-blur-xl border-b-[3px] border-[#2d2d2d] shadow-hard-sm" : "bg-transparent")
          : "theme-cinematic-navbar shadow-md"
      }`}
      style={!isHome ? { backgroundColor: 'var(--color-brown-primary)', borderBottom: '1px solid var(--color-gold-soft)' } : {}}
    >
      <Link href="/" prefetch={false} className="flex items-center gap-4 group">
        <span 
          className={`text-sm sm:text-base md:text-2xl font-bold tracking-wider md:tracking-widest pl-1 md:pl-2 transition-all ${isHome ? 'font-kalam text-[#2d2d2d]' : 'serif'}`}
          style={!isHome ? { color: 'var(--color-gold-primary)' } : {}}
        >
          ECLECTICA <span style={!isHome ? { color: 'var(--color-gold-soft)' } : {}}>FAREWELL</span>
        </span>
      </Link>
 
      <div className="flex items-center gap-4">
        {!loading && (
          user ? (
            <Link 
              href="/#dashboard"
              prefetch={false}
              className={isHome ? "hand-card-yellow px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-base font-bold uppercase tracking-wide md:tracking-widest font-patrick hover:-translate-y-1 transition-transform rotate-1" : "theme-cinematic-btn-primary px-6 py-2 rounded-full text-[10px] md:text-sm font-bold uppercase tracking-wider"}
            >
              Dashboard ➔
            </Link>
          ) : (
            <button 
              onClick={handleSignIn}
              disabled={isSigningIn}
              className={isHome ? "hand-card-yellow px-4 md:px-6 py-2 md:py-2.5 text-xs md:text-base border-[3px] border-[#2d2d2d] shadow-hard font-bold uppercase tracking-wide md:tracking-widest font-patrick hover:-translate-y-1 transition-transform rotate-2 disabled:opacity-50 flex items-center gap-2" : "theme-cinematic-btn-secondary px-6 py-2 rounded-full text-[10px] md:text-sm font-bold uppercase tracking-wider disabled:opacity-50"}
            >
              {isSigningIn ? "Wait..." : "Sign the Register ✒"}
            </button>
          )
        )}
      </div>
    </nav>
  );
};

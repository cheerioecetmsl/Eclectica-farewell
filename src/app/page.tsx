"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { HeroCollage } from "@/components/ui/modern-hero-section";
import { Loader2, LogIn } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Set the auth-token cookie so proxy.ts allows the redirect
          document.cookie = `auth-token=${await user.getIdToken()}; path=/; max-age=86400;`;
          
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists() && docSnap.data()?.hasSeenTutorial) {
            router.push("/dashboard");
            return; // Stay in checking state while redirecting
          } else {
            router.push("/onboarding");
            return;
          }
        } catch (err) {
          console.error("Session check error:", err);
          setCheckingSession(false);
          setIsLoggingIn(false);
        }
      } else {
        setCheckingSession(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle redirect
    } catch (error) {
      console.error("Authentication failed:", error);
      setIsLoggingIn(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="fixed inset-0 bg-[#fdfbf7] flex items-center justify-center z-[200]">
        <div className="flex flex-col items-center gap-6">
           <div className="w-16 h-16 border-4 border-[#2d2d2d] border-t-transparent rounded-full animate-spin" />
           <p className="font-kalam font-bold text-3xl text-[#2d2d2d] animate-pulse">Checking the Archives...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fdfbf7] flex flex-col selection:bg-[#fff9c4] relative">
      
      <HeroCollage 
        title={<><span>Memories</span> <span>Forever</span></>}
        subtitle="The Batch of 2026 Interactive Scrapbook"
        stats={[
          { value: "4", label: "Years of Legacy" },
          { value: "♾️", label: "Memories Made" }
        ]}
      />
      
      {/* Hand-drawn background grid (subtle) */}
      <div className="absolute inset-0 pointer-events-none flex justify-center items-center opacity-[0.03] z-[-1]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2d2d2d" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
    </main>
  );
}

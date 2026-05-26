"use client";

import { auth } from "@/lib/firebase";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithCredential,
  signInWithEmailAndPassword 
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import GoogleAuthScript from "@/components/GoogleAuthScript";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const isCheckingRedirect = useRef(false);

  const handleUserRouting = async (user: any) => {
    try {
      // Set the auth-token cookie so proxy.ts allows the redirect
      document.cookie = `auth-token=${await user.getIdToken()}; path=/; max-age=86400;`;
      
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data()?.hasSeenTutorial) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (err) {
      console.error("Error checking user existence:", err);
      router.push("/onboarding"); // fallback
    }
  };

  // 1. Monitor Auth State directly (Robust fallback for PWA redirect issues)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !isProcessing) {
        console.log("Auth state detected user:", user.email);
        handleUserRouting(user);
      }
    });
    return () => unsubscribe();
  }, [router, isProcessing]);

  // 2. Google One Tap / Credential Manager Integration
  useEffect(() => {
    const initializeOneTap = () => {
      if (typeof window === "undefined" || !(window as any).google) return;

      const client_id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!client_id) {
        console.warn("Google Client ID missing. One Tap disabled.");
        return;
      }

      (window as any).google.accounts.id.initialize({
        client_id: client_id,
        callback: async (response: any) => {
          try {
            setIsProcessing(true);
            const credential = GoogleAuthProvider.credential(response.credential);
            const userCredential = await signInWithCredential(auth, credential);
            await handleUserRouting(userCredential.user);
          } catch (err: any) {
            console.error("One Tap Login Error:", err);
            setError(err.message || "Native sign-in failed.");
          } finally {
            setIsProcessing(false);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          console.warn("One Tap not displayed:", notification.getNotDisplayedReason());
        }
      });
    };

    // Wait for GIS script to load
    const checkGis = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        clearInterval(checkGis);
        initializeOneTap();
      }
    }, 500);

    return () => clearInterval(checkGis);
  }, [router]);

  const handleGoogleSignIn = async () => {
    try {
      setIsProcessing(true);
      setError("");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      
      console.log("Attempting Google Sign-In with Popup...");
      try {
        const userCredential = await signInWithPopup(auth, provider);
        await handleUserRouting(userCredential.user);
      } catch (popupError: any) {
        console.error("Popup sign-in error:", popupError);
        
        if (popupError.code === 'auth/popup-blocked') {
          setError("The sign-in popup was blocked by your browser. Please enable popups or use the 'Continue with Google' button again.");
        } else if (popupError.code === 'auth/cancelled-popup-request') {
          // User closed the popup, no need to show error
        } else {
          setError(popupError.message || "An error occurred during Google Sign-In.");
        }
      }
    } catch (err: unknown) {
      console.error("Google Sign-In Error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleUserRouting(userCredential.user);
    } catch (err: unknown) {
      setError("Invalid email or password. Please try again.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-parchment relative">
      <GoogleAuthScript />
      <div className="glass-card p-8 md:p-12 rounded-3xl w-full max-w-md text-center border-gold/30">
        <h1 className="text-4xl font-bold mb-2 text-brown-primary serif">Welcome</h1>
        <p className="text-brown-secondary/60 mb-8 italic serif">Begin your Eclectica journey</p>

        {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

        <button 
          onClick={handleGoogleSignIn}
          disabled={isProcessing}
          className="w-full mb-4 flex items-center justify-center gap-3 bg-white text-black border border-brown-primary/10 py-3 rounded-lg hover:bg-gray-50 transition-all font-medium disabled:opacity-50"
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-gold-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
              className="w-5 h-5" 
            />
          )}
          {isProcessing ? "Authenticating..." : "Continue with Google"}
        </button>

        <div className="flex items-center gap-4 my-6">
          <div className="h-px flex-1 bg-brown-primary/10" />
          <span className="text-brown-secondary/40 text-sm">OR</span>
          <div className="h-px flex-1 bg-brown-primary/10" />
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium text-brown-secondary/70 mb-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/50 border border-brown-primary/10 rounded-lg p-3 outline-none focus:border-gold-primary transition-all text-black"
              placeholder="name@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brown-secondary/70 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/50 border border-brown-primary/10 rounded-lg p-3 outline-none focus:border-gold-primary transition-all text-black"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit"
            className="gold-button w-full py-3 rounded-lg font-bold tracking-widest uppercase mt-4"
          >
            Sign In
          </button>
        </form>

        <p className="mt-8 text-brown-secondary/50 text-xs serif italic">
          By continuing, you agree to join the 2026 Farewell legacy.
        </p>
      </div>
    </main>
  );
}

"use client";

import { useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export function PresenceTracker() {
  useEffect(() => {
    console.log("PresenceTracker: Component mounted");
    console.log("PresenceTracker: Current Auth instance:", !!auth);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("PresenceTracker: Auth state changed. User:", user ? user.uid : "None");
      
      if (user) {
        const userRef = doc(db, "users", user.uid);
        console.log("PresenceTracker: Tracking presence for UID:", user.uid);
        
        // Initial mark as online
        const setOnline = () => {
          setDoc(userRef, {
            isOnline: true,
            presence: 'online',
            onlineSince: serverTimestamp(),
            lastSeen: serverTimestamp()
          }, { merge: true })
          .then(() => console.log("PresenceTracker: Successfully marked ONLINE"))
          .catch(err => console.error("Presence Error (Online):", err));
        };

        const setOffline = () => {
          setDoc(userRef, {
            isOnline: false,
            presence: 'offline',
            lastSeen: serverTimestamp()
          }, { merge: true })
          .then(() => console.log("PresenceTracker: Successfully marked OFFLINE"))
          .catch(err => console.error("Presence Error (Offline):", err));
        };

        // Mark as online on startup
        setOnline();

        // Heartbeat every 30 seconds to keep lastSeen fresh
        const heartbeat = setInterval(() => {
          if (document.visibilityState === 'visible') {
            setDoc(userRef, {
              lastSeen: serverTimestamp()
            }, { merge: true }).catch(err => console.error("Heartbeat Error:", err));
          }
        }, 30000);

        const handlePresence = () => {
          if (document.visibilityState === 'hidden') {
            console.log("PresenceTracker: Tab hidden, marking OFFLINE");
            setOffline();
          } else {
            console.log("PresenceTracker: Tab visible, marking ONLINE");
            setOnline();
          }
        };

        const handleUnload = () => {
          setOffline();
        };

        window.addEventListener("beforeunload", handleUnload);
        document.addEventListener("visibilitychange", handlePresence);

        return () => {
          clearInterval(heartbeat);
          window.removeEventListener("beforeunload", handleUnload);
          document.removeEventListener("visibilitychange", handlePresence);
          setOffline();
        };

      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}

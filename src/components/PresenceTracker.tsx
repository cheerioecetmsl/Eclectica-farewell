"use client";

import { useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
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
          updateDoc(userRef, {
            isOnline: true,
            presence: 'online',
            onlineSince: serverTimestamp(),
            lastSeen: serverTimestamp()
          })
          .then(() => console.log("PresenceTracker: Successfully marked ONLINE"))
          .catch(err => {
            // Silently ignore errors during onboarding when doc doesn't exist yet
            console.log("PresenceTracker: User profile document not yet initialized (normal during onboarding).");
          });
        };

        const setOffline = () => {
          updateDoc(userRef, {
            isOnline: false,
            presence: 'offline',
            lastSeen: serverTimestamp()
          })
          .then(() => console.log("PresenceTracker: Successfully marked OFFLINE"))
          .catch(err => {
            console.log("PresenceTracker: User profile document not yet initialized.");
          });
        };

        // Mark as online on startup
        setOnline();

        // Heartbeat every 30 seconds to keep lastSeen fresh
        const heartbeat = setInterval(() => {
          if (document.visibilityState === 'visible') {
            updateDoc(userRef, {
              lastSeen: serverTimestamp()
            }).catch(err => {
              // Ignore heartbeat errors during onboarding
            });
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

"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2, ArrowLeft, Users, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Teammate {
  uid: string;
  name: string;
  photoURL: string;
}

export default function ChaseColoursEvent() {
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRejected, setIsRejected] = useState(false);

  const [teamMembers, setTeamMembers] = useState<Teammate[]>([]);
  const [teamName, setTeamName] = useState("");
  const [teamColor, setTeamColor] = useState("#2d2d2d");
  
  const [entries, setEntries] = useState<any[]>([]);
  const [entryLimit, setEntryLimit] = useState<number>(5);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setEntryLimit(data.entryLimit || 5);
          
          if (data.year !== "4th Year") {
            setIsRejected(true);
            setLoading(false);
            return;
          }

          // Fetch team info
          if (data.teamId) {
            setTeamName(data.teamId === "team1" ? "Team 1" : data.teamId === "team2" ? "Team 2" : data.teamId === "team3" ? "Team 3" : "Team 4");
            setTeamColor(data.teamColor || "#2d2d2d");
            fetchTeammates(data.teamId);
          } else {
            setLoading(false);
          }

          // Fetch user's entries
          fetchEntries(user.uid);
        } else {
          router.push("/onboarding");
        }
      } else {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchEntries = async (uid: string) => {
    try {
      const q = query(collection(db, "archives"), where("userId", "==", uid), where("isEntry", "==", true));
      const snap = await getDocs(q);
      const userEntries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setEntries(userEntries);
    } catch (err) {
      console.error("Failed to fetch entries", err);
    }
  };

  const fetchTeammates = async (teamId: string) => {
    try {
      const q = query(collection(db, "users"), where("teamId", "==", teamId));
      const snap = await getDocs(q);
      const members = snap.docs.map(d => ({ uid: d.id, ...d.data() } as Teammate));
      setTeamMembers(members);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
        <Loader2 className="w-16 h-16 text-[#2d2d2d] animate-spin" strokeWidth={2.5} />
      </div>
    );
  }

  // --- REJECTION MODAL ---
  if (isRejected) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#fdfbf7]/80 backdrop-blur-md">
        <div className="hand-card p-10 max-w-md w-full text-center bg-white border-[3px] border-[#2d2d2d] shadow-hard animate-in fade-in zoom-in duration-300">
          <div className="tack-decoration" />
          <h2 className="text-4xl font-bold font-kalam text-red-500 mb-6 -rotate-2">Hold up!</h2>
          <p className="text-xl font-patrick text-[#2d2d2d] mb-8 leading-relaxed">
            Ahem... You're 1 year early, kiddo! 😜<br/><br/>
            The grand auction is for 4th Years only.
          </p>
          <button 
            onClick={() => router.push("/dashboard/events")}
            className="theme-cinematic-btn-secondary px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider w-full"
          >
            Take me back
          </button>
        </div>
      </div>
    );
  }

  if (!userData?.teamId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#fdfbf7] p-6 text-center">
        <h1 className="text-4xl font-kalam font-bold mb-4">The Auction is Ongoing...</h1>
        <p className="text-xl font-patrick text-[#2d2d2d]/60 mb-8">You haven't been drafted to a team yet.</p>
        <Link href="/dashboard/events" className="underline font-bold font-patrick text-lg hover:text-[#ff4d4d] transition-colors">Return to Events</Link>
      </main>
    );
  }

  const getContrastColor = (hex: string) => {
    const c = hex.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >>  8) & 0xff;
    const b = (rgb >>  0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 128 ? '#ffffff' : '#000000';
  };

  const textColor = getContrastColor(teamColor);

  return (
    <main className="min-h-screen py-16 px-6 relative bg-[#fdfbf7] overflow-hidden">
      {/* Background Splash */}
      <div 
        className="absolute top-0 left-0 right-0 h-[45vh] opacity-20 pointer-events-none transition-colors duration-1000"
        style={{ background: `linear-gradient(to bottom, ${teamColor}, transparent)` }}
      />

      <div className="max-w-4xl mx-auto space-y-12 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Header */}
        <div className="text-center space-y-8">
          <Link 
            href="/dashboard/events" 
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full border-2 border-[#2d2d2d]/20 hover:border-[#2d2d2d] hover:bg-[#2d2d2d] hover:text-[#fdfbf7] transition-all font-bold tracking-widest text-sm uppercase"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Link>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold font-kalam text-[#2d2d2d] drop-shadow-sm -rotate-1">
              Chase the Colours
            </h1>
            <h2 className="text-2xl md:text-3xl font-patrick text-[#2d2d2d]/70 rotate-1">
              Not Your Ex
            </h2>
          </div>
        </div>

        {/* Team Banner */}
        <div 
          className="rounded-3xl border-4 shadow-hard overflow-hidden flex flex-col md:flex-row items-center p-8 md:p-12 gap-8 text-center md:text-left transition-colors duration-500"
          style={{ borderColor: teamColor, backgroundColor: teamColor, color: textColor }}
        >
          <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center flex-shrink-0 bg-black/10" style={{ borderColor: textColor }}>
            <Trophy className="w-12 h-12" style={{ color: textColor }} />
          </div>
          <div>
            <p className="text-sm md:text-base font-bold uppercase tracking-widest mb-2 opacity-80">You have been drafted to</p>
            <h2 className="text-5xl md:text-7xl font-black font-kalam drop-shadow-sm">{teamName}</h2>
          </div>
        </div>

        {/* Teammates Grid */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold font-kalam text-[#2d2d2d] flex items-center gap-3">
            <Users className="text-[#2d2d2d]" /> 
            Your Squad ({teamMembers.length}/5)
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {teamMembers.map((member, i) => {
              const isMe = member.uid === currentUser?.uid;
              return (
                <div
                  key={member.uid}
                  className="hand-card p-6 flex flex-col items-center gap-4 bg-white border-[3px] shadow-hard relative transition-transform hover:-translate-y-2 hover:shadow-[8px_8px_0_0_#2d2d2d] duration-200"
                  style={isMe ? { boxShadow: `0 0 0 4px #fdfbf7, 0 0 0 8px ${teamColor}` } : {}}
                >
                  {isMe && (
                    <div className="absolute top-2 right-2 rotate-12 text-xs px-2 py-1 rounded font-bold font-kalam text-white shadow-sm" style={{ backgroundColor: teamColor }}>
                      YOU
                    </div>
                  )}
                  
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4" style={{ borderColor: teamColor }}>
                    {member.photoURL ? (
                      <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#f0f0f0] flex items-center justify-center">
                        <Users className="text-[#2d2d2d]/30 w-8 h-8" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center w-full">
                    <h4 className="font-bold font-kalam text-xl leading-tight truncate">{member.name}</h4>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Your Entries Grid */}
        <div className="space-y-6 pt-8 border-t-[3px] border-[#2d2d2d]/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <h3 className="text-2xl font-bold font-kalam text-[#2d2d2d] flex items-center gap-3">
              <Trophy className="text-[#2d2d2d]" /> 
              Your Competition Entries
            </h3>
            <div className="bg-white border-[2px] border-[#2d2d2d] px-4 py-2 rounded-full font-bold font-patrick text-sm shadow-[2px_2px_0_0_#2d2d2d]">
              {entries.length} / {entryLimit} Entries Used
            </div>
          </div>
          
          {entries.length === 0 ? (
            <div className="hand-card bg-white p-8 border-[3px] border-[#2d2d2d] shadow-hard text-center">
              <p className="text-lg font-patrick text-[#2d2d2d]/70">You haven't submitted any entries yet.</p>
              <Link href="/dashboard/upload/image" className="inline-block mt-4 px-6 py-2 bg-[#ffca28] hover:bg-[#ffe066] border-[2px] border-[#2d2d2d] rounded-full font-bold font-patrick shadow-[2px_2px_0_0_#2d2d2d] hover:-translate-y-1 transition-transform uppercase">
                Submit an Entry
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {entries.map(entry => {
                const isApproved = entry.status === "approved";
                const isRejected = entry.status === "rejected";
                const isPending = entry.status === "pending" || !entry.status;
                
                return (
                  <div key={entry.id} className="relative aspect-square rounded-[var(--radius-wobbly)] overflow-hidden border-[3px] border-[#2d2d2d] bg-white group shadow-[4px_4px_0_0_#2d2d2d] hover:-translate-y-1 transition-transform">
                    <img src={entry.url} alt="Entry" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-2 right-2">
                      {isApproved && <span className="bg-[#4caf50] text-white px-2 py-1 rounded text-xs font-bold font-patrick border-[2px] border-[#2d2d2d] shadow-sm uppercase tracking-wider">Approved</span>}
                      {isRejected && <span className="bg-[#f44336] text-white px-2 py-1 rounded text-xs font-bold font-patrick border-[2px] border-[#2d2d2d] shadow-sm uppercase tracking-wider">Rejected</span>}
                      {isPending && <span className="bg-[#ffca28] text-[#2d2d2d] px-2 py-1 rounded text-xs font-bold font-patrick border-[2px] border-[#2d2d2d] shadow-sm uppercase tracking-wider">Pending</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

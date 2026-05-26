"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Crown, User, Loader2 } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, query, onSnapshot, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { CheerioImage } from "@/lib/imageVariants";
import { formatXP, calculateLevel } from "@/lib/xp";

interface LeaderboardUser {
  id: string;
  name: string;
  xp: number;
  level: number;
  count: number;
  photoURL?: string;
  photoBaseId?: string;
  email?: string;
}

export function LeaderboardWidget() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myData, setMyData] = useState<LeaderboardUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // No orderBy in the Firestore query — avoids needing a composite index.
    // We fetch up to 200 users and sort client-side instead.
    const q = query(collection(db, "users"), limit(200));

    const unsub = onSnapshot(q, (snapshot) => {
      const list: LeaderboardUser[] = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          name: doc.data().name || doc.data().displayName || "Anonymous",
          xp: doc.data().xp || 0,
          level: calculateLevel(doc.data().xp || 0).level,
          count: doc.data().contributions || doc.data().photoCount || doc.data().count || 0,
          photoURL: doc.data().photoURL || doc.data().imageURL,
          photoBaseId: doc.data().photoBaseId,
          email: doc.data().email,
        }))
        .sort((a, b) => b.xp - a.xp);
      setUsers(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leaderboard:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUserId || users.length === 0) return;
    const idx = users.findIndex((u) => u.id === currentUserId);
    if (idx !== -1) {
      setMyRank(idx + 1);
      setMyData(users[idx]);
    }
  }, [users, currentUserId]);

  if (!mounted || loading) {
    return (
      <div className="hand-card p-6 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin mb-4" />
        <p className="font-patrick font-bold text-[#2d2d2d]/60 text-lg">Fetching Ranks...</p>
      </div>
    );
  }


  const top5 = users.slice(0, 5);

  const Avatar = ({ user, size = 48 }: { user: LeaderboardUser; size?: number }) => (
    <div
      className="relative rounded-full overflow-hidden bg-[#fff9c4] border-[3px] border-[#2d2d2d] flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_#2d2d2d]"
      style={{ width: size, height: size }}
    >
      {user.photoURL || user.photoBaseId ? (
        <CheerioImage
          src={user.photoURL || ""}
          baseId={user.photoBaseId}
          variant="avatar"
          alt={user.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-patrick font-bold text-[#2d2d2d] uppercase" style={{ fontSize: size / 2 }}>
          {user.name.charAt(0)}
        </span>
      )}
    </div>
  );

  const getRankDecoration = (rank: number) => {
    if (rank === 1) return { icon: <Crown size={16} className="text-[#d4af37]" strokeWidth={2.5} />, bg: "bg-[#fff9c4] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d]" };
    if (rank === 2) return { icon: <Medal size={16} className="text-[#a0aec0]" strokeWidth={2.5} />, bg: "bg-white border-[#2d2d2d]/30" };
    if (rank === 3) return { icon: <Medal size={16} className="text-[#cd7f32]" strokeWidth={2.5} />, bg: "bg-white border-[#2d2d2d]/30" };
    return { icon: <span className="text-sm font-bold text-[#2d2d2d]/50 font-kalam">#{rank}</span>, bg: "bg-white border-[#2d2d2d]/20" };
  };

  return (
    <div className="hand-card p-6 lg:p-8 relative">
      {/* Decorative Tape */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/40 backdrop-blur-sm border-2 border-[#2d2d2d]/20 -rotate-2 transform z-10 shadow-sm" />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[var(--radius-wobbly)] bg-[#fff9c4] border-[3px] border-[#2d2d2d] flex items-center justify-center text-[#d4af37] shadow-[2px_2px_0_0_#2d2d2d] -rotate-6">
          <Trophy size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-2xl font-kalam font-bold tracking-wide text-[#2d2d2d] leading-none">Leaderboard</h2>
          <p className="font-patrick text-[#2d2d2d]/60 text-sm">Top Archivists</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 border-[3px] border-dashed border-[#2d2d2d]/20 rounded-[var(--radius-wobbly)]">
          <p className="font-patrick font-bold text-[#2d2d2d]/60 text-lg">No archivists ranked yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {top5.map((user, i) => {
            const rank = i + 1;
            const isMe = user.id === currentUserId;
            const { icon, bg } = getRankDecoration(rank);
            return (
              <div
                key={user.id}
                className={`flex items-center gap-3 p-3 rounded-[var(--radius-wobbly)] border-[2px] transition-all hover:-translate-y-0.5 ${
                  isMe ? "bg-[#fff9c4] border-[#2d2d2d] shadow-[3px_3px_0_0_#2d2d2d]" : `${bg} border-[#2d2d2d]/20`
                }`}
              >
                <div className="w-6 flex items-center justify-center shrink-0">{icon}</div>

                <Avatar user={user} size={36} />

                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-patrick font-bold text-[#2d2d2d] text-base truncate">{user.name}</h4>
                    {isMe && <span className="text-[10px] bg-[#2d2d2d] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">You</span>}
                  </div>
                  <p className="text-xs font-patrick text-[#2d2d2d]/60">Lv {user.level} · {user.count} Frames</p>
                </div>

                <div className="text-right font-bold text-[#2d2d2d] font-patrick shrink-0">
                  {formatXP(user.xp)} <span className="text-xs text-[#2d2d2d]/50">XP</span>
                </div>
              </div>
            );
          })}

          {/* My rank if outside top 5 */}
          {myRank && myRank > 5 && myData && (
            <>
              <div className="flex justify-center gap-1 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2d2d2d]/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#2d2d2d]/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#2d2d2d]/20" />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-[var(--radius-wobbly)] border-[2px] bg-[#fff9c4] border-[#2d2d2d] shadow-[3px_3px_0_0_#2d2d2d]">
                <div className="w-6 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#2d2d2d] font-kalam">#{myRank}</span>
                </div>
                <Avatar user={myData} size={36} />
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-patrick font-bold text-[#2d2d2d] text-base truncate">{myData.name}</h4>
                    <span className="text-[10px] bg-[#2d2d2d] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">You</span>
                  </div>
                  <p className="text-xs font-patrick text-[#2d2d2d]/60">Lv {myData.level} · {myData.count} Frames</p>
                </div>
                <div className="text-right font-bold text-[#2d2d2d] font-patrick shrink-0">
                  {formatXP(myData.xp)} <span className="text-xs text-[#2d2d2d]/50">XP</span>
                </div>
              </div>
            </>
          )}

          {!currentUserId && (
            <div className="flex justify-center p-4 border-[2px] border-dashed border-[#2d2d2d]/20 rounded-[var(--radius-wobbly)] bg-white/50">
              <p className="font-patrick font-bold text-[#2d2d2d]/60 flex items-center gap-2"><User size={16}/> Sign in to see your rank</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

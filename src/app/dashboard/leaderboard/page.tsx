"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Loader2, Crown, User } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
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

export default function LeaderboardPage() {
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
    // No orderBy — avoids a Firestore index requirement. Sort client-side.
    const q = query(collection(db, "users"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
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
      },
      (error) => {
        console.error("Leaderboard snapshot error:", error);
        setLoading(false);
      }
    );

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

  const top3 = users.slice(0, 3);
  const top5 = users.slice(0, 5);
  const isInTop5 = myRank !== null && myRank <= 5;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={20} className="text-[#ff8c00]" strokeWidth={2.5} />;
    if (rank === 2) return <Medal size={20} className="text-slate-400" strokeWidth={2.5} />;
    if (rank === 3) return <Medal size={20} className="text-amber-700" strokeWidth={2.5} />;
    return <span className="text-sm font-bold text-[#2d2d2d]/60 font-kalam">#{rank}</span>;
  };

  const Avatar = ({ user, size = 48, highlight = false }: { user: LeaderboardUser; size?: number, highlight?: boolean }) => (
    <div
      className={`relative rounded-full overflow-hidden flex items-center justify-center shrink-0 border-[3px] border-[#2d2d2d] bg-white ${highlight ? 'shadow-[4px_4px_0_0_#2d2d2d]' : 'shadow-[2px_2px_0_0_#2d2d2d]'}`}
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
        <span className="font-bold text-[#2d2d2d] uppercase font-kalam" style={{ fontSize: size / 2.5 }}>
          {user.name.charAt(0)}
        </span>
      )}
    </div>
  );

  if (!mounted || loading) {
    return (
      <main className="min-h-screen py-24 flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-[#2d2d2d] animate-spin" strokeWidth={2.5} />
      </main>
    );
  }

  return (
    <main className="py-8">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-6 hand-card bg-[#fff9c4] p-10 border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] rounded-full text-[#2d2d2d] text-sm font-bold font-patrick uppercase">
            <Trophy size={16} strokeWidth={2.5} /> The Hall of Legacy
          </div>
          <h1 className="text-5xl font-bold text-[#2d2d2d] font-kalam uppercase">Top Archivists</h1>
          <p className="text-[#2d2d2d]/80 font-patrick text-xl">
            Honoring those who have preserved the most frames of our story.
          </p>
          {users.length > 0 && (
            <p className="text-[#2d2d2d]/50 text-sm font-bold uppercase tracking-widest font-patrick">
              {users.length} Archivists Ranked
            </p>
          )}
        </div>

        {/* Podium / Top 3 */}
        {top3.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 items-end pt-8 px-4">
            
            {/* 2nd Place */}
            <div className="flex flex-col items-center space-y-3 group hover:-translate-y-2 transition-all">
              <Avatar user={top3[1]} size={72} />
              <p className="text-sm font-bold text-[#2d2d2d] uppercase font-kalam line-clamp-1 bg-white px-3 py-1 border-[2px] border-[#2d2d2d] rounded-full shadow-[2px_2px_0_0_#2d2d2d]">{top3[1].name}</p>
              <div className="h-32 w-full bg-[#fdfbf7] rounded-t-[var(--radius-wobbly)] border-[3px] border-b-0 border-[#2d2d2d] shadow-[4px_-4px_0_0_#2d2d2d] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-2 w-full h-2 border-b-[2px] border-dashed border-[#2d2d2d]/20" />
                <Medal size={24} className="text-slate-400 mb-2" strokeWidth={2.5} />
                <span className="text-lg font-bold text-[#2d2d2d] font-patrick">{formatXP(top3[1].xp)} XP</span>
                <span className="text-xs text-[#2d2d2d]/60 font-bold uppercase font-patrick">2nd Place</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center space-y-3 group hover:-translate-y-2 transition-all relative z-10">
              <div className="relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 animate-bounce">
                  <Crown size={32} className="text-[#ff8c00] fill-[#ffca28]" strokeWidth={2.5} />
                </div>
                <Avatar user={top3[0]} size={96} highlight={true} />
              </div>
              <p className="text-base font-bold text-[#2d2d2d] uppercase font-kalam line-clamp-1 bg-[#ffca28] px-4 py-1 border-[2px] border-[#2d2d2d] rounded-full shadow-[4px_4px_0_0_#2d2d2d]">{top3[0].name}</p>
              <div className="h-44 w-full bg-[#ffca28] rounded-t-[var(--radius-wobbly)] border-[3px] border-b-0 border-[#2d2d2d] shadow-[6px_-6px_0_0_#2d2d2d] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-2 w-full h-2 border-b-[2px] border-dashed border-[#2d2d2d]/20" />
                <div className="absolute top-8 w-full h-2 border-b-[2px] border-dashed border-[#2d2d2d]/20" />
                <Trophy size={40} className="text-[#2d2d2d] mb-2" strokeWidth={2.5} />
                <span className="text-2xl font-bold text-[#2d2d2d] font-patrick">{formatXP(top3[0].xp)} XP</span>
                <span className="text-sm text-[#2d2d2d]/80 font-bold uppercase font-patrick tracking-widest">1st Place</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center space-y-3 group hover:-translate-y-2 transition-all">
              <Avatar user={top3[2]} size={72} />
              <p className="text-sm font-bold text-[#2d2d2d] uppercase font-kalam line-clamp-1 bg-white px-3 py-1 border-[2px] border-[#2d2d2d] rounded-full shadow-[2px_2px_0_0_#2d2d2d]">{top3[2].name}</p>
              <div className="h-24 w-full bg-[#fdfbf7] rounded-t-[var(--radius-wobbly)] border-[3px] border-b-0 border-[#2d2d2d] shadow-[4px_-4px_0_0_#2d2d2d] flex flex-col items-center justify-center relative overflow-hidden">
                <Medal size={24} className="text-amber-700 mb-2" strokeWidth={2.5} />
                <span className="text-base font-bold text-[#2d2d2d] font-patrick">{formatXP(top3[2].xp)} XP</span>
                <span className="text-xs text-[#2d2d2d]/60 font-bold uppercase font-patrick">3rd Place</span>
              </div>
            </div>
          </div>
        )}

        {/* List Leaderboard */}
        {users.length === 0 ? (
          <div className="text-center py-24 border-[3px] border-dashed border-[#2d2d2d]/30 rounded-[var(--radius-wobbly)] bg-white">
            <p className="text-[#2d2d2d]/50 font-bold uppercase tracking-widest text-lg font-kalam">
              The archives are silent. No archivists yet.
            </p>
          </div>
        ) : (
          <div className="hand-card bg-white rounded-[var(--radius-wobbly)] border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d] overflow-hidden flex flex-col relative">
            {/* Top 5 rows */}
            {top5.map((user, i) => {
              const rank = i + 1;
              const isMe = user.id === currentUserId;
              return (
                <div
                  key={`rank-${user.id}-${rank}`}
                  className={`flex items-center gap-4 px-6 py-5 border-b-[2px] border-[#2d2d2d]/10 transition-colors ${
                    isMe
                      ? "bg-[#fff9c4] border-l-[6px] border-l-[#ffca28]"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 flex items-center justify-center shrink-0">
                    {getRankIcon(rank)}
                  </div>

                  {/* Avatar */}
                  <div className="shrink-0">
                    <Avatar user={user} size={48} highlight={isMe} />
                  </div>

                  {/* Name + Level */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold font-kalam text-[#2d2d2d] uppercase text-lg truncate">
                        {user.name}
                      </h3>
                      {isMe && (
                        <span className="shrink-0 text-xs font-bold font-patrick text-[#2d2d2d] bg-[#ffca28] border-[2px] border-[#2d2d2d] rounded-full px-3 py-0.5 uppercase tracking-widest">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#2d2d2d]/60 font-bold font-patrick uppercase tracking-widest">
                      Lv. {user.level} · {user.count} Frames
                    </p>
                  </div>

                  {/* XP */}
                  <div className="text-right shrink-0">
                    <div className="text-xl font-bold font-kalam text-[#2d2d2d]">
                      {formatXP(user.xp)}
                    </div>
                    <div className="text-xs font-bold text-[#2d2d2d]/50 font-patrick uppercase tracking-widest">XP</div>
                  </div>
                </div>
              );
            })}

            {/* Separator row */}
            <div className="flex items-center justify-center gap-4 px-6 py-4 bg-gray-50 border-b-[2px] border-[#2d2d2d]/10">
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2d2d2d]/20"></span>
                <span className="w-2 h-2 rounded-full bg-[#2d2d2d]/20"></span>
                <span className="w-2 h-2 rounded-full bg-[#2d2d2d]/20"></span>
              </div>
              {myRank && !isInTop5 && (
                <span className="text-sm font-bold font-patrick text-[#2d2d2d]/50 uppercase tracking-widest">
                  {myRank - 5} more above you
                </span>
              )}
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2d2d2d]/20"></span>
                <span className="w-2 h-2 rounded-full bg-[#2d2d2d]/20"></span>
                <span className="w-2 h-2 rounded-full bg-[#2d2d2d]/20"></span>
              </div>
            </div>

            {/* My rank row (6th row) */}
            {myData && myRank ? (
              <div className="flex items-center gap-4 px-6 py-5 bg-[#fff9c4] border-l-[6px] border-l-[#ffca28] border-t-[3px] border-t-[#2d2d2d]">
                <div className="w-8 flex items-center justify-center shrink-0">
                  {getRankIcon(myRank)}
                </div>

                <div className="shrink-0">
                  <Avatar user={myData} size={48} highlight={true} />
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold font-kalam text-[#2d2d2d] uppercase text-lg truncate">
                      {myData.name}
                    </h3>
                    <span className="shrink-0 text-xs font-bold font-patrick text-[#2d2d2d] bg-[#ffca28] border-[2px] border-[#2d2d2d] rounded-full px-3 py-0.5 uppercase tracking-widest">
                      You
                    </span>
                  </div>
                  <p className="text-sm text-[#2d2d2d]/60 font-bold font-patrick uppercase tracking-widest">
                    Lv. {myData.level} · {myData.count} Frames
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xl font-bold font-kalam text-[#2d2d2d]">
                    {formatXP(myData.xp)}
                  </div>
                  <div className="text-xs font-bold text-[#2d2d2d]/50 font-patrick uppercase tracking-widest">XP</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 px-6 py-6 text-[#2d2d2d]/50 bg-gray-50 border-t-[3px] border-t-[#2d2d2d]">
                <User size={20} strokeWidth={2.5} />
                <span className="text-sm font-bold font-patrick uppercase tracking-widest">Sign in to see your rank</span>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}

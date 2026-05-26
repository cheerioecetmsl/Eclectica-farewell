"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { GraduationCap, Search, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Member, classifyMember, MemberCard, MemberModal } from "../shared";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 5;

export default function MentorsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), snap => {
      const list: Member[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || data.displayName || "Anonymous",
          year: data.year || "",
          section: data.section || "",
          role: data.role || "",
          narrative: data.narrative || "",
          tags: data.tags || [],
          photoURL: data.photoURL || "",
          photoBaseId: data.photoBaseId,
          photoCount: data.photoCount || 0,
          xp: data.xp || 0,
          category: data.category || "STUDENT",
          gender: data.gender || "",
        };
      });
      // Filter & Sort
      const filtered = list.filter(m => classifyMember(m) === "mentors").sort((a, b) => b.xp - a.xp);
      setMembers(filtered);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Filter by search
  const searched = members.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      m.year.toLowerCase().includes(q) ||
      m.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(searched.length / PAGE_SIZE);
  const paginated = searched.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to page 1 on search
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-[#cc0000]/40 animate-spin" />
        <p className="font-patrick font-bold text-[#cc0000]/50 uppercase tracking-widest text-sm animate-pulse">Gathering Mentors...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      <Link href="/dashboard/community" className="inline-flex items-center gap-2 font-bold font-patrick uppercase tracking-widest text-[#2d2d2d]/50 hover:text-[#2d2d2d] transition-colors bg-white/50 px-4 py-2 rounded-full border-[2px] border-dashed border-[#2d2d2d]/20 hover:border-[#2d2d2d]">
        <ArrowLeft size={16} strokeWidth={2.5} /> Back to Community
      </Link>

      {/* Header */}
      <div className="hand-card bg-[#ffe8e8] border-[3px] border-[#ff4d4d] shadow-[6px_6px_0_0_#2d2d2d] p-6 md:p-10 flex flex-col sm:flex-row items-center sm:justify-between rounded-[var(--radius-wobbly)] gap-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 bg-[#ff4d4d] border-[3px] border-[#2d2d2d] rounded-[var(--radius-wobbly)] flex items-center justify-center text-white shadow-[4px_4px_0_0_#2d2d2d] -rotate-3">
            <GraduationCap size={40} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-kalam font-bold text-4xl md:text-5xl text-[#cc0000] mb-2">Mentors</h1>
            <p className="font-patrick text-[#2d2d2d]/60 text-lg">Faculty · The Guides</p>
          </div>
        </div>
        <div className="font-kalam font-bold text-5xl text-[#cc0000]">
          {members.length}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2d2d2d]/40" />
        <input
          type="text"
          placeholder="Search by name, role, tag..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border-[3px] border-[#2d2d2d] rounded-[var(--radius-wobbly)] shadow-[3px_3px_0_0_#2d2d2d] font-patrick text-[#2d2d2d] focus:outline-none focus:shadow-[5px_5px_0_0_#2d2d2d] transition-all"
        />
      </div>

      {/* Grid */}
      {paginated.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {paginated.map(m => (
              <MemberCard key={m.id} member={m} onClick={() => setSelectedMember(m)} />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <div className="py-24 border-[3px] border-dashed border-[#2d2d2d]/20 rounded-[var(--radius-wobbly)] text-center bg-white/30">
          <p className="font-patrick text-[#2d2d2d]/40 italic text-xl">
            {search ? "No members match your search." : "No mentors found."}
          </p>
        </div>
      )}

      {selectedMember && (
        <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </div>
  );
}

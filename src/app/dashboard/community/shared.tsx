"use client";

import { useState } from "react";
import { Users, X, Image as ImageIcon, Camera } from "lucide-react";
import { CheerioImage } from "@/lib/imageVariants";

export interface Member {
  id: string;
  name: string;
  year: string;
  section: string;
  role: string;
  narrative: string;
  tags: string[];
  photoURL: string;
  photoBaseId?: string;
  photoCount: number;
  xp: number;
  category: string;
  gender: string;
}

export type Division = "juniors" | "legends" | "mentors";

export const JUNIOR_YEARS = ["1st Year", "2nd Year", "3rd Year"];
export const LEGEND_YEARS = ["4th Year"];
export const MENTOR_YEARS = ["Faculty"];

export function classifyMember(m: Member): Division {
  if (LEGEND_YEARS.includes(m.year)) return "legends";
  if (MENTOR_YEARS.includes(m.year)) return "mentors";
  return "juniors";
}

export function MemberCard({ member, onClick }: { member: Member; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer hand-card bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] overflow-hidden flex flex-col transition-all h-[320px]"
    >
      {/* Photo */}
      <div className="h-44 bg-[#fdfbf7] border-b-[3px] border-[#2d2d2d] flex items-center justify-center overflow-hidden shrink-0">
        {member.photoURL || member.photoBaseId ? (
          <CheerioImage
            src={member.photoURL}
            baseId={member.photoBaseId}
            variant="archive"
            alt={member.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-30">
            <Users size={48} strokeWidth={1.5} className="text-[#2d2d2d]" />
            <span className="text-xs font-patrick font-bold uppercase tracking-widest text-[#2d2d2d]">No Photo</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-kalam font-bold text-xl text-[#2d2d2d] leading-tight line-clamp-1">{member.name}</h3>
          {member.role && (
            <p className="font-patrick text-sm text-[#2d2d2d]/60 italic line-clamp-1">{member.role}</p>
          )}
        </div>
        
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-patrick font-bold uppercase tracking-widest text-[#2d2d2d]/50">
              {member.year}{member.section ? ` · Sec ${member.section}` : ""}
            </span>
            <span className="text-xs font-bold font-kalam text-[#ff4d4d]">{member.xp} XP</span>
          </div>
          <div className="text-[9px] font-patrick font-bold uppercase tracking-widest text-[#d4af37] text-center border-t border-dashed border-[#2d2d2d]/10 pt-2 group-hover:text-[#2d2d2d]/60 transition-colors">
            Tap to view profile
          </div>
        </div>
      </div>
    </div>
  );
}

export function MemberModal({ member, onClose }: { member: Member; onClose: () => void }) {
  if (!member) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#2d2d2d]/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl hand-card bg-[#fdfbf7] border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh] animate-in zoom-in-95 -rotate-1">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white border-[3px] border-[#2d2d2d] rounded-full flex items-center justify-center text-[#2d2d2d] shadow-[3px_3px_0_0_#2d2d2d] hover:-translate-y-1 hover:shadow-[5px_5px_0_0_#2d2d2d] active:translate-y-0 active:shadow-none transition-all"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* Left/Top: Image */}
        <div className="w-full md:w-2/5 h-64 md:h-auto border-b-[3px] md:border-b-0 md:border-r-[3px] border-[#2d2d2d] shrink-0 bg-[#fff9c4] relative">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M 40 0 L 0 0 0 40\' fill=\'none\' stroke=\'%232d2d2d\' stroke-width=\'1\'/%3E%3C/svg%3E")' }} />
          {member.photoURL || member.photoBaseId ? (
            <CheerioImage
              src={member.photoURL}
              baseId={member.photoBaseId}
              variant="archive"
              alt={member.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 opacity-30">
              <ImageIcon size={64} strokeWidth={1.5} className="text-[#2d2d2d]" />
              <span className="text-sm font-patrick font-bold uppercase tracking-widest text-[#2d2d2d]">No Portrait</span>
            </div>
          )}
        </div>

        {/* Right/Bottom: Details */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-6 custom-scrollbar">
          
          <div className="space-y-2">
            <h2 className="font-kalam font-bold text-4xl text-[#2d2d2d] leading-none">{member.name}</h2>
            {member.role && (
              <p className="font-patrick text-xl text-[#2d2d2d]/60 italic">"{member.role}"</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="inline-block bg-[#2d2d2d] text-white px-3 py-1 rounded-full font-patrick font-bold text-xs uppercase tracking-widest">
              {member.category}
            </span>
            <span className="inline-block bg-white border-[2px] border-[#2d2d2d] text-[#2d2d2d] px-3 py-1 rounded-full font-patrick font-bold text-xs uppercase tracking-widest">
              {member.year}{member.section ? ` · Sec ${member.section}` : ""}
            </span>
          </div>

          <div className="w-full h-px bg-dashed bg-[#2d2d2d]/20 bg-repeat-x" style={{ backgroundImage: 'linear-gradient(to right, #2d2d2d 50%, transparent 50%)', backgroundSize: '8px 1px' }} />

          {/* Narrative */}
          <div className="flex-1">
            <h3 className="font-patrick font-bold uppercase tracking-widest text-[#2d2d2d]/40 text-xs mb-3">The Brief</h3>
            {member.narrative ? (
              <p className="font-patrick text-lg text-[#2d2d2d]/80 leading-relaxed whitespace-pre-wrap">
                {member.narrative}
              </p>
            ) : (
              <p className="font-patrick text-lg text-[#2d2d2d]/40 italic">No narrative provided.</p>
            )}
          </div>

          {/* Tags */}
          {member.tags && member.tags.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-patrick font-bold uppercase tracking-widest text-[#2d2d2d]/40 text-xs">Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {member.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-sm font-bold font-patrick uppercase tracking-widest bg-[#fff9c4] border-[2px] border-[#2d2d2d] rounded-full px-3 py-1 text-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="w-full h-px bg-dashed bg-[#2d2d2d]/20 bg-repeat-x" style={{ backgroundImage: 'linear-gradient(to right, #2d2d2d 50%, transparent 50%)', backgroundSize: '8px 1px' }} />

          {/* Stats Footer */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#ffca28] border-[2px] border-[#2d2d2d] flex items-center justify-center font-bold font-kalam text-[#2d2d2d] text-sm">
                XP
              </div>
              <span className="font-patrick font-bold text-xl text-[#2d2d2d]">{member.xp}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white border-[2px] border-[#2d2d2d] flex items-center justify-center text-[#2d2d2d]">
                <Camera size={14} strokeWidth={2.5} />
              </div>
              <span className="font-patrick font-bold text-xl text-[#2d2d2d]">{member.photoCount} <span className="text-sm text-[#2d2d2d]/50 uppercase tracking-widest">Frames</span></span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

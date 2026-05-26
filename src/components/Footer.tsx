"use client";

import { useEffect, useState } from "react";
import { Camera, Link2, Heart, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export function Footer() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const isHome = pathname === "/";
  const [socialLinks, setSocialLinks] = useState<any[]>([]);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "global"));
        if (docSnap.exists()) {
          const links = docSnap.data().socialLinks || {};
          const formatted = [];
          if (links.instagram) formatted.push({ icon: Link2, href: links.instagram, label: "Instagram" });
          if (links.facebook) formatted.push({ icon: Link2, href: links.facebook, label: "Facebook" });
          if (links.github) formatted.push({ icon: Link2, href: links.github, label: "GitHub" });
          if (links.linkedin) formatted.push({ icon: Link2, href: links.linkedin, label: "LinkedIn" });
          setSocialLinks(formatted);
        } else {
          // Fallback if no settings exist
          setSocialLinks([
            { icon: Link2, href: "https://instagram.com/cheerio.2026", label: "Instagram" },
            { icon: Link2, href: "https://linkedin.com", label: "LinkedIn" },
          ]);
        }
      } catch (err) {
        console.error("Footer Social Error:", err);
      }
    };
    fetchLinks();
  }, []);

  if (isDashboard) return null;

  if (isHome) {
    return <LandingFooter socialLinks={socialLinks} />;
  }
  return <ThemedFooter socialLinks={socialLinks} />;
}

function LandingFooter({ socialLinks }: { socialLinks: any[] }) {
  return (
    <footer className="w-full bg-zinc-950 border-t border-gold/10 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />

      {/* ── Mobile micro-strip ── */}
      <div className="md:hidden flex items-center justify-between px-6 py-3">
        <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">© 2026 Batch of 2026</span>
        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-white/30">
          Made with <Heart size={8} className="text-rose-500 animate-pulse" fill="currentColor" /> for the Legends
        </span>
      </div>

      {/* ── Full footer — desktop only ── */}
      <div className="hidden md:block py-24 px-8">
        <div className="max-w-7xl mx-auto space-y-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold border border-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white serif tracking-tight">Eclectica Farewell</h3>
                  <p className="text-[10px] font-bold text-gold uppercase tracking-[0.4em]">Official Farewell Portal</p>
                </div>
              </div>
              <p className="text-white/40 serif italic text-lg leading-relaxed max-w-md">
                &quot;Welcoming everyone to their own official farewell website. A digital sanctuary where memories are reclaimed and legacies are solidified.&quot;
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold text-gold uppercase tracking-[0.3em]">Neural Connections</h4>
                <div className="flex flex-col gap-4">
                  {socialLinks.map((social) => (
                    <Link key={social.label} href={social.href} target="_blank" className="flex items-center gap-3 text-white/40 hover:text-white transition-all group">
                      <div className="p-2 bg-white/5 rounded-xl group-hover:bg-gold/10 group-hover:text-gold border border-white/5 transition-all">
                        <social.icon size={16} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest">{social.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold text-gold uppercase tracking-[0.3em]">The Architects</h4>
                <p className="text-xs text-white/60 leading-relaxed font-bold uppercase tracking-widest">
                  Made by 3rd Year<br />For the Seniors<br />By the Juniors
                </p>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 text-white/20 text-[9px] font-bold uppercase tracking-[0.3em]">
              <span>© 2026 Batch of 2026</span>
              <span className="w-1 h-1 bg-white/10 rounded-full" />
              <span>Neural Restoration Protocol</span>
            </div>
            <div className="flex items-center gap-2 text-white/40 text-[9px] font-bold uppercase tracking-widest">
              Handcrafted with <Heart size={10} className="text-rose-500 animate-pulse" fill="currentColor" /> for the Legends
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Themed footer (all dashboard / interior pages)
// ─────────────────────────────────────────────────────────────────────────────
function ThemedFooter({ socialLinks }: { socialLinks: any[] }) {
  return (
    <footer className="footer-dark w-full relative overflow-hidden border-t-2" style={{ borderColor: 'var(--color-footer-burgundy)' }}>

      {/* Ambient glows — desktop only */}
      <div className="hidden md:block absolute top-0 left-0 w-96 h-96 rounded-full blur-[180px] pointer-events-none opacity-20" style={{ background: 'var(--color-footer-burgundy)' }} />
      <div className="hidden md:block absolute bottom-0 right-0 w-80 h-80 rounded-full blur-[150px] pointer-events-none opacity-15" style={{ background: 'var(--color-footer-rust)' }} />
      <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-32 rounded-full blur-[120px] pointer-events-none opacity-10" style={{ background: 'var(--color-footer-gold)' }} />

      {/* Top rule */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-yellow-700/60 to-transparent" />

      {/* ── Mobile micro-strip ── */}
      <div className="md:hidden flex items-center justify-between px-5 py-3">
        <span className="text-[9px] font-bold uppercase tracking-[0.25em] footer-text-muted">© 2026 Batch of 2026</span>
        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest footer-text-mid">
          Made with <Heart size={8} style={{ color: 'var(--color-footer-burgundy)' }} className="animate-pulse" fill="currentColor" /> for the Legends
        </span>
      </div>

      {/* ── Full footer — desktop only ── */}
      <div className="hidden md:block py-20 px-8">
        <div className="max-w-7xl mx-auto space-y-16 relative">

          <div className="text-center">
            <span className="font-circuit text-[11px] tracking-[0.5em] uppercase" style={{ color: 'var(--color-footer-rust)' }}>
              // welcome
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            {/* LEFT */}
            <div className="lg:col-span-5 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', color: 'var(--color-footer-gold)' }}>
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold serif tracking-tight footer-text-bright">Eclectica Farewell</h3>
                  <p className="text-[9px] font-bold uppercase tracking-[0.45em] footer-text-rust mt-0.5">Official Farewell Portal</p>
                </div>
              </div>
              <div className="relative pl-5 py-2" style={{ borderLeft: '3px solid var(--color-footer-burgundy)' }}>
                <p className="serif italic text-base leading-relaxed footer-text-mid">
                  &quot;Welcoming everyone to their own official farewell website. A digital sanctuary where memories are reclaimed and legacies are solidified.&quot;
                </p>
                <p className="font-circuit text-[10px] mt-3 footer-text-sepia tracking-widest">— yours truly</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: 'rgba(160,82,45,0.3)' }} />
                <span className="font-circuit text-[9px] footer-text-sepia tracking-[0.4em] uppercase">batch :: 2026</span>
                <div className="h-px flex-1" style={{ background: 'rgba(160,82,45,0.3)' }} />
              </div>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-10">
              <div className="space-y-5">
                <h4 className="text-[9px] font-bold uppercase tracking-[0.35em] pb-2 border-b" style={{ color: 'var(--color-footer-rust)', borderColor: 'rgba(160,82,45,0.25)' }}>
                  Neural Connections
                </h4>
                <div className="flex flex-col gap-4">
                  {socialLinks.map((social) => (
                    <Link key={social.label} href={social.href} target="_blank" className="flex items-center gap-3 transition-all group">
                      <div className="footer-icon-box p-2 rounded-xl group-hover:scale-105 transition-all" style={{ color: 'var(--color-footer-gold)' }}>
                        <social.icon size={15} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest footer-text-mid" style={{ transition: 'color 0.2s ease' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-footer-gold)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-footer-text-mid)')}>
                        {social.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <h4 className="text-[9px] font-bold uppercase tracking-[0.35em] pb-2 border-b" style={{ color: 'var(--color-footer-sepia)', borderColor: 'rgba(139,115,85,0.25)' }}>
                  The Architects
                </h4>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest footer-text-bright leading-6">Made by 3rd Year</p>
                  <p className="text-xs font-bold uppercase tracking-widest footer-text-mid leading-6">For the Seniors</p>
                  <p className="text-xs font-bold uppercase tracking-widest footer-text-muted leading-6">By the Juniors</p>
                </div>
              </div>

              <div className="space-y-5">
                <h4 className="text-[9px] font-bold uppercase tracking-[0.35em] pb-2 border-b" style={{ color: 'var(--color-footer-gold)', borderColor: 'rgba(212,175,55,0.2)' }}>
                  Ethos
                </h4>
                <ul className="space-y-3">
                  {[
                    { label: "Memories", color: 'var(--color-footer-text-bright)' },
                    { label: "Legacies", color: 'var(--color-footer-text-mid)' },
                    { label: "Connections", color: 'var(--color-footer-rust)' },
                    { label: "Gratitude", color: 'var(--color-footer-sepia)' },
                  ].map(item => (
                    <li key={item.label} className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: item.color }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: item.color }} />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <span className="font-circuit text-[10px] tracking-[0.6em] uppercase" style={{ color: 'var(--color-footer-gold)', opacity: 0.5 }}>
              // thank you
            </span>
          </div>

          <div className="pt-6 footer-divider border-t flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.3em] footer-text-muted">
              <span>© 2026 Batch of 2026</span>
              <span className="w-1 h-1 rounded-full inline-block" style={{ background: 'var(--color-footer-sepia)' }} />
              <span className="footer-text-sepia">Archival Protocol</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest footer-text-mid">
              Handcrafted with{' '}
              <Heart size={9} style={{ color: 'var(--color-footer-burgundy)' }} className="animate-pulse" fill="currentColor" />
              {' '}for the Legends
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

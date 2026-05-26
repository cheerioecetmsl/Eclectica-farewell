"use client";

import { useState, useEffect, Suspense } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquare, Send, Heart, Sparkles, Loader2, ArrowLeft, Search, User, Lock, Unlock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { CheerioImage } from "@/lib/imageVariants";

interface Message {
  id: string;
  content: string;
  likes: number;
  createdAt: any;
  recipientId: string;
}

interface Senior {
  id: string;
  name: string;
  photoURL?: string;
  photoBaseId?: string;
}

function AnonymousWallContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"inbox" | "send">("send");

  // State for Inbox View
  const [inbox, setInbox] = useState<Message[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // State for Sending View
  const [seniors, setSeniors] = useState<Senior[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSenior, setSelectedSenior] = useState<Senior | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSentSeniorName, setLastSentSeniorName] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({ id: user.uid, ...userData });

          const isSenior = userData.category === "LEGEND" || userData.year === "4th Year";
          setActiveTab(isSenior ? "inbox" : "send");

          const unlockParam = searchParams.get("unlock");
          
          if (unlockParam === "true" && !userData.isWallUnlocked) {
            await updateDoc(doc(db, "users", user.uid), { isWallUnlocked: true });
            setIsUnlocked(true);
          } else {
            setIsUnlocked(userData.isWallUnlocked || false);
          }
          
          fetchInbox(user.uid);
          fetchSeniors();
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [searchParams]);

  const fetchInbox = async (uid: string) => {
    try {
      const q = query(
        collection(db, "anonymous_messages"),
        where("recipientId", "==", uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setInbox(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    } catch (err) {
      console.error("Error fetching inbox:", err);
    }
  };

  const fetchSeniors = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("category", "==", "LEGEND")
      );
      const snap = await getDocs(q);
      setSeniors(snap.docs.map(d => ({ 
        id: d.id, 
        name: d.data().name, 
        photoURL: d.data().photoURL,
        photoBaseId: d.data().photoBaseId 
      })));
    } catch (err) {
      console.error("Error fetching seniors:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedSenior || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, "anonymous_messages"), {
        recipientId: selectedSenior.id,
        content: message.trim(),
        likes: 0,
        createdAt: serverTimestamp()
      });
      setLastSentSeniorName(selectedSenior.name);
      setMessage("");
      setSelectedSenior(null);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send whisper.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-16 h-16 text-[#2d2d2d] animate-spin" strokeWidth={2.5} />
        <p className="text-[#2d2d2d]/60 font-bold uppercase tracking-widest font-patrick">Connecting to the Whisper Gallery...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-16 px-6 relative">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-white border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d] rounded-full text-[#2d2d2d] text-sm font-bold font-patrick uppercase hover:-translate-y-1 transition-transform mb-6">
            <ArrowLeft size={16} strokeWidth={2.5} /> Return to Hub
          </Link>
          <div className="hand-card bg-[#e8f4f8] p-10 border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] relative overflow-hidden inline-block w-full">
            <h1 className="text-5xl md:text-6xl font-bold text-[#2d2d2d] font-kalam uppercase leading-tight">
              The Whisper Gallery
            </h1>
            <p className="text-[#2d2d2d]/80 font-patrick text-xl mt-4">
              Leave a final, anonymous message or read the ones you've received.
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-full overflow-hidden p-1">
            <button
              onClick={() => setActiveTab("inbox")}
              className={`px-8 py-3 rounded-full font-bold font-patrick uppercase tracking-widest transition-all ${
                activeTab === "inbox" 
                  ? "bg-[#2d2d2d] text-white" 
                  : "bg-transparent text-[#2d2d2d] hover:bg-[#2d2d2d]/5"
              }`}
            >
              The Inbox
            </button>
            <button
              onClick={() => setActiveTab("send")}
              className={`px-8 py-3 rounded-full font-bold font-patrick uppercase tracking-widest transition-all ${
                activeTab === "send" 
                  ? "bg-[#2d2d2d] text-white" 
                  : "bg-transparent text-[#2d2d2d] hover:bg-[#2d2d2d]/5"
              }`}
            >
              Send a Message
            </button>
          </div>
        </div>

        {activeTab === "inbox" ? (
          /* ======================================================== */
          /* INBOX VIEW: Blurred/unblurred notes                      */
          /* ======================================================== */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Banner */}
            <div className={`p-6 border-[3px] border-[#2d2d2d] rounded-[var(--radius-wobbly)] shadow-[4px_4px_0_0_#2d2d2d] flex items-center justify-between ${isUnlocked ? 'bg-[#8de08a]' : 'bg-[#ffcccb]'}`}>
              <div className="flex items-center gap-4">
                {isUnlocked ? <Unlock size={32} strokeWidth={2.5} className="text-[#2d2d2d]" /> : <Lock size={32} strokeWidth={2.5} className="text-[#2d2d2d]" />}
                <div>
                  <h3 className="text-2xl font-bold font-kalam text-[#2d2d2d] uppercase">
                    {isUnlocked ? "Inbox Unlocked" : "Inbox Locked"}
                  </h3>
                  <p className="text-lg font-patrick text-[#2d2d2d]/80">
                    {isUnlocked 
                      ? "You can now read all your anonymous messages." 
                      : "Scan the QR Code on your physical invitation card to reveal the messages."}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-4xl font-bold font-kalam text-[#2d2d2d]">{inbox.length}</span>
                <p className="text-sm font-bold font-patrick text-[#2d2d2d]/60 uppercase tracking-widest">Messages</p>
              </div>
            </div>

            {/* Messages Grid */}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {inbox.map((msg, idx) => (
                <div 
                  key={msg.id}
                  className="break-inside-avoid p-8 rounded-[var(--radius-wobbly)] bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] relative overflow-hidden group hover:-translate-y-1 transition-transform"
                >
                  <Sparkles className="absolute top-4 right-4 text-[#2d2d2d]/10 group-hover:text-amber-400 transition-colors" size={24} strokeWidth={2.5} />
                  <p className={`text-2xl font-patrick text-[#2d2d2d] leading-relaxed transition-all duration-700 ${!isUnlocked ? 'blur-md select-none' : ''}`}>
                    "{msg.content}"
                  </p>
                  <div className="mt-6 pt-4 border-t-[2px] border-dashed border-[#2d2d2d]/20">
                    <span className="text-xs font-bold font-patrick text-[#2d2d2d]/40 uppercase tracking-widest">
                      {msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {inbox.length === 0 && (
              <div className="text-center py-20 border-[3px] border-dashed border-[#2d2d2d]/30 rounded-[var(--radius-wobbly)] bg-white/50">
                <MessageSquare className="mx-auto text-[#2d2d2d]/20 mb-6" size={64} strokeWidth={2.5} />
                <p className="text-[#2d2d2d]/50 font-patrick text-2xl">Your inbox is empty. Check back later.</p>
              </div>
            )}
          </div>
        ) : (
          /* ======================================================== */
          /* SEND MESSAGE VIEW: Send messages to seniors              */
          /* ======================================================== */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2d2d2d]/40" size={24} strokeWidth={2.5} />
              <input 
                type="text"
                placeholder="Search for a senior..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full hand-input p-5 pl-14 text-xl font-patrick text-[#2d2d2d] bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {seniors.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(senior => (
                <button
                  key={senior.id}
                  onClick={() => setSelectedSenior(senior)}
                  className="flex flex-col items-center p-6 bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] hover:-translate-y-2 hover:bg-[#fff9c4] transition-all group"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-[#2d2d2d] mb-4 bg-[#fdfbf7]">
                    {senior.photoURL || senior.photoBaseId ? (
                      <CheerioImage
                        src={senior.photoURL || ""}
                        baseId={senior.photoBaseId}
                        variant="avatar"
                        alt={senior.name}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold font-kalam text-[#2d2d2d] uppercase">
                        {senior.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold font-kalam text-[#2d2d2d] text-center line-clamp-2 uppercase">
                    {senior.name}
                  </h3>
                </button>
              ))}
            </div>
            
            {seniors.length === 0 && (
              <div className="text-center py-20 text-[#2d2d2d]/50 font-patrick text-xl">
                No seniors found in the archive directory.
              </div>
            )}
          </div>
        )}

        {/* ======================================================== 
            MODAL FOR SENDING MESSAGE TO SENIOR                      
            ======================================================== */}
        {selectedSenior && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#fdfbf7]/80 backdrop-blur-sm" onClick={() => setSelectedSenior(null)} />
            <div className="relative w-full max-w-lg hand-card bg-white p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="tack-decoration" />
              
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full overflow-hidden border-[3px] border-[#2d2d2d]">
                  {selectedSenior.photoURL || selectedSenior.photoBaseId ? (
                    <CheerioImage
                      src={selectedSenior.photoURL || ""}
                      baseId={selectedSenior.photoBaseId}
                      variant="avatar"
                      alt={selectedSenior.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-[#2d2d2d] font-kalam uppercase bg-[#fdfbf7]">
                      {selectedSenior.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-kalam text-[#2d2d2d] uppercase">Whisper to {selectedSenior.name}</h3>
                  <p className="text-sm font-patrick text-[#2d2d2d]/60 tracking-widest uppercase">Your identity remains completely hidden.</p>
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-6">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your anonymous message..."
                  maxLength={500}
                  className="w-full h-40 hand-input p-4 text-xl font-patrick text-[#2d2d2d] resize-none border-[3px] border-[#2d2d2d] shadow-[inner_2px_2px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] focus:outline-none focus:bg-[#ffca28]/10 transition-colors"
                />
                <div className="flex justify-between items-center text-sm font-bold font-patrick text-[#2d2d2d]/40">
                  <span>{message.length} / 500 characters</span>
                </div>
                
                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setSelectedSenior(null)}
                    className="flex-1 py-4 bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] text-[#2d2d2d] font-bold font-patrick uppercase tracking-widest rounded-[var(--radius-wobbly)] hover:-translate-y-1 transition-transform"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={!message.trim() || sending}
                    className="flex-1 py-4 bg-[#ffca28] border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] text-[#2d2d2d] font-bold font-patrick uppercase tracking-widest rounded-[var(--radius-wobbly)] hover:-translate-y-1 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    {sending ? "Sending..." : "Send Whisper"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== 
            SUCCESS MODAL                      
            ======================================================== */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#fdfbf7]/80 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)} />
            <div className="relative w-full max-w-md hand-card bg-white p-8 text-center space-y-8 animate-in zoom-in-95 duration-200 border-[3px] border-[#2d2d2d] shadow-[8px_8px_0_0_#2d2d2d]">
              <div className="w-24 h-24 bg-[#ffca28] rounded-full flex items-center justify-center text-[#2d2d2d] mx-auto border-[4px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d]">
                <CheckCircle size={48} strokeWidth={3} />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-bold font-kalam text-[#2d2d2d] uppercase">Whisper Sent!</h3>
                <p className="font-patrick text-2xl text-[#2d2d2d]/80 leading-relaxed">
                  Your message to <span className="font-bold text-[#ff8c00]">{lastSentSeniorName}</span> was delivered completely anonymously.
                </p>
              </div>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-4 bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] text-[#2d2d2d] text-xl font-bold font-patrick uppercase tracking-widest rounded-[var(--radius-wobbly)] hover:bg-[#ffca28]/20 hover:-translate-y-1 transition-all"
              >
                Awesome
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

export default function AnonymousWallPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#2d2d2d] animate-spin" strokeWidth={2.5} />
      </div>
    }>
      <AnonymousWallContent />
    </Suspense>
  );
}

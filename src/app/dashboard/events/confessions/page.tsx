"use client";

import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { uploadGenericFile } from "@/lib/uploadHelper";
import { Loader2, ArrowLeft, Send, X, Image as ImageIcon, Video, User, MessageCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface ConfessionUser {
  uid: string;
  name: string;
  photoURL: string;
  isOnline: boolean;
  year: string;
}

interface ConfessionMessage {
  id: string;
  recipientId: string;
  text: string;
  mediaUrl: string | null;
  mediaType: "image" | "video" | null;
  timestamp: any;
}

export default function ConfessionsEvent() {
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRejected, setIsRejected] = useState(false);

  const [activeTab, setActiveTab] = useState<"send" | "inbox">("send");
  
  // Realtime Data
  const [onlineSeniors, setOnlineSeniors] = useState<ConfessionUser[]>([]);
  const [inboxMessages, setInboxMessages] = useState<ConfessionMessage[]>([]);

  // Modal State
  const [selectedRecipient, setSelectedRecipient] = useState<ConfessionUser | null>(null);
  const [messageText, setMessageText] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSentPopup, setShowSentPopup] = useState(false);

  useEffect(() => {
    let unsubListeners: (() => void) | null = null;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          
          const isUserLegend = 
            data.year?.toLowerCase().includes("4th year") || 
            data.year?.toLowerCase().includes("legend") || 
            data.category?.toLowerCase().includes("legend");

          if (!isUserLegend) {
            setIsRejected(true);
            setLoading(false);
            return;
          }

          // If valid 4th year, setup realtime listeners
          unsubListeners = setupListeners(user.uid);
        } else {
          router.push("/onboarding");
        }
      } else {
        if (unsubListeners) {
          unsubListeners();
          unsubListeners = null;
        }
        router.push("/");
      }
    });

    return () => {
      unsubscribe();
      if (unsubListeners) unsubListeners();
    };
  }, [router]);

  const setupListeners = (uid: string) => {
    // 1. Listen for all 4th years
    const usersQuery = query(
      collection(db, "users"),
      where("year", "==", "4th Year")
    );
    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      const usersList = snap.docs.map(d => ({ uid: d.id, ...d.data() } as ConfessionUser));
      setOnlineSeniors(usersList);
    });

    // 2. Listen for my inbox
    const inboxQuery = query(
      collection(db, "event_confessions"),
      where("recipientId", "==", uid)
    );
    const unsubInbox = onSnapshot(inboxQuery, (snap) => {
      const msgList = snap.docs.map(d => ({ id: d.id, ...d.data() } as ConfessionMessage));
      msgList.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setInboxMessages(msgList);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubInbox();
    };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(e.target.files[0]);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedRecipient || !currentUser) return;
    if (!messageText.trim() && !mediaFile) return;

    setIsUploading(true);
    try {
      let mediaUrl = null;
      let mediaType = null;

      if (mediaFile) {
        const result = await uploadGenericFile(mediaFile, "Cheerio/Events/Confessions");
        mediaUrl = result.url;
        mediaType = mediaFile.type.startsWith("video/") ? "video" : "image";
      }

      await addDoc(collection(db, "event_confessions"), {
        recipientId: selectedRecipient.uid,
        recipientName: selectedRecipient.name,
        senderId: currentUser.uid,
        senderName: userData?.name || currentUser.displayName || "Unknown",
        text: messageText.trim(),
        mediaUrl,
        mediaType,
        timestamp: serverTimestamp()
      });

      // Reset & close modal
      setSelectedRecipient(null);
      setMessageText("");
      setMediaFile(null);
      setShowSentPopup(true);

    } catch (err) {
      console.error(err);
      alert("Failed to send confession.");
    } finally {
      setIsUploading(false);
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
  const getRejectionMessage = () => {
    if (!userData) return "You are not authorized.";
    if (userData.year === "Faculty") {
      return "Faculty members are not allowed in this student-only arena! 🎓";
    }
    let x = 1;
    if (userData.year === "1st Year") x = 3;
    else if (userData.year === "2nd Year") x = 2;
    else if (userData.year === "3rd Year") x = 1;
    
    return `Ahem... You are ${x} ${x === 1 ? 'year' : 'years'} early, kiddo! 😜\n\nThis sacred ground is for 4th Years only. Your time will come!`;
  };

  if (isRejected) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#fdfbf7]/80 backdrop-blur-md">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, rotate: -2 }}
          animate={{ scale: 1, opacity: 1, rotate: 1 }}
          className="hand-card p-10 max-w-md w-full text-center bg-white border-[3px] border-[#2d2d2d] shadow-hard"
        >
          <div className="tack-decoration" />
          <h2 className="text-4xl font-bold font-kalam text-red-500 mb-6 -rotate-2">Hold up!</h2>
          <p className="text-xl font-patrick text-[#2d2d2d] mb-8 leading-relaxed whitespace-pre-line">
            {getRejectionMessage()}
          </p>
          <button 
            onClick={() => router.push("/dashboard/events")}
            className="theme-cinematic-btn-secondary px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider w-full"
          >
            Take me back
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-16 px-6 relative bg-[#fdfbf7]">
      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-6">
          <Link 
            href="/dashboard/events" 
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full border-2 border-[#2d2d2d]/20 hover:border-[#2d2d2d] hover:bg-[#2d2d2d] hover:text-[#fdfbf7] transition-all font-bold tracking-widest text-sm uppercase"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Link>
          
          <div className="inline-block relative">
            <h1 className="text-5xl md:text-7xl font-bold font-kalam text-[#2d2d2d] drop-shadow-sm -rotate-2">
              Yeh To Dhoti Khol Raha Hai
            </h1>
            <div className="absolute -bottom-4 right-0 rotate-6 bg-red-500 text-white font-bold text-xs px-3 py-1 uppercase tracking-widest">
              Confessions
            </div>
          </div>
          <p className="text-xl font-patrick text-[#2d2d2d]/70 max-w-2xl mx-auto leading-relaxed">
            Spill the tea. Speak your truth. Send anonymous messages and media to your fellow batchmates. What happens here, stays here.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => setActiveTab("send")}
            className={`px-8 py-3 rounded-full font-bold uppercase tracking-wider transition-all duration-300 ${
              activeTab === "send" 
                ? "bg-[#2d2d2d] text-[#fdfbf7] shadow-lg scale-105" 
                : "bg-white text-[#2d2d2d] border-2 border-[#2d2d2d]/20 hover:border-[#2d2d2d]"
            }`}
          >
            Send Confession
          </button>
          <button 
            onClick={() => setActiveTab("inbox")}
            className={`px-8 py-3 rounded-full font-bold uppercase tracking-wider transition-all duration-300 relative ${
              activeTab === "inbox" 
                ? "bg-[#2d2d2d] text-[#fdfbf7] shadow-lg scale-105" 
                : "bg-white text-[#2d2d2d] border-2 border-[#2d2d2d]/20 hover:border-[#2d2d2d]"
            }`}
          >
            My Inbox
            {inboxMessages.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#fdfbf7]">
                {inboxMessages.length}
              </span>
            )}
          </button>
        </div>

        {/* --- SEND TAB --- */}
        {activeTab === "send" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 justify-center mb-8">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-bold text-sm tracking-widest uppercase text-[#2d2d2d]/60">
                {onlineSeniors.length} Seniors Online Now
              </span>
            </div>

            {onlineSeniors.length === 0 ? (
              <div className="text-center py-20 font-patrick text-2xl text-[#2d2d2d]/50">
                It's awfully quiet in here... nobody is online!
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {onlineSeniors.map(senior => {
                  const isMe = senior.uid === currentUser?.uid;
                  return (
                    <motion.button
                      key={senior.uid}
                      disabled={isMe}
                      whileHover={!isMe ? { scale: 1.05, rotate: Math.random() * 4 - 2 } : {}}
                      onClick={() => setSelectedRecipient(senior)}
                      className={`hand-card p-4 flex flex-col items-center gap-4 border-[3px] transition-all relative ${
                        isMe 
                          ? "opacity-50 grayscale border-dashed border-[#2d2d2d]/30 cursor-not-allowed" 
                          : "border-[#2d2d2d] hover:shadow-hard cursor-pointer bg-white"
                      }`}
                    >
                      {isMe && (
                        <div className="absolute top-2 right-2 rotate-12 bg-gray-200 text-xs px-2 font-bold font-kalam">
                          YOU
                        </div>
                      )}
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#2d2d2d]">
                        {senior.photoURL ? (
                          <img src={senior.photoURL} alt={senior.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#f0f0f0] flex items-center justify-center">
                            <User className="text-[#2d2d2d]/30 w-8 h-8" />
                          </div>
                        )}
                        {senior.isOnline && (
                          <div className="absolute bottom-0 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold font-kalam text-lg leading-tight">{senior.name}</h3>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* --- INBOX TAB --- */}
        {activeTab === "inbox" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {inboxMessages.length === 0 ? (
              <div className="text-center py-20 font-patrick text-2xl text-[#2d2d2d]/50">
                Your inbox is empty. No dark secrets yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {inboxMessages.map(msg => (
                  <div key={msg.id} className="hand-card-yellow p-6 bg-[#fff9c4] border-[3px] border-[#2d2d2d] shadow-hard rotate-1 hover:rotate-0 transition-transform flex flex-col h-full relative">
                    <div className="tack-decoration" />
                    
                    <div className="flex-1 space-y-4">
                      {msg.text && (
                        <p className="font-patrick text-xl leading-relaxed text-[#2d2d2d] whitespace-pre-wrap">
                          "{msg.text}"
                        </p>
                      )}
                      
                      {msg.mediaUrl && (
                        <div className="mt-4 border-2 border-[#2d2d2d] overflow-hidden rounded-md bg-black relative pt-[100%]">
                          {msg.mediaType === 'video' ? (
                            <video 
                              src={msg.mediaUrl} 
                              controls 
                              className="absolute inset-0 w-full h-full object-contain"
                            />
                          ) : (
                            <img 
                              src={msg.mediaUrl} 
                              alt="Confession Attachment" 
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t-2 border-dashed border-[#2d2d2d]/20 text-right">
                      <span className="font-kalam text-[#2d2d2d]/50 font-bold">
                        - Anonymous
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </div>

      {/* --- SEND MESSAGE MODAL --- */}
      <AnimatePresence>
        {selectedRecipient && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#fdfbf7]/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-[3px] border-[#2d2d2d] shadow-hard p-8 max-w-lg w-full relative rotate-1"
            >
              <button 
                onClick={() => setSelectedRecipient(null)}
                className="absolute top-4 right-4 p-2 hover:bg-red-100 rounded-full transition-colors text-red-500"
              >
                <X className="w-6 h-6" strokeWidth={3} />
              </button>

              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-[#2d2d2d] mb-4">
                  {selectedRecipient.photoURL ? (
                    <img src={selectedRecipient.photoURL} alt={selectedRecipient.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#f0f0f0] flex items-center justify-center">
                      <User className="text-[#2d2d2d]/30 w-8 h-8" />
                    </div>
                  )}
                </div>
                <h3 className="font-bold font-kalam text-2xl">To: {selectedRecipient.name}</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-[#2d2d2d]/50 mt-1">They won't know it's you</p>
              </div>

              <div className="space-y-6">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your confession here..."
                  className="w-full h-32 p-4 border-2 border-[#2d2d2d] bg-[#fdfbf7] focus:outline-none focus:ring-4 focus:ring-yellow-400 font-patrick text-xl resize-none"
                />

                <div>
                  <input 
                    type="file" 
                    accept="image/*,video/*"
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 border-2 border-dashed border-[#2d2d2d]/40 rounded-lg text-[#2d2d2d]/60 font-bold uppercase tracking-wider hover:bg-[#2d2d2d]/5 hover:border-[#2d2d2d] transition-colors flex items-center justify-center gap-2"
                  >
                    {mediaFile ? (
                      <span className="text-[#2d2d2d] flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" /> {mediaFile.name}
                      </span>
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5" /> / <Video className="w-5 h-5" /> Add Photo or Video (Optional)
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={isUploading || (!messageText.trim() && !mediaFile)}
                  className="w-full theme-cinematic-btn-primary py-4 rounded-xl text-lg font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Sending Securely...</>
                  ) : (
                    <><Send className="w-5 h-5" /> Send Confession</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SENT SUCCESS POPUP --- */}
      <AnimatePresence>
        {showSentPopup && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-[#fdfbf7]/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-[3px] border-[#2d2d2d] shadow-hard p-8 max-w-sm w-full text-center space-y-6 relative -rotate-1"
            >
              <div className="tape-decoration" />
              
              <div className="w-20 h-20 bg-[#4caf50] border-[3px] border-[#2d2d2d] rounded-full flex items-center justify-center text-white mx-auto shadow-[4px_4px_0_0_#2d2d2d] rotate-3">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-bold font-kalam text-[#2d2d2d]">Confession Sealed!</h3>
                <p className="font-patrick text-xl text-[#2d2d2d]/80 leading-relaxed">
                  Your message has been safely encrypted and sent into their anonymous vault. 🤫🔒
                </p>
              </div>

              <button 
                onClick={() => setShowSentPopup(false)}
                className="w-full py-3 bg-[#ffca28] hover:bg-[#ffe066] border-[2px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] rounded-[var(--radius-wobbly)] font-patrick font-bold text-lg uppercase tracking-widest hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#2d2d2d] transition-all active:translate-y-1 active:shadow-none"
              >
                Awesome!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

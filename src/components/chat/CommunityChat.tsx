"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDocs, 
  startAfter,
  doc,
  getDoc,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChatMessage, sendMessage, TypingStatus, updateLastReadChat } from '@/lib/chat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Loader2, Users, Shield, ChevronDown, MessageSquare } from 'lucide-react';

interface CommunityChatProps {
  currentUser: any;
}

export const CommunityChat: React.FC<CommunityChatProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const firstMessageRef = useRef<any>(null);
  const isInitialLoad = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
    audioRef.current.volume = 0.5;

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setTimeout(() => {
        window.scrollTo(0, 1);
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const checkStatus = async () => {
      const adminDoc = await getDoc(doc(db, 'admin_emails', currentUser.email || ''));
      setIsAdmin(adminDoc.exists());

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setIsMuted(data.isMuted || false);

        await updateLastReadChat(currentUser.uid);

        if (data.isBanned) {
          window.location.href = '/banned';
        }
      }
    };

    checkStatus();
  }, [currentUser]);

  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatMessage)).reverse();

      setMessages(newMessages);
      setLoading(false);

      if (isInitialLoad.current) {
        const lastRead = userData?.lastReadChatTimestamp?.toDate ? userData.lastReadChatTimestamp.toDate() : (userData?.lastReadChatTimestamp ? new Date(userData.lastReadChatTimestamp) : null);
        const hasUnread = lastRead && newMessages.some(m => {
          if (!m.createdAt) return false;
          const msgDate = m.createdAt.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
          return msgDate > lastRead && m.senderId !== currentUser?.uid;
        });

        if (!hasUnread) {
          setTimeout(scrollToBottom, 100);
        }
        isInitialLoad.current = false;
      } else {
        const lastMsg = snapshot.docs[0]?.data() as ChatMessage;
        if (lastMsg && lastMsg.senderId !== currentUser?.uid && snapshot.docChanges().some(change => change.type === 'added')) {
          audioRef.current?.play().catch(e => console.log('Audio play failed:', e));
          
          if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 300;
            if (isNearBottom) {
              setTimeout(scrollToBottom, 100);
            }
          }
        }
      }

      if (snapshot.docs.length > 0) {
        firstMessageRef.current = snapshot.docs[snapshot.docs.length - 1];
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid, userData]);

  useEffect(() => {
    const q = query(collection(db, 'typing'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const typing = snapshot.docs
        .map(doc => doc.data() as TypingStatus)
        .filter(t => t.userId !== currentUser?.uid && t.isTyping);
      setTypingUsers(typing);
    });

    return () => unsubscribe();
  }, [currentUser]);
  
  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("presence", "==", "online")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOnlineCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: isInitialLoad.current ? 'auto' : 'smooth'
      });
    }
  };

  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 200;
    setShowScrollButton(!isNearBottom);

    if (target.scrollTop === 0 && hasMore && !loadingOlder && firstMessageRef.current) {
      loadOlderMessages();
    }
  };

  const loadOlderMessages = async () => {
    if (loadingOlder || !hasMore || !firstMessageRef.current) return;

    setLoadingOlder(true);
    const prevHeight = scrollRef.current?.scrollHeight || 0;

    try {
      const q = query(
        collection(db, 'messages'),
        orderBy('createdAt', 'desc'),
        startAfter(firstMessageRef.current),
        limit(30)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setHasMore(false);
      } else {
        const olderMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ChatMessage)).reverse();

        setMessages(prev => [...olderMessages, ...prev]);
        firstMessageRef.current = snapshot.docs[snapshot.docs.length - 1];

        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight;
          }
        }, 0);
      }
    } catch (error) {
      console.error("Error loading older messages:", error);
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleSendMessage = async (text: string, media?: { url: string; type: 'image' | 'video' | 'file' }) => {
    if (!currentUser) return;

    let finalUserData = userData;
    if (!finalUserData) {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        finalUserData = userDoc.data();
      }
    }

    await sendMessage(
      {
        uid: currentUser.uid,
        name: finalUserData?.name || finalUserData?.displayName || currentUser.displayName || 'Anonymous',
        photoURL: finalUserData?.photoURL || currentUser.photoURL || '',
        photoBaseId: finalUserData?.photoBaseId || '',
        role: isAdmin ? 'admin' : 'user'
      },
      { text, mediaUrl: media?.url, mediaType: media?.type }
    );
    setTimeout(scrollToBottom, 100);
  };

  const groupedMessages = messages.reduce((acc: any[], msg, i) => {
    const prevMsg = messages[i - 1];
    const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
    
    acc.push({
      ...msg,
      isFirstInGroup
    });
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 bg-[#fdfbf7]">
        <div className="relative">
          <Loader2 className="w-16 h-16 animate-spin text-[#2d2d2d]" strokeWidth={3} />
        </div>
        <div className="text-center space-y-2">
          <p className="text-3xl font-bold font-kalam text-[#2d2d2d]">Gathering folks...</p>
          <p className="font-patrick text-lg text-[#2d2d2d]/60">Just a sec, loading the chat history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7] relative overflow-hidden font-sans">
      
      {/* Header Info */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#fdfbf7] border-b-[3px] border-[#2d2d2d] z-20 sticky top-0 shadow-[0_4px_0_0_rgba(45,45,45,0.05)]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[var(--radius-wobbly)] bg-white flex items-center justify-center border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d]">
              <Users className="text-[#2d5da1]" size={24} strokeWidth={2.5} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-[2px] border-[#2d2d2d] animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-[#2d2d2d] text-lg sm:text-xl font-kalam tracking-tight">The Farewell Lobby</h2>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-bold text-[#2d5da1] font-patrick bg-[#2d5da1]/10 px-2 rounded">Live</span>
              <span className="text-xs text-[#2d2d2d]/60 font-patrick font-medium">{onlineCount} online now</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {isAdmin && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-wobbly)] bg-[#ffca28] border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d]">
              <Shield size={14} className="text-[#2d2d2d]" strokeWidth={3} />
              <span className="text-xs font-bold text-[#2d2d2d] font-patrick">Admin</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar relative z-10 px-2 sm:px-0"
      >
        <div className="max-w-[900px] mx-auto w-full px-2 sm:px-4 py-4 sm:py-8 flex flex-col min-h-full">
          {loadingOlder && (
            <div className="flex justify-center py-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-wobbly)] bg-white border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d]">
                <Loader2 className="w-5 h-5 animate-spin text-[#2d2d2d]" strokeWidth={3} />
                <span className="text-sm font-bold text-[#2d2d2d] font-patrick">Loading history...</span>
              </div>
            </div>
          )}
          
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-700">
              <div className="w-24 h-24 rounded-[var(--radius-wobbly)] bg-white flex items-center justify-center mb-6 border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d]">
                <MessageSquare className="text-[#2d2d2d]" size={48} strokeWidth={2} />
              </div>
              <h3 className="text-4xl font-bold text-[#2d2d2d] font-kalam mb-2">It's quiet...</h3>
              <p className="text-[#2d2d2d]/60 font-patrick text-xl max-w-[250px]">Be the first to say hi to the community! 👋</p>
            </div>
          ) : (
            <div className="space-y-2">
              {!hasMore && (
                <div className="flex flex-col items-center gap-2 py-10">
                  <p className="text-sm font-bold font-patrick text-[#2d2d2d]/40">Beginning of the chat</p>
                </div>
              )}

              {groupedMessages.map((msg, idx) => (
                <div 
                  key={msg.id} 
                  className={`${msg.isFirstInGroup && idx !== 0 ? 'mt-6' : 'mt-1'}`}
                >
                  <MessageBubble 
                    message={msg} 
                    isMe={msg.senderId === currentUser?.uid}
                    isAdmin={isAdmin}
                    isFirstInGroup={msg.isFirstInGroup}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Typing Indicators */}
          {typingUsers.length > 0 && (
            <div className="sticky bottom-0 left-0 right-0 py-4 mt-auto">
              <div className="flex items-center gap-3 px-4 py-2 rounded-[var(--radius-wobbly)] bg-white border-[2px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] w-fit animate-in slide-in-from-left duration-300">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ff4d4d] animate-bounce border-[1px] border-[#2d2d2d]" />
                  <span className="w-2 h-2 rounded-full bg-[#ffca28] animate-bounce [animation-delay:0.2s] border-[1px] border-[#2d2d2d]" />
                  <span className="w-2 h-2 rounded-full bg-[#2d5da1] animate-bounce [animation-delay:0.4s] border-[1px] border-[#2d2d2d]" />
                </div>
                <span className="text-sm font-bold text-[#2d2d2d] font-patrick">
                  {(() => {
                    const names = typingUsers.map(u => u.name.split(' ')[0]);
                    if (names.length === 1) return `${names[0]} is typing...`;
                    if (names.length === 2) return `${names[0]} & ${names[1]} are typing...`;
                    return `Several people are typing...`;
                  })()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll Down Button */}
      {showScrollButton && (
        <button 
          onClick={scrollToBottom}
          className="absolute bottom-[100px] right-4 sm:right-8 w-12 h-12 flex items-center justify-center rounded-full bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#2d2d2d] transition-all z-30 active:translate-y-1 active:shadow-none"
        >
          <ChevronDown size={28} className="text-[#2d2d2d] mt-1" strokeWidth={3} />
        </button>
      )}

      {/* Chat Input */}
      <div className="relative z-20 px-2 sm:px-4 pb-4 sm:pb-6 pt-2 bg-[#fdfbf7]">
        <div className="max-w-[900px] mx-auto w-full">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            user={{ uid: currentUser?.uid, displayName: currentUser?.displayName || 'Anonymous' }}
            isMuted={isMuted}
          />
        </div>
      </div>
    </div>
  );
};

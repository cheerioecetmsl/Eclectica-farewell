import React, { useState, useRef, useEffect } from 'react';
import { Send, Video, Paperclip, X, Smile, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadGenericFile } from '@/lib/uploadHelper';
import { setTypingStatus, searchUsers } from '@/lib/chat';
import { EmojiPicker } from './EmojiPicker';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
  onSendMessage: (text: string, media?: { url: string; type: 'image' | 'video' | 'file' }) => Promise<void>;
  user: { uid: string; displayName: string };
  isMuted?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, user, isMuted }) => {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<{ file: File; type: 'image' | 'video' | 'file' } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [showMentionResults, setShowMentionResults] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mentionIndexRef = useRef<number>(-1);

  const handleTextChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    
    // Mention detection
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1 && (lastAtSymbol === 0 || textBeforeCursor[lastAtSymbol - 1] === ' ')) {
      const queryStr = textBeforeCursor.substring(lastAtSymbol + 1);
      mentionIndexRef.current = lastAtSymbol;
      setMentionSearch(queryStr);
      const results = await searchUsers(queryStr);
      
      if (results.length === 0 && queryStr.includes(' ')) {
        setShowMentionResults(false);
      } else {
        setMentionResults(results);
        setShowMentionResults(true);
      }
    } else {
      setShowMentionResults(false);
    }

    setTypingStatus(user.uid, user.displayName, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(user.uid, user.displayName, false);
    }, 3000);
  };

  const handleMentionSelect = (userName: string) => {
    const cursorPosition = textAreaRef.current?.selectionStart || 0;
    const before = text.substring(0, mentionIndexRef.current);
    const after = text.substring(cursorPosition);
    const newText = `${before}@${userName} ${after}`;
    setText(newText);
    setShowMentionResults(false);
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
        const newPos = before.length + userName.length + 2;
        textAreaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleEmojiSelect = (emoji: string) => {
    if (emoji.startsWith('http')) {
      onSendMessage('', { url: emoji, type: 'image' });
      setShowEmojiPicker(false);
      return;
    }

    const cursorPosition = textAreaRef.current?.selectionStart || 0;
    const before = text.substring(0, cursorPosition);
    const after = text.substring(cursorPosition);
    const newText = before + emoji + after;
    setText(newText);
    setShowEmojiPicker(false);
    
    setTimeout(() => textAreaRef.current?.focus(), 0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedMedia({ file, type });
      if (type === 'image') {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const clearMedia = () => {
    setSelectedMedia(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !selectedMedia) || isUploading || isMuted) return;

    try {
      setIsUploading(true);
      let mediaData = undefined;

      if (selectedMedia) {
        const folder = selectedMedia.type === 'image' ? 'Images' : 
                      selectedMedia.type === 'video' ? 'Videos' : 'Files';
        
        const result = await uploadGenericFile(
          selectedMedia.file,
          folder,
          (progress) => setUploadProgress(progress)
        );
        mediaData = { url: result.url, type: selectedMedia.type };
      }

      await onSendMessage(text.trim(), mediaData);
      setText('');
      clearMedia();
      setTypingStatus(user.uid, user.displayName, false);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (isMuted) {
    return (
      <div className="p-4 bg-[#ff4d4d]/10 border-[2px] border-[#ff4d4d] rounded-[var(--radius-wobbly)] text-center shadow-[4px_4px_0_0_#ff4d4d]">
        <p className="text-lg text-[#2d2d2d] font-kalam font-bold">You have been muted by an admin.</p>
      </div>
    );
  }

  return (
    <div className="bg-transparent pt-4 font-sans relative">
      {/* Media Preview Area */}
      {selectedMedia && (
        <div className="mb-4 p-3 rounded-[var(--radius-wobbly)] bg-white border-[2px] border-[#2d2d2d] flex items-center gap-4 relative animate-in slide-in-from-bottom-4 shadow-[4px_4px_0_0_#2d2d2d]">
          <div className="relative group">
            {previewUrl ? (
              <img src={previewUrl} className="w-16 h-16 rounded-[var(--radius-wobbly)] object-cover border-[2px] border-[#2d2d2d]" alt="Preview" />
            ) : (
              <div className="w-16 h-16 rounded-[var(--radius-wobbly)] bg-[#fff9c4] flex items-center justify-center border-[2px] border-[#2d2d2d]">
                {selectedMedia.type === 'video' ? <Video className="text-[#2d2d2d]" size={24} /> : <Paperclip className="text-[#2d2d2d]" size={24} />}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#2d2d2d] font-patrick truncate mb-0.5">{selectedMedia.file.name}</p>
          </div>

          <button 
            onClick={clearMedia}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-[#ff4d4d]/10 text-[#ff4d4d] border-[2px] border-[#2d2d2d] transition-all hover:scale-110 active:scale-95 shadow-[2px_2px_0_0_#2d2d2d]"
          >
            <X size={20} strokeWidth={3} />
          </button>
          
          {isUploading && (
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-[#fdfbf7] rounded-b-[var(--radius-wobbly)] overflow-hidden border-t-[2px] border-[#2d2d2d]">
              <div 
                className="h-full bg-[#2d5da1] transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSend} className="relative group flex flex-col gap-2">
        <div className="flex items-end gap-2 sm:gap-3 p-2 rounded-[var(--radius-wobbly)] bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] focus-within:shadow-[6px_6px_0_0_#2d2d2d] focus-within:-translate-y-1 focus-within:-translate-x-1 transition-all">
          
          {/* Action Buttons Left */}
          <div className="flex items-center gap-2 pl-1 mb-1">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`w-10 h-10 flex items-center justify-center rounded-[var(--radius-wobbly)] transition-all border-[2px] border-[#2d2d2d] ${showEmojiPicker ? 'bg-[#ffca28] text-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d]' : 'bg-white text-[#2d2d2d] hover:bg-[#fff9c4] hover:-translate-y-1 hover:shadow-[2px_2px_0_0_#2d2d2d]'}`}
            >
              <Smile size={20} strokeWidth={2.5} />
            </button>

            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'image/*,video/*,.pdf,.doc,.docx,.zip';
                  fileInputRef.current.click();
                }
              }}
              className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-wobbly)] border-[2px] border-[#2d2d2d] bg-white text-[#2d2d2d] hover:bg-[#fff9c4] transition-all hover:-translate-y-1 hover:shadow-[2px_2px_0_0_#2d2d2d]"
            >
              <Paperclip size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Text Area */}
          <div className="flex-1 min-w-0 py-1 relative">
            <AnimatePresence>
              {showEmojiPicker && (
                <EmojiPicker 
                  onSelect={handleEmojiSelect} 
                  onClose={() => setShowEmojiPicker(false)} 
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showMentionResults && (
                <>
                  <div className="fixed inset-0 z-[45]" onClick={() => setShowMentionResults(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 mb-4 w-64 hand-card bg-white p-2 z-50 animate-in fade-in"
                  >
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {mentionResults.length === 0 ? (
                        <div className="px-4 py-3 text-sm font-bold text-[#2d2d2d]/50 font-patrick text-center">
                          No users found
                        </div>
                      ) : (
                        mentionResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleMentionSelect(u.name)}
                            className="w-full px-4 py-2 flex items-center gap-3 hover:bg-[#fff9c4] rounded-[var(--radius-wobbly)] transition-colors border-b-[2px] border-dashed border-[#2d2d2d]/10 last:border-0"
                          >
                            <div className="w-8 h-8 rounded-[var(--radius-wobbly)] overflow-hidden border-[2px] border-[#2d2d2d] bg-white flex items-center justify-center">
                              {u.photoURL ? (
                                <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm font-bold text-[#2d2d2d] font-kalam">{u.name[0]}</span>
                              )}
                            </div>
                            <span className="text-sm font-bold text-[#2d2d2d] font-patrick">{u.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <textarea
              ref={textAreaRef}
              value={text}
              onChange={handleTextChange}
              placeholder="Scribble a message..."
              className="w-full bg-transparent border-none focus:ring-0 text-[#2d2d2d] p-1.5 sm:p-2 min-h-[40px] sm:min-h-[44px] max-h-32 sm:max-h-40 resize-none text-[15px] sm:text-[16px] leading-relaxed custom-scrollbar placeholder:text-[#2d2d2d]/40 font-patrick font-medium"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!text.trim() && !selectedMedia) || isUploading}
            className={`
              w-12 h-12 flex-shrink-0 rounded-[var(--radius-wobbly)] border-[2px] border-[#2d2d2d] transition-all duration-300 flex items-center justify-center relative mb-1 mr-1
              ${(!text.trim() && !selectedMedia) || isUploading 
                ? 'bg-gray-200 text-[#2d2d2d]/30 border-[#2d2d2d]/30' 
                : 'bg-[#ffca28] text-[#2d2d2d] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#2d2d2d] active:translate-y-1 active:shadow-none'
              }
            `}
          >
            {isUploading ? (
              <Loader2 size={24} className="animate-spin" strokeWidth={3} />
            ) : (
              <Send size={20} strokeWidth={2.5} className="-ml-1 mt-1" />
            )}
          </button>
        </div>
      </form>

      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const type = file.type.startsWith('image/') ? 'image' : 
                       file.type.startsWith('video/') ? 'video' : 'file';
          handleFileSelect(e, type);
        }}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { ChatMessage, deleteMessage, editMessage } from '@/lib/chat';
import { format } from 'date-fns';
import { Shield, Trash2, Pencil, X, Check, Eye, Maximize2 } from 'lucide-react';
import { CheerioImage } from '@/lib/imageVariants';
import { MediaModal } from './MediaModal';
import { ConfirmationModal } from './ConfirmationModal';

interface MessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
  isAdmin: boolean;
  isFirstInGroup?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isMe, 
  isAdmin,
  isFirstInGroup = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const time = message.createdAt?.toDate 
    ? format(message.createdAt.toDate(), 'HH:mm')
    : format(new Date(), 'HH:mm');

  const handleEdit = async () => {
    if (!editText.trim() || editText === message.text) {
      setIsEditing(false);
      return;
    }
    await editMessage(message.id, editText);
    setIsEditing(false);
  };

  const confirmDelete = async () => {
    await deleteMessage(message.id, isMe ? 'self' : 'admin');
  };

  const renderMessageContent = (content: string) => {
    if (!content) return null;
    
    const parts = content.split(/(@[^\s,!?.]+(?:\s[A-Z][^\s,!?.]*)*)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span 
            key={i} 
            className="font-black text-[#2d5da1] bg-[#2d5da1]/10 px-1 rounded inline-block"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (message.deleted) {
    return (
      <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className={`px-4 py-2 border-[2px] border-dashed border-[#2d2d2d]/30 text-xs font-bold font-patrick text-[#2d2d2d]/50 bg-white/50 rounded-[var(--radius-wobbly)]`}>
          {message.deletedBy === 'admin' ? 'Message removed by Admin' : 'Message deleted'}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group mb-2 sm:mb-4 relative`}>
      <div className={`flex items-start gap-2 sm:gap-3 max-w-[90%] sm:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar Area */}
        <div className="w-8 sm:w-10 flex-shrink-0 flex justify-center self-start mt-1">
          {isFirstInGroup && (
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-[var(--radius-wobbly)] overflow-hidden border-[2px] border-[#2d2d2d] bg-white shadow-[2px_2px_0_0_#2d2d2d]`}>
              {(message.senderAvatar || message.senderPhotoBaseId || message.senderPhoto) ? (
                <CheerioImage 
                  baseId={message.senderPhotoBaseId}
                  fallbackUrl={message.senderAvatar || message.senderPhoto}
                  alt={message.senderName}
                  variant="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-[#2d2d2d] font-kalam text-lg">
                  {message.senderName?.[0] || '?'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
          {isFirstInGroup && (
            <span className="text-xs font-bold font-patrick text-[#2d2d2d] ml-1 mb-1 px-1">
              {isMe ? 'You' : message.senderName}
            </span>
          )}
          
          <div className="relative group/bubble flex items-center gap-2">
            {/* Options Trigger */}
            {(isMe || isAdmin) && !isEditing && (
              <div className={`opacity-0 group-hover/bubble:opacity-100 transition-opacity flex gap-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {isMe && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-[var(--radius-wobbly)] bg-white text-[#2d2d2d] hover:bg-[#fff9c4] transition-all border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d]"
                  >
                    <Pencil size={14} strokeWidth={3} />
                  </button>
                )}
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-[var(--radius-wobbly)] bg-white text-[#ff4d4d] hover:bg-[#ff4d4d]/10 transition-all border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d]"
                >
                  <Trash2 size={14} strokeWidth={3} />
                </button>
              </div>
            )}

            <div className={`
              relative p-3 sm:p-4 rounded-[var(--radius-wobbly)] border-[2px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] transition-all duration-300
              ${isMe ? 'bg-[#fff9c4]' : 'bg-white'}
              hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#2d2d2d]
            `}>
              {/* Text Content */}
              {isEditing ? (
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <textarea 
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="bg-transparent border-b-[2px] border-[#2d2d2d] focus:ring-0 text-sm sm:text-base p-1 w-full resize-none font-patrick font-medium placeholder:text-[#2d2d2d]/30"
                    rows={Math.max(1, editText.split('\n').length)}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setIsEditing(false)} className="p-1.5 hover:bg-[#ff4d4d]/10 text-[#ff4d4d] rounded-full">
                      <X size={16} strokeWidth={3} />
                    </button>
                    <button onClick={handleEdit} className="p-1.5 hover:bg-green-500/10 text-green-600 rounded-full">
                      <Check size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ) : (
                message.text && (
                  <p className="text-[15px] sm:text-[16px] leading-relaxed font-sans font-medium text-[#2d2d2d] whitespace-pre-wrap">
                    {renderMessageContent(message.text)}
                    {message.edited && <span className="ml-2 font-patrick font-bold text-xs text-[#2d2d2d]/40 italic">(edited)</span>}
                  </p>
                )
              )}

              {/* Media Content */}
              {message.mediaUrl && !isEditing && (
                <div className={`mt-3 rounded-[var(--radius-wobbly)] overflow-hidden border-[2px] border-[#2d2d2d] bg-white`}>
                  {message.mediaType === 'image' && (
                    <div className="relative group/media">
                      <img 
                        src={typeof message.mediaUrl === 'string' && !message.mediaUrl.startsWith('[object') ? message.mediaUrl : (message.mediaUrl as any)?.url} 
                        alt="attachment" 
                        className="max-h-[300px] w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setIsMediaOpen(true)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute top-2 right-2 p-2 bg-white border-[2px] border-[#2d2d2d] rounded-full opacity-0 group-hover/media:opacity-100 transition-opacity pointer-events-none shadow-[2px_2px_0_0_#2d2d2d]">
                        <Eye size={16} strokeWidth={3} className="text-[#2d2d2d]" />
                      </div>
                    </div>
                  )}
                  {message.mediaType === 'video' && (
                    <div className="relative group/media">
                      <video 
                        src={typeof message.mediaUrl === 'string' && !message.mediaUrl.startsWith('[object') ? message.mediaUrl : (message.mediaUrl as any)?.url} 
                        className="max-h-[300px] w-full cursor-pointer bg-black"
                        onClick={() => setIsMediaOpen(true)}
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer hover:bg-black/10 transition-colors" onClick={() => setIsMediaOpen(true)}>
                        <div className="w-12 h-12 rounded-full bg-white border-[2px] border-[#2d2d2d] flex items-center justify-center shadow-[4px_4px_0_0_#2d2d2d] hover:-translate-y-1 transition-transform">
                          <Maximize2 className="text-[#2d2d2d]" size={24} strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  )}
                  {message.mediaType === 'file' && (
                    <a 
                      href={message.mediaUrl as string} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-[#fff9c4] hover:bg-[#ffca28] transition-colors border-t-[2px] border-[#2d2d2d]"
                    >
                      <div className="p-2 rounded-[var(--radius-wobbly)] bg-white border-[2px] border-[#2d2d2d] shadow-[2px_2px_0_0_#2d2d2d]">
                        <Shield size={20} className="text-[#2d2d2d]" strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#2d2d2d] font-patrick">View Document</span>
                      </div>
                    </a>
                  )}
                </div>
              )}

              {/* Meta Info */}
              <div className="flex items-center justify-end gap-2 mt-2">
                <span className="text-[10px] font-bold font-patrick text-[#2d2d2d]/50">{time}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MediaModal 
        isOpen={isMediaOpen} 
        onClose={() => setIsMediaOpen(false)} 
        mediaUrl={message.mediaUrl || ''} 
        mediaType={message.mediaType || 'image'} 
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Message"
        message="Are you sure you want to delete this message?"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

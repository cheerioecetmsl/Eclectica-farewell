import React from 'react';
import { X, Maximize2 } from 'lucide-react';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string | { url: string };
  mediaType: 'image' | 'video' | 'file';
}

export const MediaModal: React.FC<MediaModalProps> = ({ isOpen, onClose, mediaUrl, mediaType }) => {
  if (!isOpen || mediaType === 'file') return null;

  const url = typeof mediaUrl === 'string' ? mediaUrl : mediaUrl.url;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#fdfbf7]/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl hand-card bg-white p-2 sm:p-4 animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 w-10 h-10 rounded-full bg-[#ff4d4d] border-[2px] border-[#2d2d2d] flex items-center justify-center text-white shadow-[2px_2px_0_0_#2d2d2d] hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#2d2d2d] transition-all z-10"
        >
          <X size={24} strokeWidth={3} />
        </button>

        <div className="w-full h-full max-h-[80vh] overflow-hidden rounded-[var(--radius-wobbly)] border-[2px] border-[#2d2d2d] bg-[#fdfbf7]">
          {mediaType === 'image' ? (
            <img 
              src={url} 
              alt="Expanded media" 
              className="w-full h-full object-contain"
            />
          ) : (
            <video 
              src={url} 
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
};

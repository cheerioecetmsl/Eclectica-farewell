import React, { useState } from 'react';
import { Smile, Zap, Heart, Star, Coffee, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  { icon: Smile, label: 'Faces', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'] },
  { icon: Heart, label: 'Love', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌', '💏', '💑', '💋', '💍', '💎'] },
  { icon: Zap, label: 'Energy', emojis: ['⚡', '🔥', '✨', '🌟', '⭐', '🌈', '☁️', '☀️', '🌤️', '⛅', '🌥️', '🌦️', '🌧️', '⛈️', '🌩️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌫️', '🌊', '💧', '💦', '☂️'] },
  { icon: Star, label: 'Common', emojis: ['✅', '❌', '⚠️', '🔔', '📢', '💯', '👏', '🙌', '🎉', '🎈', '🎊', '🎁', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🎫', '🎟️'] },
  { icon: Coffee, label: 'Food', emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🍞', '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🍵', '🧉', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🍾'] },
];

const STICKERS = [
  // Animated/Premium Stickers from Noto Emoji
  { id: '1', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.webp', name: 'Grinning' },
  { id: '2', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp', name: 'Laughing' },
  { id: '3', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.webp', name: 'Love Eyes' },
  { id: '4', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.webp', name: 'Cool' },
  { id: '5', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.webp', name: 'Star Eyes' },
  { id: '6', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp', name: 'Fire' },
  { id: '7', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp', name: 'Rocket' },
  { id: '8', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/512.webp', name: '100' },
  { id: '9', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.webp', name: 'Clapping' },
  { id: '10', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.webp', name: 'Party' },
  { id: '11', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f47b/512.webp', name: 'Ghost' },
  { id: '12', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f48e/512.webp', name: 'Gem' },
  { id: '13', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.webp', name: 'Party Face' },
  { id: '14', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f911/512.webp', name: 'Money Mouth' },
  { id: '15', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92c/512.webp', name: 'Swearing' },
  { id: '16', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92d/512.webp', name: 'Cover Mouth' },
  { id: '17', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f974/512.webp', name: 'Dizzy' },
  { id: '18', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92e/512.webp', name: 'Vomiting' },
  { id: '19', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/512.webp', name: 'Exploding' },
  { id: '20', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f970/512.webp', name: 'Smiling Hearts' },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const [activeTab, setActiveTab] = useState<'emoji' | 'sticker'>('emoji');

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="fixed md:absolute bottom-[80px] left-2 right-2 md:left-0 md:right-auto md:w-[400px] h-[50vh] md:h-[450px] hand-card bg-white z-[110] flex flex-col p-4 shadow-[4px_4px_0_0_#2d2d2d]"
      >
        <div className="flex items-center border-b-[3px] border-[#2d2d2d] pb-2 mb-4">
          <div className="flex flex-1 gap-2">
            <button 
              onClick={() => setActiveTab('emoji')}
              className={`flex-1 py-2 font-kalam font-bold text-lg rounded-[var(--radius-wobbly)] transition-all ${activeTab === 'emoji' ? 'bg-[#ffca28] text-[#2d2d2d] border-[2px] border-[#2d2d2d]' : 'text-[#2d2d2d]/60 hover:text-[#2d2d2d]'}`}
            >
              Emojis
            </button>
            <button 
              onClick={() => setActiveTab('sticker')}
              className={`flex-1 py-2 font-kalam font-bold text-lg rounded-[var(--radius-wobbly)] transition-all ${activeTab === 'sticker' ? 'bg-[#ffca28] text-[#2d2d2d] border-[2px] border-[#2d2d2d]' : 'text-[#2d2d2d]/60 hover:text-[#2d2d2d]'}`}
            >
              Stickers
            </button>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 ml-2 flex items-center justify-center rounded-full hover:bg-[#ff4d4d]/10 text-[#2d2d2d]/60 hover:text-[#ff4d4d] transition-all"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'emoji' ? (
            <div className="space-y-6">
              {EMOJI_CATEGORIES.map((category, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 mb-3 sticky top-0 bg-white/90 backdrop-blur-sm z-10 py-1">
                    <category.icon size={16} className="text-[#2d2d2d]" />
                    <span className="text-xs font-bold text-[#2d2d2d] uppercase tracking-widest font-patrick">{category.label}</span>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 sm:gap-2">
                    {category.emojis.map((emoji, eIdx) => (
                      <button 
                        key={eIdx}
                        onClick={() => onSelect(emoji)}
                        className="text-2xl p-1 hover:bg-[#fff9c4] rounded-[var(--radius-wobbly)] transition-all hover:scale-125 active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {STICKERS.map((sticker) => (
                <button 
                  key={sticker.id}
                  onClick={() => onSelect(sticker.url)}
                  className="group relative aspect-square rounded-[var(--radius-wobbly)] bg-[#fff9c4] border-[2px] border-[#2d2d2d] flex items-center justify-center hover:bg-[#ffca28] transition-all hover:scale-105 active:translate-y-1 shadow-[2px_2px_0_0_#2d2d2d] overflow-hidden"
                >
                  <img src={sticker.url} alt={sticker.name} className="w-16 h-16 object-contain group-hover:rotate-6 transition-transform" />
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

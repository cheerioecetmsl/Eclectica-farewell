import React from 'react';
import { X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2d2d2d]/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm hand-card bg-white p-6 animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-[#2d2d2d]/10 transition-colors"
        >
          <X size={20} className="text-[#2d2d2d]" />
        </button>

        <h3 className="text-2xl font-kalam font-bold text-[#2d2d2d] mb-2 pr-6">
          {title}
        </h3>
        <p className="font-patrick text-lg text-[#2d2d2d]/70 mb-6 leading-tight">
          {message}
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 font-patrick font-bold text-lg text-[#2d2d2d] rounded-[var(--radius-wobbly)] border-[2px] border-[#2d2d2d] bg-white hover:bg-gray-100 transition-colors active:translate-y-1"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 font-patrick font-bold text-lg text-white rounded-[var(--radius-wobbly)] border-[2px] border-[#2d2d2d] bg-[#ff4d4d] hover:bg-[#ff3333] transition-colors shadow-[2px_2px_0_0_#2d2d2d] active:translate-y-1 active:shadow-none"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always include page 1
      pages.push(1);

      if (currentPage <= 3) {
        // Near the start
        pages.push(2, 3, 4);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push("...");
        pages.push(totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // In the middle
        pages.push("...");
        pages.push(currentPage - 1, currentPage, currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 mt-12 py-8">
      {/* Previous Arrow */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] text-[#2d2d2d] hover:-translate-y-1 hover:bg-[#fff9c4] disabled:opacity-50 disabled:shadow-[4px_4px_0_0_#2d2d2d] disabled:translate-y-0 disabled:hover:bg-white transition-all active:translate-y-1 active:shadow-none"
        aria-label="Previous Page"
      >
        <ChevronLeft size={24} strokeWidth={2.5} />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-2 md:gap-3">
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === "number" && onPageChange(page)}
            disabled={page === "..."}
            className={`
              w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-sm md:text-lg font-bold font-kalam border-[3px] transition-all
              ${page === currentPage 
                ? "bg-[#ffca28] text-[#2d2d2d] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] scale-110" 
                : page === "..." 
                  ? "border-transparent text-[#2d2d2d]/40 cursor-default" 
                  : "bg-white border-[#2d2d2d] text-[#2d2d2d] hover:bg-[#fff9c4] hover:-translate-y-1 shadow-[4px_4px_0_0_#2d2d2d] active:translate-y-1 active:shadow-none"
              }
            `}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Next Arrow */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-white border-[3px] border-[#2d2d2d] shadow-[4px_4px_0_0_#2d2d2d] text-[#2d2d2d] hover:-translate-y-1 hover:bg-[#fff9c4] disabled:opacity-50 disabled:shadow-[4px_4px_0_0_#2d2d2d] disabled:translate-y-0 disabled:hover:bg-white transition-all active:translate-y-1 active:shadow-none"
        aria-label="Next Page"
      >
        <ChevronRight size={24} strokeWidth={2.5} />
      </button>
    </div>
  );
};

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
  scrollToTop?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  className = '',
  scrollToTop = true,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const handlePageSelect = (page: number) => {
    if (page === currentPage || page < 1 || page > totalPages) return;
    onPageChange(page);
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate pagination numbers with ellipsis (e.g. 1 ... 4 5 6 ... 20)
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 pb-12 ${className}`}
    >
      {/* Summary Info */}
      <div className="text-xs text-neutral-400 font-semibold">
        {totalItems && itemsPerPage ? (
          <span>
            Showing{' '}
            <strong className="text-white">
              {(currentPage - 1) * itemsPerPage + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-white">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </strong>{' '}
            of <strong className="text-[#E50914]">{totalItems}</strong> titles
          </span>
        ) : (
          <span>
            Page <strong className="text-white">{currentPage}</strong> of{' '}
            <strong className="text-[#E50914]">{totalPages}</strong>
          </span>
        )}
      </div>

      {/* Page Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => handlePageSelect(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous Page"
          className={`p-2 rounded-xl border border-white/5 flex items-center justify-center transition-all ${
            currentPage <= 1
              ? 'opacity-30 cursor-not-allowed bg-white/5 text-neutral-500'
              : 'bg-[#16171E] hover:bg-[#E50914] text-white hover:text-white cursor-pointer shadow-sm active:scale-95'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Number Buttons */}
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span
                key={`dots-${idx}`}
                className="w-8 h-8 flex items-center justify-center text-xs font-bold text-neutral-600 select-none"
              >
                ...
              </span>
            );
          }

          const pageNum = Number(p);
          const isCurrent = pageNum === currentPage;

          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => handlePageSelect(pageNum)}
              className={`w-9 h-9 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none ${
                isCurrent
                  ? 'bg-[#E50914] text-white shadow-lg shadow-red-900/40 scale-105'
                  : 'bg-[#16171E] hover:bg-white/10 text-neutral-300 hover:text-white border border-white/5'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => handlePageSelect(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next Page"
          className={`p-2 rounded-xl border border-white/5 flex items-center justify-center transition-all ${
            currentPage >= totalPages
              ? 'opacity-30 cursor-not-allowed bg-white/5 text-neutral-500'
              : 'bg-[#16171E] hover:bg-[#E50914] text-white hover:text-white cursor-pointer shadow-sm active:scale-95'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

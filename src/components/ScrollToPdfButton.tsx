'use client';

import React from 'react';
import { FileText, ArrowDown } from 'lucide-react';

export function ScrollToPdfButton() {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-pdf-viewer'));
      const el = document.getElementById('gazette-pdf-viewer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      try {
        history.pushState(null, '', '#gazette-pdf-viewer');
      } catch {
        // ignore
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      id="scroll-to-pdf-btn"
      className="py-2.5 px-4 mc-btn-gold text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
      title="Scroll to bottom and open original official gazette PDF"
    >
      <FileText className="w-4 h-4 text-[#1C1404]" />
      <span>VIEW ORIGINAL PDF</span>
      <ArrowDown className="w-3.5 h-3.5 text-[#1C1404]" />
    </button>
  );
}

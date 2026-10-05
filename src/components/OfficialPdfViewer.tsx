'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Maximize2, 
  Minimize2,
  FileCheck,
  Hash,
  Printer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface OfficialPdfViewerProps {
  pdfUrl: string;
  filename: string;
  drawNumber: string;
  lotteryName: string;
  sha256?: string;
  drawDate?: string;
}

export function OfficialPdfViewer({
  pdfUrl,
  filename,
  drawNumber,
  lotteryName,
  sha256,
  drawDate
}: OfficialPdfViewerProps) {
  // Closed by default so it does NOT open always on page load
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Listen for anchor click or custom event to open and scroll smoothly
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setTimeout(() => {
        const el = document.getElementById('gazette-pdf-viewer');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    };

    if (typeof window !== 'undefined') {
      if (window.location.hash === '#gazette-pdf-viewer') {
        handleOpen();
      }

      const onHashChange = () => {
        if (window.location.hash === '#gazette-pdf-viewer') {
          handleOpen();
        }
      };

      window.addEventListener('hashchange', onHashChange);
      window.addEventListener('open-pdf-viewer', handleOpen);

      return () => {
        window.removeEventListener('hashchange', onHashChange);
        window.removeEventListener('open-pdf-viewer', handleOpen);
      };
    }
  }, []);

  const handlePrint = () => {
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  };

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setTimeout(() => {
        const el = document.getElementById('gazette-pdf-viewer');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  };

  return (
    <div className="mc-card border border-[#C9A227]/40 shadow-sm overflow-hidden rounded-2xl bg-white transition-all">
      {/* Header / Toolbar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#FAF6EC] via-white to-[#FAF6EC] border-b border-[#DDD9CE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B5E0D]/10 border border-[#C9A227]/30 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[#8B5E0D]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-[#1D2821] text-base">
                Official Gazette PDF Document
              </h3>
              <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#8B5E0D]/10 text-[#8B5E0D] border border-[#C9A227]/30">
                <ShieldCheck className="w-3 h-3 text-[#C9A227]" />
                <span>ORIGINAL UPLOADED</span>
              </span>
            </div>
            <p className="text-xs text-[#636058] flex items-center gap-2 mt-0.5">
              <span>{lotteryName} ({drawNumber})</span>
              {drawDate && <span>• {drawDate}</span>}
              <span className="font-mono text-[11px] text-[#8B5E0D] font-medium hidden md:inline">
                [{filename}]
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Main Toggle Button */}
          <button
            type="button"
            onClick={handleToggle}
            id="toggle-pdf-viewer-btn"
            className="py-1.5 px-3 rounded-lg border border-[#DDD9CE] hover:border-[#C9A227] text-xs font-bold text-[#1D2821] bg-white flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            title={isOpen ? 'Hide PDF Viewer' : 'Show PDF Viewer'}
          >
            {isOpen ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-[#636058]" />
                <span>Hide Viewer</span>
                <ChevronUp className="w-3.5 h-3.5 text-[#636058]" />
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-[#8B5E0D]" />
                <span className="text-[#8B5E0D]">Show Viewer</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8B5E0D]" />
              </>
            )}
          </button>

          {/* Toggle Full Height (only when open) */}
          {isOpen && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="py-1.5 px-2.5 rounded-lg border border-[#DDD9CE] hover:border-[#C9A227] text-xs font-semibold text-[#636058] hover:text-[#1D2821] bg-white hidden sm:flex items-center space-x-1 transition-colors cursor-pointer shadow-2xs"
              title={isExpanded ? 'Compact height' : 'Expand height'}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Compact</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Expand</span>
                </>
              )}
            </button>
          )}

          {/* Open in New Window */}
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 px-3 rounded-lg border border-[#DDD9CE] hover:border-[#C9A227] text-xs font-bold text-[#8B5E0D] hover:text-[#1D2821] bg-[#FAF6EC] flex items-center space-x-1.5 transition-colors shadow-2xs"
            title="Open original uploaded PDF in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in New Tab</span>
          </a>

          {/* Download Original PDF Button */}
          <a
            href={pdfUrl}
            download={filename || `Kerala_Lottery_${drawNumber}_Result.pdf`}
            className="py-1.5 px-3.5 mc-btn-primary text-xs font-bold flex items-center space-x-1.5 shadow-xs"
            title="Download the original official PDF file"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Download PDF</span>
          </a>
        </div>
      </div>

      {/* When Collapsed: Quick summary notice with one-click Show button */}
      {!isOpen && (
        <div className="p-4 bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#636058]">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-[#C9A227] shrink-0" />
            <span>
              Click <strong>&ldquo;Show Viewer&rdquo;</strong> to view the official Directorate of Kerala State Lotteries Government Gazette document embedded directly on this page.
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            className="self-start sm:self-auto py-1 px-3 mc-btn-gold text-[11px] font-bold rounded-lg cursor-pointer shrink-0 shadow-2xs"
          >
            Open Original PDF
          </button>
        </div>
      )}

      {/* Embedded Document View Area (Only rendered when isOpen is true) */}
      {isOpen && (
        <div className="relative bg-[#2D3130] flex flex-col animate-in fade-in duration-300">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            title={`Official Kerala Lottery Gazette PDF - ${drawNumber}`}
            className={`w-full border-0 transition-all duration-300 ${
              isExpanded ? 'h-[900px]' : 'h-[620px]'
            }`}
          />

          {/* Bottom Controls / Helper */}
          <div className="p-3 bg-[#FAF6EC] border-t border-[#DDD9CE] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#636058]">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-[#C9A227] shrink-0" />
              <span>
                Original Directorate of Kerala State Lotteries Government Gazette PDF
              </span>
            </div>

            <div className="flex items-center space-x-3 text-[11px] font-semibold">
              <button
                type="button"
                onClick={handlePrint}
                className="text-[#8B5E0D] hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
              <a
                href={pdfUrl}
                download={filename}
                className="text-[#8B5E0D] hover:underline flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save to Device</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* SHA-256 Cryptographic Provenance Bar */}
      {sha256 && (
        <div className="px-4 py-2.5 bg-[#FAF8F5] border-t border-[#DDD9CE] text-[11px] text-[#636058] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center space-x-1.5 overflow-hidden">
            <Hash className="w-3.5 h-3.5 text-[#C9A227] shrink-0" />
            <span className="font-semibold text-[#1D2821] shrink-0">SHA-256 Checksum:</span>
            <span className="font-mono text-[#8B5E0D] truncate select-all">{sha256}</span>
          </div>
          <span className="text-[10px] text-[#8B5E0D] font-bold shrink-0">
            100% Authentic Government Gazette
          </span>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckTicketResult } from '@/types/lottery';
import { useLanguage } from '@/context/LanguageContext';
import { playCelebrationAudio, announceWinning, stopAnnouncement } from '@/lib/audio';
import { 
  Sparkles, 
  FileText, 
  Download, 
  Volume2, 
  VolumeX, 
  X, 
  ShieldCheck, 
  ExternalLink,
  Coffee
} from 'lucide-react';

interface WinningModalProps {
  result: CheckTicketResult;
  onClose: () => void;
}

export function WinningModal({ result, onClose }: WinningModalProps) {
  const { language, t } = useLanguage();
  const [soundFailed, setSoundFailed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // 1. Party Popper Cannon Explosions ("pepper popper effect")
    try {
      // Left cannon burst
      confetti({
        particleCount: 75,
        angle: 60,
        spread: 60,
        origin: { x: 0.1, y: 0.7 },
        colors: ['#C9A227', '#E5C158', '#8B5E0D', '#ffffff', '#FFD700', '#F5F2EB']
      });
      // Right cannon burst
      confetti({
        particleCount: 75,
        angle: 120,
        spread: 60,
        origin: { x: 0.9, y: 0.7 },
        colors: ['#C9A227', '#E5C158', '#8B5E0D', '#ffffff', '#FFD700', '#F5F2EB']
      });
      // Central party popper shower
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { x: 0.5, y: 0.5 },
          colors: ['#C9A227', '#E5C158', '#8B5E0D', '#ffffff', '#FFD700', '#1D221F']
        });
      }, 150);
    } catch (e) {
      console.warn('Confetti error:', e);
    }

    // 2. Play Audio chime
    playCelebrationAudio().then((success) => {
      if (!success) setSoundFailed(true);
    });

    // 3. Web Speech announcement
    if (result.prize?.amount && !isMuted) {
      announceWinning(result.prize.amount, language);
    }

    return () => {
      stopAnnouncement();
    };
  }, [result, language, isMuted]);

  const handleReplayVoice = () => {
    if (result.prize?.amount) {
      setIsMuted(false);
      announceWinning(result.prize.amount, language);
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (result.prize?.amount) {
        announceWinning(result.prize.amount, language);
      }
    } else {
      setIsMuted(true);
      stopAnnouncement();
    }
  };

  const handleClose = () => {
    stopAnnouncement();
    onClose();
  };

  const prizeAmountFormatted = result.prize?.formattedAmount || '₹0';
  const pdfUrl = result.source?.pdfUrl || `/samples/Karunya_Plus_KN-642_Result.pdf`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
    >
      <div className="relative w-full max-w-lg mc-card-gold p-6 sm:p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          id="winning-modal-close-btn"
          className="absolute top-4 right-4 p-2 rounded-full bg-[#F5F2EB] hover:bg-[#EAE5D8] text-[#636058] transition-colors"
          aria-label="Close winning dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Header */}
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#1D221F] border-2 border-[#C9A227] flex items-center justify-center shadow-lg shadow-[#C9A227]/20">
          <Sparkles className="w-8 h-8 text-[#C9A227]" />
        </div>

        <span className="inline-flex items-center px-3 py-0.5 rounded-[0.5rem] text-[11px] font-bold bg-[#FAF6EC] text-[#8B5E0D] border border-[#C9A227]/40 mb-2">
          {t('win_matched_badge')}
        </span>

        <h2 className="text-2xl sm:text-3xl font-sans font-bold text-[#1D2821] tracking-tight mb-1">
          {t('win_congratulations')}
        </h2>
        <p className="text-xs text-[#636058] mb-4">
          {t('win_subtitle')}
        </p>

        {/* Winning Prize Display */}
        <div className="my-4 p-5 rounded-[0.875rem] bg-[#FAF6EC] border border-[#C9A227]/50 text-center shadow-xs">
          <p className="text-xs font-bold tracking-wider text-[#8B5E0D] uppercase mb-1">
            {language === 'ml' ? result.prize?.nameMl : result.prize?.name}
          </p>
          <div className="text-4xl sm:text-5xl font-sans font-extrabold text-[#1D2821] tracking-tight my-1">
            {prizeAmountFormatted}
          </div>
          <p className="text-[10px] text-[#636058]">
            Official Gazette Prize Amount (Before statutory TDS / commissions)
          </p>
        </div>

        {/* Ticket & Draw Info Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-left my-4 text-xs">
          <div className="p-3 rounded-xl bg-[#F5F2EB] border border-[#DDD9CE]">
            <span className="text-[#636058] block text-[10px] uppercase font-bold">
              {t('select_series')} & {t('enter_number')}
            </span>
            <span className="font-extrabold text-[#1D2821] text-base font-mono">
              {result.ticket?.fullTicket}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F5F2EB] border border-[#DDD9CE]">
            <span className="text-[#636058] block text-[10px] uppercase font-bold">
              {t('select_lottery')}
            </span>
            <span className="font-bold text-[#8B5E0D] text-sm truncate block">
              {language === 'ml' ? result.lottery?.nameMl : result.lottery?.name}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F5F2EB] border border-[#DDD9CE]">
            <span className="text-[#636058] block text-[10px] uppercase font-bold">
              {t('select_draw')}
            </span>
            <span className="font-bold text-[#1D2821] text-sm">
              {result.draw?.number}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F5F2EB] border border-[#DDD9CE]">
            <span className="text-[#636058] block text-[10px] uppercase font-bold">
              Draw Date
            </span>
            <span className="font-bold text-[#1D2821] text-sm">
              {result.draw?.formattedDate}
            </span>
          </div>
        </div>

        {/* Provenance and SHA-256 Box */}
        <div className="p-3 rounded-xl bg-[#FAF6EC] border border-[#C9A227]/30 text-left text-[11px] text-[#636058] mb-5 flex items-start space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
          <div className="overflow-hidden">
            <div className="font-bold text-[#1D2821]">Source Verification Provenance:</div>
            <div className="text-[10px] text-[#636058] truncate font-mono">
              File: {result.source?.filename}
            </div>
            <div className="text-[9px] text-[#8B5E0D] truncate font-mono">
              SHA-256: {result.source?.sha256}
            </div>
          </div>
        </div>

        {/* Audio Controls (Replay / Mute / Manual Play) */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <button
            onClick={handleReplayVoice}
            id="replay-voice-btn"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#F5F2EB] hover:bg-[#EAE5D8] text-[#1D221F] border border-[#DDD9CE] transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#C9A227]" />
            <span>{t('btn_replay_voice')}</span>
          </button>

          <button
            onClick={handleToggleMute}
            id="toggle-mute-btn"
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#F5F2EB] hover:bg-[#EAE5D8] text-[#636058] border border-[#DDD9CE] transition-colors"
          >
            {isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{isMuted ? 'Unmute' : t('btn_mute')}</span>
          </button>

          {soundFailed && (
            <button
              onClick={() => playCelebrationAudio()}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#C9A227] text-[#1C1404] hover:bg-[#b8911f]"
            >
              <span>🔊 Play sound</span>
            </button>
          )}
        </div>

        {/* Support Us Button */}
        <button
          onClick={onClose}
          id="winning-modal-support-btn"
          className="w-full mb-3 py-3 px-4 mc-btn-gold text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <Coffee className="w-4 h-4 text-[#1C1404]" />
          <span>ഞങ്ങളെ സപ്പോർട്ട് ചെയ്യാം ☕ (Support Our Service)</span>
        </button>

        {/* Action Buttons: View Original PDF / Download */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            id="view-original-pdf-btn"
            className="flex-1 py-3 px-4 mc-btn-gold text-xs sm:text-sm flex items-center justify-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>{t('btn_view_pdf')}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-75" />
          </a>

          <a
            href={pdfUrl}
            download={result.source?.filename || 'Official_Kerala_Lottery_Result.pdf'}
            id="download-original-pdf-btn"
            className="flex-1 py-3 px-4 mc-btn-primary text-xs sm:text-sm flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4 text-white" />
            <span>{t('btn_download_pdf')}</span>
          </a>
        </div>

        {/* Official Statutory Disclaimer */}
        <p className="mt-4 text-[10px] text-[#736F67] text-center leading-relaxed">
          {t('disclaimer_text')}
        </p>
      </div>
    </div>
  );
}

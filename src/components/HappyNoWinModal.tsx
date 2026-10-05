'use client';

import React, { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { CheckTicketResult } from '@/types/lottery';
import { playGentlePopAudio } from '@/lib/audio';
import { Sparkles, Smile, X, ShieldCheck, Coffee, Target, RotateCcw } from 'lucide-react';

interface HappyNoWinModalProps {
  result: CheckTicketResult;
  onClose: () => void;
  onCheckAnother?: () => void;
}

export function HappyNoWinModal({ result, onClose, onCheckAnother }: HappyNoWinModalProps) {
  const { t } = useLanguage();

  useEffect(() => {
    // Play gentle cheerful pop chime sound effect on popup
    playGentlePopAudio().catch(() => {});
  }, []);

  const nearest = result.nearestMiss;
  const isJustMissed = nearest?.isJustMissed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-sm mc-card-gold p-5 text-center shadow-2xl animate-in zoom-in-95 duration-200 my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          id="happy-modal-close-btn"
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-[#F5F2EB] hover:bg-[#EAE5D8] text-[#636058] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Happy Cheerful Icon with gentle bounce/glow */}
        <div className="w-13 h-13 mx-auto mb-2.5 rounded-full bg-[#FAF6EC] border-2 border-[#C9A227] flex items-center justify-center shadow-md shadow-[#C9A227]/20">
          {isJustMissed ? (
            <Target className="w-6 h-6 text-[#C9A227]" />
          ) : (
            <Smile className="w-6 h-6 text-[#8B5E0D]" />
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-[#1D2821] tracking-tight mb-1 flex items-center justify-center gap-1.5">
          <span>{isJustMissed ? 'ഭാഗ്യത്തിനടുത്തെത്തി! 🎯' : t('happy_no_win_title')}</span>
          <Sparkles className="w-4 h-4 text-[#C9A227]" />
        </h3>

        {/* Happy Cheerful Message */}
        <p className="text-xs font-semibold text-[#8B5E0D] leading-snug px-1 mb-3">
          {isJustMissed
            ? 'വിഷമിക്കേണ്ട! നിങ്ങളുടെ ഭാഗ്യം തൊട്ടടുത്തെത്തിയിരുന്നു, അടുത്ത തവണ ഉറപ്പായും നേടും! ✨'
            : t('happy_no_win_message')}
        </p>

        {/* NEAREST WINNING NUMBER & PRIZE CARD - ONLY show if user just missed by 1 number/digit */}
        {nearest && isJustMissed && (
          <div
            className={`p-3 rounded-2xl text-left mb-3.5 border transition-all ${
              isJustMissed
                ? 'bg-gradient-to-br from-[#FFF9E6] via-[#FAF3DD] to-[#F5EACB] border-[#C9A227] shadow-md shadow-[#C9A227]/15 ring-1 ring-[#C9A227]/30'
                : 'bg-[#F9F7F1] border-[#DDD9CE]'
            }`}
          >
            {/* Header Badge & Diff indicator */}
            <div className="flex items-center justify-between gap-1 mb-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isJustMissed
                    ? 'bg-[#C9A227] text-[#1C1404] shadow-xs'
                    : 'bg-[#EAE5D8] text-[#636058]'
                }`}
              >
                <Target className="w-3 h-3 text-[#1C1404]" />
                {isJustMissed ? 'അല്പം വ്യത്യാസത്തിൽ നഷ്ടമായി! 🎯' : 'ഏറ്റവും അടുത്ത വിജയിച്ച നമ്പർ'}
              </span>

              {nearest.numericDiff !== undefined && nearest.numericDiff <= 5 && (
                <span className="text-[10px] font-mono font-bold text-[#8B5E0D] bg-white/80 px-1.5 py-0.5 rounded border border-[#C9A227]/30">
                  ±{nearest.numericDiff} {nearest.numericDiff === 1 ? 'Number' : 'Numbers'}
                </span>
              )}
            </div>

            {/* Explanation of difference */}
            <p className="text-xs font-bold text-[#8B5E0D] mb-2 leading-tight">
              {nearest.differenceDescMl}
            </p>

            {/* Ticket & Prize Comparison Box */}
            <div className="bg-white/95 rounded-xl p-2.5 border border-[#E5DAC1] space-y-2 shadow-2xs">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="block text-[10px] font-semibold text-[#636058] uppercase">
                    നിങ്ങളുടെ നമ്പർ
                  </span>
                  <span className="font-mono font-bold text-xs text-[#1D2821] bg-[#F5F2EB] px-2 py-0.5 rounded inline-block mt-0.5">
                    {result.ticket?.fullTicket || nearest.userTicket}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-[#8B5E0D] uppercase">
                    വിജയിച്ച നമ്പർ 🎯
                  </span>
                  <span className="font-mono font-black text-xs text-[#1D2821] bg-[#FFF2C2] px-2 py-0.5 rounded border border-[#C9A227]/40 inline-block mt-0.5">
                    {nearest.winningTicket}
                  </span>
                </div>
              </div>

              {/* Prize Details & Amount */}
              <div className="pt-2 border-t border-[#EAE5D8] flex items-center justify-between gap-1">
                <div>
                  <span className="block text-[10px] text-[#636058] font-bold">
                    സമ്മാനത്തുക (Prize):
                  </span>
                  <span className="text-[11px] font-bold text-[#1D2821]">
                    {nearest.prizeNameMl}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-sm text-[#1B6B35] bg-[#E8F5E9] px-2 py-0.5 rounded-lg border border-[#C8E6C9] shadow-2xs inline-block">
                    {nearest.formattedAmount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Checked Details Box for Peace of Mind */}
        <div className="p-2.5 rounded-xl bg-[#F5F2EB] border border-[#DDD9CE] text-xs space-y-1.5 text-left mb-3.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-[#636058] font-medium">പരിശോധിച്ച ടിക്കറ്റ്:</span>
            <span className="font-mono font-bold text-[#1D2821]">{result.ticket?.fullTicket}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-[#636058] font-medium">ലോട്ടറി / നറുക്കെടുപ്പ്:</span>
            <span className="font-bold text-[#8B5E0D] text-[11px] truncate max-w-[170px]">
              {result.lottery?.nameMl || result.lottery?.name || 'കേരള ലോട്ടറി'} ({result.draw?.number})
            </span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-[#DDD9CE] text-[10px]">
            <span className="text-[#636058] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#C9A227]" />
              ഔദ്യോഗിക ഗസറ്റ് ഫലം:
            </span>
            <span className="font-bold text-[#1D2821]">പരിശോധിച്ചു • സമ്മാനമില്ല</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onCheckAnother || onClose}
            id="happy-modal-check-another-btn"
            className="w-full py-3 px-4 mc-btn-gold text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#1C1404]" />
            <span>അടുത്ത ടിക്കറ്റ് പരിശോധിക്കാം (Check Another Ticket)</span>
          </button>

          <button
            onClick={onClose}
            id="happy-modal-close-action-btn"
            className="w-full py-1.5 px-3 text-xs font-semibold text-[#636058] hover:text-[#1D2821] hover:underline cursor-pointer"
          >
            <span>{t('btn_close')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

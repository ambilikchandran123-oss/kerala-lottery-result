'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lottery, Draw, CheckTicketResult } from '@/types/lottery';
import { useLanguage } from '@/context/LanguageContext';
import { VerificationAnimation } from './VerificationAnimation';
import { WinningModal } from './WinningModal';
import { 
  Search, 
  QrCode, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface TicketCheckerProps {
  initialLotteries?: Lottery[];
  initialDraws?: Draw[];
}

export function TicketChecker({ initialLotteries = [], initialDraws = [] }: TicketCheckerProps) {
  const { language, t } = useLanguage();

  const [lotteries, setLotteries] = useState<Lottery[]>(initialLotteries);
  const [draws, setDraws] = useState<Draw[]>(initialDraws);
  const [selectedLotteryId, setSelectedLotteryId] = useState<string>('');
  const [selectedDrawId, setSelectedDrawId] = useState<string>('');
  const [selectedSeries, setSelectedSeries] = useState<string>('');
  const [ticketNumber, setTicketNumber] = useState<string>('');
  const [fullTicketInput, setFullTicketInput] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingAnim, setIsVerifyingAnim] = useState(false);
  const [pendingResult, setPendingResult] = useState<CheckTicketResult | null>(null);
  const [activeResult, setActiveResult] = useState<CheckTicketResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch lotteries & published draws on mount if not provided
  useEffect(() => {
    async function loadData() {
      try {
        if (lotteries.length === 0) {
          const res = await fetch('/api/lotteries');
          const data = await res.json();
          if (data.lotteries) {
            setLotteries(data.lotteries);
            if (data.lotteries.length > 0) {
              setSelectedLotteryId(data.lotteries[0].id);
            }
          }
        }
        if (draws.length === 0) {
          const res = await fetch('/api/results');
          const data = await res.json();
          if (data.draws) {
            setDraws(data.draws);
            if (data.draws.length > 0) {
              setSelectedDrawId(data.draws[0].id);
              if (data.draws[0].series_list?.length > 0) {
                setSelectedSeries(data.draws[0].series_list[0]);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    }
    loadData();
  }, [lotteries.length, draws.length]);

  // When lottery selection changes, filter draws
  const filteredDraws = selectedLotteryId
    ? draws.filter(d => d.lottery_id === selectedLotteryId)
    : draws;

  // Selected draw object
  const currentDraw = draws.find(d => d.id === selectedDrawId);
  const availableSeries = currentDraw?.series_list || [];

  // Update selected draw when lottery changes
  useEffect(() => {
    if (filteredDraws.length > 0 && !filteredDraws.some(d => d.id === selectedDrawId)) {
      setSelectedDrawId(filteredDraws[0].id);
      if (filteredDraws[0].series_list?.length > 0) {
        setSelectedSeries(filteredDraws[0].series_list[0]);
      }
    }
  }, [selectedLotteryId, filteredDraws, selectedDrawId]);

  // Handle Check Result submission
  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedDrawId) {
      setErrorMessage('Please select a lottery draw.');
      return;
    }

    // Determine query payload
    let rawParam = '';
    let seriesParam = '';
    let numberParam = '';

    if (fullTicketInput.trim()) {
      rawParam = fullTicketInput.trim();
    } else {
      if (!ticketNumber.trim()) {
        setErrorMessage('Please enter a 6-digit ticket number.');
        return;
      }
      seriesParam = selectedSeries;
      numberParam = ticketNumber.trim();
    }

    setIsLoading(true);
    setActiveResult(null);

    try {
      const params = new URLSearchParams({
        drawId: selectedDrawId,
        ...(rawParam ? { raw: rawParam } : { series: seriesParam, number: numberParam })
      });

      const res = await fetch(`/api/check-ticket?${params.toString()}`);
      const data: CheckTicketResult = await res.json();

      if (res.status === 429) {
        setErrorMessage(data.message || 'Too many requests. Please wait a moment.');
        setIsLoading(false);
        return;
      }

      if (!res.ok && data.status === 'ERROR') {
        setErrorMessage(data.message || 'Failed to verify ticket.');
        setIsLoading(false);
        return;
      }

      // Start the official verification animation
      setPendingResult(data);
      setIsVerifyingAnim(true);
    } catch {
      setErrorMessage('Connection error. Could not check ticket.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnimationComplete = () => {
    setIsVerifyingAnim(false);
    if (pendingResult) {
      setActiveResult(pendingResult);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Search Card */}
      <div className="mc-card p-5 sm:p-6 space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C9A227]" />
            <h2 className="text-xl sm:text-2xl font-sans font-bold text-[#1D2821] tracking-tight">
              {t('hero_title')}
            </h2>
          </div>

          <Link
            href="/scan"
            id="camera-scan-header-btn"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[0.75rem] text-xs font-bold bg-[#1D221F] hover:bg-[#2D3530] text-white transition-all hover:scale-105 active:scale-95 shadow-xs"
          >
            <QrCode className="w-4 h-4 text-[#C9A227]" />
            <span className="hidden sm:inline">{t('scan_cta')}</span>
            <span className="sm:hidden">Scan</span>
          </Link>
        </div>

        <form onSubmit={handleCheck} className="space-y-3.5">
          {/* 1. Select Lottery */}
          <div>
            <label className="block text-xs font-bold text-[#1D2821] mb-1">
              {t('select_lottery')}
            </label>
            <select
              value={selectedLotteryId}
              onChange={(e) => setSelectedLotteryId(e.target.value)}
              id="lottery-select"
              className="mc-input w-full px-3.5 py-2.5 text-xs font-semibold cursor-pointer"
            >
              {lotteries.map((l) => (
                <option key={l.id} value={l.id}>
                  {language === 'ml' ? l.name_ml : l.name_en} {l.type === 'BUMPER' ? '★ Bumper' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Select Draw */}
          <div>
            <label className="block text-xs font-bold text-[#1D2821] mb-1.5">
              {t('select_draw')}
            </label>
            <select
              value={selectedDrawId}
              onChange={(e) => {
                setSelectedDrawId(e.target.value);
                const d = draws.find(item => item.id === e.target.value);
                if (d?.series_list?.length) setSelectedSeries(d.series_list[0]);
              }}
              id="draw-select"
              className="mc-input w-full px-3.5 py-2.5 text-xs font-semibold cursor-pointer"
            >
              {filteredDraws.map((d) => (
                <option key={d.id} value={d.id}>
                  Draw {d.draw_number} — {d.draw_date}
                </option>
              ))}
              {filteredDraws.length === 0 && (
                <option value="">No published draws available for this lottery</option>
              )}
            </select>
          </div>

          {/* 3. Ticket Series & Number */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1D2821] mb-1">
                {t('select_series')}
              </label>
              {availableSeries.length > 0 ? (
                <select
                  value={selectedSeries}
                  onChange={(e) => setSelectedSeries(e.target.value)}
                  id="series-select"
                  className="mc-input w-full px-3.5 py-2.5 text-xs font-bold text-center cursor-pointer"
                >
                  {availableSeries.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  maxLength={3}
                  placeholder="MU"
                  value={selectedSeries}
                  onChange={(e) => setSelectedSeries(e.target.value.toUpperCase())}
                  className="mc-input w-full px-3.5 py-2.5 text-xs font-bold uppercase text-center"
                />
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-[#1D2821] mb-1">
                {t('enter_number')}
              </label>
              <input
                type="text"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="422635"
                value={ticketNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setTicketNumber(val);
                }}
                id="ticket-number-input"
                className="mc-input w-full px-3.5 py-2.5 text-sm tracking-widest font-mono font-bold"
              />
            </div>
          </div>

          {/* Quick Alternative: Paste Full Ticket */}
          <div className="pt-0.5">
            <details className="text-xs text-[#636058] group">
              <summary className="cursor-pointer hover:text-[#8B5E0D] font-semibold list-none flex items-center justify-between">
                <span>{t('enter_full_ticket')}</span>
                <span className="text-[10px] text-[#636058] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <input
                type="text"
                placeholder="e.g. MU 422635"
                value={fullTicketInput}
                onChange={(e) => setFullTicketInput(e.target.value.toUpperCase())}
                id="full-ticket-input"
                className="mc-input w-full mt-2 px-3 py-2 font-mono uppercase tracking-wider text-xs"
              />
            </details>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-[0.75rem] bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            id="check-ticket-submit-btn"
            className="w-full py-3.5 px-4 mc-btn-gold text-xs sm:text-sm flex items-center justify-center space-x-2 tracking-wide disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{isLoading ? 'SEARCHING...' : t('btn_check')}</span>
          </button>
        </form>

        {/* Selected Draw Gazette Provenance Note */}
        {currentDraw && (
          <div className="mt-4 pt-3 border-t border-[#DDD9CE] flex items-center justify-between text-[11px] text-[#636058]">
            <span className="flex items-center space-x-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8B5E0D]" />
              <span>Official Gazette Draw: {currentDraw.draw_number}</span>
            </span>
            <span className="text-[#8B5E0D] font-mono font-bold">
              {currentDraw.draw_date}
            </span>
          </div>
        )}
      </div>

      {/* Verification Multi-step Animation */}
      {isVerifyingAnim && (
        <VerificationAnimation onComplete={handleAnimationComplete} />
      )}

      {/* WINNING POPUP MODAL */}
      {activeResult && activeResult.status === 'WIN' && (
        <WinningModal
          result={activeResult}
          onClose={() => setActiveResult(null)}
        />
      )}

      {/* NO WINNING RESULT FOUND CARD */}
      {activeResult && activeResult.status === 'NO_WINNING_RESULT_FOUND' && (
        <div 
          className="mt-5 mc-card p-6 border border-[#DDD9CE] text-center shadow-md animate-in fade-in slide-in-from-top-4 duration-200"
          role="status"
          aria-live="polite"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#F5F2EB] border border-[#DDD9CE] flex items-center justify-center text-[#636058]">
            <RotateCcw className="w-6 h-6 text-[#636058]" />
          </div>

          <h3 className="text-xl font-sans font-bold text-[#1D2821] mb-1">
            {t('no_win_title')}
          </h3>
          <p className="text-xs text-[#636058] mb-4">
            {t('no_win_desc')}
          </p>

          <div className="p-3.5 rounded-[0.75rem] bg-[#F5F2EB] border border-[#DDD9CE] text-left text-xs mb-4">
            <div className="flex justify-between py-1 border-b border-[#DDD9CE]">
              <span className="text-[#636058] font-medium">Checked Ticket:</span>
              <span className="font-mono font-bold text-[#1D2821]">{activeResult.ticket?.fullTicket}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#DDD9CE]">
              <span className="text-[#636058] font-medium">Draw Number:</span>
              <span className="font-bold text-[#8B5E0D]">{activeResult.draw?.number}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#636058] font-medium">Source Document:</span>
              <span className="text-[#1D2821] truncate max-w-[180px] font-mono">{activeResult.source?.filename}</span>
            </div>
          </div>

          <div className="p-3 rounded-[0.75rem] bg-[#FAF6EC] border border-[#C9A227]/30 text-left text-[11px] text-[#8B5E0D] mb-4 font-medium">
            {t('no_win_notice')}
          </div>

          <div className="flex gap-2">
            {activeResult.source?.pdfUrl && (
              <a
                href={activeResult.source.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 mc-btn-secondary text-xs font-bold flex items-center justify-center space-x-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-[#8B5E0D]" />
                <span>{t('btn_view_pdf')}</span>
              </a>
            )}
            <button
              onClick={() => setActiveResult(null)}
              className="py-2.5 px-4 mc-btn-primary text-xs font-bold"
            >
              {t('btn_close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lottery, Draw, WinningEntry, CheckTicketResult } from '@/types/lottery';
import { useLanguage } from '@/context/LanguageContext';
import { WinningModal } from '@/components/WinningModal';
import { HappyNoWinModal } from '@/components/HappyNoWinModal';
import { VerificationAnimation } from '@/components/VerificationAnimation';
import { decodeBarcode } from '@/lib/engine/barcode';
import jsQR from 'jsqr';
import { 
  Sparkles, 
  Calendar, 
  ArrowLeft, 
  Camera, 
  QrCode, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  ChevronRight, 
  Hash, 
  FileText,
  Download
} from 'lucide-react';

interface MinimalDashboardProps {
  lotteries: Lottery[];
  draws: Draw[];
  todayDraw: Draw | null;
  todayTopWinningEntries?: WinningEntry[];
  initialViewMode?: ViewMode;
}

type ViewMode = 'landing' | 'check-today' | 'previous-list' | 'check-previous';

export function MinimalDashboard({
  lotteries,
  draws,
  todayDraw,
  initialViewMode = 'landing'
}: MinimalDashboardProps) {
  const router = useRouter();
  const { language, t } = useLanguage();
  
  // View mode navigation state: starts at initialViewMode ('landing' or 'previous-list')
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [selectedPreviousDraw, setSelectedPreviousDraw] = useState<Draw | null>(null);

  // Live draws state: initialized from SSR props, auto-synced with /api/results
  const [liveDraws, setLiveDraws] = useState<Draw[]>(draws);

  useEffect(() => {
    setLiveDraws(draws);
  }, [draws]);

  // Real-time synchronization whenever user views previous-list or changes view mode
  useEffect(() => {
    fetch('/api/results')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.draws)) {
          setLiveDraws(data.draws);
        }
      })
      .catch(() => {});
  }, [viewMode]);

  // Active draw for checking (either today's draw or the chosen previous draw)
  const displayTodayDraw = todayDraw || (liveDraws.length > 0 ? liveDraws[0] : null);
  const activeCheckingDraw = viewMode === 'check-today' ? displayTodayDraw : selectedPreviousDraw;

  // Form input state
  const [selectedSeries, setSelectedSeries] = useState<string>('');
  const [ticketNumber, setTicketNumber] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Camera Scanner state
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedPayload, setScannedPayload] = useState<string | null>(null);
  const [scanWarning, setScanWarning] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Search animation & Results modal state
  const [isVerifyingAnim, setIsVerifyingAnim] = useState<boolean>(false);
  const [pendingResult, setPendingResult] = useState<CheckTicketResult | null>(null);
  const [activeResult, setActiveResult] = useState<CheckTicketResult | null>(null);

  // Auto-set default series when active checking draw changes
  useEffect(() => {
    if (activeCheckingDraw && activeCheckingDraw.series_list && activeCheckingDraw.series_list.length > 0) {
      setSelectedSeries(activeCheckingDraw.series_list[0]);
    }
  }, [activeCheckingDraw]);

  // Handle Camera Scanner Lifecycle
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isCameraOpen) {
      const startCamera = async () => {
        try {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: 'environment' } }
            });
          } catch {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true
            });
          }
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true');
            await videoRef.current.play();
            setCameraError(null);
            startScanningLoop();
          }
        } catch {
          setCameraError('Camera access denied or unavailable. Please enter ticket digits manually.');
        }
      };
      startCamera();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraOpen]);

  const startScanningLoop = () => {
    const scanFrame = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert'
            });

            if (code && code.data) {
              handleBarcodeDetected(code.data);
              return; // Stop scan loop on success
            }
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };
    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleBarcodeDetected = (rawPayload: string) => {
    setScannedPayload(rawPayload);
    setIsCameraOpen(false); // Close camera viewport

    const decoded = decodeBarcode(rawPayload, 'QR_CODE');
    if (decoded.series) setSelectedSeries(decoded.series);
    if (decoded.ticketNumber) setTicketNumber(decoded.ticketNumber);

    if (decoded.confidence === 'UNIDENTIFIED') {
      setScanWarning(decoded.errorMessage || 'Barcode detected. Please confirm the 6-digit number.');
    } else {
      setScanWarning(null);
    }
  };

  // Check Result Submission
  const handleCheckTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!activeCheckingDraw) {
      setErrorMessage('Draw information not found.');
      return;
    }

    const cleanNum = ticketNumber.trim();
    if (!cleanNum || cleanNum.length !== 6 || !/^\d{6}$/.test(cleanNum)) {
      setErrorMessage('Please enter an exact 6-digit ticket number (e.g., 422635).');
      return;
    }

    if (!selectedSeries) {
      setErrorMessage('Please select a ticket series.');
      return;
    }

    setIsLoading(true);
    setActiveResult(null);

    try {
      const params = new URLSearchParams({
        drawId: activeCheckingDraw.id,
        series: selectedSeries,
        number: cleanNum
      });

      const res = await fetch(`/api/check-ticket?${params.toString()}`);
      const data: CheckTicketResult = await res.json();

      if (!res.ok && data.status === 'ERROR') {
        setErrorMessage(data.message || 'Verification failed.');
        setIsLoading(false);
        return;
      }

      // Trigger the realistic searching animation
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

  const handleCheckAnother = () => {
    setActiveResult(null);
    setTicketNumber('');
  };

  // Helper for localized lottery name
  const getLotteryName = (draw: Draw | null) => {
    if (!draw) return 'Kerala State Lottery';
    if (language === 'ml' && draw.lottery?.name_ml) return draw.lottery.name_ml;
    return draw.lottery?.name_en || 'Kerala State Lottery';
  };

  // =========================================================================
  // VIEW 1: FIRST PAGE (ONLY TODAY RESULT & PREVIOUS DAY RESULT BUTTONS)
  // =========================================================================
  if (viewMode === 'landing') {
    return (
      <div className="w-full max-w-md mx-auto pt-8 pb-12 px-2 animate-in fade-in duration-300">
        <div className="flex flex-col gap-4">
          
          {/* Button 1: TODAY'S RESULT */}
          <button
            onClick={() => setViewMode('check-today')}
            id="btn-today-result-main"
            className="w-full py-5 px-6 rounded-2xl mc-card-gold text-left flex items-center justify-between group hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md cursor-pointer border-2 border-[#C9A227]"
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-[#C9A227] flex items-center justify-center text-[#1C1404] shadow-sm group-hover:rotate-3 transition-transform">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#8B5E0D] uppercase block">
                  Official LOTIS Gazette
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-sans text-[#1D221F] tracking-tight">
                  {t('btn_today_results')}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold font-sans bg-[#C9A227]/25 text-[#734A04] border border-[#C9A227]/30">
                    {displayTodayDraw ? getLotteryName(displayTodayDraw) : 'Today'}
                  </span>
                  {displayTodayDraw?.draw_date && (
                    <span className="text-xs font-sans text-[#636058] font-semibold">
                      {displayTodayDraw.draw_date}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-[#8B5E0D] group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Button 2: PREVIOUS DAY RESULTS */}
          <button
            onClick={() => setViewMode('previous-list')}
            id="btn-previous-results-main"
            className="w-full py-5 px-6 rounded-2xl mc-card text-left flex items-center justify-between group hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md cursor-pointer border-2 border-[#DDD9CE] hover:border-[#C9A227]/60"
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF6EC] border border-[#C9A227]/40 flex items-center justify-center text-[#8B5E0D] shadow-sm group-hover:rotate-3 transition-transform">
                <Calendar className="w-7 h-7 text-[#C9A227]" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#636058] uppercase block">
                  Past Draws Archive
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-sans text-[#1D221F] tracking-tight">
                  {t('btn_previous_results')}
                </h2>
                <p className="text-xs font-sans text-[#636058] mt-1 font-medium">
                  View past dates, lottery names & series
                </p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-[#636058] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: PREVIOUS DAYS LIST (DATES, NAMES, SERIES NUMBERS)
  // =========================================================================
  if (viewMode === 'previous-list') {
    return (
      <div className="w-full max-w-xl mx-auto space-y-4 pb-12 animate-in fade-in duration-200">
        {/* Navigation Header */}
        <div className="flex items-center justify-between pb-1 border-b border-[#DDD9CE]">
          <button
            onClick={() => {
              if (initialViewMode === 'previous-list') {
                router.push('/');
              } else {
                setViewMode('landing');
              }
            }}
            id="back-to-landing-btn"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#8B5E0D] hover:underline cursor-pointer py-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('btn_back')}</span>
          </button>

          <span className="text-xs font-bold text-[#1D2821]">
            {t('btn_previous_results')}
          </span>
        </div>

        <p className="text-xs text-[#636058]">
          Select any previous day to scan or verify your ticket against that official draw result:
        </p>

        {/* Previous Draws List */}
        <div className="space-y-3">
          {liveDraws.map((draw) => {
            const seriesString = draw.series_list && draw.series_list.length > 0
              ? draw.series_list.join(', ')
              : 'VA, VB, VC, VD, VE, VG, VH, VJ, VK, VL, VM, VN';

            return (
              <div
                key={draw.id}
                onClick={() => {
                  setSelectedPreviousDraw(draw);
                  setViewMode('check-previous');
                }}
                className="mc-card p-4 hover:border-[#C9A227] transition-all cursor-pointer group shadow-xs hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    {/* Date and Draw Number */}
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#8B5E0D] bg-[#FAF6EC] px-2.5 py-0.5 rounded-md border border-[#C9A227]/30">
                        <Calendar className="w-3 h-3 text-[#C9A227]" />
                        <span>{draw.draw_date}</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-[#1D2821]">
                        {draw.draw_number}
                      </span>
                    </div>

                    {/* Name of Lottery */}
                    <h3 className="text-base sm:text-lg font-bold text-[#1D2821] group-hover:text-[#8B5E0D] transition-colors">
                      {getLotteryName(draw)}
                    </h3>

                    {/* Series Number / List */}
                    <div className="text-[11px] text-[#636058] flex items-start gap-1 pt-0.5">
                      <span className="font-bold text-[#1D2821] shrink-0">{t('draw_series_label')}:</span>
                      <span className="font-mono text-[10px] text-[#8B5E0D] break-words">
                        {seriesString}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0 mt-1">
                    <Link
                      href={`/results/${draw.id}#gazette-pdf-viewer`}
                      onClick={(e) => e.stopPropagation()}
                      className="py-1.5 px-2.5 rounded-lg border border-[#DDD9CE] hover:border-[#C9A227] text-[11px] font-semibold text-[#636058] hover:text-[#1D2821] bg-white flex items-center gap-1 shadow-2xs"
                      title="View Official Gazette PDF"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#C9A227]" />
                      <span>PDF</span>
                    </Link>

                    <a
                      href={draw.source_file?.public_url || `/samples/${draw.source_file?.filename || `${draw.draw_number}.pdf`}`}
                      download={draw.source_file?.filename || `${draw.draw_number}.pdf`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg border border-[#DDD9CE] hover:border-[#C9A227] text-[#8B5E0D] hover:bg-[#FAF6EC] bg-white flex items-center justify-center shadow-2xs transition-colors"
                      title="Download Official Gazette PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => {
                        setSelectedPreviousDraw(draw);
                        setViewMode('check-previous');
                      }}
                      className="py-2 px-3.5 mc-btn-gold text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <span>{t('btn_check_draw')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {liveDraws.length === 0 && (
            <div className="p-8 text-center mc-card text-xs text-[#636058]">
              No previous results available in database.
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3 & 4: SCANNING AND TYPING THE NUMBER SECTION
  // (LOCKED TO TODAY'S DRAW OR THE CHOSEN PREVIOUS DAY'S DRAW)
  // =========================================================================
  const availableSeries = activeCheckingDraw?.series_list || [
    'VA', 'VB', 'VC', 'VD', 'VE', 'VG', 'VH', 'VJ', 'VK', 'VL', 'VM', 'VN'
  ];

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 pb-12 animate-in fade-in duration-200">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-1 border-b border-[#DDD9CE]">
        <button
          onClick={() => {
            if (viewMode === 'check-previous') {
              setViewMode('previous-list');
            } else {
              setViewMode('landing');
            }
          }}
          id="back-btn"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#8B5E0D] hover:underline cursor-pointer py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{viewMode === 'check-previous' ? 'Back to Previous Draws' : t('btn_back')}</span>
        </button>

        <span className="text-xs font-bold text-[#1D2821]">
          {viewMode === 'check-today' ? t('btn_today_results') : 'Previous Draw Verification'}
        </span>
      </div>

      {/* Draw Details Header Card */}
      {activeCheckingDraw && (
        <div className="p-4 rounded-2xl bg-[#FAF6EC] border border-[#C9A227]/40 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#8B5E0D] uppercase font-mono tracking-wider">
              {activeCheckingDraw.draw_number}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8B5E0D] bg-[#FCFBF8] px-2 py-0.5 rounded border border-[#C9A227]/30">
              <ShieldCheck className="w-3 h-3 text-[#C9A227]" />
              Official Gazette
            </span>
          </div>

          <h2 className="text-xl font-bold text-[#1D2821]">
            {getLotteryName(activeCheckingDraw)}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[#636058] pt-0.5">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#C9A227]" />
              <span className="font-semibold text-[#1D2821]">{activeCheckingDraw.draw_date}</span>
            </span>
            <span className="text-[11px] font-mono text-[#8B5E0D]">
              Series: {availableSeries.slice(0, 6).join(', ')}{availableSeries.length > 6 ? '...' : ''}
            </span>
          </div>
        </div>
      )}

      {/* SCANNING & TYPING SECTION */}
      <div className="mc-card p-5 sm:p-6 space-y-5 border border-[#DDD9CE] shadow-xs">
        
        {/* Camera Scanner Toggle / Trigger */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1D2821] flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-[#C9A227]" />
              <span>Camera Scan Option</span>
            </span>
            <button
              type="button"
              onClick={() => setIsCameraOpen(!isCameraOpen)}
              id="toggle-camera-btn"
              className="text-xs font-bold text-[#8B5E0D] hover:underline flex items-center gap-1"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{isCameraOpen ? 'Close Camera' : t('btn_scan_camera')}</span>
            </button>
          </div>

          {/* Inline Live Camera Viewport */}
          {isCameraOpen && (
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#C9A227] bg-black aspect-video flex items-center justify-center animate-in fade-in duration-200">
              {cameraError ? (
                <div className="p-4 text-center text-xs text-[#FAF6EC] space-y-2">
                  <AlertTriangle className="w-8 h-8 text-[#C9A227] mx-auto" />
                  <p>{cameraError}</p>
                </div>
              ) : (
                <>
                  <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Reticle Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                    <div className="w-48 h-28 border-2 border-dashed border-[#C9A227] rounded-xl relative shadow-lg shadow-[#C9A227]/30">
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[#1C1404] bg-[#C9A227] px-2 py-0.5 rounded-full whitespace-nowrap">
                        Align Barcode / QR
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {scannedPayload && (
            <div className="p-2.5 rounded-xl bg-[#FAF6EC] border border-[#C9A227]/40 text-xs text-[#8B5E0D] flex items-center justify-between">
              <span className="flex items-center gap-1 font-mono text-[11px] truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A227] shrink-0" />
                Scanned: {scannedPayload}
              </span>
              <button
                type="button"
                onClick={() => setScannedPayload(null)}
                className="text-[10px] text-[#636058] hover:text-[#1D2821] font-bold ml-2 shrink-0"
              >
                Clear
              </button>
            </div>
          )}

          {scanWarning && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{scanWarning}</span>
            </div>
          )}
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#DDD9CE]" />
          <span className="flex-shrink mx-3 text-[10px] text-[#636058] font-bold uppercase tracking-wider">
            Type Ticket Details
          </span>
          <div className="flex-grow border-t border-[#DDD9CE]" />
        </div>

        {/* Manual Typing Form */}
        <form onSubmit={handleCheckTicket} className="space-y-4">
          <div className="grid grid-cols-3 gap-2.5">
            {/* Series Selector */}
            <div>
              <label className="block text-[11px] font-bold text-[#1D2821] mb-1">
                {t('select_series')}
              </label>
              <select
                value={selectedSeries}
                onChange={(e) => setSelectedSeries(e.target.value)}
                id="ticket-series-select"
                className="mc-input w-full px-3 py-2.5 text-xs font-bold uppercase cursor-pointer"
              >
                {availableSeries.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* 6-Digit Number */}
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-[#1D2821] mb-1">
                {t('enter_number')}
              </label>
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="422635"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value.replace(/[^0-9]/g, ''))}
                id="ticket-number-input"
                className="mc-input w-full px-3.5 py-2.5 font-mono font-bold tracking-widest text-sm text-[#1D2821]"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* CHECK RESULT BUTTON */}
          <button
            type="submit"
            disabled={isLoading || ticketNumber.length !== 6}
            id="btn-check-ticket-submit"
            className="w-full py-3.5 px-4 mc-btn-gold text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4 text-[#1C1404]" />
            <span>{isLoading ? 'CHECKING...' : t('btn_check')}</span>
          </button>
        </form>
      </div>

      {/* Multi-step Searching Animation */}
      {isVerifyingAnim && (
        <VerificationAnimation onComplete={handleAnimationComplete} />
      )}

      {/* WIN POPUP WITH PARTY POPPER EFFECT ("pepper poer effct") */}
      {activeResult && activeResult.status === 'WIN' && (
        <WinningModal
          result={activeResult}
          onClose={() => {
            setActiveResult(null);
            router.push('/support');
          }}
        />
      )}

      {/* NO WIN: SMALL POP ANIMATION WITH HAPPY TEXT MESSAGE (NO REDIRECT TO SUPPORT) */}
      {activeResult && activeResult.status === 'NO_WINNING_RESULT_FOUND' && (
        <HappyNoWinModal
          result={activeResult}
          onClose={() => {
            setActiveResult(null);
          }}
          onCheckAnother={() => {
            setActiveResult(null);
          }}
        />
      )}
    </div>
  );
}

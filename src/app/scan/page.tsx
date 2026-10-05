'use client';

import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Lottery, Draw, CheckTicketResult } from '@/types/lottery';
import { useLanguage } from '@/context/LanguageContext';
import { decodeBarcode } from '@/lib/engine/barcode';
import { VerificationAnimation } from '@/components/VerificationAnimation';
import { WinningModal } from '@/components/WinningModal';
import { HappyNoWinModal } from '@/components/HappyNoWinModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Camera, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  Edit3,
  ExternalLink,
  Upload,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

export default function ScanPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [draws, setDraws] = useState<Draw[]>([]);
  const [selectedDrawId, setSelectedDrawId] = useState<string>('');

  // Scanned payload details
  const [scannedPayload, setScannedPayload] = useState<string | null>(null);
  const [decodedSeries, setDecodedSeries] = useState<string | null>(null);
  const [decodedNumber, setDecodedNumber] = useState<string | null>(null);
  const [scanConfidence, setScanConfidence] = useState<'HIGH' | 'MEDIUM' | 'LOW' | 'UNIDENTIFIED' | null>(null);
  const [scanWarning, setScanWarning] = useState<string | null>(null);

  // Manual fallback inputs
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualSeries, setManualSeries] = useState('');
  const [manualNumber, setManualNumber] = useState('');

  // Verification states
  const [isVerifyingAnim, setIsVerifyingAnim] = useState(false);
  const [pendingResult, setPendingResult] = useState<CheckTicketResult | null>(null);
  const [activeResult, setActiveResult] = useState<CheckTicketResult | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // 1. Load published draws on mount
  useEffect(() => {
    async function fetchDraws() {
      try {
        const res = await fetch('/api/results');
        const data = await res.json();
        if (data.draws && data.draws.length > 0) {
          setDraws(data.draws);
          setSelectedDrawId(data.draws[0].id);
        }
      } catch (err) {
        console.error('Error fetching draws for scanner:', err);
      }
    }
    fetchDraws();
  }, []);

  // 2. Start Camera Feed with resilient fallbacks
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported by your browser or requires HTTPS.');
        setHasCameraPermission(false);
        return;
      }

      let stream: MediaStream | null = null;
      try {
        // Prefer rear/environment camera on phones
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });
      } catch {
        // Fallback to any available video camera (webcam, laptop front camera)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setHasCameraPermission(true);
        setCameraError(null);
        startScanningLoop();
      }
    } catch (err) {
      console.warn('Camera permission denied or camera unavailable:', err);
      setHasCameraPermission(false);
      setCameraError('Camera access denied or unavailable. Grant camera permission in your browser or upload a ticket photo below.');
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // 3. Continuous Scanning Loop
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
              handleBarcodeDetected(code.data, 'QR_CODE');
              return; // stop loop once payload captured
            }
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // 4. Handle barcode detection & inspection with decodeBarcode()
  const handleBarcodeDetected = (rawPayload: string, format: string) => {
    setScannedPayload(rawPayload);
    const decoded = decodeBarcode(rawPayload, format);

    setScanConfidence(decoded.confidence);
    setDecodedSeries(decoded.series);
    setDecodedNumber(decoded.ticketNumber);

    if (decoded.series) setManualSeries(decoded.series);
    if (decoded.ticketNumber) setManualNumber(decoded.ticketNumber);

    if (decoded.confidence === 'UNIDENTIFIED') {
      setScanWarning(decoded.errorMessage || 'Barcode detected, but the ticket number could not be safely identified.');
      setIsManualInput(true);
    } else {
      setScanWarning(null);
    }
  };

  const resetScanner = () => {
    setScannedPayload(null);
    setDecodedSeries(null);
    setDecodedNumber(null);
    setScanConfidence(null);
    setScanWarning(null);
    setActiveResult(null);
    setVerificationError(null);
    startScanningLoop();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth'
          });
          if (code && code.data) {
            handleBarcodeDetected(code.data, 'QR_CODE');
          } else {
            setScanWarning('No barcode/QR code detected in this photo. Please make sure the ticket barcode is well-lit and clear, or enter the 6 digits below.');
            setIsManualInput(true);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // 5. Submit verification
  const handleVerifyTicket = async () => {
    setVerificationError(null);

    const series = decodedSeries || manualSeries;
    const number = decodedNumber || manualNumber;

    if (!selectedDrawId) {
      setVerificationError('Please select a specific draw.');
      return;
    }

    if (!number || number.length !== 6) {
      setVerificationError('Ticket number must be exactly 6 digits.');
      return;
    }

    try {
      const params = new URLSearchParams({
        drawId: selectedDrawId,
        number: number.trim(),
        ...(series ? { series: series.trim() } : {})
      });

      const res = await fetch(`/api/check-ticket?${params.toString()}`);
      const data: CheckTicketResult = await res.json();

      if (!res.ok && data.status === 'ERROR') {
        setVerificationError(data.message || 'Verification error.');
        return;
      }

      setPendingResult(data);
      setIsVerifyingAnim(true);
    } catch {
      setVerificationError('Connection failure during verification.');
    }
  };

  const handleAnimationComplete = () => {
    setIsVerifyingAnim(false);
    if (pendingResult) {
      setActiveResult(pendingResult);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#8B5E0D] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <span className="text-xs font-bold text-[#8B5E0D]">
          Camera Verification Scanner
        </span>
      </div>

      {/* Camera Viewport or Error Fallback */}
      <div className="relative rounded-3xl overflow-hidden mc-card border-2 border-[#C9A227]/40 shadow-md bg-black aspect-square max-h-[380px] flex items-center justify-center">
        {hasCameraPermission === false ? (
          <div className="p-6 text-center space-y-4 bg-[#FCFBF8] w-full h-full flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-[#FAF6EC] border border-[#C9A227]/40 flex items-center justify-center text-[#8B5E0D]">
              <Camera className="w-7 h-7" />
            </div>
            
            <div className="space-y-1 max-w-xs">
              <h4 className="font-bold text-sm text-[#1D2821]">Camera Access</h4>
              <p className="text-xs text-[#636058] leading-relaxed">
                {cameraError || 'Camera access denied or unavailable. Grant camera permission in your browser or upload a ticket photo below.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs pt-1">
              <button
                type="button"
                onClick={startCamera}
                className="flex-1 py-2 px-3 mc-btn-gold text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>

              <label className="flex-1 py-2 px-3 rounded-xl border border-[#C9A227]/50 bg-white hover:bg-[#FAF6EC] text-xs font-bold text-[#8B5E0D] flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Target Reticle Overlay */}
            <div className="absolute inset-0 border-2 border-[#C9A227]/30 pointer-events-none flex items-center justify-center p-8">
              <div className="w-64 h-36 border-2 border-dashed border-[#C9A227] rounded-2xl relative shadow-lg shadow-[#C9A227]/20">
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#8B5E0D] bg-[#FAF6EC] px-2.5 py-0.5 rounded-full border border-[#C9A227]/40 whitespace-nowrap shadow-xs">
                  Align QR / Barcode Here
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Target Draw Selector */}
      <div className="mc-card p-4 border border-[#DDD9CE] space-y-2 shadow-xs">
        <label className="block text-xs font-bold text-[#1D2821]">
          Target Draw (Mandatory)
        </label>
        <select
          value={selectedDrawId}
          onChange={(e) => setSelectedDrawId(e.target.value)}
          id="scanner-draw-select"
          className="mc-input w-full px-3 py-2 text-xs font-semibold cursor-pointer"
        >
          {draws.map((d) => (
            <option key={d.id} value={d.id}>
              {d.draw_number} — {d.lottery?.name_en || 'Draw'} ({d.draw_date})
            </option>
          ))}
        </select>
      </div>

      {/* Scanned Inspection Result Card */}
      {scannedPayload && (
        <div className="mc-card-gold p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8B5E0D] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#C9A227]" />
              Barcode Detected
            </span>
            <button
              onClick={resetScanner}
              className="text-[11px] font-bold text-[#636058] hover:text-[#8B5E0D] flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Scan Again</span>
            </button>
          </div>

          <div className="p-2.5 rounded-[0.625rem] bg-[#F5F2EB] border border-[#DDD9CE] text-[11px] text-[#636058] font-mono truncate">
            Raw Payload: {scannedPayload}
          </div>

          {/* Safety Warning if Payload was Unidentified (Spec 8) */}
          {scanWarning && (
            <div className="p-3 rounded-xl bg-[#FAF6EC] border border-[#C9A227]/40 text-[#8B5E0D] text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#8B5E0D] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{scanWarning}</p>
                <p className="text-[11px] text-[#636058] mt-1">
                  The system never guesses digits. Please confirm or enter the 6-digit ticket number.
                </p>
              </div>
            </div>
          )}

          {/* Ticket Confirmation Fields */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-[#1D2821] mb-1">
                Series
              </label>
              <input
                type="text"
                maxLength={3}
                placeholder="MU"
                value={decodedSeries || manualSeries}
                onChange={(e) => {
                  setDecodedSeries(null);
                  setManualSeries(e.target.value.toUpperCase());
                }}
                className="mc-input w-full px-3 py-2 font-bold text-center uppercase text-sm"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#1D2821] mb-1">
                6-Digit Number
              </label>
              <input
                type="text"
                maxLength={6}
                pattern="[0-9]*"
                placeholder="422635"
                value={decodedNumber || manualNumber}
                onChange={(e) => {
                  setDecodedNumber(null);
                  setManualNumber(e.target.value.replace(/[^0-9]/g, ''));
                }}
                className="mc-input w-full px-3 py-2 font-mono font-bold tracking-widest text-sm"
              />
            </div>
          </div>

          {verificationError && (
            <p className="text-xs text-red-600 font-bold">{verificationError}</p>
          )}

          <button
            onClick={handleVerifyTicket}
            id="verify-scanned-ticket-btn"
            className="w-full py-3 px-4 mc-btn-gold text-xs font-bold flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4 text-[#1C1404]" />
            <span>VERIFY TICKET RESULT</span>
          </button>
        </div>
      )}

      {/* Manual Entry Fallback Toggle */}
      {!scannedPayload && (
        <div className="text-center pt-2">
          <button
            onClick={() => setIsManualInput(!isManualInput)}
            id="manual-input-toggle-btn"
            className="text-xs font-bold text-[#8B5E0D] hover:underline inline-flex items-center space-x-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isManualInput ? 'Hide Manual Entry' : 'Cannot scan? Enter ticket number manually'}</span>
          </button>
        </div>
      )}

      {/* Manual Fallback Card */}
      {isManualInput && !scannedPayload && (
        <div className="mc-card p-5 border border-[#DDD9CE] space-y-3 shadow-xs">
          <h4 className="text-xs font-bold text-[#1D2821] uppercase tracking-wider">
            Manual Ticket Entry
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-[#1D2821] mb-1">Series</label>
              <input
                type="text"
                maxLength={3}
                placeholder="MU"
                value={manualSeries}
                onChange={(e) => setManualSeries(e.target.value.toUpperCase())}
                className="mc-input w-full px-3 py-2 font-bold text-center uppercase text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#1D2821] mb-1">6-Digit Number</label>
              <input
                type="text"
                maxLength={6}
                pattern="[0-9]*"
                placeholder="422635"
                value={manualNumber}
                onChange={(e) => setManualNumber(e.target.value.replace(/[^0-9]/g, ''))}
                className="mc-input w-full px-3 py-2 font-mono font-bold tracking-widest text-sm"
              />
            </div>
          </div>

          {verificationError && (
            <p className="text-xs text-red-600 font-bold">{verificationError}</p>
          )}

          <button
            onClick={handleVerifyTicket}
            className="w-full py-2.5 px-4 mc-btn-gold text-xs font-bold"
          >
            CHECK RESULT
          </button>
        </div>
      )}

      {/* Multi-step Animation */}
      {isVerifyingAnim && (
        <VerificationAnimation onComplete={handleAnimationComplete} />
      )}

      {/* Winning Popup */}
      {activeResult && activeResult.status === 'WIN' && (
        <WinningModal
          result={activeResult}
          onClose={() => {
            setActiveResult(null);
            router.push('/support');
          }}
        />
      )}

      {/* No Win Result Popup (No redirect to support) */}
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

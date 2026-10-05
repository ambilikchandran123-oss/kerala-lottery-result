'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  ArrowRight,
  FileCheck2,
  AlertCircle,
  Calendar,
  Hash,
  Tag,
  FileUp,
  Sparkles,
  X
} from 'lucide-react';

interface IngestionPreview {
  drawId: string;
  status: string;
  sha256: string;
  filename: string;
  lottery: string;
  drawNumber: string;
  drawDate: string;
  categoriesCount: number;
  totalEntries: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;
  ocrUsed: boolean;
  warnings: string[];
  categories: {
    categoryCode: string;
    nameEn: string;
    amount: number;
    entries: unknown[];
  }[];
}

const KERALA_LOTTERIES_PRESET = [
  { name: 'Sthree Sakthi', code: 'SS', nameMl: 'സ്ത്രീ ശക്തി' },
  { name: 'Dhanalekshmi', code: 'DL', nameMl: 'ധനലക്ഷ്മി' },
  { name: 'Win-Win', code: 'W', nameMl: 'വിൻ-വിൻ' },
  { name: 'Fifty-Fifty', code: 'FF', nameMl: 'ഫിഫ്റ്റി-ഫിഫ്റ്റി' },
  { name: 'Karunya Plus', code: 'KN', nameMl: 'കാരുണ്യ പ്ലസ്' },
  { name: 'Karunya', code: 'KR', nameMl: 'കാരുണ്യ' },
  { name: 'Nirmal', code: 'NR', nameMl: 'നിർമ്മൽ' },
  { name: 'Akshaya', code: 'AK', nameMl: 'അക്ഷയ' },
  { name: 'Thiruvonam Bumper', code: 'BR', nameMl: 'തിരുവോണം ബമ്പർ' }
];

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Metadata form state
  const [lotteryName, setLotteryName] = useState('Sthree Sakthi');
  const [drawNumber, setDrawNumber] = useState('SS-539');
  const [drawDate, setDrawDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [isOcr, setIsOcr] = useState(false);
  const [autoPublish, setAutoPublish] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<IngestionPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  // Select a preset lottery
  const handleSelectPreset = (preset: typeof KERALA_LOTTERIES_PRESET[0]) => {
    setLotteryName(preset.name);
    // Suggest draw number with proper series prefix
    const parts = drawNumber.split('-');
    const numPart = parts.length > 1 ? parts[1] : '';
    setDrawNumber(`${preset.code}-${numPart || '500'}`);
  };

  // Handle file selection (and auto-read text file if .txt)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (file.name.toLowerCase().endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (evt.target?.result) {
            setRawText(evt.target.result as string);
          }
        };
        reader.readAsText(file);
      }
    }
  };

  // Sample official gazette text pre-fill for fast testing
  const sampleGazetteText = `KERALA STATE LOTTERIES - RESULT
www.keralalotteries.com
PHONE: 0471-2305230, 2305193
KARUNYA PLUS LOTTERY NO. KN-650th DRAW held on 01/10/2026 AT GORKY BHAVAN, THIRUVANANTHAPURAM

1st Prize- Rs :1,00,00,000/-       PA 567890  (KOLLAM)

Consolation Prize- Rs. 8,000/-     PB 567890  PC 567890  PD 567890  PE 567890
                                   PF 567890  PG 567890  PH 567890  PJ 567890
                                   PK 567890  PL 567890  PM 567890

2nd Prize- Rs :10,00,000/-         PJ 890123  (ERNAKULAM)

3rd Prize- Rs :5,00,000/-          PC 456123  (KOZHIKODE)

4th Prize- Rs. 5,000/-
1122  3344  5566  7788  9900  1234  5678  9012

5th Prize- Rs. 1,000/-
0101  0202  0303  0404  0505

The prize winners are advised to verify the winning numbers with the results published in the Kerala Government Gazette.`;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey) {
      setIsAuthenticated(true);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPublishSuccess(null);
    setPreview(null);
    setIsSubmitting(true);

    try {
      let res;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (lotteryName.trim()) formData.append('lotteryName', lotteryName.trim());
        if (drawNumber.trim()) formData.append('drawNumber', drawNumber.trim());
        if (drawDate.trim()) formData.append('drawDate', drawDate.trim());
        if (isOcr) formData.append('ocrUsed', 'true');

        res = await fetch('/api/admin/import', {
          method: 'POST',
          headers: { 'x-admin-key': adminKey },
          body: formData
        });
      } else {
        if (!rawText.trim()) {
          setErrorMessage('Please provide result document text or upload a file.');
          setIsSubmitting(false);
          return;
        }
        res = await fetch('/api/admin/import', {
          method: 'POST',
          headers: {
            'x-admin-key': adminKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: rawText,
            lotteryName: lotteryName.trim(),
            drawNumber: drawNumber.trim(),
            drawDate: drawDate.trim(),
            filename: `official_result_${drawNumber.trim() || Date.now()}.txt`,
            ocrUsed: isOcr
          })
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Import failed.');
      } else {
        if (autoPublish && data.drawId) {
          // Immediately publish to live website
          const pubRes = await fetch('/api/admin/publish', {
            method: 'POST',
            headers: {
              'x-admin-key': adminKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              drawId: data.drawId,
              performedBy: 'lottery_officer_admin',
              reason: 'Verified and auto-published upon upload'
            })
          });
          const pubData = await pubRes.json();
          if (pubData.success) {
            setPublishSuccess(`Draw ${data.drawNumber} (${data.lottery}) ഔദ്യോഗികമായി പ്രസിദ്ധീകരിച്ചു! ഫലം ഇപ്പോൾ ഹോം പേജിൽ ലൈവാണ്.`);
            setPreview({ ...data, status: 'PUBLISHED' });
          } else {
            setPreview(data);
          }
        } else {
          setPreview(data);
        }
      }
    } catch {
      setErrorMessage('Connection failed during result import.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!preview) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: {
          'x-admin-key': adminKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          drawId: preview.drawId,
          performedBy: 'lottery_officer_admin',
          reason: 'Verified and approved by lottery verification authority'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Publishing failed.');
      } else {
        setPublishSuccess(`Draw ${preview.drawNumber} officially PUBLISHED! Users can now verify tickets against this draw.`);
        setPreview(prev => prev ? { ...prev, status: 'PUBLISHED' } : null);
      }
    } catch {
      setErrorMessage('Connection failed during publication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 animate-in fade-in duration-200">
        <div className="mc-card p-8 border border-[#DDD9CE] shadow-md text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FAF6EC] text-[#8B5E0D] flex items-center justify-center border border-[#C9A227]/40">
            <Lock className="w-7 h-7 text-[#C9A227]" />
          </div>

          <h2 className="text-xl font-sans font-bold text-[#1D2821]">
            Administrative Ingestion Access
          </h2>
          <p className="text-xs text-[#636058]">
            Authorized personnel only. Public users have zero write permissions.
          </p>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-[#1D2821] text-left mb-1">
                Admin Secret Key
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                id="admin-secret-key-input"
                className="mc-input w-full px-3.5 py-2.5 text-xs font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 mc-btn-gold text-xs font-bold"
            >
              Authenticate Officer Session
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-sans font-bold text-[#1D2821] flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#C9A227]" />
            <span>Official Result Ingestion Portal</span>
          </h1>
          <p className="text-xs text-[#636058]">
            Secure, verified parsing & publication pipeline
          </p>
        </div>

        <button
          onClick={() => setIsAuthenticated(false)}
          className="text-xs font-bold text-[#636058] hover:text-[#1D2821]"
        >
          Lock Session
        </button>
      </div>

      {/* Upload & Parse Form */}
      <div className="mc-card p-6 sm:p-8 border border-[#DDD9CE] shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-sans font-bold text-[#1D2821] flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#C9A227]" />
            <span>ഇന്നത്തെ ലോട്ടറി ഫലം നൽകുക (Add Lottery Result)</span>
          </h2>
          <p className="text-xs text-[#636058] mt-0.5">
            ലോട്ടറിയുടെ പേര്, സീരിയൽ നമ്പർ, തീയതി എന്നിവ നൽകിയ ശേഷം ഫയൽ അപ്‌ലോഡ് ചെയ്യുകയോ ടെക്സ്റ്റ് പേസ്റ്റ് ചെയ്യുകയോ ചെയ്യുക.
          </p>
        </div>

        <form onSubmit={handleImport} className="space-y-6">
          {/* SECTION 1: LOTTERY METADATA */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF6EC] border border-[#C9A227]/30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#8B5E0D] uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>1. ലോട്ടറി വിവരങ്ങൾ (Lottery Details)</span>
              </span>
              <span className="text-[10px] text-[#636058] font-medium">Quick Select 👇</span>
            </div>

            {/* Quick preset selector buttons */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {KERALA_LOTTERIES_PRESET.map((preset) => {
                const isSelected = lotteryName.toLowerCase() === preset.name.toLowerCase();
                return (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#C9A227] text-[#1C1404] shadow-xs ring-2 ring-[#C9A227]/40'
                        : 'bg-white hover:bg-[#FFF2C2] text-[#1D2821] border border-[#DDD9CE]'
                    }`}
                  >
                    <span>{preset.nameMl}</span>
                    <span className="text-[10px] ml-1 opacity-75 font-mono">({preset.code})</span>
                  </button>
                );
              })}
            </div>

            {/* 3-column input grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              {/* Field 1: Lottery Name */}
              <div>
                <label className="block text-xs font-bold text-[#1D2821] mb-1">
                  ലോട്ടറിയുടെ പേര് (Lottery Name) *
                </label>
                <input
                  type="text"
                  required
                  value={lotteryName}
                  onChange={(e) => setLotteryName(e.target.value)}
                  placeholder="ഉദാ: Sthree Sakthi, Win-Win"
                  id="admin-lottery-name-input"
                  className="mc-input w-full px-3 py-2 text-xs font-semibold bg-white"
                />
              </div>

              {/* Field 2: Serial / Draw Number */}
              <div>
                <label className="block text-xs font-bold text-[#1D2821] mb-1">
                  സീരിയൽ / ഡ്രോ നമ്പർ (Serial No) *
                </label>
                <div className="relative">
                  <Hash className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8B5E0D]" />
                  <input
                    type="text"
                    required
                    value={drawNumber}
                    onChange={(e) => setDrawNumber(e.target.value.toUpperCase())}
                    placeholder="ഉദാ: SS-539, KN-650, W-750"
                    id="admin-draw-number-input"
                    className="mc-input w-full pl-8 pr-3 py-2 text-xs font-mono font-bold uppercase bg-white"
                  />
                </div>
              </div>

              {/* Field 3: Draw Date */}
              <div>
                <label className="block text-xs font-bold text-[#1D2821] mb-1">
                  ഡ്രോ തീയതി (Date) *
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8B5E0D]" />
                  <input
                    type="date"
                    required
                    value={drawDate}
                    onChange={(e) => setDrawDate(e.target.value)}
                    id="admin-draw-date-input"
                    className="mc-input w-full pl-8 pr-3 py-2 text-xs font-semibold bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: RESULT DOCUMENT FILE OR TEXT */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-[#8B5E0D] uppercase tracking-wider flex items-center gap-1.5">
              <FileUp className="w-3.5 h-3.5" />
              <span>2. റിസൾട്ട് ഫയൽ / ടെക്സ്റ്റ് (Result Document File or Text)</span>
            </span>

            {/* File Picker */}
            <div className="p-3.5 rounded-xl border border-dashed border-[#C9A227] bg-[#FFFDF7] space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#1D2821]">
                  ഔദ്യോഗിക റിസൾട്ട് ഫയൽ തിരഞ്ഞെടുക്കുക (.txt / .pdf)
                </label>
                {selectedFile && (
                  <span className="text-[10px] font-mono font-bold text-[#1B6B35] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#C8E6C9]">
                    ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
              <input
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileChange}
                id="admin-file-upload-input"
                className="mc-input w-full px-3 py-2 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#1D221F] file:text-white hover:file:bg-[#2c332f] cursor-pointer"
              />
              {selectedFile ? (
                <div className="mt-2.5 p-2.5 rounded-xl bg-[#FAF6EC] border border-[#C9A227]/40 flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#C9A227]/15 flex items-center justify-center text-[#8B5E0D]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1D2821]">{selectedFile.name}</p>
                      <p className="text-[10px] text-[#636058]">
                        {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.name.toLowerCase().endsWith('.pdf') ? 'Official PDF' : 'Text File'} • പ്രോസസ്സ് ചെയ്യാൻ സജ്ജമാണ്
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      const fileInput = document.getElementById('admin-file-upload-input') as HTMLInputElement | null;
                      if (fileInput) fileInput.value = '';
                    }}
                    className="p-1 rounded-md text-[#636058] hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-[#636058]">
                  ഭാഗ്യക്കുറി വകുപ്പിൽ നിന്നുള്ള ഔദ്യോഗിക .pdf അല്ലെങ്കിൽ .txt ഫയൽ അപ്‌ലോഡ് ചെയ്യാം. (ഡിജിറ്റൽ PDF ഫയലുകളിൽ നിന്ന് സമ്മാനങ്ങൾ തനിയെ വേർതിരിച്ചെടുക്കും).
                </p>
              )}
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#DDD9CE]" />
              <span className="flex-shrink mx-4 text-[10px] text-[#636058] font-bold uppercase">അല്ലെങ്കിൽ നേരിട്ട് ടെക്സ്റ്റ് നൽകാം</span>
              <div className="flex-grow border-t border-[#DDD9CE]" />
            </div>

            {/* Text Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#1D2821]">
                  റിസൾട്ട് ഗസറ്റ് ഉള്ളടക്കം (Result Text Content)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRawText(sampleGazetteText);
                      setLotteryName('Karunya Plus');
                      setDrawNumber('KN-650');
                      setDrawDate('2026-10-01');
                    }}
                    className="text-[10px] text-[#8B5E0D] hover:underline font-bold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-[#C9A227]" />
                    <span>മാതൃകാ റിസൾട്ട് നൽകുക (Sample Draw)</span>
                  </button>
                  {rawText && (
                    <button
                      type="button"
                      onClick={() => setRawText('')}
                      className="text-[10px] text-[#636058] hover:text-red-600 font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <textarea
                rows={selectedFile ? 5 : 9}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={selectedFile 
                  ? `ഫയൽ തിരഞ്ഞെടുത്തിരിക്കുന്നു (${selectedFile.name}). താഴെയുള്ള ബട്ടൺ ക്ലിക്ക് ചെയ്താൽ ഈ ഫയൽ പ്രോസസ്സ് ആകും. നേരിട്ട് ടെക്സ്റ്റ് മാറ്റണമെങ്കിൽ മാത്രം ഇവിടെ പേസ്റ്റ് ചെയ്യുക.`
                  : "ഔദ്യോഗിക ഗസറ്റ് റിസൾട്ട് ടെക്സ്റ്റ് ഇവിടെ പേസ്റ്റ് ചെയ്യുക (1st Prize, Consolation, 2nd, 3rd... നമ്പറുകൾ ഉൾപ്പെടെ)..."
                }
                id="admin-gazette-text-input"
                className="mc-input w-full px-3.5 py-2.5 font-mono text-xs leading-relaxed"
              />
            </div>

            {/* OCR Checkbox */}
            <div className="flex items-start space-x-2 pt-1">
              <input
                type="checkbox"
                id="ocr-toggle"
                checked={isOcr}
                onChange={(e) => setIsOcr(e.target.checked)}
                className="rounded border-[#DDD9CE] text-[#C9A227] focus:ring-[#C9A227] mt-0.5"
              />
              <label htmlFor="ocr-toggle" className="text-xs text-[#636058] font-medium cursor-pointer leading-normal">
                <span>ക്യാമറ ഫോട്ടോ / സ്കാൻ ചെയ്ത OCR ഇമേജ് ആണെങ്കിൽ മാത്രം ടിക്ക് ചെയ്യുക</span>
                <span className="block text-[10px] text-[#8B5E0D]">
                  (ഔദ്യോഗിക ഡിജിറ്റൽ PDF ഫയലുകൾക്ക് ഇത് അൺചെക്ക് (Uncheck) ചെയ്തു വെക്കുക)
                </span>
              </label>
            </div>
            {/* Auto-publish toggle */}
            <div className="flex items-center space-x-2 pt-2 pb-1">
              <input
                type="checkbox"
                id="auto-publish-toggle"
                checked={autoPublish}
                onChange={(e) => setAutoPublish(e.target.checked)}
                className="w-4 h-4 rounded border-[#DDD9CE] text-[#C9A227] focus:ring-[#C9A227] cursor-pointer"
              />
              <label htmlFor="auto-publish-toggle" className="text-xs text-[#1D2821] font-bold cursor-pointer flex items-center gap-1.5 flex-wrap">
                <span>ഫലം പ്രോസസ്സ് ചെയ്ത ഉടൻ തന്നെ വെബ്‌സൈറ്റിൽ ലൈവാക്കുക (Auto-publish immediately to front-end)</span>
                <span className="text-[10px] bg-[#E8F5E9] text-[#1B6B35] px-1.5 py-0.5 rounded font-bold border border-[#C8E6C9]">Recommended</span>
              </label>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            id="admin-import-submit-btn"
            className="w-full py-3.5 mc-btn-gold text-sm font-bold flex items-center justify-center space-x-2 cursor-pointer shadow-md"
          >
            <FileCheck2 className="w-4 h-4 text-[#1C1404]" />
            <span>{isSubmitting ? 'PROCESSING & EXTRACTING PRIZES...' : 'ഫലം പരിശോധിച്ച് അപ്‌ലോഡ് ചെയ്യുക (PROCESS & PUBLISH RESULT)'}</span>
          </button>
        </form>
      </div>

      {/* ADMIN VALIDATION SCREEN (SPEC 58) */}
      {preview && (
        <div className="mc-card-gold p-6 sm:p-8 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDD9CE]">
            <div>
              <span className="text-xs font-bold text-[#8B5E0D] uppercase tracking-widest font-mono">
                Verification Screen
              </span>
              <h3 className="text-xl font-sans font-bold text-[#1D2821]">
                {preview.lottery} — Draw {preview.drawNumber}
              </h3>
            </div>

            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
              preview.status === 'PUBLISHED'
                ? 'bg-[#FAF6EC] text-[#8B5E0D] border-[#C9A227]/40'
                : preview.confidence === 'HIGH' && !preview.ocrUsed
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-[#FAF6EC] text-[#8B5E0D] border-[#C9A227]/40'
            }`}>
              {preview.status}
            </span>
          </div>

          {/* Validation Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F5F2EB] border border-[#DDD9CE]">
              <span className="text-[#636058] block text-[10px] font-medium">Draw Date</span>
              <span className="font-bold text-[#1D2821] text-sm">{preview.drawDate}</span>
            </div>

            <div className="p-3 rounded-xl bg-[#F5F2EB] border border-[#DDD9CE]">
              <span className="text-[#636058] block text-[10px] font-medium">Extracted Categories</span>
              <span className="font-bold text-[#8B5E0D] text-sm">{preview.categoriesCount} Tiers</span>
            </div>

            <div className="p-3 rounded-xl bg-[#F5F2EB] border border-[#DDD9CE]">
              <span className="text-[#636058] block text-[10px] font-medium">Winning Entries</span>
              <span className="font-bold text-[#8B5E0D] text-sm">{preview.totalEntries} Entries</span>
            </div>

            <div className="p-3 rounded-xl bg-[#F5F2EB] border border-[#DDD9CE]">
              <span className="text-[#636058] block text-[10px] font-medium">Confidence Score</span>
              <span className="font-bold text-[#1D2821] text-sm">{preview.confidenceScore}% ({preview.confidence})</span>
            </div>
          </div>

          {/* Cryptographic SHA-256 Provenance */}
          <div className="p-3 rounded-xl bg-[#F5F2EB] border border-[#DDD9CE] text-xs">
            <span className="text-[#636058] block font-bold mb-1">
              Source File SHA-256 Checksum:
            </span>
            <span className="font-mono text-[#8B5E0D] text-[11px] break-all block font-bold">
              {preview.sha256}
            </span>
          </div>

          {/* Warnings */}
          {preview.warnings.length > 0 && (
            <div className="p-3 rounded-xl bg-[#FAF6EC] border border-[#C9A227]/30 text-xs text-[#8B5E0D] space-y-1">
              <span className="font-bold block flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-[#8B5E0D]" />
                <span>Verification Warnings:</span>
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#8B5E0D]">
                {preview.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {publishSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{publishSuccess}</span>
              </div>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <a
                  href="/"
                  className="px-4 py-2 rounded-xl bg-[#C9A227] hover:bg-[#b59120] text-[#1C1404] font-bold text-xs transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <span>ഹോം പേജിൽ റിസൾട്ട് കാണുക (View on Homepage)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <a
                  href={`/results/${preview.drawId}`}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-[#FAF6EC] border border-[#DDD9CE] text-[#1D2821] font-bold text-xs transition-colors inline-flex items-center gap-1"
                >
                  <span>ഈ ഫലത്തിന്റെ പേജ് കാണുക</span>
                </a>
              </div>
            </div>
          )}

          {/* APPROVE & PUBLISH BUTTON (Spec 58) */}
          {preview.status !== 'PUBLISHED' && (
            <div className="pt-2">
              <button
                onClick={handlePublish}
                disabled={isSubmitting}
                id="admin-approve-publish-btn"
                className="w-full py-3.5 px-4 mc-btn-gold text-xs sm:text-sm font-bold flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-5 h-5 text-[#1C1404]" />
                <span>APPROVE & PUBLISH DRAW FOR PUBLIC VERIFICATION</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

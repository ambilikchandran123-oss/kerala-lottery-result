'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Coffee, 
  Heart, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Server, 
  QrCode as QrCodeIcon
} from 'lucide-react';

const UPI_ID = 'BHARATPE2J0A0P6U4O28675@unitype';
const PAYEE_NAME = 'Kerala Lottery Result Checker';

const PRESET_AMOUNTS = [
  { amount: 10, label: '₹10', desc_ml: 'ഒരു ചായ ☕', desc_en: 'Tea ☕' },
  { amount: 15, label: '₹15', desc_ml: 'ഒരു കോഫി ☕✨', desc_en: 'Coffee ☕✨', popular: true },
  { amount: 40, label: '₹40', desc_ml: 'സെർവർ ബൂസ്റ്റ് 🚀', desc_en: 'Server Boost 🚀' }
];

export default function SupportPage() {
  const { language } = useLanguage();
  const [selectedAmount, setSelectedAmount] = useState<number>(15);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Compute active donation amount
  const activeAmount = isCustom ? Math.max(1, parseInt(customAmount, 10) || 10) : selectedAmount;

  // Construct UPI deep-link URL encoded into the QR code
  const paymentNote = language === 'ml' ? 'Kerala Lottery Server Support - നന്ദി' : 'Kerala Lottery Server Support - Thank You';
  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${activeAmount}&cu=INR&tn=${encodeURIComponent(paymentNote)}`;

  // Generate QR code dynamically whenever amount changes
  useEffect(() => {
    QRCode.toDataURL(upiUrl, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#1D221F',
        light: '#FCFBF8'
      }
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate QR Code', err));
  }, [upiUrl]);

  const handleCopyUpi = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-16 pt-2 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF6EC] text-[#8B5E0D] border border-[#C9A227]/40 shadow-2xs">
          <Heart className="w-3.5 h-3.5 text-[#C9A227] fill-[#C9A227]" />
          <span>{language === 'ml' ? 'സെർവർ & മെയിന്റനൻസ് സപ്പോർട്ട്' : 'Server & Maintenance Support'}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D221F] tracking-tight">
          {language === 'ml' ? (
            <>ഞങ്ങളെ <span className="text-[#8B5E0D]">സപ്പോർട്ട്</span> ചെയ്യാം ☕</>
          ) : (
            <>Buy Us a <span className="text-[#8B5E0D]">Coffee</span> ☕</>
          )}
        </h1>

        <p className="text-xs sm:text-sm text-[#636058] max-w-md mx-auto leading-relaxed">
          {language === 'ml'
            ? 'കേരള ലോട്ടറി ചെക്കർ 100% സൗജന്യമായും പരസ്യങ്ങളില്ലാതെയും നിലനിർത്താൻ, സെർവർ ചാർജുകൾക്കും മെയിന്റനൻസിനുമായി നിങ്ങളുടെ ചെറിയ സംഭാവന നൽകി സഹായിക്കൂ.'
            : 'Help us keep Kerala Lottery Checker 100% free, ultra-fast and ad-free. Your small contribution directly covers our cloud server charges and daily gazette maintenance.'}
        </p>
      </div>

      {/* Main Donation Card */}
      <div className="mc-card p-5 sm:p-7 border border-[#DDD9CE] shadow-sm space-y-6">
        
        {/* Step 1: Choose Amount */}
        <div>
          <label className="block text-xs font-bold text-[#1D221F] uppercase tracking-wider mb-2.5">
            {language === 'ml' ? '1. തുക തിരഞ്ഞെടുക്കുക (Choose Amount)' : '1. Choose Donation Amount'}
          </label>

          <div className="grid grid-cols-3 gap-2.5">
            {PRESET_AMOUNTS.map((preset) => {
              const isSelected = !isCustom && selectedAmount === preset.amount;
              return (
                <button
                  key={preset.amount}
                  type="button"
                  onClick={() => handleSelectPreset(preset.amount)}
                  className={`py-3 px-2 rounded-xl text-center transition-all cursor-pointer relative border ${
                    isSelected
                      ? 'bg-[#FAF6EC] border-[#C9A227] text-[#1D221F] shadow-sm ring-1 ring-[#C9A227]'
                      : 'bg-white border-[#DDD9CE] hover:border-[#C9A227]/60 text-[#1D221F]'
                  }`}
                >
                  {preset.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#C9A227] text-[#1C1404] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-tighter">
                      Popular
                    </span>
                  )}
                  <div className="text-lg font-extrabold">{preset.label}</div>
                  <div className="text-[10px] text-[#636058] font-medium mt-0.5">
                    {language === 'ml' ? preset.desc_ml : preset.desc_en}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Amount Option */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between border ${
                isCustom
                  ? 'border-[#C9A227] bg-[#FAF6EC] text-[#1D221F]'
                  : 'border-[#DDD9CE] bg-white text-[#636058] hover:text-[#1D221F]'
              }`}
            >
              <span>{language === 'ml' ? 'മറ്റൊരു തുക നൽകാൻ (Custom Amount)' : 'Enter Custom Amount'}</span>
              <span className="text-[#8B5E0D]">₹</span>
            </button>

            {isCustom && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-bold text-[#8B5E0D]">₹</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="തുക രേഖപ്പെടുത്തുക (e.g. 50, 100)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="mc-input flex-1 px-3 py-2 text-sm font-bold text-[#1D221F]"
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Our Heartfelt Wish for the Supporter */}
        <div className="p-4 rounded-2xl bg-[#FAF6EC] border border-[#C9A227]/40 text-center space-y-2 shadow-2xs">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B5E0D] uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#C9A227]" />
            <span>{language === 'ml' ? 'ഞങ്ങളുടെ ഹൃദയം നിറഞ്ഞ ആശംസകൾ' : 'Our Heartfelt Wish & Blessing For You'}</span>
            <Sparkles className="w-4 h-4 text-[#C9A227]" />
          </div>

          <p className="text-xs sm:text-sm font-bold text-[#1D221F] leading-relaxed px-2">
            {language === 'ml'
              ? 'നിങ്ങളുടെ ജീവിതത്തിൽ സർവ്വവിധ ഭാഗ്യങ്ങളും സന്തോഷവും ഐശ്വര്യങ്ങളും എന്നും നിറഞ്ഞുനിൽക്കട്ടെ എന്ന് സർവ്വേശ്വരനോട് ഹൃദയപൂർവ്വം പ്രാർത്ഥിക്കുന്നു! നിങ്ങൾ ആഗ്രഹിക്കുന്ന നല്ല കാര്യങ്ങളെല്ലാം ഭംഗിയായി നടക്കട്ടെ! 🌟❤️'
              : 'May your life be blessed with good health, immense happiness, boundless prosperity, and good fortune always! Thank you for standing with us and supporting our service! 🌟❤️'}
          </p>
        </div>

        {/* Step 3: Dynamic QR Code Card with Download QR Button */}
        <div className="p-5 rounded-2xl bg-[#FAF6EC] border border-[#C9A227]/50 text-center space-y-4 shadow-xs">
          
          <div className="flex items-center justify-between border-b border-[#C9A227]/30 pb-2">
            <span className="text-[11px] font-bold text-[#8B5E0D] uppercase tracking-wider flex items-center gap-1">
              <QrCodeIcon className="w-3.5 h-3.5 text-[#C9A227]" />
              <span>Scan & Pay via UPI</span>
            </span>
            <span className="text-lg font-extrabold text-[#1D221F]">
              ₹{activeAmount}
            </span>
          </div>

          {/* QR Code Canvas/Image */}
          <div className="w-56 h-56 mx-auto bg-white p-2.5 rounded-2xl border-2 border-[#C9A227]/40 shadow-sm flex items-center justify-center">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt={`UPI QR Code for ₹${activeAmount}`}
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <div className="text-xs text-[#636058] animate-pulse">Generating QR...</div>
            )}
          </div>

          {/* Download QR Code Button */}
          <div className="space-y-2 pt-1">
            {qrCodeDataUrl && (
              <a
                href={qrCodeDataUrl}
                download={`Kerala_Lottery_Support_UPI_QR_Rs${activeAmount}.png`}
                className="w-full py-3 px-4 mc-btn-gold text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#1C1404]" />
                <span>
                  {language === 'ml'
                    ? `₹${activeAmount} QR കോഡ് ഡൗൺലോഡ് ചെയ്യുക`
                    : `Download QR Code (₹${activeAmount})`}
                </span>
              </a>
            )}

            {/* UPI ID with 1-Click Copy */}
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-[#DDD9CE] text-xs">
              <div className="text-left overflow-hidden">
                <span className="text-[10px] text-[#636058] block">UPI ID:</span>
                <span className="font-mono font-bold text-[#1D2821] text-[11px] truncate block">
                  {UPI_ID}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="py-1 px-2.5 rounded-lg bg-[#F5F2EB] hover:bg-[#EAE5D8] text-[11px] font-bold text-[#8B5E0D] flex items-center gap-1 transition-colors shrink-0 cursor-pointer ml-2"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-700" />
                    <span className="text-green-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Transparency & Note */}
        <div className="p-3.5 rounded-xl bg-[#F5F2EB] border border-[#DDD9CE] text-[11px] text-[#636058] flex items-start space-x-2">
          <Server className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {language === 'ml'
              ? 'ഈ സംഭാവന പൂർണ്ണമായും ഔദ്യോഗിക ഗസറ്റ് ക്ലൗഡ് സെർവർ ഹോസ്റ്റിംഗിനും സിസ്റ്റം മെയിന്റനൻസിനും മാത്രമായി ഉപയോഗിക്കുന്നു. ഞങ്ങൾക്ക് താങ്ങായി നിൽക്കുന്നതിന് നന്ദി! ❤️'
              : '100% of contributions directly support official gazette cloud server hosting, database storage, and high-availability maintenance. Thank you for your kindness! ❤️'}
          </p>
        </div>

      </div>
    </div>
  );
}

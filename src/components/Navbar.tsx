'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage, LANGUAGES, Language } from '@/context/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const handleSelectLanguage = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FCFBF8]/95 backdrop-blur-md border-b border-[#DDD9CE] shadow-xs">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-[0.875rem] bg-[#C9A227] border border-[#C9A227]/60 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 shrink-0">
            <span className="font-extrabold text-[#1C1404] text-base leading-none">
              KL
            </span>
          </div>
          <div>
            <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-[#1D221F] m-0 leading-snug">
              {t('app_title')}
            </h1>
          </div>
        </Link>

        {/* Multi-language Selector (Super Compact Small Size) */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            id="language-selector-btn"
            className="flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF6EC] hover:bg-[#F5EED9] text-[#8B5E0D] border border-[#C9A227]/40 transition-all hover:scale-105 active:scale-95 shadow-2xs cursor-pointer"
            aria-label="Select Language / ഭാഷ തിരഞ്ഞെടുക്കുക"
            aria-expanded={isOpen}
          >
            <Globe className="w-2.5 h-2.5 text-[#C9A227]" />
            <span className="font-semibold">{currentLang.nativeLabel}</span>
            <ChevronDown className={`w-2.5 h-2.5 text-[#8B5E0D] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-[#FCFBF8] border border-[#DDD9CE] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#636058] border-b border-[#DDD9CE] mb-1">
                Choose Language / ഭാഷ
              </div>
              <div className="space-y-0.5">
                {LANGUAGES.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                        isSelected
                          ? 'bg-[#FAF6EC] text-[#8B5E0D] border border-[#C9A227]/40'
                          : 'text-[#1D2821] hover:bg-[#F5F2EB]'
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-xs">{lang.nativeLabel}</span>
                        <span className="text-[10px] text-[#636058] font-normal">{lang.label}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#8B5E0D] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


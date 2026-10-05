'use client';

import React, { useState } from 'react';
import { Search, Sparkles, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/engine/matcher';

export interface SearchablePrizeCategory {
  id: string;
  category_code: string;
  category_name_en: string;
  category_name_ml: string;
  prize_amount: number;
  match_type: string;
  match_digits: number;
  entries: Array<{
    ticket_number: string;
    series?: string | null;
    matched_suffix?: string | null;
    full_ticket?: string | null;
  }>;
}

interface GazetteNumberSearchProps {
  categories: SearchablePrizeCategory[];
  drawNumber: string;
}

export function GazetteNumberSearch({ categories, drawNumber }: GazetteNumberSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchResult, setMatchResult] = useState<{
    found: boolean;
    categoryNameEn?: string;
    categoryNameMl?: string;
    prizeAmount?: number;
    matchedNumber?: string;
    series?: string | null;
  } | null>(null);

  const handleSearch = (query: string) => {
    const clean = query.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    setSearchTerm(clean);

    if (!clean || clean.length < 4) {
      setMatchResult(null);
      return;
    }

    // Extract digits only for suffix / 6-digit matching
    const digitsOnly = clean.replace(/[^0-9]/g, '');
    const alphaOnly = clean.replace(/[^A-Z]/g, '');

    // Check each category from highest to lowest
    for (const cat of categories) {
      for (const entry of cat.entries) {
        // 1. Suffix matching (4-digit prizes like 4th, 5th, 6th, 7th, 8th, 9th)
        if (cat.match_type === 'LAST_N_DIGITS') {
          const suffix = entry.matched_suffix || entry.ticket_number;
          // If user typed 4 digits and it equals suffix, or user typed 6 digits and last 4 equal suffix
          if (digitsOnly.endsWith(suffix)) {
            setMatchResult({
              found: true,
              categoryNameEn: cat.category_name_en,
              categoryNameMl: cat.category_name_ml,
              prizeAmount: cat.prize_amount,
              matchedNumber: suffix
            });
            return;
          }
        } 
        // 2. Full ticket matching (1st, 2nd, 3rd, Consolation)
        else {
          const entryNum = entry.ticket_number;
          const entrySeries = entry.series ? entry.series.toUpperCase() : '';

          if (digitsOnly === entryNum) {
            // Check series if user provided series
            if (!alphaOnly || !entrySeries || alphaOnly === entrySeries) {
              setMatchResult({
                found: true,
                categoryNameEn: cat.category_name_en,
                categoryNameMl: cat.category_name_ml,
                prizeAmount: cat.prize_amount,
                matchedNumber: entry.full_ticket || entryNum,
                series: entry.series
              });
              return;
            }
          }
        }
      }
    }

    // If 4 or 6 digits entered and nothing matched
    if (digitsOnly.length === 4 || digitsOnly.length === 6) {
      setMatchResult({
        found: false
      });
    } else {
      setMatchResult(null);
    }
  };

  return (
    <div className="mc-card p-4 sm:p-5 border border-[#C9A227]/40 bg-gradient-to-br from-[#FAF6EC] via-[#FCFBF8] to-[#F5F2EB] shadow-sm rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#1D2821] flex items-center gap-1.5">
            <Search className="w-4 h-4 text-[#C9A227]" />
            <span>ഈ ഫലത്തിൽ നിങ്ങളുടെ നമ്പർ തിരയുക (Quick Number Search)</span>
          </h3>
          <p className="text-[11px] text-[#636058]">
            ടിക്കറ്റിന്റെ അവസാന 4 അക്കങ്ങളോ 6 അക്കങ്ങളോ നൽകി സമ്മാനം പരിശോധിക്കുക.
          </p>
        </div>
        <span className="text-[10px] font-mono font-bold text-[#8B5E0D] bg-white px-2 py-0.5 rounded border border-[#C9A227]/30 self-start sm:self-auto">
          Draw {drawNumber}
        </span>
      </div>

      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Enter 4 or 6 digits (e.g., 0499 or 945712)..."
          maxLength={8}
          className="mc-input w-full pl-9 pr-4 py-2.5 font-mono text-sm font-bold tracking-wider uppercase text-[#1D2821] bg-white"
        />
        <Search className="w-4 h-4 text-[#636058] absolute left-3 top-3 pointer-events-none" />
      </div>

      {/* Match Result Alert Box */}
      {matchResult && matchResult.found && (
        <div className="mt-3 p-3.5 rounded-xl bg-[#E8F5E9] border border-[#A5D6A7] text-left animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#2E7D32] shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="inline-block px-2 py-0.5 rounded bg-[#2E7D32] text-white text-[10px] font-extrabold tracking-wider uppercase mb-1">
                സമ്മാനാർഹമായ നമ്പർ! (MATCH FOUND)
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-0.5">
                <div>
                  <span className="font-bold text-[#1B5E20] text-sm block">
                    {matchResult.categoryNameMl} ({matchResult.categoryNameEn})
                  </span>
                  <span className="font-mono text-xs text-[#2E7D32]">
                    Matched Number: <span className="font-bold">{matchResult.matchedNumber}</span>
                  </span>
                </div>
                <div className="font-mono font-black text-lg sm:text-xl text-[#1B5E20]">
                  {formatIndianCurrency(matchResult.prizeAmount || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {matchResult && !matchResult.found && searchTerm.length >= 4 && (
        <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-200 text-left text-xs text-[#636058] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#8B5E0D] shrink-0" />
          <span>
            ഈ നറുക്കെടുപ്പിൽ <strong className="font-mono text-[#1D2821]">{searchTerm}</strong> നമ്പറിന് സമ്മാനം കണ്ടെത്തിയില്ല.
          </span>
        </div>
      )}
    </div>
  );
}

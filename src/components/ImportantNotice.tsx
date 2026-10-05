'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { AlertCircle, ChevronDown, ChevronUp, ShieldAlert, Award } from 'lucide-react';

export function ImportantNotice() {
  const { t } = useLanguage();
  const [showClaimsGuide, setShowClaimsGuide] = useState(false);

  return (
    <div className="w-full space-y-4 my-8">
      {/* Official Verification Disclaimer Card */}
      <div className="mc-card p-4 sm:p-5 border border-[#D99B26]/40 bg-[#FAF6EC] text-[#1D2821] shadow-xs">
        <div className="flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-[#8B5E0D] shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs sm:text-sm">
            <h4 className="font-bold text-[#8B5E0D] flex items-center gap-1.5 font-sans text-base">
              {t('disclaimer_title')}
            </h4>
            <p className="text-[#636058] leading-relaxed">
              {t('disclaimer_text')}
            </p>
            <p className="text-[11px] text-[#8B5E0D] font-bold">
              {t('unauthorized_notice')}
            </p>
          </div>
        </div>
      </div>

      {/* Won a Prize? What Next? Collapsible Guide */}
      <div className="mc-card p-4 sm:p-5 border border-[#DDD9CE]">
        <button
          onClick={() => setShowClaimsGuide(!showClaimsGuide)}
          id="toggle-claims-guide-btn"
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FAF6EC] border border-[#C9A227]/40 flex items-center justify-center text-[#8B5E0D]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#1D2821] group-hover:text-[#8B5E0D] transition-colors">
                {t('claims_title')}
              </h4>
              <p className="text-[11px] text-[#636058]">
                Official 30-Day Claim Procedure & Requirements
              </p>
            </div>
          </div>
          {showClaimsGuide ? (
            <ChevronUp className="w-5 h-5 text-[#636058]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#636058]" />
          )}
        </button>

        {showClaimsGuide && (
          <div className="mt-4 pt-4 border-t border-[#DDD9CE] space-y-2.5 text-xs text-[#636058]">
            <p className="font-bold text-[#8B5E0D]">{t('claims_intro')}</p>
            <ul className="space-y-2 list-disc list-inside text-[#636058]">
              <li>{t('claims_step_1')}</li>
              <li>{t('claims_step_2')}</li>
              <li>{t('claims_step_3')}</li>
              <li>{t('claims_step_4')}</li>
            </ul>
            <div className="p-2.5 rounded-xl bg-[#F5F2EB] border border-[#DDD9CE] text-[11px] text-[#636058] flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-[#8B5E0D] shrink-0 mt-0.5" />
              <span>{t('claims_deductions_notice')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


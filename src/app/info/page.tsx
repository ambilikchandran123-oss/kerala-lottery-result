'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { 
  ShieldCheck, 
  Award, 
  FileCheck2, 
  AlertCircle, 
  HelpCircle, 
  Building2, 
  Clock, 
  FileText 
} from 'lucide-react';

export default function InfoPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-3xl font-sans font-bold text-[#1D2821]">
          How It Works & <span className="text-[#8B5E0D]">Prize Claims</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#636058]">
          Official LOTIS reference verification model & statutory claim procedures
        </p>
      </div>

      {/* Architecture Explanation */}
      <div className="mc-card p-6 border border-[#DDD9CE] space-y-4 shadow-xs">
        <div className="flex items-center space-x-2">
          <FileCheck2 className="w-5 h-5 text-[#C9A227]" />
          <h2 className="text-base font-sans font-bold text-[#1D2821]">
            Official Source Verification Architecture
          </h2>
        </div>

        <p className="text-xs text-[#636058] leading-relaxed">
          This system is strictly engineered around the official Kerala State Lotteries (LOTIS) gazette publications. We never guess, interpolate, or use predictive models to determine winning tickets.
        </p>

        {/* Pipeline Diagram */}
        <div className="p-4 rounded-2xl bg-[#F5F2EB] border border-[#DDD9CE] space-y-2 text-xs font-mono text-[#1D2821]">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-[#FAF6EC] text-[#8B5E0D] border border-[#C9A227]/40 flex items-center justify-center font-bold text-[10px]">1</span>
            <span>Official Gazette Document Uploaded (PDF / TXT)</span>
          </div>
          <div className="pl-2 text-[#A09C94]">↓</div>
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-[#FAF6EC] text-[#8B5E0D] border border-[#C9A227]/40 flex items-center justify-center font-bold text-[10px]">2</span>
            <span>Cryptographic SHA-256 Checksum Computed & Stamped</span>
          </div>
          <div className="pl-2 text-[#A09C94]">↓</div>
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-[#FAF6EC] text-[#8B5E0D] border border-[#C9A227]/40 flex items-center justify-center font-bold text-[10px]">3</span>
            <span>Draw-Specific Prize Categories & Rules Extracted</span>
          </div>
          <div className="pl-2 text-[#A09C94]">↓</div>
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-[#FAF6EC] text-[#8B5E0D] border border-[#C9A227]/40 flex items-center justify-center font-bold text-[10px]">4</span>
            <span>Mandatory Verification & Administrative Publishing</span>
          </div>
          <div className="pl-2 text-[#A09C94]">↓</div>
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-[#FAF6EC] text-[#8B5E0D] border border-[#C9A227]/40 flex items-center justify-center font-bold text-[10px]">5</span>
            <span>User Ticket Checked Against Published Draw Only</span>
          </div>
        </div>
      </div>

      {/* Won a Prize? What Next? */}
      <div className="mc-card p-6 border border-[#DDD9CE] space-y-4 shadow-xs">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-[#8B5E0D]" />
          <h2 className="text-base font-sans font-bold text-[#1D2821]">
            {t('claims_title')}
          </h2>
        </div>

        <p className="text-xs text-[#636058] leading-relaxed">
          {t('claims_intro')}
        </p>

        <div className="space-y-3 text-xs text-[#636058]">
          <div className="p-3.5 rounded-xl bg-[#F5F2EB] border border-[#DDD9CE] space-y-1">
            <div className="font-bold text-[#8B5E0D] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#C9A227]" />
              <span>1. Retain the Original Ticket</span>
            </div>
            <p className="text-[#636058] text-[11px] leading-relaxed">
              Keep the physical ticket in pristine condition. Never tamper, alter, or write heavily on the ticket. Avoid laminating the physical ticket as heat can damage the lottery paper markings.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F5F2EB] border border-[#DDD9CE] space-y-1">
            <div className="font-bold text-[#8B5E0D] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#C9A227]" />
              <span>2. 30-Day Mandatory Claim Window</span>
            </div>
            <p className="text-[#636058] text-[11px] leading-relaxed">
              As per Kerala State Lotteries rules, prize claims must be surrendered within 30 days from the draw date. Delayed claims require special condonation from the Government.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F5F2EB] border border-[#DDD9CE] space-y-1">
            <div className="font-bold text-[#8B5E0D] flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#C9A227]" />
              <span>3. Submission Offices</span>
            </div>
            <p className="text-[#636058] text-[11px] leading-relaxed">
              <strong>Prizes up to ₹1,00,000:</strong> Can be claimed through authorized agents or District Lottery Offices (DLO).<br />
              <strong>Prizes above ₹1,00,000:</strong> Must be presented in person or via nationalized banks to the Directorate of State Lotteries, Vikas Bhavan, Thiruvananthapuram.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F5F2EB] border border-[#DDD9CE] space-y-1">
            <div className="font-bold text-[#1D2821] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#C9A227]" />
              <span>4. Mandatory Claim Documents</span>
            </div>
            <ul className="list-disc list-inside text-[11px] text-[#636058] space-y-1 pt-1">
              <li>Original winning ticket with signature on reverse side</li>
              <li>Prescribed claim application form with passport size photograph</li>
              <li>Self-attested copy of PAN Card</li>
              <li>Valid Government Identity (Aadhaar, Passport, or Voter ID)</li>
              <li>Cancelled bank cheque leaf matching applicant details</li>
            </ul>
          </div>
        </div>

        {/* Deductions Notice */}
        <div className="p-3 rounded-xl bg-[#FAF6EC] border border-[#C9A227]/40 text-[11px] text-[#8B5E0D] flex items-start space-x-2 font-medium">
          <AlertCircle className="w-4 h-4 text-[#8B5E0D] shrink-0 mt-0.5" />
          <span>
            {t('claims_deductions_notice')} Under Section 194B of the Income Tax Act, prizes above ₹10,000 are subject to 30% TDS plus applicable surcharges and cess.
          </span>
        </div>
      </div>

      {/* Non-official Disclaimer */}
      <div className="p-4 rounded-2xl mc-card border border-[#DDD9CE] text-center space-y-2 shadow-xs">
        <HelpCircle className="w-6 h-6 text-[#636058] mx-auto" />
        <h3 className="text-xs font-bold text-[#1D2821] uppercase tracking-wider">
          Independent Verification Service
        </h3>
        <p className="text-[11px] text-[#636058] leading-relaxed max-w-lg mx-auto">
          {t('unauthorized_notice')} Always cross-check with the official Kerala State Government Gazette before disposing of physical tickets or making commercial decisions.
        </p>
      </div>
    </div>
  );
}


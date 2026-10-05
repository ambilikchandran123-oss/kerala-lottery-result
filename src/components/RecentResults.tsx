'use client';

import React from 'react';
import Link from 'next/link';
import { Draw } from '@/types/lottery';
import { useLanguage } from '@/context/LanguageContext';
import { FileText, Download, ShieldCheck, ExternalLink, Calendar } from 'lucide-react';

interface RecentResultsProps {
  draws: Draw[];
}

export function RecentResults({ draws }: RecentResultsProps) {
  const { language, t } = useLanguage();

  if (draws.length === 0) {
    return (
      <div className="text-center p-8 mc-card">
        <p className="text-sm text-[#636058]">
          {t('today_not_published')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-[#C9A227]" />
          <h3 className="font-sans font-bold text-xl sm:text-2xl text-[#1D2821]">
            {t('today_results_title')}
          </h3>
        </div>
        <Link
          href="/results"
          className="text-xs font-bold text-[#8B5E0D] hover:underline flex items-center gap-1"
        >
          <span>View All</span>
          <span>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {draws.slice(0, 4).map((draw) => {
          const lotteryName = language === 'ml'
            ? draw.lottery?.name_ml || draw.lottery?.name_en
            : draw.lottery?.name_en || 'Kerala State Lottery';

          const pdfUrl = draw.source_file?.public_url || `/samples/Karunya_Plus_KN-642_Result.pdf`;

          return (
            <div
              key={draw.id}
              className="mc-card p-5 hover:border-[#C9A227]/60 transition-all flex flex-col justify-between group shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#8B5E0D] tracking-wider uppercase font-mono">
                    {draw.draw_number}
                  </span>
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[0.375rem] text-[10px] font-bold bg-[#FAF6EC] text-[#8B5E0D] border border-[#C9A227]/40">
                    <ShieldCheck className="w-3 h-3 text-[#C9A227]" />
                    <span>{t('status_published')}</span>
                  </span>
                </div>

                <h4 className="text-lg font-sans font-bold text-[#1D2821] group-hover:text-[#8B5E0D] transition-colors">
                  {lotteryName}
                </h4>

                <p className="text-xs text-[#636058] mt-1 flex items-center space-x-1">
                  <span>Draw Date:</span>
                  <span className="font-semibold text-[#1D2821]">{draw.draw_date}</span>
                </p>

                {draw.source_file && (
                  <div className="mt-3 p-2.5 rounded-[0.625rem] bg-[#F5F2EB] border border-[#DDD9CE] text-[10px] text-[#636058]">
                    <span className="text-[#8B5E0D] block font-bold mb-0.5">
                      Source SHA-256:
                    </span>
                    <span className="font-mono text-[#636058] truncate block">
                      {draw.source_file.sha256}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-[#DDD9CE] flex items-center space-x-2">
                <Link
                  href={`/results/${draw.id}`}
                  className="flex-1 py-2 px-3 mc-btn-gold text-xs font-bold flex items-center justify-center space-x-1"
                >
                  <span>{t('view_result')}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <a
                  href={pdfUrl}
                  download={draw.source_file?.filename || `Official_Result_${draw.draw_number}.pdf`}
                  className="p-2 rounded-[0.625rem] bg-[#F5F2EB] hover:bg-[#EAE5D8] text-[#1D2821] border border-[#DDD9CE] transition-colors"
                  title="Download Original Gazette PDF"
                  aria-label="Download Original Gazette PDF"
                >
                  <Download className="w-4 h-4 text-[#8B5E0D]" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


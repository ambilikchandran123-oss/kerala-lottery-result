import { notFound } from 'next/navigation';
import { LotteryRepository } from '@/lib/db/repository';
import { formatIndianCurrency } from '@/lib/engine/matcher';
import { GazetteNumberSearch, SearchablePrizeCategory } from '@/components/GazetteNumberSearch';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  ShieldCheck, 
  ExternalLink, 
  Calendar, 
  MapPin, 
  Sparkles, 
  Award 
} from 'lucide-react';
import { OfficialPdfViewer } from '@/components/OfficialPdfViewer';
import { ScrollToPdfButton } from '@/components/ScrollToPdfButton';

export default async function DrawDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const draw = await LotteryRepository.getDrawById(id);

  if (!draw || draw.status !== 'PUBLISHED') {
    notFound();
  }

  const categories = await LotteryRepository.getPrizeCategories(id);
  const entries = await LotteryRepository.getWinningEntries(id);

  // Group entries by category
  const entriesByCategory = new Map<string, typeof entries>();
  for (const entry of entries) {
    const list = entriesByCategory.get(entry.prize_category_id) || [];
    list.push(entry);
    entriesByCategory.set(entry.prize_category_id, list);
  }

  // Prepare searchable categories for client-side search component
  const searchableCategories: SearchablePrizeCategory[] = categories.map((c) => ({
    id: c.id,
    category_code: c.category_code,
    category_name_en: c.category_name_en,
    category_name_ml: c.category_name_ml,
    prize_amount: c.prize_amount,
    match_type: c.match_type,
    match_digits: c.match_digits,
    entries: (entriesByCategory.get(c.id) || []).map((e) => ({
      ticket_number: e.ticket_number,
      series: e.series,
      matched_suffix: e.matched_suffix,
      full_ticket: e.full_ticket
    }))
  }));

  const pdfUrl = draw.source_file?.public_url || `/samples/Karunya_Plus_KN-642_Result.pdf`;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <Link
          href="/results"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#8B5E0D] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Results</span>
        </Link>

        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-[0.5rem] text-xs font-bold bg-[#FAF6EC] text-[#8B5E0D] border border-[#C9A227]/40">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C9A227]" />
          <span>OFFICIAL PUBLISHED GAZETTE</span>
        </span>
      </div>

      {/* Draw Overview Header */}
      <div className="mc-card p-6 sm:p-8 border border-[#DDD9CE] shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#8B5E0D] font-mono tracking-widest uppercase">
              DRAW NO: {draw.draw_number}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1D2821] mt-1">
              {draw.lottery?.name_en}
            </h1>
            <p className="text-sm text-[#636058] font-medium">
              {draw.lottery?.name_ml}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#636058]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#C9A227]" />
                <span className="font-semibold text-[#1D2821]">{draw.draw_date}</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#C9A227]" />
                <span>{draw.venue || 'Gorky Bhavan, Near Bakery Junction, Thiruvananthapuram'}</span>
              </span>
            </div>
          </div>

          {/* Quick PDF Action Buttons */}
          <div className="flex flex-col gap-2 min-w-[180px]">
            <ScrollToPdfButton />

            <a
              href={pdfUrl}
              download={draw.source_file?.filename || `Official_Result_${draw.draw_number}.pdf`}
              className="py-2.5 px-4 mc-btn-primary text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm"
              title="Download original uploaded PDF directly"
            >
              <Download className="w-4 h-4 text-white" />
              <span>DOWNLOAD PDF</span>
            </a>
          </div>
        </div>

        {/* SHA-256 Provenance Box */}
        {draw.source_file && (
          <div className="mt-5 p-3 rounded-xl bg-[#FAF6EC] border border-[#C9A227]/30 text-[11px] text-[#636058] flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
            <div className="overflow-hidden">
              <span className="font-bold text-[#1D2821] block">Official Source Provenance:</span>
              <span className="font-mono text-[#636058] block truncate">
                File: {draw.source_file.filename}
              </span>
              <span className="font-mono text-[#8B5E0D] block truncate">
                SHA-256: {draw.source_file.sha256}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Interactive Number Search */}
      <GazetteNumberSearch
        categories={searchableCategories}
        drawNumber={draw.draw_number}
      />

      {/* Complete Prize Tiers Summary Ribbon (1st to 9th Prize Overview) */}
      <div className="p-4 rounded-2xl bg-white border border-[#DDD9CE] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#1D2821] flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#C9A227]" />
            <span>ഔദ്യോഗിക സമ്മാന ഘടന (Official Prize Overview - All Tiers)</span>
          </span>
          <span className="text-[11px] font-mono text-[#8B5E0D] font-bold">
            {categories.length} Prize Categories
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const count = (entriesByCategory.get(cat.id) || []).length;
            const isTop = cat.priority <= 4;
            return (
              <div
                key={cat.id}
                className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
                  isTop
                    ? 'bg-[#FAF6EC] border-[#C9A227]/50 text-[#1D2821] shadow-2xs'
                    : 'bg-[#F9F7F1] border-[#DDD9CE] text-[#636058]'
                }`}
              >
                <div className="text-left">
                  <span className="font-bold block text-[11px] leading-tight">
                    {cat.category_name_en}
                  </span>
                  <span className="text-[10px] text-[#8B5E0D] font-mono font-semibold">
                    {formatIndianCurrency(cat.prize_amount)}
                  </span>
                </div>
                {count > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-[#DDD9CE]">
                    {count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Structured Category-by-Category Prize Breakdown */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#1D2821] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#C9A227]" />
          <span>വിശദമായ സമ്മാന വിവരങ്ങളും നമ്പറുകളും (Winning Numbers Breakdown)</span>
        </h2>

        {categories.map((cat) => {
          const categoryEntries = entriesByCategory.get(cat.id) || [];
          const isTopTier = cat.priority <= 4;

          return (
            <div
              key={cat.id}
              id={`category-${cat.id}`}
              className={`p-5 rounded-2xl transition-all ${
                isTopTier ? 'mc-card-gold' : 'mc-card'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#DDD9CE] gap-1">
                <div>
                  <h3 className="font-bold text-[#1D2821] text-lg flex items-center gap-2">
                    <span>{cat.category_name_en}</span>
                    <span className="text-xs text-[#636058] font-normal">({cat.category_name_ml})</span>
                    {categoryEntries.length > 0 && (
                      <span className="text-[10px] font-mono font-bold bg-white/90 text-[#8B5E0D] px-2 py-0.5 rounded-full border border-[#C9A227]/30">
                        {categoryEntries.length} {categoryEntries.length === 1 ? 'Winner' : 'Winners'}
                      </span>
                    )}
                  </h3>
                  <span className="text-[11px] text-[#636058] font-medium">
                    {cat.match_type === 'EXACT_FULL_TICKET' && 'Exact Series & 6-Digit Match'}
                    {cat.match_type === 'CONSOLATION' && 'Consolation Prize (Remaining Series for 1st Prize Digits)'}
                    {cat.match_type === 'EXACT_NUMBER_PER_SERIES' && 'One Prize in Each Series'}
                    {cat.match_type === 'LAST_N_DIGITS' && `Last ${cat.match_digits} Digits across all participating series`}
                  </span>
                </div>

                <div className="text-xl sm:text-2xl font-extrabold text-[#1D2821] font-mono">
                  {formatIndianCurrency(cat.prize_amount)}
                </div>
              </div>

              {/* Entries list */}
              {cat.match_type === 'LAST_N_DIGITS' ? (
                // Suffix numbers grid
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 pt-1">
                  {categoryEntries.map((ent, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[#FAF6EC] hover:bg-[#FFF2C2] border border-[#C9A227]/30 text-center font-mono font-bold text-[#8B5E0D] text-sm shadow-2xs transition-colors"
                    >
                      {ent.matched_suffix || ent.ticket_number}
                    </div>
                  ))}
                </div>
              ) : (
                // Full series + number entries (1st, Consolation, 2nd, 3rd)
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                  {categoryEntries.map((ent, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#FAF6EC] border border-[#C9A227]/30 font-mono text-center shadow-2xs"
                    >
                      {ent.series && (
                        <span className="text-[#8B5E0D] font-bold mr-1.5 uppercase">{ent.series}</span>
                      )}
                      <span className="text-[#1D2821] font-black text-sm">{ent.ticket_number}</span>
                    </div>
                  ))}
                </div>
              )}

              {categoryEntries.length === 0 && (
                <p className="text-xs text-[#636058] italic py-2">
                  No winning entries published under this category.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Official Gazette PDF Viewer at the last part of the page */}
      <div id="gazette-pdf-viewer" className="scroll-mt-8 pt-2">
        <OfficialPdfViewer
          pdfUrl={pdfUrl}
          filename={draw.source_file?.filename || `${draw.draw_number}.pdf`}
          drawNumber={draw.draw_number}
          lotteryName={draw.lottery?.name_en || 'Kerala State Lottery'}
          sha256={draw.source_file?.sha256}
          drawDate={draw.draw_date}
        />
      </div>
    </div>
  );
}

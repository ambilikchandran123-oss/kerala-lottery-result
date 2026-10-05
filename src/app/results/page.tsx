import { LotteryRepository } from '@/lib/db/repository';
import { MinimalDashboard } from '@/components/MinimalDashboard';
import { WinningEntry } from '@/types/lottery';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ResultsPage() {
  const lotteries = await LotteryRepository.getLotteries();
  const publishedDraws = await LotteryRepository.getPublishedDraws();
  const todayDraw = await LotteryRepository.getTodayOrLatestDraw();
  
  let todayTopWinningEntries: WinningEntry[] = [];
  if (todayDraw) {
    todayTopWinningEntries = await LotteryRepository.getWinningEntries(todayDraw.id);
  }

  return (
    <div className="max-w-2xl mx-auto py-2">
      <MinimalDashboard
        lotteries={lotteries}
        draws={publishedDraws}
        todayDraw={todayDraw}
        todayTopWinningEntries={todayTopWinningEntries}
        initialViewMode="previous-list"
      />
    </div>
  );
}


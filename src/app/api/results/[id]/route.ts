import { NextRequest, NextResponse } from 'next/server';
import { LotteryRepository } from '@/lib/db/repository';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const draw = await LotteryRepository.getDrawById(id);

    if (!draw) {
      return NextResponse.json(
        { success: false, error: 'Draw not found.' },
        { status: 404 }
      );
    }

    if (draw.status !== 'PUBLISHED') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'This draw result has not been published yet.', 
          status: draw.status 
        },
        { status: 403 }
      );
    }

    const categories = await LotteryRepository.getPrizeCategories(id);
    const winningEntries = await LotteryRepository.getWinningEntries(id);

    return NextResponse.json({
      success: true,
      draw,
      categories,
      winningEntriesCount: winningEntries.length,
      winningEntries
    });
  } catch (error) {
    console.error('Error fetching draw details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve draw details.' },
      { status: 500 }
    );
  }
}

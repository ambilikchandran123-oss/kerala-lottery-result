import { NextRequest, NextResponse } from 'next/server';
import { LotteryRepository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lotteryId = searchParams.get('lotteryId') || undefined;
    const date = searchParams.get('date') || undefined;

    const draws = await LotteryRepository.getPublishedDraws(lotteryId, date);

    return NextResponse.json({
      success: true,
      count: draws.length,
      draws
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch draw results.' },
      { status: 500 }
    );
  }
}

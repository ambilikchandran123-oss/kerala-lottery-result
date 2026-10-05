import { NextResponse } from 'next/server';
import { LotteryRepository } from '@/lib/db/repository';

export async function GET() {
  try {
    const lotteries = await LotteryRepository.getLotteries();
    return NextResponse.json({
      success: true,
      lotteries
    });
  } catch (error) {
    console.error('Error fetching lotteries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lotteries.' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { LotteryRepository } from '@/lib/db/repository';

export async function GET() {
  try {
    const draw = await LotteryRepository.getTodayOrLatestDraw();

    if (!draw) {
      return NextResponse.json({
        published: false,
        message: 'Today’s result has not been published on this checker yet.'
      });
    }

    return NextResponse.json({
      published: true,
      draw
    });
  } catch (error) {
    console.error('Error fetching today draw:', error);
    return NextResponse.json(
      { published: false, error: 'Result service is temporarily unavailable.' },
      { status: 500 }
    );
  }
}

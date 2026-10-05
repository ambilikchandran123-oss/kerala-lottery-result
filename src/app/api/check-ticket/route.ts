import { NextRequest, NextResponse } from 'next/server';
import { LotteryRepository } from '@/lib/db/repository';
import { checkRateLimit } from '@/lib/rateLimit';
import { sanitizeIdentifier, sanitizeTicketSeries, sanitizeTicketNumber } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    // 1. Enforce rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
    const rateCheck = checkRateLimit(`check-ticket:${ip}`, 60, 60);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          status: 'ERROR',
          verified: false,
          message: `Too many requests. Please wait ${rateCheck.resetInSeconds} seconds before checking another ticket.`
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.resetInSeconds),
            'X-RateLimit-Remaining': String(rateCheck.remaining)
          }
        }
      );
    }

    // 2. Extract and sanitize query parameters to prevent injection
    const { searchParams } = new URL(request.url);
    const rawDrawId = searchParams.get('drawId') || '';
    const drawId = sanitizeIdentifier(rawDrawId);
    const rawSeries = searchParams.get('series');
    const series = rawSeries ? sanitizeTicketSeries(rawSeries) : undefined;
    const rawNumber = searchParams.get('number');
    const number = rawNumber ? sanitizeTicketNumber(rawNumber) : undefined;
    const raw = (searchParams.get('raw') || '').slice(0, 50).replace(/[<>'"]/g, '');

    // Draw ID is mandatory as per Spec Item 10
    if (!drawId) {
      return NextResponse.json(
        {
          status: 'ERROR',
          verified: false,
          message: 'Draw selection is mandatory. Kerala lottery tickets must be checked against a specific draw.'
        },
        { status: 400 }
      );
    }

    if (!raw && !number) {
      return NextResponse.json(
        {
          status: 'ERROR',
          verified: false,
          message: 'Please provide ticket number or full ticket input.'
        },
        { status: 400 }
      );
    }

    // 3. Strict verification against published draw
    const result = await LotteryRepository.verifyTicket(drawId, raw, series, number);

    const headers = {
      'Cache-Control': 'no-store, max-age=0',
      'X-RateLimit-Remaining': String(rateCheck.remaining)
    };

    if (result.status === 'ERROR') {
      return NextResponse.json(result, { status: 400, headers });
    }

    if (result.status === 'DRAW_NOT_PUBLISHED') {
      return NextResponse.json(result, { status: 403, headers });
    }

    return NextResponse.json(result, { status: 200, headers });
  } catch (error) {
    console.error('Error in ticket verification endpoint:', error);
    return NextResponse.json(
      {
        status: 'ERROR',
        verified: false,
        message: 'Result service is temporarily unavailable. Please try again in a few moments.'
      },
      { status: 500 }
    );
  }
}

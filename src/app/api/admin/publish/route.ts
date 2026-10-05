import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { LotteryRepository } from '@/lib/db/repository';
import { timingSafeCompare, sanitizeIdentifier } from '@/lib/security';
import { checkRateLimit } from '@/lib/rateLimit';

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'kerala-lottery-admin-secret-2026';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'admin-local';

    const adminKey = request.headers.get('x-admin-key');
    const isAuthorized = timingSafeCompare(adminKey, ADMIN_SECRET);

    if (!isAuthorized) {
      const limit = checkRateLimit(`admin-fail:${ip}`, 10, 900);
      return NextResponse.json(
        { 
          success: false, 
          error: limit.allowed 
            ? 'Unauthorized. Admin credentials required.' 
            : 'Too many failed login attempts. Temporarily locked for 15 minutes.' 
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const rawDrawId = body?.drawId;
    const drawId = sanitizeIdentifier(rawDrawId);
    const performedBy = sanitizeIdentifier(body?.performedBy || 'authorized_admin');
    const reason = typeof body?.reason === 'string' ? body.reason.slice(0, 200) : 'Official result verified';

    if (!drawId) {
      return NextResponse.json(
        { success: false, error: 'Valid drawId is required.' },
        { status: 400 }
      );
    }

    const draw = await LotteryRepository.publishDraw(
      drawId,
      performedBy || 'authorized_admin',
      reason || 'Official result verified by administrative board'
    );

    // Invalidate caches so frontend updates immediately
    try {
      revalidatePath('/', 'page');
      revalidatePath('/results', 'page');
      revalidatePath(`/results/${draw.id}`, 'page');
    } catch (e) {
      console.warn('Revalidation warning:', e);
    }

    return NextResponse.json({
      success: true,
      drawId: draw.id,
      status: draw.status,
      published_at: draw.published_at,
      message: `Draw ${draw.draw_number} is now officially published for public ticket verification.`
    });
  } catch (error: unknown) {
    console.error('Error publishing draw:', error);
    const msg = error instanceof Error ? error.message : 'Publishing failed.';
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

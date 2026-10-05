import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { LotteryRepository } from '@/lib/db/repository';
import { generateGazettePdf } from '@/lib/pdf/generator';
import { sanitizeFilename } from '@/lib/security';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;
    const cleanFilename = sanitizeFilename(filename, '.pdf');
    const samplesDir = path.join(process.cwd(), 'public', 'samples');
    const diskPath = path.join(samplesDir, cleanFilename);

    // Strictly ensure target stays within samples directory
    if (!diskPath.startsWith(samplesDir + path.sep)) {
      return NextResponse.json({ error: 'Invalid file request.' }, { status: 400 });
    }

    // 1. If the file exists directly on disk in public/samples, serve it
    if (fs.existsSync(diskPath)) {
      const fileBuffer = fs.readFileSync(diskPath);
      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${cleanFilename}"`,
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
        }
      });
    }

    // 2. Otherwise search in Lottery repository/store for matching draw or source file
    const allDraws = await LotteryRepository.getPublishedDraws();
    let matchingSourceFile = allDraws.find(
      (d) =>
        d.source_file?.filename === cleanFilename ||
        d.source_file?.public_url?.endsWith(cleanFilename) ||
        cleanFilename.toLowerCase().includes(d.draw_number.toLowerCase())
    )?.source_file;

    if (!matchingSourceFile) {
      // Also check by raw filename in all draws (including draft/verified)
      const latest = await LotteryRepository.getTodayOrLatestDraw();
      if (
        latest?.source_file?.filename === cleanFilename ||
        cleanFilename.toLowerCase().includes(latest?.draw_number.toLowerCase() || '')
      ) {
        matchingSourceFile = latest?.source_file;
      }
    }

    if (matchingSourceFile?.raw_text) {
      const pdfBuffer = generateGazettePdf(
        matchingSourceFile.raw_text,
        matchingSourceFile.filename
      );

      // Best effort cache to disk
      try {
        if (!fs.existsSync(samplesDir)) {
          fs.mkdirSync(samplesDir, { recursive: true });
        }
        fs.writeFileSync(diskPath, pdfBuffer);
      } catch {
        // Disk write might fail on read-only environments; ignore
      }

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${cleanFilename}"`,
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
        }
      });
    }

    return NextResponse.json(
      { error: `PDF document '${cleanFilename}' not found.` },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error serving sample PDF:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve or generate PDF document.' },
      { status: 500 }
    );
  }
}

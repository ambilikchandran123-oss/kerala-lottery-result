import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { LotteryRepository } from '@/lib/db/repository';
import { calculateSha256 } from '@/lib/parser/hasher';
import { parseLotteryResultText, LOTTERY_MAPPINGS } from '@/lib/parser/txtParser';
import { parseLotteryResultPdf } from '@/lib/parser/pdfParser';
import { generateGazettePdf } from '@/lib/pdf/generator';
import { 
  timingSafeCompare, 
  sanitizeFilename, 
  validateFileSize, 
  validatePdfMagicBytes, 
  sanitizeIdentifier 
} from '@/lib/security';
import { checkRateLimit } from '@/lib/rateLimit';

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'kerala-lottery-admin-secret-2026';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'admin-local';

    // 1. Verify admin authorization with timing-safe comparison & rate limiting
    const adminKey = request.headers.get('x-admin-key');
    const isAuthorized = timingSafeCompare(adminKey, ADMIN_SECRET);

    if (!isAuthorized) {
      // Throttle failed admin attempts (max 10 per 15 minutes)
      const limit = checkRateLimit(`admin-fail:${ip}`, 10, 900);
      return NextResponse.json(
        { 
          success: false, 
          error: limit.allowed 
            ? 'Unauthorized. Invalid admin credentials.' 
            : 'Too many failed login attempts. Temporarily locked for 15 minutes.' 
        },
        { status: 401 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let rawBuffer: Buffer;
    let filename = `official_result_${Date.now()}.txt`;
    let isPdf = false;
    let ocrUsed = false;
    let overrideLotteryName = '';
    let overrideDrawNumber = '';
    let overrideDrawDate = '';
    let parseResult;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      overrideLotteryName = (formData.get('lotteryName') as string) || '';
      overrideDrawNumber = (formData.get('drawNumber') as string) || '';
      overrideDrawDate = (formData.get('drawDate') as string) || '';
      ocrUsed = formData.get('ocrUsed') === 'true';

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file uploaded in form data.' },
          { status: 400 }
        );
      }
      filename = file.name;
      const arrayBuffer = await file.arrayBuffer();
      rawBuffer = Buffer.from(arrayBuffer);
      isPdf = filename.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    } else {
      const body = await request.json();
      overrideLotteryName = body.lotteryName || '';
      overrideDrawNumber = body.drawNumber || '';
      overrideDrawDate = body.drawDate || '';
      ocrUsed = Boolean(body.ocrUsed);

      if (!body.text) {
        return NextResponse.json(
          { success: false, error: 'Text content required.' },
          { status: 400 }
        );
      }
      filename = body.filename || `official_result_${Date.now()}.txt`;
      rawBuffer = Buffer.from(body.text, 'utf-8');
    }

    // 2. Security validation: file size limit (10MB)
    if (!validateFileSize(rawBuffer, 10 * 1024 * 1024)) {
      return NextResponse.json(
        { success: false, error: 'Uploaded document exceeds maximum allowed size (10 MB).' },
        { status: 413 }
      );
    }

    // 2b. Security validation: verify PDF magic bytes to prevent disguised executable files
    if (isPdf && !validatePdfMagicBytes(rawBuffer)) {
      return NextResponse.json(
        { success: false, error: 'Security validation failed: File does not contain valid PDF magic bytes.' },
        { status: 400 }
      );
    }

    // 2c. Sanitize filename against Directory Traversal (LFI)
    filename = sanitizeFilename(filename, isPdf ? '.pdf' : '.txt');

    // 3. Compute SHA-256 hash
    const sha256 = calculateSha256(rawBuffer);

    // 3. Prevent duplicate imports
    const alreadyImported = await LotteryRepository.isSourceHashImported(sha256);
    if (alreadyImported) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'This exact result document has already been imported.',
          sha256
        },
        { status: 409 }
      );
    }

    // 4. Parse document
    if (isPdf) {
      parseResult = await parseLotteryResultPdf(rawBuffer);
    } else {
      parseResult = parseLotteryResultText(rawBuffer.toString('utf-8'), ocrUsed);
    }

    // 4b. Apply explicit user metadata overrides (Lottery Name, Serial Number, Date)
    if (overrideLotteryName.trim()) {
      const cleanUpper = overrideLotteryName.trim().toUpperCase();
      const mapping = LOTTERY_MAPPINGS[cleanUpper];
      if (mapping) {
        parseResult.lotteryNameEn = mapping.nameEn;
        parseResult.lotteryNameMl = mapping.nameMl;
        parseResult.lotteryCode = mapping.code;
      } else {
        parseResult.lotteryNameEn = overrideLotteryName.trim();
        parseResult.lotteryNameMl = overrideLotteryName.trim();
        parseResult.lotteryCode = overrideLotteryName.trim().slice(0, 3).toUpperCase();
      }
    }

    if (overrideDrawNumber.trim()) {
      parseResult.drawNumber = overrideDrawNumber.trim().toUpperCase();
    }

    if (overrideDrawDate.trim()) {
      parseResult.drawDate = overrideDrawDate.trim();
    }

    // If manual metadata satisfied the required identifiers, clear missing metadata errors
    if (parseResult.lotteryNameEn && parseResult.drawNumber && parseResult.categories.length > 0) {
      parseResult.errors = parseResult.errors.filter(e => {
        const lower = e.toLowerCase();
        return !lower.includes('lottery name') && !lower.includes('draw number') && !lower.includes('draw date');
      });
      if (parseResult.errors.length === 0) {
        parseResult.success = true;
      }
    }

    if (!parseResult.success && parseResult.errors.length > 0) {
      const detailedError = parseResult.errors.join(' • ');
      return NextResponse.json(
        {
          success: false,
          error: detailedError || 'Result could not be safely processed. Please check the uploaded file or paste the result text directly.',
          errors: parseResult.errors,
          parseResult,
          sha256
        },
        { status: 422 }
      );
    }

    // 5. Best-effort cache of PDF file to disk / ephemeral storage
    // Note: On Serverless platforms like Vercel, the root filesystem is read-only (EROFS).
    // The /samples/[filename] route automatically generates/serves the PDF from database/source_files on demand.
    let pdfFilename = filename;
    if (isPdf) {
      pdfFilename = sanitizeFilename(filename, '.pdf');
    } else {
      pdfFilename = filename.replace(/\.(txt|json|csv)$/i, '') + '.pdf';
      if (!pdfFilename.endsWith('.pdf')) pdfFilename += '.pdf';
      pdfFilename = sanitizeFilename(pdfFilename, '.pdf');
    }
    const publicPdfUrl = `/samples/${pdfFilename}`;

    try {
      const samplesDir = path.join(process.cwd(), 'public', 'samples');
      if (!fs.existsSync(samplesDir)) {
        fs.mkdirSync(samplesDir, { recursive: true });
      }
      const targetPath = path.join(samplesDir, pdfFilename);
      if (targetPath.startsWith(samplesDir + path.sep) || targetPath === samplesDir) {
        const fileBuf = isPdf ? rawBuffer : generateGazettePdf(parseResult.rawText);
        fs.writeFileSync(targetPath, fileBuf);
      }
    } catch {
      // Ephemeral /tmp fallback for serverless environments (AWS Lambda / Vercel)
      try {
        const tmpSamplesDir = path.join('/tmp', 'samples');
        if (!fs.existsSync(tmpSamplesDir)) {
          fs.mkdirSync(tmpSamplesDir, { recursive: true });
        }
        const tmpTargetPath = path.join(tmpSamplesDir, pdfFilename);
        const fileBuf = isPdf ? rawBuffer : generateGazettePdf(parseResult.rawText);
        fs.writeFileSync(tmpTargetPath, fileBuf);
      } catch (tmpErr) {
        console.warn('Ephemeral file cache skipped on serverless:', tmpErr);
      }
    }

    // 6. Save to database in initial status (VERIFIED or NEEDS_VERIFICATION)
    const { drawId, status } = await LotteryRepository.saveImportedDraw(
      parseResult,
      pdfFilename,
      sha256,
      publicPdfUrl
    );

    return NextResponse.json({
      success: true,
      drawId,
      status,
      sha256,
      filename,
      lottery: parseResult.lotteryNameEn,
      drawNumber: parseResult.drawNumber,
      drawDate: parseResult.drawDate,
      categoriesCount: parseResult.categories.length,
      totalEntries: parseResult.totalEntriesCount,
      confidence: parseResult.confidence,
      confidenceScore: parseResult.confidenceScore,
      ocrUsed: parseResult.ocrUsed,
      warnings: parseResult.warnings,
      categories: parseResult.categories
    });
  } catch (error: unknown) {
    console.error('Error during result ingestion:', error);
    const msg = error instanceof Error ? error.message : 'Ingestion failed.';
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

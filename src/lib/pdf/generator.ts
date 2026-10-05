/**
 * Pure TypeScript PDF-1.4 Generator for Official Kerala State Lottery Gazette results.
 * Produces crisp, standard-compliant vector PDFs viewable in all browsers and mobile devices.
 */

export function generateGazettePdf(rawText: string, title?: string): Buffer {
  // Normalize line endings and split
  const rawLines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Wrap lines that exceed maximum character width (approx 76 chars for 10pt Courier on A4)
  const MAX_CHARS_PER_LINE = 76;
  const wrappedLines: string[] = [];

  for (const line of rawLines) {
    if (line.length <= MAX_CHARS_PER_LINE) {
      wrappedLines.push(line);
    } else {
      let remaining = line;
      while (remaining.length > MAX_CHARS_PER_LINE) {
        // try to break at last space within limit
        let breakIndex = remaining.lastIndexOf(' ', MAX_CHARS_PER_LINE);
        if (breakIndex === -1 || breakIndex < 30) {
          breakIndex = MAX_CHARS_PER_LINE;
        }
        wrappedLines.push(remaining.substring(0, breakIndex));
        remaining = remaining.substring(breakIndex).trimStart();
      }
      if (remaining.length > 0) {
        wrappedLines.push(remaining);
      }
    }
  }

  // Lines per page (approx 52 lines with 14pt leading on 842pt height A4)
  const LINES_PER_PAGE = 52;
  const pages: string[][] = [];

  for (let i = 0; i < wrappedLines.length; i += LINES_PER_PAGE) {
    pages.push(wrappedLines.slice(i, i + LINES_PER_PAGE));
  }
  if (pages.length === 0) {
    pages.push([title || 'KERALA STATE LOTTERIES - OFFICIAL RESULT GAZETTE']);
  }

  let objIndex = 1;
  const catalogObj = objIndex++;
  const pagesObj = objIndex++;
  const fontCourier = objIndex++;
  const fontCourierBold = objIndex++;

  const pageObjIds: number[] = [];
  const contentObjIds: number[] = [];

  for (let p = 0; p < pages.length; p++) {
    pageObjIds.push(objIndex++);
    contentObjIds.push(objIndex++);
  }

  const objects: string[] = [];

  // Catalog
  objects.push(`${catalogObj} 0 obj\n<< /Type /Catalog /Pages ${pagesObj} 0 R >>\nendobj\n`);

  // Pages container
  objects.push(
    `${pagesObj} 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>\nendobj\n`
  );

  // Fonts
  objects.push(`${fontCourier} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n`);
  objects.push(`${fontCourierBold} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj\n`);

  // Build each page
  for (let p = 0; p < pages.length; p++) {
    const pageLines = pages[p];
    let streamText = 'BT\n/F1 9.5 Tf\n13.5 TL\n45 780 Td\n';

    for (let l = 0; l < pageLines.length; l++) {
      const line = pageLines[l];
      // Escape PDF special characters: backslash, open paren, close paren
      const escaped = line
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');

      // Highlight headers or prize titles if applicable
      const isHeader = line.includes('KERALA STATE LOTTERIES') || line.includes('Prize');
      const fontCmd = isHeader ? '/F2 9.5 Tf ' : '/F1 9.5 Tf ';

      if (l === 0) {
        streamText += `${fontCmd}(${escaped}) Tj\n`;
      } else {
        streamText += `T* ${fontCmd}(${escaped}) Tj\n`;
      }
    }

    // Add footer page indicator
    const footerText = `Page ${p + 1} of ${pages.length}  |  Directorate of State Lotteries, Govt. of Kerala`;
    streamText += `ET\nBT\n/F1 8 Tf\n45 35 Td\n(${footerText.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')}) Tj\nET\n`;

    const streamLen = Buffer.byteLength(streamText, 'utf-8');

    // Page object (A4 size: 595 x 842 points)
    objects.push(
      `${pageObjIds[p]} 0 obj\n<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 595 842] /Contents ${contentObjIds[p]} 0 R /Resources << /Font << /F1 ${fontCourier} 0 R /F2 ${fontCourierBold} 0 R >> >> >>\nendobj\n`
    );

    // Content stream object
    objects.push(`${contentObjIds[p]} 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamText}endstream\nendobj\n`);
  }

  // Cross-reference table and final PDF assembly
  let pdfOutput = '%PDF-1.4\n';
  const xrefOffsets: number[] = [0];
  let currentOffset = Buffer.byteLength(pdfOutput, 'utf-8');

  for (let i = 0; i < objects.length; i++) {
    xrefOffsets.push(currentOffset);
    pdfOutput += objects[i];
    currentOffset += Buffer.byteLength(objects[i], 'utf-8');
  }

  const xrefOffset = currentOffset;
  pdfOutput += `xref\n0 ${objects.length + 1}\n`;
  pdfOutput += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    const offsetStr = String(xrefOffsets[i]).padStart(10, '0');
    pdfOutput += `${offsetStr} 00000 n \n`;
  }

  pdfOutput += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdfOutput, 'utf-8');
}

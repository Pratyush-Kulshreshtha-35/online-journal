import jsPDF from 'jspdf';
import { JournalEntry } from '../types/journal';

export interface PDFExportOptions {
  theme?: 'light' | 'dark';
  title?: string;
  authorName?: string;
  includePrompts?: boolean;
}

/**
 * Generate a pristine vector Archival PDF directly using jsPDF.
 * Bypasses html2canvas completely to eliminate browser canvas memory limits,
 * iframe sandbox restrictions, and blurry rendering.
 */
export async function generateDirectJournalPDF(
  entries: JournalEntry[],
  options: PDFExportOptions = {},
  fileName: string = `Archival_Journal_${new Date().toISOString().slice(0, 10)}.pdf`,
  onProgress?: (step: string) => void
): Promise<void> {
  if (onProgress) onProgress('Compiling archival vector pages...');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 22;
  const contentWidth = pageWidth - margin * 2; // 166mm
  let cursorY = margin;

  const author = options.authorName || 'Private Journal Author';
  const includePrompts = options.includePrompts !== false;

  const drawRunningHeader = () => {
    doc.setFont('times', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(130, 130, 130);
    doc.text('The Collected Journal — Archival Edition', margin, 14);
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.2);
    doc.line(margin, 16, pageWidth - margin, 16);
  };

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin - 10) {
      doc.addPage();
      cursorY = margin + 4;
      drawRunningHeader();
    }
  };

  // -------------------------------------------------------------
  // 1. Cover Page
  // -------------------------------------------------------------
  if (onProgress) onProgress('Designing archival cover...');

  // Decorative border
  doc.setDrawColor(230, 225, 215);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, pageWidth - 28, pageHeight - 28);
  doc.rect(16, 16, pageWidth - 32, pageHeight - 32);

  // Emblem icon indicator
  doc.setFillColor(245, 240, 230);
  doc.roundedRect(pageWidth / 2 - 8, 70, 16, 16, 3, 3, 'F');
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text('J', pageWidth / 2, 81, { align: 'center' });

  // Main Cover Title
  doc.setFont('times', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(25, 25, 25);
  doc.text('The Collected Journal', pageWidth / 2, 105, { align: 'center' });

  // Subtitle
  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(110, 110, 110);
  const subtitleLines = doc.splitTextToSize(
    'A private chronicle of reflections, mindful thoughts, and personal growth.',
    120
  );
  doc.text(subtitleLines, pageWidth / 2, 118, { align: 'center' });

  // Accent divider line
  doc.setDrawColor(217, 119, 6); // amber-600
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - 25, 134, pageWidth / 2 + 25, 134);

  // Author & Archival Details
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(60, 60, 60);
  doc.text(author, pageWidth / 2, 150, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`${entries.length} Entries  •  ${new Date().getFullYear()} Edition`, pageWidth / 2, 156, {
    align: 'center',
  });
  doc.text(
    `Exported on ${new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}`,
    pageWidth / 2,
    162,
    { align: 'center' }
  );

  // -------------------------------------------------------------
  // 2. Individual Entry Pages
  // -------------------------------------------------------------
  if (onProgress) onProgress('Formatting journal chapters...');

  entries.forEach((entry, index) => {
    doc.addPage();
    cursorY = margin + 4;
    drawRunningHeader();

    // Chapter & Meta
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9); // amber-700
    const metaDate = entry.date ? entry.date.toUpperCase() : 'UNDATED';
    const moodPart = entry.mood ? `  •  MOOD: ${entry.mood.toUpperCase()}` : '';
    doc.text(`CHAPTER ${index + 1}  •  ${metaDate}${moodPart}`, margin, cursorY);
    cursorY += 7;

    // Entry Title
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(20, 20, 20);
    const titleLines = doc.splitTextToSize(entry.title || 'Untitled Reflection', contentWidth);
    doc.text(titleLines, margin, cursorY);
    cursorY += titleLines.length * 7.5 + 2;

    // Tags
    if (entry.tags && entry.tags.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(115, 115, 115);
      const tagText = entry.tags.map((t) => `#${t}`).join('   ');
      doc.text(tagText, margin, cursorY);
      cursorY += 6;
    }

    // Header bottom separator
    doc.setDrawColor(225, 220, 210);
    doc.setLineWidth(0.3);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 7;

    // Prompt box if present
    if (includePrompts && entry.promptUsed) {
      doc.setFont('times', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(80, 80, 80);
      const promptLines = doc.splitTextToSize(`Prompt: "${entry.promptUsed}"`, contentWidth - 10);
      const pHeight = promptLines.length * 4.8 + 6;
      checkPageBreak(pHeight + 4);

      // Light background for prompt
      doc.setFillColor(250, 248, 244);
      doc.rect(margin, cursorY, contentWidth, pHeight, 'F');

      // Left amber accent bar
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(1.2);
      doc.line(margin, cursorY, margin, cursorY + pHeight);

      doc.text(promptLines, margin + 5, cursorY + 5);
      cursorY += pHeight + 6;
    }

    // Media photos (if base64 data URLs)
    if (entry.media && entry.media.length > 0) {
      const photos = entry.media.filter((m) => m.type === 'photo' && m.url?.startsWith('data:image'));
      for (const photo of photos) {
        try {
          const imgWidth = Math.min(100, contentWidth);
          const imgHeight = 65;
          checkPageBreak(imgHeight + 10);
          doc.addImage(photo.url, 'JPEG', margin, cursorY, imgWidth, imgHeight);
          cursorY += imgHeight + 4;
          if (photo.caption) {
            doc.setFont('times', 'italic');
            doc.setFontSize(8);
            doc.setTextColor(130, 130, 130);
            doc.text(photo.caption, margin, cursorY);
            cursorY += 5;
          }
        } catch {
          // Gracefully skip unsupported image formats without aborting PDF
        }
      }
    }

    // Entry Body Paragraphs
    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(35, 35, 35);

    const rawContent = entry.content || '(No written content)';
    const paragraphs = rawContent.split(/\n\n+/);

    paragraphs.forEach((para) => {
      const cleanPara = para.trim();
      if (!cleanPara) return;

      const lines = doc.splitTextToSize(cleanPara, contentWidth);
      const paraHeight = lines.length * 5;
      checkPageBreak(paraHeight + 4);

      doc.text(lines, margin, cursorY);
      cursorY += paraHeight + 4;
    });

    cursorY += 6;
  });

  // -------------------------------------------------------------
  // 3. Footer Page Numbers on All Pages (Except Cover)
  // -------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 11, { align: 'center' });
  }

  if (onProgress) onProgress('Downloading Archival PDF...');
  // Small delay for UI smoothness
  await new Promise((resolve) => setTimeout(resolve, 100));
  doc.save(fileName);
}

/**
 * Generate a standalone, portable HTML Archival Book
 * Users can open this single file in any browser and use native Ctrl+P to print
 */
export function generateStandaloneHTMLBook(
  entries: JournalEntry[],
  options: PDFExportOptions = {}
): string {
  const author = options.authorName || 'Private Journal Author';
  const year = new Date().getFullYear();
  const includePrompts = options.includePrompts !== false;

  const entriesHTML = entries
    .map((e, index) => {
      const photos = (e.media || [])
        .filter((m) => m.type === 'photo')
        .map(
          (m) => `
          <div class="photo-card">
            <img src="${m.url}" alt="${m.caption || 'Journal photo'}" />
            ${m.caption ? `<p class="photo-caption">${m.caption}</p>` : ''}
          </div>
        `
        )
        .join('');

      const tags = (e.tags || [])
        .map((t) => `<span class="tag">#${t}</span>`)
        .join(' ');

      return `
      <article class="chapter">
        <div class="chapter-header">
          <div class="meta">
            <span>CHAPTER ${index + 1} &bull; ${e.date}</span>
            <span class="mood">${e.mood || ''}</span>
          </div>
          <h2 class="entry-title">${escapeHTML(e.title)}</h2>
          ${tags ? `<div class="tags-container">${tags}</div>` : ''}
        </div>

        ${
          includePrompts && e.promptUsed
            ? `<blockquote class="prompt-box"><em>${escapeHTML(e.promptUsed)}</em></blockquote>`
            : ''
        }

        ${photos ? `<div class="photos-grid">${photos}</div>` : ''}

        <div class="entry-content">
          ${formatMarkdownParagraphs(e.content)}
        </div>
      </article>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Collected Journal - Archival Edition</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Lora:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
    
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: #FDFBF7;
      color: #1A1A1A;
      font-family: 'Lora', Georgia, serif;
      line-height: 1.75;
      font-size: 15px;
      -webkit-font-smoothing: antialiased;
    }

    .toolbar {
      position: sticky;
      top: 0;
      background: #181818;
      color: #FFF;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 1000;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .toolbar button {
      background: #D97706;
      color: #000;
      border: none;
      font-weight: 700;
      padding: 8px 18px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.2s;
    }
    .toolbar button:hover {
      background: #F59E0B;
    }

    .book-container {
      max-width: 760px;
      margin: 40px auto;
      background: #FFFFFF;
      padding: 60px 70px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.06);
      border-radius: 8px;
      border: 1px solid #EAE6DF;
    }

    .cover-page {
      min-height: 600px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      border-bottom: 2px solid #EAE6DF;
      padding-bottom: 60px;
      margin-bottom: 60px;
      page-break-after: always;
    }
    .cover-title {
      font-family: 'Cinzel', serif;
      font-size: 42px;
      letter-spacing: 2px;
      margin: 20px 0 12px 0;
      color: #111;
    }
    .cover-subtitle {
      color: #666;
      font-size: 16px;
      max-width: 440px;
      margin-bottom: 40px;
    }
    .cover-author {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #888;
      border-top: 1px solid #DDD;
      padding-top: 20px;
      width: 220px;
    }

    .chapter {
      padding-top: 40px;
      margin-top: 40px;
      border-top: 1px solid #EAE6DF;
      page-break-after: always;
    }
    .chapter:first-of-type {
      border-top: none;
      padding-top: 0;
      margin-top: 0;
    }
    .chapter-header {
      margin-bottom: 24px;
    }
    .meta {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #B45309;
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .entry-title {
      font-family: 'Cinzel', serif;
      font-size: 26px;
      margin: 0 0 10px 0;
      color: #0F0F0F;
      line-height: 1.3;
    }
    .tags-container {
      margin-top: 8px;
    }
    .tag {
      display: inline-block;
      background: #F3F0EB;
      color: #555;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: system-ui, sans-serif;
      margin-right: 6px;
    }

    .prompt-box {
      margin: 20px 0;
      padding: 14px 18px;
      background: #FAF8F5;
      border-left: 3px solid #D97706;
      font-size: 13.5px;
      color: #444;
      border-radius: 0 6px 6px 0;
    }

    .photos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin: 24px 0;
    }
    .photo-card {
      border: 1px solid #E5E5E5;
      border-radius: 8px;
      overflow: hidden;
      background: #FAFAFA;
    }
    .photo-card img {
      width: 100%;
      max-height: 320px;
      object-fit: contain;
      display: block;
      background: #FFF;
    }
    .photo-caption {
      padding: 8px 12px;
      margin: 0;
      font-size: 11.5px;
      color: #666;
      font-style: italic;
    }

    .entry-content {
      font-size: 15.5px;
      line-height: 1.8;
      color: #222;
    }
    .entry-content p {
      margin: 0 0 16px 0;
    }

    @media print {
      body {
        background: #FFF !important;
      }
      .toolbar {
        display: none !important;
      }
      .book-container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
      .chapter, .cover-page {
        page-break-after: always !important;
      }
    }
  </style>
  <script>
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        try { window.print(); } catch(e) {}
      }, 500);
    });
  </script>
</head>
<body>
  <div class="toolbar">
    <div>
      <strong>The Collected Journal</strong> &bull; ${entries.length} Entries Ready for Print
    </div>
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="book-container">
    <div class="cover-page">
      <div style="font-size: 36px; margin-bottom: 12px;">📖</div>
      <h1 class="cover-title">The Collected Journal</h1>
      <p class="cover-subtitle">A private chronicle of reflections, emotions, and mindful personal growth.</p>
      <div class="cover-author">
        <strong>${escapeHTML(author)}</strong><br>
        ${year} Archival Edition
      </div>
    </div>

    ${entriesHTML}
  </div>
</body>
</html>`;
}

function escapeHTML(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMarkdownParagraphs(text: string): string {
  if (!text) return '';
  return text
    .split(/\n\n+/)
    .map((para) => {
      const clean = escapeHTML(para.trim());
      return `<p>${clean.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');
}

/**
 * Downloads a string content as an HTML file
 */
export function downloadHTMLFile(content: string, filename: string = 'Archival_Journal_Book.html') {
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

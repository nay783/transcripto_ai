import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { jsPDF } from "jspdf";
import { getLanguageLabel } from "@/lib/utils";

export interface ExportDocumentPayload {
  title: string;
  filename: string;
  language?: string;
  transcription: string;
  summary?: string;
  keyPoints?: string[];
  includeSummary?: boolean;
}

export function sanitizeBaseFilename(rawName: string): string {
  const withoutExt = rawName.replace(/\.[^/.]+$/, "");
  const cleaned = withoutExt
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "transcripto-export";
}

function triggerBrowserDownload(blob: Blob, downloadName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = downloadName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Generates plain text (.txt) content from the latest user-edited transcript.
 */
export function buildTxtContent(payload: ExportDocumentPayload): string {
  const lines: string[] = [];
  const docTitle = payload.title?.trim() || "Audio Transcription";

  lines.push(docTitle.toUpperCase());
  lines.push("=".repeat(Math.min(72, Math.max(24, docTitle.length))));
  lines.push(`Source file: ${payload.filename || "recording"}`);
  if (payload.language) {
    lines.push(`Language: ${getLanguageLabel(payload.language)}`);
  }
  lines.push("");

  if (payload.includeSummary !== false && payload.summary?.trim()) {
    lines.push("AI SUMMARY");
    lines.push("----------");
    lines.push(payload.summary.trim());
    lines.push("");
  }

  if (
    payload.includeSummary !== false &&
    payload.keyPoints &&
    payload.keyPoints.length > 0
  ) {
    lines.push("KEY INSIGHTS");
    lines.push("------------");
    for (const point of payload.keyPoints) {
      lines.push(`• ${point}`);
    }
    lines.push("");
  }

  lines.push("TRANSCRIPT");
  lines.push("----------");
  lines.push(payload.transcription.trim());
  lines.push("");

  return lines.join("\n");
}

export function exportAsTxt(payload: ExportDocumentPayload): void {
  const content = buildTxtContent(payload);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const base = sanitizeBaseFilename(payload.title || payload.filename);
  triggerBrowserDownload(blob, `${base}-transcript.txt`);
}

/**
 * Generates a professionally formatted Word (.docx) binary buffer.
 */
export async function buildDocxBuffer(
  payload: ExportDocumentPayload
): Promise<Uint8Array> {
  const docTitle = payload.title?.trim() || "Audio Transcription";
  const children: Paragraph[] = [];

  // Brand tag
  children.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: "TRANSCRIPTO AI",
          bold: true,
          size: 18,
          color: "4B6B50",
          font: "Calibri",
        }),
      ],
    })
  );

  // Document Title
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: docTitle,
          bold: true,
          size: 36,
          color: "090C0A",
          font: "Calibri",
        }),
      ],
    })
  );

  // Metadata bar
  const metaParts = [`Recording: ${payload.filename || "audio"}`];
  if (payload.language) {
    metaParts.push(`Language: ${getLanguageLabel(payload.language)}`);
  }
  children.push(
    new Paragraph({
      spacing: { after: 320 },
      border: {
        bottom: {
          color: "CCCCCC",
          space: 8,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      children: [
        new TextRun({
          text: metaParts.join("   |   "),
          size: 20,
          color: "555555",
          font: "Calibri",
        }),
      ],
    })
  );

  // Optional AI Summary section
  if (payload.includeSummary !== false && payload.summary?.trim()) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: "Executive Summary",
            bold: true,
            size: 26,
            color: "111812",
            font: "Calibri",
          }),
        ],
      })
    );

    const summaryParagraphs = payload.summary
      .trim()
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    for (const para of summaryParagraphs) {
      children.push(
        new Paragraph({
          spacing: { after: 160, line: 300 },
          children: [
            new TextRun({
              text: para,
              size: 22,
              color: "222222",
              font: "Calibri",
            }),
          ],
        })
      );
    }
  }

  // Key Insights section
  if (
    payload.includeSummary !== false &&
    payload.keyPoints &&
    payload.keyPoints.length > 0
  ) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: "Key Insights",
            bold: true,
            size: 26,
            color: "111812",
            font: "Calibri",
          }),
        ],
      })
    );

    for (const point of payload.keyPoints) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 100, line: 280 },
          children: [
            new TextRun({
              text: point,
              size: 22,
              color: "222222",
              font: "Calibri",
            }),
          ],
        })
      );
    }
  }

  // Transcription section
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 320, after: 160 },
      children: [
        new TextRun({
          text: "Full Transcript",
          bold: true,
          size: 26,
          color: "111812",
          font: "Calibri",
        }),
      ],
    })
  );

  const transcriptBlocks = payload.transcription
    .trim()
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const block of transcriptBlocks) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 180, line: 320 },
        children: [
          new TextRun({
            text: block,
            size: 22,
            color: "1A1A1A",
            font: "Calibri",
          }),
        ],
      })
    );
  }

  const doc = new Document({
    creator: "Transcripto AI",
    title: docTitle,
    description: `Transcription export for ${payload.filename}`,
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

export async function exportAsDocx(
  payload: ExportDocumentPayload
): Promise<void> {
  const bytes = await buildDocxBuffer(payload);
  const safeCopy = new Uint8Array(bytes.byteLength);
  safeCopy.set(bytes);
  const blob = new Blob([safeCopy.buffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const base = sanitizeBaseFilename(payload.title || payload.filename);
  triggerBrowserDownload(blob, `${base}-transcript.docx`);
}

/**
 * Generates a clean, printable multi-page PDF document with consistent
 * typography and automatic page breaks.
 */
export function buildPdfBytes(payload: ExportDocumentPayload): ArrayBuffer {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 48;
  const topMargin = 54;
  const bottomMargin = 54;
  const contentWidth = pageWidth - marginX * 2;

  let cursorY = topMargin;

  const ensureSpace = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - bottomMargin) {
      pdf.addPage();
      cursorY = topMargin;
    }
  };

  // Header tag
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(70, 105, 75);
  pdf.text("TRANSCRIPTO AI — TRANSCRIPTION REPORT", marginX, cursorY);
  cursorY += 22;

  // Document Title
  const docTitle = payload.title?.trim() || "Audio Transcription";
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(15, 20, 16);
  const titleLines = pdf.splitTextToSize(docTitle, contentWidth) as string[];
  for (const line of titleLines) {
    ensureSpace(26);
    pdf.text(line, marginX, cursorY);
    cursorY += 24;
  }

  cursorY += 4;

  // Metadata line
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(100, 110, 102);
  const metaString = [
    `Source: ${payload.filename || "recording"}`,
    payload.language ? `Language: ${getLanguageLabel(payload.language)}` : null,
  ]
    .filter(Boolean)
    .join("   •   ");
  pdf.text(metaString, marginX, cursorY);
  cursorY += 14;

  // Divider line
  pdf.setDrawColor(210, 218, 212);
  pdf.setLineWidth(0.75);
  pdf.line(marginX, cursorY, pageWidth - marginX, cursorY);
  cursorY += 22;

  // Optional AI Summary
  if (payload.includeSummary !== false && payload.summary?.trim()) {
    ensureSpace(40);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(17, 24, 18);
    pdf.text("Executive Summary", marginX, cursorY);
    cursorY += 18;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10.5);
    pdf.setTextColor(35, 40, 36);
    const summaryLines = pdf.splitTextToSize(
      payload.summary.trim(),
      contentWidth
    ) as string[];

    for (const line of summaryLines) {
      ensureSpace(16);
      pdf.text(line, marginX, cursorY);
      cursorY += 15;
    }
    cursorY += 14;
  }

  // Optional Key Insights
  if (
    payload.includeSummary !== false &&
    payload.keyPoints &&
    payload.keyPoints.length > 0
  ) {
    ensureSpace(40);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(17, 24, 18);
    pdf.text("Key Insights", marginX, cursorY);
    cursorY += 18;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10.5);
    pdf.setTextColor(35, 40, 36);

    for (const point of payload.keyPoints) {
      const wrappedPoint = pdf.splitTextToSize(
        point,
        contentWidth - 16
      ) as string[];
      ensureSpace(wrappedPoint.length * 15 + 6);
      pdf.text("•", marginX + 2, cursorY);
      for (const line of wrappedPoint) {
        pdf.text(line, marginX + 14, cursorY);
        cursorY += 15;
      }
      cursorY += 4;
    }
    cursorY += 12;
  }

  // Full Transcript
  ensureSpace(40);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(17, 24, 18);
  pdf.text("Full Transcript", marginX, cursorY);
  cursorY += 18;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.5);
  pdf.setTextColor(25, 30, 26);

  const paragraphs = payload.transcription
    .trim()
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const para of paragraphs) {
    const lines = pdf.splitTextToSize(para, contentWidth) as string[];
    for (const line of lines) {
      ensureSpace(16);
      pdf.text(line, marginX, cursorY);
      cursorY += 15.5;
    }
    cursorY += 8;
  }

  // Page numbers in footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(130, 140, 132);
    pdf.text(
      `Transcripto AI  •  Page ${i} of ${pageCount}`,
      marginX,
      pageHeight - 28
    );
  }

  return pdf.output("arraybuffer");
}

export function exportAsPdf(payload: ExportDocumentPayload): void {
  const arrayBuffer = buildPdfBytes(payload);
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  const base = sanitizeBaseFilename(payload.title || payload.filename);
  triggerBrowserDownload(blob, `${base}-transcript.pdf`);
}

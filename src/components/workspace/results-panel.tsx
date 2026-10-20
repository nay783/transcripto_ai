"use client";

import * as React from "react";
import {
  FileText,
  Sparkles,
  ListChecks,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  FileType2,
  PlusCircle,
  RotateCcw,
  Globe,
  FileAudio,
  PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { AudioPlayer } from "@/components/workspace/audio-player";
import {
  exportAsDocx,
  exportAsPdf,
  exportAsTxt,
} from "@/lib/export-documents";
import { getLanguageLabel } from "@/lib/utils";
import type { TranscriptionJobResult } from "@/types/transcription";

interface ResultsPanelProps {
  result: TranscriptionJobResult;
  fallbackFilename: string;
  audioObjectUrl: string | null;
  onNewTranscription: () => void;
}

export function ResultsPanel({
  result,
  fallbackFilename,
  audioObjectUrl,
  onNewTranscription,
}: ResultsPanelProps) {
  const originalTranscript = result.transcription ?? "";
  const [editedTranscript, setEditedTranscript] =
    React.useState<string>(originalTranscript);
  const [editableTitle, setEditableTitle] = React.useState<string>(
    result.title?.trim() || fallbackFilename.replace(/\.[^/.]+$/, "")
  );
  const [copied, setCopied] = React.useState(false);
  const [isExportingDocx, setIsExportingDocx] = React.useState(false);

  React.useEffect(() => {
    setEditedTranscript(result.transcription ?? "");
    setEditableTitle(
      result.title?.trim() ||
        result.filename?.replace(/\.[^/.]+$/, "") ||
        fallbackFilename.replace(/\.[^/.]+$/, "")
    );
  }, [result, fallbackFilename]);

  const displayFilename = result.filename || fallbackFilename;
  const isEdited = editedTranscript !== originalTranscript;

  const wordCount = React.useMemo(() => {
    const trimmed = editedTranscript.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [editedTranscript]);

  const charCount = editedTranscript.length;

  const handleCopyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(editedTranscript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback textarea copy
      const el = document.createElement("textarea");
      el.value = editedTranscript;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const buildExportPayload = () => ({
    title: editableTitle.trim() || "Audio Transcription",
    filename: displayFilename,
    language: result.language,
    transcription: editedTranscript,
    summary: result.summary,
    keyPoints: result.key_points,
    includeSummary: Boolean(
      result.summary || (result.key_points && result.key_points.length > 0)
    ),
  });

  const handleDownloadTxt = () => {
    exportAsTxt(buildExportPayload());
  };

  const handleDownloadDocx = async () => {
    try {
      setIsExportingDocx(true);
      await exportAsDocx(buildExportPayload());
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleDownloadPdf = () => {
    exportAsPdf(buildExportPayload());
  };

  return (
    <div className="rounded-2xl border border-[#273329] bg-[#111812] p-6 sm:p-8 shadow-2xl">
      {/* Top Bar: Metadata & New Transcription Button */}
      <div className="flex flex-col gap-4 border-b border-[#273329] pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">Completed</Badge>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#273329] bg-[#172019] px-2.5 py-0.5 text-xs text-[#A6B4A7]">
              <FileAudio className="h-3 w-3 text-[#B8FF65]" />
              {displayFilename}
            </span>
            {result.language && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#273329] bg-[#172019] px-2.5 py-0.5 text-xs text-[#A6B4A7]">
                <Globe className="h-3 w-3 text-[#B8FF65]" />
                {getLanguageLabel(result.language)}
              </span>
            )}
            {isEdited && (
              <Badge variant="secondary">
                <PenLine className="h-3 w-3 text-[#B8FF65]" />
                Edited locally
              </Badge>
            )}
          </div>

          {/* Generated / Editable Title */}
          <div>
            <label htmlFor="document-title-input" className="sr-only">
              Document Title
            </label>
            <input
              id="document-title-input"
              type="text"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              className="w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F8F4] transition-colors hover:border-[#273329] focus:border-[#B8FF65]/50 focus:bg-[#090C0A] focus:px-3 focus:outline-none"
              placeholder="Generated Document Title"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopyTranscript}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#B8FF65]" />
                Copied transcript
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy transcript
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onNewTranscription}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            New transcription
          </Button>
        </div>
      </div>

      {/* Audio Player */}
      {audioObjectUrl && (
        <div className="mt-6">
          <AudioPlayer src={audioObjectUrl} filename={displayFilename} />
        </div>
      )}

      {/* Tabs: Transcription | AI Summary | Key Insights */}
      <div className="mt-6">
        <Tabs defaultValue="transcription" className="w-full">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="w-full sm:w-auto overflow-x-auto">
              <TabsTrigger value="transcription">
                <FileText className="h-3.5 w-3.5 text-[#B8FF65]" />
                Transcription
              </TabsTrigger>
              <TabsTrigger value="summary">
                <Sparkles className="h-3.5 w-3.5 text-[#B8FF65]" />
                AI Summary
              </TabsTrigger>
              <TabsTrigger value="insights">
                <ListChecks className="h-3.5 w-3.5 text-[#B8FF65]" />
                Key Insights
                {result.key_points && result.key_points.length > 0 && (
                  <span className="ml-1 rounded-full bg-[#B8FF65]/15 px-1.5 py-0.2 text-[10px] font-mono text-[#B8FF65]">
                    {result.key_points.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Word & Character Statistics + Revert */}
            <div className="flex items-center gap-3 text-xs text-[#A6B4A7]">
              <span className="font-mono">{wordCount} words</span>
              <span>•</span>
              <span className="font-mono">{charCount} chars</span>
              {isEdited && (
                <button
                  type="button"
                  onClick={() => setEditedTranscript(originalTranscript)}
                  className="inline-flex items-center gap-1 text-[#B8FF65] hover:underline cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restore original
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: Editable Transcription */}
          <TabsContent value="transcription" className="mt-4">
            <div className="rounded-xl border border-[#273329] bg-[#090C0A] p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between border-b border-[#273329] pb-2.5 text-xs text-[#A6B4A7]">
                <span>
                  Editable Transcript — Any refinements made below are included in TXT, DOCX, and PDF downloads.
                </span>
                <span className="font-mono text-[11px] text-[#B8FF65]">
                  Live Editor
                </span>
              </div>
              <textarea
                value={editedTranscript}
                onChange={(e) => setEditedTranscript(e.target.value)}
                rows={14}
                aria-label="Editable transcript text"
                className="w-full resize-y bg-transparent text-base leading-relaxed text-[#F5F8F4] placeholder:text-[#A6B4A7]/50 focus:outline-none"
                placeholder="Transcript content..."
              />
            </div>
          </TabsContent>

          {/* TAB 2: AI Summary */}
          <TabsContent value="summary" className="mt-4">
            <div className="rounded-xl border border-[#273329] bg-[#090C0A] p-6">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#B8FF65]" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F5F8F4]">
                  Executive AI Summary
                </h3>
              </div>

              {result.summary && result.summary.trim().length > 0 ? (
                <div className="space-y-4 text-base leading-relaxed text-[#F5F8F4]/95">
                  {result.summary
                    .trim()
                    .split(/\n+/)
                    .map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-[#A6B4A7]">
                  No AI summary was returned by the backend for this recording.
                </p>
              )}
            </div>
          </TabsContent>

          {/* TAB 3: Key Insights */}
          <TabsContent value="insights" className="mt-4">
            <div className="rounded-xl border border-[#273329] bg-[#090C0A] p-6">
              <div className="mb-4 flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-[#B8FF65]" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F5F8F4]">
                  Actionable Key Insights
                </h3>
              </div>

              {result.key_points && result.key_points.length > 0 ? (
                <ul className="space-y-3">
                  {result.key_points.map((point, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3.5 rounded-lg border border-[#273329] bg-[#172019]/70 p-4 text-sm leading-relaxed text-[#F5F8F4]"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#B8FF65]/15 font-mono text-xs font-bold text-[#B8FF65]">
                        {idx + 1}
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#A6B4A7]">
                  No structured key insights were returned by the backend for this recording.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Export Bar */}
      <div className="mt-6 flex flex-col gap-4 rounded-xl border border-[#273329] bg-[#172019] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#F5F8F4]">
            Export Document
          </p>
          <p className="text-xs text-[#A6B4A7]">
            Generated directly in your browser using your latest edited transcript and AI insights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDownloadTxt}
          >
            <FileType2 className="h-3.5 w-3.5 text-[#B8FF65]" />
            Download TXT
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isExportingDocx}
            onClick={handleDownloadDocx}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#B8FF65]" />
            {isExportingDocx ? "Building DOCX..." : "Download DOCX"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDownloadPdf}
          >
            <Download className="h-3.5 w-3.5 text-[#B8FF65]" />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

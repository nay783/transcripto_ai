"use client";

import * as React from "react";
import {
  UploadCloud,
  FileAudio,
  Trash2,
  RefreshCw,
  Sparkles,
  Globe,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AudioPlayer } from "@/components/workspace/audio-player";
import { formatBytes } from "@/lib/utils";
import { validateAudioFileMetadata } from "@/lib/validation";
import type {
  ConfigDiagnostics,
  SupportedLanguageCode,
} from "@/types/transcription";

interface UploadPanelProps {
  selectedFile: File | null;
  audioObjectUrl: string | null;
  language: SupportedLanguageCode;
  summaryEnabled: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  missingVars?: string[];
  diagnostics: ConfigDiagnostics | null;
  onSelectFile: (file: File | null, validationError?: string | null) => void;
  onLanguageChange: (lang: SupportedLanguageCode) => void;
  onSummaryToggle: (enabled: boolean) => void;
  onSubmit: () => void;
}

export function UploadPanel({
  selectedFile,
  audioObjectUrl,
  language,
  summaryEnabled,
  isSubmitting,
  errorMessage,
  missingVars,
  diagnostics,
  onSelectFile,
  onLanguageChange,
  onSummaryToggle,
  onSubmit,
}: UploadPanelProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const maxUploadMb = diagnostics?.maxUploadSizeMb ?? 50;

  const handleFileCandidate = (file: File | undefined) => {
    if (!file) return;
    const validation = validateAudioFileMetadata(
      {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      maxUploadMb
    );
    if (!validation.valid) {
      onSelectFile(null, validation.errorMessage ?? "Invalid audio file.");
      return;
    }
    onSelectFile(file, null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isSubmitting) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileCandidate(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileCandidate(files[0]);
    }
    // Reset input value so re-selecting the same file works after removal
    e.target.value = "";
  };

  return (
    <div className="rounded-2xl border border-[#273329] bg-[#111812] p-6 sm:p-8 shadow-2xl">
      {/* Top Workspace Header */}
      <div className="flex flex-col gap-3 border-b border-[#273329] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-[#F5F8F4]">
              Transcription Studio
            </h2>
            <Badge variant="default">Single Recording</Badge>
          </div>
          <p className="mt-1 text-sm text-[#A6B4A7]">
            Upload an MP3, M4A, or WAV recording to generate a verbatim transcript, executive summary, and key insights.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#A6B4A7]">
          <span className="rounded-md border border-[#273329] bg-[#172019] px-2.5 py-1 font-mono">
            MP3
          </span>
          <span className="rounded-md border border-[#273329] bg-[#172019] px-2.5 py-1 font-mono">
            M4A
          </span>
          <span className="rounded-md border border-[#273329] bg-[#172019] px-2.5 py-1 font-mono">
            WAV
          </span>
          <span className="text-[#A6B4A7] pl-1">Up to {maxUploadMb} MB</span>
        </div>
      </div>

      {/* Server Environment Configuration Alert if .env variables are missing */}
      {diagnostics && !diagnostics.configured && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-[#523c18] bg-[#1c160b] p-4 text-sm text-[#FDE68A]"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FBBF24]" />
            <div className="space-y-1">
              <p className="font-semibold text-[#FEF3C7]">
                Environment Configuration Required for Live Webhook Submission
              </p>
              <p className="text-xs leading-relaxed text-[#FDE68A]/90">
                The following server-side variables are not yet populated in your{" "}
                <code className="rounded bg-[#090C0A] px-1.5 py-0.5 font-mono text-[#B8FF65]">
                  .env
                </code>{" "}
                file:{" "}
                <span className="font-mono font-semibold text-[#F5F8F4]">
                  {diagnostics.missingRequiredVariables.join(", ")}
                </span>
                . Add them from{" "}
                <code className="rounded bg-[#090C0A] px-1.5 py-0.5 font-mono">
                  .env.example
                </code>{" "}
                to connect to the n8n workflow.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav"
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Upload audio recording"
      />

      {/* Upload Dropzone OR Selected Audio Preview Card */}
      <div className="mt-6">
        {!selectedFile ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isSubmitting) setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
            onClick={() => !isSubmitting && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 sm:p-14 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-[#B8FF65] bg-[#172019]"
                : "border-[#273329] bg-[#090C0A]/70 hover:border-[#B8FF65]/50 hover:bg-[#172019]/50"
            }`}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#273329] bg-[#172019] text-[#B8FF65] transition-transform duration-200 group-hover:scale-105">
              <UploadCloud className="h-6 w-6" />
            </div>

            <p className="text-base font-semibold text-[#F5F8F4]">
              Drag and drop your audio recording here
            </p>
            <p className="mt-1.5 max-w-md text-xs text-[#A6B4A7]">
              Supports high-clarity speech recordings in MP3, M4A, or WAV format.
              Maximum file size {maxUploadMb} MB.
            </p>

            <div className="mt-6">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Browse files
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 rounded-xl border border-[#273329] bg-[#090C0A] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#B8FF65]/30 bg-[#172019] text-[#B8FF65]">
                  <FileAudio className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[#F5F8F4]">
                      {selectedFile.name}
                    </p>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#B8FF65]" />
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-[#A6B4A7]">
                    <span className="font-mono">
                      {formatBytes(selectedFile.size)}
                    </span>
                    <span>•</span>
                    <span className="uppercase font-mono">
                      {selectedFile.name.split(".").pop()}
                    </span>
                    <span>•</span>
                    <span className="text-[#B8FF65]">Validated for upload</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Replace audio
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => onSelectFile(null, null)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            </div>

            {/* Audio Preview Player */}
            {audioObjectUrl && (
              <AudioPlayer
                src={audioObjectUrl}
                filename={selectedFile.name}
                compact
              />
            )}
          </div>
        )}
      </div>

      {/* Validation or Submission Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-[#7F1D1D] bg-[#291414]/90 p-4 text-sm text-[#FCA5A5]"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#F87171]" />
            <div className="space-y-1">
              <p className="font-medium text-[#FECACA]">{errorMessage}</p>
              {missingVars && missingVars.length > 0 && (
                <p className="text-xs font-mono text-[#FCA5A5]">
                  Missing variables: {missingVars.join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transcription Options Row */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Language Selection */}
        <div className="flex flex-col justify-between rounded-xl border border-[#273329] bg-[#172019]/70 p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <label
              htmlFor="language-select"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F5F8F4]"
            >
              <Globe className="h-3.5 w-3.5 text-[#B8FF65]" />
              Spoken Language
            </label>
            <span className="text-[11px] text-[#A6B4A7]">
              Preserves original language
            </span>
          </div>
          <Select
            value={language}
            onValueChange={(val) =>
              onLanguageChange(val as SupportedLanguageCode)
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id="language-select" aria-label="Spoken Language">
              <SelectValue placeholder="Automatic language detection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                Automatic language detection (Default)
              </SelectItem>
              <SelectItem value="pt">Portuguese (Português)</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish (Español)</SelectItem>
              <SelectItem value="fr">French (Français)</SelectItem>
              <SelectItem value="de">German (Deutsch)</SelectItem>
              <SelectItem value="it">Italian (Italiano)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* AI Summary Toggle */}
        <div className="flex items-center justify-between rounded-xl border border-[#273329] bg-[#172019]/70 p-4">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#B8FF65]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#F5F8F4]">
                AI Executive Summary & Insights
              </span>
            </div>
            <p className="text-xs text-[#A6B4A7]">
              Generates a descriptive title, structured summary, and actionable key points via OpenAI.
            </p>
          </div>
          <Switch
            checked={summaryEnabled}
            onCheckedChange={onSummaryToggle}
            disabled={isSubmitting}
            aria-label="Enable AI summary"
          />
        </div>
      </div>

      {/* Primary Action Bar */}
      <div className="mt-6 flex flex-col items-stretch justify-between gap-4 border-t border-[#273329] pt-6 sm:flex-row sm:items-center">
        <p className="text-xs text-[#A6B4A7]">
          Audio is transmitted via server-authenticated webhook proxy. No browser API keys are exposed.
        </p>

        <Button
          type="button"
          size="lg"
          disabled={!selectedFile || isSubmitting}
          onClick={onSubmit}
          className="w-full sm:w-auto min-w-[210px]"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Uploading recording...
            </>
          ) : (
            <>
              Transcribe audio
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import {
  Loader2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Radio,
  FileAudio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBytes, formatDurationSeconds } from "@/lib/utils";
import type { TranscriptionStatus } from "@/types/transcription";

interface ProcessingPanelProps {
  jobId: string;
  status: TranscriptionStatus;
  filename: string;
  fileSize?: number;
  elapsedSeconds: number;
  consecutiveNetworkErrors: number;
  errorMessage: string | null;
  isPollingRequestActive: boolean;
  onManualPollRetry: () => void;
  onResetWorkspace: () => void;
}

interface StageMeta {
  key: TranscriptionStatus;
  label: string;
  description: string;
}

const PIPELINE_STAGES: StageMeta[] = [
  {
    key: "queued",
    label: "Queued",
    description:
      "Recording received by n8n workflow and queued for audio pipeline execution.",
  },
  {
    key: "processing",
    label: "Processing Audio",
    description:
      "Preparing audio stream and initializing speech recognition parameters.",
  },
  {
    key: "transcribing",
    label: "Transcribing Speech",
    description:
      "AssemblyAI acoustic engine is converting spoken words into verbatim text and detecting language.",
  },
  {
    key: "summarising",
    label: "Generating AI Summary",
    description:
      "OpenAI is synthesising the transcript into a descriptive title, executive summary, and key insights.",
  },
  {
    key: "completed",
    label: "Completed",
    description: "Transcription and structured insights are ready for review.",
  },
];

const STATUS_HEADLINES: Record<
  TranscriptionStatus,
  { title: string; subtitle: string }
> = {
  queued: {
    title: "Job queued in transcription pipeline",
    subtitle:
      "Your recording has been registered and is waiting for an available worker slot.",
  },
  processing: {
    title: "Processing audio stream",
    subtitle:
      "Validating audio channels and preparing recording for speech recognition.",
  },
  transcribing: {
    title: "Transcribing spoken audio",
    subtitle:
      "Converting speech to text in the original spoken language via AssemblyAI.",
  },
  summarising: {
    title: "Synthesising summary & key insights",
    subtitle:
      "Extracting executive takeaways and generating a descriptive title from your transcript.",
  },
  completed: {
    title: "Transcription completed",
    subtitle: "Preparing your workspace results...",
  },
  transcription_failed: {
    title: "Audio transcription failed",
    subtitle:
      "The speech recognition service could not complete transcription for this recording.",
  },
  summary_failed: {
    title: "AI summarisation failed",
    subtitle:
      "The transcription step finished, or summary synthesis encountered an upstream error.",
  },
};

function getStageOrderIndex(status: TranscriptionStatus): number {
  switch (status) {
    case "queued":
      return 0;
    case "processing":
      return 1;
    case "transcribing":
      return 2;
    case "summarising":
      return 3;
    case "completed":
      return 4;
    case "transcription_failed":
      return 2;
    case "summary_failed":
      return 3;
  }
}

export function ProcessingPanel({
  jobId,
  status,
  filename,
  fileSize,
  elapsedSeconds,
  consecutiveNetworkErrors,
  errorMessage,
  isPollingRequestActive,
  onManualPollRetry,
  onResetWorkspace,
}: ProcessingPanelProps) {
  const isFailed =
    status === "transcription_failed" || status === "summary_failed";
  const currentStageIndex = getStageOrderIndex(status);
  const headline = STATUS_HEADLINES[status];

  return (
    <div className="rounded-2xl border border-[#273329] bg-[#111812] p-6 sm:p-8 shadow-2xl">
      {/* Top Status Header */}
      <div className="flex flex-col gap-4 border-b border-[#273329] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {isFailed ? (
              <Badge variant="danger">Status: {status}</Badge>
            ) : (
              <Badge variant="default">
                <Radio className="h-3 w-3 animate-pulse" />
                Live Status: {status}
              </Badge>
            )}
            <span className="font-mono text-xs text-[#A6B4A7]">
              Job #{jobId.slice(0, 8)}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F8F4]">
            {headline.title}
          </h2>
          <p className="text-sm text-[#A6B4A7]">{headline.subtitle}</p>
        </div>

        {/* Elapsed Time Counter */}
        <div className="flex items-center gap-3 self-start sm:self-center rounded-xl border border-[#273329] bg-[#090C0A] px-4 py-3">
          <Clock className="h-4 w-4 text-[#B8FF65]" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#A6B4A7]">
              Elapsed Time
            </p>
            <p className="font-mono text-lg font-bold text-[#F5F8F4]">
              {formatDurationSeconds(elapsedSeconds)}
            </p>
          </div>
        </div>
      </div>

      {/* File Summary Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#273329] bg-[#172019] px-4 py-3 text-xs">
        <div className="flex items-center gap-2.5 text-[#F5F8F4]">
          <FileAudio className="h-4 w-4 text-[#B8FF65]" />
          <span className="font-medium truncate max-w-[260px] sm:max-w-md">
            {filename}
          </span>
          {typeof fileSize === "number" && fileSize > 0 && (
            <span className="font-mono text-[#A6B4A7]">
              ({formatBytes(fileSize)})
            </span>
          )}
        </div>

        {!isFailed && (
          <div className="flex items-center gap-2 text-[#A6B4A7]">
            {isPollingRequestActive ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#B8FF65]" />
                <span>Checking backend status...</span>
              </>
            ) : (
              <span>Polling result webhook every ~7s</span>
            )}
          </div>
        )}
      </div>

      {/* Authentic Stage Stepper (No Fabricated Percentages) */}
      <div className="mt-6 space-y-3">
        {PIPELINE_STAGES.map((stage, index) => {
          const isCompletedStage = !isFailed && index < currentStageIndex;
          const isCurrentStage = index === currentStageIndex;
          const isFailedAtStage = isFailed && index === currentStageIndex;

          return (
            <div
              key={stage.key}
              className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${
                isFailedAtStage
                  ? "border-[#7F1D1D] bg-[#291414]/60"
                  : isCurrentStage
                  ? "border-[#B8FF65]/50 bg-[#172019]"
                  : isCompletedStage
                  ? "border-[#273329] bg-[#090C0A]/80"
                  : "border-[#273329]/60 bg-[#090C0A]/30 opacity-55"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isFailedAtStage ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7F1D1D] text-[#FCA5A5]">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                ) : isCompletedStage ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#B8FF65]/15 text-[#B8FF65]">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                ) : isCurrentStage ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#B8FF65] text-[#090C0A]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#273329] bg-[#111812] text-xs font-mono text-[#A6B4A7]">
                    {index + 1}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#F5F8F4]">
                    {stage.label}
                  </p>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#A6B4A7]">
                    {isFailedAtStage
                      ? "Failed"
                      : isCurrentStage
                      ? "Active"
                      : isCompletedStage
                      ? "Passed"
                      : "Pending"}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#A6B4A7]">
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error / Backoff Alert */}
      {(errorMessage || consecutiveNetworkErrors > 0) && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-[#7F1D1D] bg-[#291414]/90 p-4 text-sm text-[#FCA5A5]"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#F87171]" />
            <div className="space-y-2 flex-1">
              <p className="font-medium text-[#FECACA]">
                {errorMessage ||
                  `Temporary network interruption while polling status (attempt ${consecutiveNetworkErrors}). Applying exponential backoff.`}
              </p>
              <p className="text-xs text-[#FCA5A5]/90">
                To prevent duplicate charges, your audio recording is never automatically resubmitted when polling fails.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-6 flex flex-col gap-3 border-t border-[#273329] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onResetWorkspace}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {isFailed ? "Upload a different recording" : "Cancel & start over"}
        </Button>

        {(isFailed || consecutiveNetworkErrors > 0) && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isPollingRequestActive}
            onClick={onManualPollRetry}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isPollingRequestActive ? "animate-spin" : ""
              }`}
            />
            Check job status now
          </Button>
        )}
      </div>
    </div>
  );
}

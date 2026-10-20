"use client";

import * as React from "react";
import { UploadPanel } from "@/components/workspace/upload-panel";
import { ProcessingPanel } from "@/components/workspace/processing-panel";
import { ResultsPanel } from "@/components/workspace/results-panel";
import {
  ACTIVE_POLLING_STATUSES,
  type ApiErrorResponse,
  type ConfigDiagnostics,
  type SupportedLanguageCode,
  type TranscriptionJobResult,
  type TranscriptionStatus,
  type TranscriptionSubmitResponse,
} from "@/types/transcription";

type WorkspaceStage = "upload" | "processing" | "results";

const BASE_POLL_INTERVAL_MS = 7000;
const MAX_BACKOFF_INTERVAL_MS = 45000;
const MAX_CONSECUTIVE_NETWORK_FAILURES = 5;

export function TranscriptionWorkspace() {
  const [stage, setStage] = React.useState<WorkspaceStage>("upload");
  const [diagnostics, setDiagnostics] =
    React.useState<ConfigDiagnostics | null>(null);

  // Upload state
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [audioObjectUrl, setAudioObjectUrl] = React.useState<string | null>(
    null
  );
  const [language, setLanguage] =
    React.useState<SupportedLanguageCode>("auto");
  const [summaryEnabled, setSummaryEnabled] = React.useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [missingVars, setMissingVars] = React.useState<string[]>([]);

  // Active Job / Processing state
  const [jobId, setJobId] = React.useState<string | null>(null);
  // Kept only in volatile React ref — never persisted to URLs or Web Storage
  const accessTokenRef = React.useRef<string | null>(null);
  const [jobStatus, setJobStatus] =
    React.useState<TranscriptionStatus>("queued");
  const [elapsedSeconds, setElapsedSeconds] = React.useState<number>(0);
  const [consecutiveNetworkErrors, setConsecutiveNetworkErrors] =
    React.useState<number>(0);
  const [processingError, setProcessingError] = React.useState<string | null>(
    null
  );
  const [isPollingRequestActive, setIsPollingRequestActive] =
    React.useState<boolean>(false);

  // Completed Result state
  const [completedResult, setCompletedResult] =
    React.useState<TranscriptionJobResult | null>(null);

  // Fetch non-sensitive configuration diagnostics on mount
  React.useEffect(() => {
    let mounted = true;
    fetch("/api/health", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ConfigDiagnostics | null) => {
        if (mounted && data) {
          setDiagnostics(data);
        }
      })
      .catch(() => {
        // Ignore diagnostic fetch errors
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Manage audio preview Object URL lifecycle
  React.useEffect(() => {
    if (!selectedFile) {
      setAudioObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setAudioObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  // Elapsed time counter while in active processing status
  React.useEffect(() => {
    if (stage !== "processing") return;
    if (!ACTIVE_POLLING_STATUSES.includes(jobStatus)) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, jobStatus]);

  const handleSelectFile = (
    file: File | null,
    validationError?: string | null
  ) => {
    setSelectedFile(file);
    setUploadError(validationError ?? null);
    setMissingVars([]);
  };

  // Single poll execution against GET /api/transcriptions/[jobId]
  const executePoll = React.useCallback(async (activeJobId: string) => {
    setIsPollingRequestActive(true);
    try {
      const headers: HeadersInit = {
        Accept: "application/json",
      };
      if (accessTokenRef.current) {
        headers["X-Job-Access-Token"] = accessTokenRef.current;
      }

      const response = await fetch(
        `/api/transcriptions/${encodeURIComponent(activeJobId)}`,
        {
          method: "GET",
          headers,
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        let apiErr: ApiErrorResponse | null = null;
        try {
          apiErr = (await response.json()) as ApiErrorResponse;
        } catch {
          // non-json error
        }

        // Terminal authorization or missing configuration error
        if (
          response.status === 401 ||
          response.status === 403 ||
          response.status === 404 ||
          response.status === 503
        ) {
          setProcessingError(
            apiErr?.error?.message ??
              `Unable to retrieve transcription status (HTTP ${response.status}).`
          );
          setConsecutiveNetworkErrors(MAX_CONSECUTIVE_NETWORK_FAILURES);
          return { shouldContinue: false, hadNetworkFailure: true };
        }

        // Transient 5xx or 429 error -> apply exponential backoff
        setConsecutiveNetworkErrors((prev) => prev + 1);
        setProcessingError(
          apiErr?.error?.message ??
            "Temporary error while checking transcription status."
        );
        return { shouldContinue: true, hadNetworkFailure: true };
      }

      const result = (await response.json()) as TranscriptionJobResult;
      setConsecutiveNetworkErrors(0);
      setProcessingError(null);
      setJobStatus(result.status);

      if (result.status === "completed") {
        setCompletedResult(result);
        setStage("results");
        return { shouldContinue: false, hadNetworkFailure: false };
      }

      if (
        result.status === "transcription_failed" ||
        result.status === "summary_failed"
      ) {
        setProcessingError(
          result.error_message ||
            (result.status === "transcription_failed"
              ? "The transcription engine could not process this audio recording."
              : "The AI summary step failed to complete.")
        );
        return { shouldContinue: false, hadNetworkFailure: false };
      }

      return { shouldContinue: true, hadNetworkFailure: false };
    } catch {
      setConsecutiveNetworkErrors((prev) => prev + 1);
      setProcessingError(
        "Network connection interrupted while polling status. Retrying with backoff..."
      );
      return { shouldContinue: true, hadNetworkFailure: true };
    } finally {
      setIsPollingRequestActive(false);
    }
  }, []);

  // Polling lifecycle loop with 7s base interval and exponential backoff
  React.useEffect(() => {
    if (stage !== "processing" || !jobId) return;
    if (!ACTIVE_POLLING_STATUSES.includes(jobStatus)) return;
    if (consecutiveNetworkErrors >= MAX_CONSECUTIVE_NETWORK_FAILURES) return;

    const backoffMultiplier =
      consecutiveNetworkErrors > 0
        ? Math.pow(2, consecutiveNetworkErrors)
        : 1;
    const delayMs = Math.min(
      BASE_POLL_INTERVAL_MS * backoffMultiplier,
      MAX_BACKOFF_INTERVAL_MS
    );

    const timer = setTimeout(() => {
      void executePoll(jobId);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [stage, jobId, jobStatus, consecutiveNetworkErrors, executePoll]);

  const handleSubmitAudio = async () => {
    if (!selectedFile || isSubmitting) return;

    setIsSubmitting(true);
    setUploadError(null);
    setMissingVars([]);

    try {
      const formData = new FormData();
      formData.append("audio", selectedFile, selectedFile.name);
      formData.append("language", language);
      formData.append("summary_enabled", String(summaryEnabled));

      const response = await fetch("/api/transcriptions", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });

      if (!response.ok) {
        let errPayload: ApiErrorResponse | null = null;
        try {
          errPayload = (await response.json()) as ApiErrorResponse;
        } catch {
          // ignore
        }
        // Refresh diagnostics so any stale missing-env banner clears automatically
        fetch("/api/health", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : null))
          .then((d: ConfigDiagnostics | null) => {
            if (d) setDiagnostics(d);
          })
          .catch(() => {});

        setUploadError(
          errPayload?.error?.message ??
            `Upload failed with status ${response.status}.`
        );
        if (errPayload?.error?.missingVariables) {
          setMissingVars(errPayload.error.missingVariables);
        }
        return;
      }

      const data = (await response.json()) as TranscriptionSubmitResponse;
      accessTokenRef.current = data.access_token ?? null;
      setJobId(data.job_id);
      setJobStatus(data.status || "transcribing");
      setElapsedSeconds(0);
      setConsecutiveNetworkErrors(0);
      setProcessingError(null);
      setCompletedResult(null);
      setStage("processing");
    } catch {
      setUploadError(
        "Unable to reach the server to upload your audio recording. Please verify your local server is running."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualPollRetry = () => {
    if (!jobId || isPollingRequestActive) return;
    setConsecutiveNetworkErrors(0);
    setProcessingError(null);
    void executePoll(jobId);
  };

  const handleResetWorkspace = () => {
    setStage("upload");
    setJobId(null);
    accessTokenRef.current = null;
    setJobStatus("queued");
    setElapsedSeconds(0);
    setConsecutiveNetworkErrors(0);
    setProcessingError(null);
    setCompletedResult(null);
    setSelectedFile(null);
    setUploadError(null);
  };

  if (stage === "processing" && jobId) {
    return (
      <ProcessingPanel
        jobId={jobId}
        status={jobStatus}
        filename={selectedFile?.name || "recording"}
        fileSize={selectedFile?.size}
        elapsedSeconds={elapsedSeconds}
        consecutiveNetworkErrors={consecutiveNetworkErrors}
        errorMessage={processingError}
        isPollingRequestActive={isPollingRequestActive}
        onManualPollRetry={handleManualPollRetry}
        onResetWorkspace={handleResetWorkspace}
      />
    );
  }

  if (stage === "results" && completedResult) {
    return (
      <ResultsPanel
        result={completedResult}
        fallbackFilename={selectedFile?.name || "recording.m4a"}
        audioObjectUrl={audioObjectUrl}
        onNewTranscription={handleResetWorkspace}
      />
    );
  }

  return (
    <UploadPanel
      selectedFile={selectedFile}
      audioObjectUrl={audioObjectUrl}
      language={language}
      summaryEnabled={summaryEnabled}
      isSubmitting={isSubmitting}
      errorMessage={uploadError}
      missingVars={missingVars}
      diagnostics={diagnostics}
      onSelectFile={handleSelectFile}
      onLanguageChange={setLanguage}
      onSummaryToggle={setSummaryEnabled}
      onSubmit={handleSubmitAudio}
    />
  );
}

export type TranscriptionStatus =
  | "queued"
  | "processing"
  | "transcribing"
  | "summarising"
  | "completed"
  | "transcription_failed"
  | "summary_failed";

export const ACTIVE_POLLING_STATUSES: readonly TranscriptionStatus[] = [
  "queued",
  "processing",
  "transcribing",
  "summarising",
] as const;

export const TERMINAL_STATUSES: readonly TranscriptionStatus[] = [
  "completed",
  "transcription_failed",
  "summary_failed",
] as const;

export type SupportedAudioExtension = "mp3" | "m4a" | "wav";

export type SupportedLanguageCode =
  | "auto"
  | "pt"
  | "en"
  | "es"
  | "fr"
  | "de"
  | "it";

export interface TranscriptionSubmitResponse {
  job_id: string;
  status: TranscriptionStatus;
  /**
   * Note: access_token is stored server-side in a scoped HttpOnly cookie
   * (`transcripto_job_tokens`) so it never needs to appear in URLs or logs.
   * We also return a masked/opaque session confirmation flag to the client.
   */
  access_token?: string;
}

export interface TranscriptionJobResult {
  job_id?: string;
  status: TranscriptionStatus;
  filename?: string;
  language?: string;
  title?: string;
  transcription?: string;
  summary?: string;
  key_points?: string[];
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiErrorResponse {
  error: {
    code:
      | "MISSING_CONFIGURATION"
      | "INVALID_FILE_TYPE"
      | "FILE_TOO_LARGE"
      | "EMPTY_FILE"
      | "RATE_LIMITED"
      | "UNAUTHORIZED_JOB_ACCESS"
      | "INVALID_JOB_ID"
      | "UPSTREAM_WEBHOOK_ERROR"
      | "INVALID_UPSTREAM_CONTRACT"
      | "JOB_NOT_FOUND"
      | "INTERNAL_ERROR";
    message: string;
    missingVariables?: string[];
    retryAfterSeconds?: number;
  };
}

export interface ConfigDiagnostics {
  configured: boolean;
  n8nSubmitConfigured: boolean;
  n8nResultConfigured: boolean;
  n8nSecretConfigured: boolean;
  supabaseConfigured: boolean;
  missingRequiredVariables: string[];
  missingOptionalVariables: string[];
  maxUploadSizeMb: number;
}

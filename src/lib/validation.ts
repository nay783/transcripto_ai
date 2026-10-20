import type {
  SupportedAudioExtension,
  TranscriptionJobResult,
  TranscriptionStatus,
  TranscriptionSubmitResponse,
} from "@/types/transcription";

export const ALLOWED_EXTENSIONS: readonly SupportedAudioExtension[] = [
  "mp3",
  "m4a",
  "wav",
] as const;

export const ALLOWED_MIME_TYPES: readonly string[] = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/vnd.wave",
  // Some browsers/OS report m4a as video/mp4 when container is MP4
  "video/mp4",
] as const;

const VALID_STATUSES = new Set<TranscriptionStatus>([
  "queued",
  "processing",
  "transcribing",
  "summarising",
  "completed",
  "transcription_failed",
  "summary_failed",
]);

export interface FileValidationResult {
  valid: boolean;
  errorCode?: "INVALID_FILE_TYPE" | "FILE_TOO_LARGE" | "EMPTY_FILE";
  errorMessage?: string;
  extension?: SupportedAudioExtension;
}

export function extractExtension(filename: string): string {
  const parts = filename.trim().toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function validateAudioFileMetadata(
  file: { name: string; size: number; type: string },
  maxSizeMb = 50
): FileValidationResult {
  if (!file || file.size <= 0) {
    return {
      valid: false,
      errorCode: "EMPTY_FILE",
      errorMessage: "The selected audio file is empty (0 bytes).",
    };
  }

  const maxBytes = maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      errorCode: "FILE_TOO_LARGE",
      errorMessage: `Audio file exceeds the ${maxSizeMb} MB upload limit.`,
    };
  }

  const ext = extractExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext as SupportedAudioExtension)) {
    return {
      valid: false,
      errorCode: "INVALID_FILE_TYPE",
      errorMessage:
        "Unsupported file format. Please upload an MP3, M4A, or WAV recording.",
    };
  }

  // If browser provides a MIME type, verify it's compatible or application/octet-stream
  const normalizedMime = (file.type || "").toLowerCase().trim();
  if (
    normalizedMime &&
    normalizedMime !== "application/octet-stream" &&
    !ALLOWED_MIME_TYPES.includes(normalizedMime)
  ) {
    return {
      valid: false,
      errorCode: "INVALID_FILE_TYPE",
      errorMessage: `Unsupported media type (${normalizedMime}). Only MP3, M4A, and WAV audio files are accepted.`,
    };
  }

  return {
    valid: true,
    extension: ext as SupportedAudioExtension,
  };
}

/**
 * Inspects the first 12 bytes of an uploaded buffer to guard against
 * non-audio binary executables disguised with an audio extension.
 */
export function verifyAudioMagicBytes(
  headerBytes: Uint8Array,
  extension: SupportedAudioExtension
): boolean {
  if (!headerBytes || headerBytes.length < 4) {
    return false;
  }

  // Reject Windows PE/MZ executables ("MZ"), ELF binaries ("\x7FELF"), or scripts ("#!")
  if (
    (headerBytes[0] === 0x4d && headerBytes[1] === 0x5a) ||
    (headerBytes[0] === 0x7f &&
      headerBytes[1] === 0x45 &&
      headerBytes[2] === 0x4c &&
      headerBytes[3] === 0x46) ||
    (headerBytes[0] === 0x23 && headerBytes[1] === 0x21)
  ) {
    return false;
  }

  if (extension === "wav") {
    // RIFF....WAVE
    const isRiff =
      headerBytes[0] === 0x52 &&
      headerBytes[1] === 0x49 &&
      headerBytes[2] === 0x46 &&
      headerBytes[3] === 0x46;
    if (!isRiff) return false;
    if (headerBytes.length >= 12) {
      const isWave =
        headerBytes[8] === 0x57 &&
        headerBytes[9] === 0x41 &&
        headerBytes[10] === 0x56 &&
        headerBytes[11] === 0x45;
      return isWave;
    }
    return true;
  }

  if (extension === "m4a") {
    // ISO Base Media File Format: bytes 4..7 == "ftyp" (0x66 0x74 0x79 0x70)
    if (headerBytes.length >= 8) {
      const isFtyp =
        headerBytes[4] === 0x66 &&
        headerBytes[5] === 0x74 &&
        headerBytes[6] === 0x79 &&
        headerBytes[7] === 0x70;
      if (isFtyp) return true;
    }
    return false;
  }

  if (extension === "mp3") {
    // ID3v2 tag ("ID3") OR MPEG frame sync (0xFF followed by 0xE0..0xFF)
    const isId3 =
      headerBytes[0] === 0x49 &&
      headerBytes[1] === 0x44 &&
      headerBytes[2] === 0x33;
    const isFrameSync =
      headerBytes[0] === 0xff && (headerBytes[1] & 0xe0) === 0xe0;
    return isId3 || isFrameSync;
  }

  return false;
}

const JOB_ID_PATTERN = /^[a-zA-Z0-9_-]{4,128}$/;

export function isValidIdentifier(value: unknown): value is string {
  return typeof value === "string" && JOB_ID_PATTERN.test(value.trim());
}

/**
 * Normalizes backend status values strictly to the 7 known states.
 * Maps "summarizing" (US spelling) to "summarising" (UK spec spelling) if encountered.
 */
export function normalizeStatus(raw: unknown): TranscriptionStatus | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.trim().toLowerCase();
  if (cleaned === "summarizing") return "summarising";
  if (VALID_STATUSES.has(cleaned as TranscriptionStatus)) {
    return cleaned as TranscriptionStatus;
  }
  return null;
}

/**
 * Validates the response from POST https://n8n.ncai.club/webhook/transcripto-submit
 * Expected contract:
 * {
 *   "job_id": "uuid",
 *   "access_token": "uuid",
 *   "status": "transcribing"
 * }
 */
export function parseSubmitWebhookResponse(
  payload: unknown
):
  | {
      ok: true;
      data: Required<TranscriptionSubmitResponse>;
    }
  | {
      ok: false;
      reason: string;
    } {
  const unpacked = Array.isArray(payload) ? payload[0] : payload;
  if (!unpacked || typeof unpacked !== "object") {
    return {
      ok: false,
      reason: "Submission webhook returned a non-object payload.",
    };
  }

  const record = unpacked as Record<string, unknown>;
  const jobId = record.job_id;
  const accessToken = record.access_token;
  const status = normalizeStatus(record.status) ?? "transcribing";

  if (!isValidIdentifier(jobId)) {
    return {
      ok: false,
      reason: "Submission webhook response is missing a valid 'job_id'.",
    };
  }

  if (!isValidIdentifier(accessToken)) {
    return {
      ok: false,
      reason: "Submission webhook response is missing a valid 'access_token'.",
    };
  }

  return {
    ok: true,
    data: {
      job_id: jobId.trim(),
      access_token: accessToken.trim(),
      status,
    },
  };
}

/**
 * Validates the response from the n8n result webhook.
 * Never invents transcript or summary text if missing.
 */
export function parseResultWebhookResponse(
  payload: unknown
):
  | {
      ok: true;
      data: TranscriptionJobResult;
    }
  | {
      ok: false;
      reason: string;
    } {
  const unpacked = Array.isArray(payload) ? payload[0] : payload;
  if (!unpacked || typeof unpacked !== "object") {
    return {
      ok: false,
      reason: "Result webhook returned an invalid JSON payload.",
    };
  }

  const record = unpacked as Record<string, unknown>;
  const status = normalizeStatus(record.status);

  if (!status) {
    return {
      ok: false,
      reason: `Result webhook returned an unrecognised status value: ${String(
        record.status ?? "undefined"
      )}`,
    };
  }

  const result: TranscriptionJobResult = {
    status,
  };

  if (typeof record.job_id === "string" && record.job_id.trim()) {
    result.job_id = record.job_id.trim();
  }
  if (typeof record.filename === "string" && record.filename.trim()) {
    result.filename = record.filename.trim();
  }
  if (typeof record.language === "string" && record.language.trim()) {
    result.language = record.language.trim();
  }
  if (typeof record.title === "string") {
    result.title = record.title.trim();
  }
  if (typeof record.transcription === "string") {
    result.transcription = record.transcription;
  }
  if (typeof record.summary === "string") {
    result.summary = record.summary;
  }
  if (Array.isArray(record.key_points)) {
    result.key_points = record.key_points
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof record.error_message === "string" && record.error_message.trim()) {
    result.error_message = record.error_message.trim();
  } else if (typeof record.error === "string" && record.error.trim()) {
    result.error_message = record.error.trim();
  }

  // If status is completed, ensure actual transcription string is present
  if (status === "completed" && typeof result.transcription !== "string") {
    return {
      ok: false,
      reason:
        "Backend reported 'completed' status without a 'transcription' text field.",
    };
  }

  return {
    ok: true,
    data: result,
  };
}

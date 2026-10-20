import { describe, expect, it, beforeEach } from "vitest";
import {
  parseResultWebhookResponse,
  parseSubmitWebhookResponse,
  validateAudioFileMetadata,
  verifyAudioMagicBytes,
} from "@/lib/validation";
import {
  checkRateLimit,
  resetRateLimitBucketsForTest,
} from "@/lib/rate-limit";
import {
  attachJobTokenToSession,
  resolveJobAccessToken,
} from "@/lib/job-session";
import {
  buildDocxBuffer,
  buildPdfBytes,
  buildTxtContent,
} from "@/lib/export-documents";

describe("Audio File Metadata & Magic Byte Validation", () => {
  it("accepts valid MP3, M4A, and WAV metadata within size limits", () => {
    expect(
      validateAudioFileMetadata(
        { name: "interview.mp3", size: 1024 * 500, type: "audio/mpeg" },
        50
      )
    ).toEqual({ valid: true, extension: "mp3" });

    expect(
      validateAudioFileMetadata(
        { name: "meeting.m4a", size: 1024 * 1200, type: "audio/mp4" },
        50
      )
    ).toEqual({ valid: true, extension: "m4a" });

    expect(
      validateAudioFileMetadata(
        { name: "studio.wav", size: 1024 * 2400, type: "audio/wav" },
        50
      )
    ).toEqual({ valid: true, extension: "wav" });
  });

  it("rejects empty files, oversized files, and unsupported extensions", () => {
    const empty = validateAudioFileMetadata(
      { name: "empty.mp3", size: 0, type: "audio/mpeg" },
      50
    );
    expect(empty.valid).toBe(false);
    expect(empty.errorCode).toBe("EMPTY_FILE");

    const tooLarge = validateAudioFileMetadata(
      { name: "huge.wav", size: 60 * 1024 * 1024, type: "audio/wav" },
      50
    );
    expect(tooLarge.valid).toBe(false);
    expect(tooLarge.errorCode).toBe("FILE_TOO_LARGE");

    const badExt = validateAudioFileMetadata(
      { name: "archive.zip", size: 2048, type: "application/zip" },
      50
    );
    expect(badExt.valid).toBe(false);
    expect(badExt.errorCode).toBe("INVALID_FILE_TYPE");
  });

  it("verifies magic bytes for WAV, M4A, and MP3 and rejects disguised executables", () => {
    // Valid WAV: "RIFF....WAVE"
    const wavBytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x08, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    ]);
    expect(verifyAudioMagicBytes(wavBytes, "wav")).toBe(true);

    // Valid M4A: "....ftypM4A "
    const m4aBytes = new Uint8Array([
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41, 0x20,
    ]);
    expect(verifyAudioMagicBytes(m4aBytes, "m4a")).toBe(true);

    // Valid MP3: "ID3..."
    const mp3Bytes = new Uint8Array([
      0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x00,
    ]);
    expect(verifyAudioMagicBytes(mp3Bytes, "mp3")).toBe(true);

    // Disguised Windows PE executable ("MZ...")
    const exeBytes = new Uint8Array([
      0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00,
    ]);
    expect(verifyAudioMagicBytes(exeBytes, "mp3")).toBe(false);
    expect(verifyAudioMagicBytes(exeBytes, "wav")).toBe(false);
  });
});

describe("n8n Webhook Contract Validation (Test Fixtures Only)", () => {
  it("validates expected submit webhook response", () => {
    const parsed = parseSubmitWebhookResponse({
      job_id: "550e8400-e29b-41d4-a716-446655440000",
      access_token: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      status: "transcribing",
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.job_id).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(parsed.data.status).toBe("transcribing");
    }
  });

  it("validates processing and completed result contracts without fabricating fields", () => {
    const processing = parseResultWebhookResponse({ status: "processing" });
    expect(processing.ok).toBe(true);
    if (processing.ok) {
      expect(processing.data.status).toBe("processing");
      expect(processing.data.transcription).toBeUndefined();
    }

    // Rejects 'completed' if transcription is missing
    const invalidCompleted = parseResultWebhookResponse({
      status: "completed",
      title: "Missing Transcript",
    });
    expect(invalidCompleted.ok).toBe(false);

    // Accepts full completed contract
    const completed = parseResultWebhookResponse({
      status: "completed",
      filename: "recording.m4a",
      language: "pt",
      title: "Reunião de Produto Q4",
      transcription: "Texto real da transcrição em português.",
      summary: "Resumo executivo gerado por IA.",
      key_points: ["Primeiro insight", "Segundo insight"],
    });
    expect(completed.ok).toBe(true);
    if (completed.ok) {
      expect(completed.data.language).toBe("pt");
      expect(completed.data.key_points).toHaveLength(2);
    }
  });
});

describe("Session Token Signing & Rate Limiting", () => {
  beforeEach(() => {
    resetRateLimitBucketsForTest();
  });

  it("binds job_id to access_token in signed cookie and rejects tampering", () => {
    const cookie = attachJobTokenToSession(
      undefined,
      "job-1234",
      "token-secret-abcd"
    );
    expect(resolveJobAccessToken("job-1234", cookie, null)).toBe(
      "token-secret-abcd"
    );
    expect(resolveJobAccessToken("other-job", cookie, null)).toBeNull();

    const tamperedCookie = `${cookie}tampered`;
    expect(resolveJobAccessToken("job-1234", tamperedCookie, null)).toBeNull();
  });

  it("throttles requests when window limit is exceeded", () => {
    const config = { windowMs: 60_000, maxRequests: 2 };
    expect(checkRateLimit("127.0.0.1", "test_bucket", config).allowed).toBe(
      true
    );
    expect(checkRateLimit("127.0.0.1", "test_bucket", config).allowed).toBe(
      true
    );
    const blocked = checkRateLimit("127.0.0.1", "test_bucket", config);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});

describe("Document Export Generation (TXT, DOCX, PDF)", () => {
  const sampleExport = {
    title: "Quarterly Strategy Sync",
    filename: "strategy-sync.m4a",
    language: "en",
    transcription:
      "User-edited transcript paragraph one.\n\nUser-edited paragraph two.",
    summary: "Concise executive summary of the strategy discussion.",
    keyPoints: ["Prioritize security controls", "Finalize n8n integration"],
    includeSummary: true,
  };

  it("builds plain text export containing the latest edited transcript", () => {
    const txt = buildTxtContent(sampleExport);
    expect(txt).toContain("QUARTERLY STRATEGY SYNC");
    expect(txt).toContain("User-edited transcript paragraph one.");
    expect(txt).toContain("Prioritize security controls");
  });

  it("builds a valid non-empty DOCX zip buffer", async () => {
    const docxBytes = await buildDocxBuffer(sampleExport);
    expect(docxBytes.byteLength).toBeGreaterThan(1000);
    // DOCX is a ZIP container starting with PK (0x50 0x4B)
    expect(docxBytes[0]).toBe(0x50);
    expect(docxBytes[1]).toBe(0x4b);
  });

  it("builds a valid non-empty PDF document buffer", () => {
    const pdfBuffer = buildPdfBytes(sampleExport);
    const bytes = new Uint8Array(pdfBuffer);
    expect(bytes.byteLength).toBeGreaterThan(500);
    // PDF header starts with "%PDF" (0x25 0x50 0x44 0x46)
    expect(bytes[0]).toBe(0x25);
    expect(bytes[1]).toBe(0x50);
    expect(bytes[2]).toBe(0x44);
    expect(bytes[3]).toBe(0x46);
  });
});

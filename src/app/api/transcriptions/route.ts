import { NextRequest, NextResponse } from "next/server";
import { getConfigDiagnostics, getServerEnv } from "@/lib/env";
import {
  attachJobTokenToSession,
  JOB_SESSION_COOKIE_NAME,
} from "@/lib/job-session";
import {
  checkRateLimit,
  extractClientIdentifier,
} from "@/lib/rate-limit";
import {
  parseSubmitWebhookResponse,
  validateAudioFileMetadata,
  verifyAudioMagicBytes,
} from "@/lib/validation";
import type { ApiErrorResponse } from "@/types/transcription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUBMIT_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 8,
};

function errorJson(
  status: number,
  code: ApiErrorResponse["error"]["code"],
  message: string,
  extra?: Partial<ApiErrorResponse["error"]>,
  headers?: HeadersInit
) {
  const body: ApiErrorResponse = {
    error: {
      code,
      message,
      ...extra,
    },
  };
  return NextResponse.json(body, { status, headers });
}

export async function POST(request: NextRequest) {
  // 1. Apply request throttling and abuse protection
  const clientKey = extractClientIdentifier(request.headers);
  const rateCheck = checkRateLimit(
    clientKey,
    "submit_transcription",
    SUBMIT_RATE_LIMIT
  );

  if (!rateCheck.allowed) {
    return errorJson(
      429,
      "RATE_LIMITED",
      `Too many transcription requests. Please wait ${rateCheck.retryAfterSeconds} seconds before uploading another file.`,
      { retryAfterSeconds: rateCheck.retryAfterSeconds },
      { "Retry-After": String(rateCheck.retryAfterSeconds) }
    );
  }

  // 2. Verify server environment configuration without exposing secrets
  const env = getServerEnv();
  const diagnostics = getConfigDiagnostics();

  if (!env.n8nSubmitWebhookUrl || !env.n8nWebhookSecret) {
    const missing = diagnostics.missingRequiredVariables.filter(
      (v) => v === "N8N_SUBMIT_WEBHOOK_URL" || v === "N8N_WEBHOOK_SECRET"
    );
    return errorJson(
      503,
      "MISSING_CONFIGURATION",
      `Server configuration incomplete. Missing required environment variables: ${missing.join(
        ", "
      )}. Configure them in your local .env file and restart the server.`,
      { missingVariables: missing }
    );
  }

  // 3. Parse multipart/form-data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorJson(
      400,
      "INVALID_FILE_TYPE",
      "Expected a multipart/form-data request containing an 'audio' file field."
    );
  }

  const audioEntry = formData.get("audio");
  if (!audioEntry || !(audioEntry instanceof File)) {
    return errorJson(
      400,
      "INVALID_FILE_TYPE",
      "No audio file was provided in the 'audio' field."
    );
  }

  // 4. Validate file type, extension, and size limit
  const metaValidation = validateAudioFileMetadata(
    {
      name: audioEntry.name,
      size: audioEntry.size,
      type: audioEntry.type,
    },
    env.maxAudioUploadMb
  );

  if (!metaValidation.valid || !metaValidation.extension) {
    return errorJson(
      metaValidation.errorCode === "FILE_TOO_LARGE" ? 413 : 400,
      metaValidation.errorCode ?? "INVALID_FILE_TYPE",
      metaValidation.errorMessage ?? "Invalid audio file."
    );
  }

  // Verify magic bytes from the first 16 bytes of the file stream
  try {
    const headerSlice = audioEntry.slice(0, 16);
    const headerBuffer = new Uint8Array(await headerSlice.arrayBuffer());
    const validSignature = verifyAudioMagicBytes(
      headerBuffer,
      metaValidation.extension
    );
    if (!validSignature) {
      return errorJson(
        400,
        "INVALID_FILE_TYPE",
        "The uploaded file content does not match a valid MP3, M4A, or WAV audio container."
      );
    }
  } catch {
    return errorJson(
      400,
      "INVALID_FILE_TYPE",
      "Unable to inspect uploaded audio stream."
    );
  }

  // 5. Build outbound multipart/form-data for n8n submission webhook
  const outboundForm = new FormData();
  outboundForm.append("audio", audioEntry, audioEntry.name);

  const language = formData.get("language");
  if (typeof language === "string" && language.trim()) {
    outboundForm.append("language", language.trim());
  } else {
    outboundForm.append("language", "auto");
  }

  const summaryEnabled = formData.get("summary_enabled");
  outboundForm.append(
    "summary_enabled",
    typeof summaryEnabled === "string" ? summaryEnabled : "true"
  );

  // 6. Forward to configured n8n submission webhook with server-side secret
  let upstreamResponse: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    upstreamResponse = await fetch(env.n8nSubmitWebhookUrl, {
      method: "POST",
      headers: {
        "X-Webhook-Secret": env.n8nWebhookSecret,
        Accept: "application/json",
      },
      body: outboundForm,
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
  } catch {
    return errorJson(
      502,
      "UPSTREAM_WEBHOOK_ERROR",
      "Could not reach the transcription orchestration service. Please check your connection and try again."
    );
  }

  if (!upstreamResponse.ok) {
    let upstreamHint = "";
    try {
      const errBody = (await upstreamResponse.json()) as {
        message?: string;
        hint?: string;
      };
      if (
        upstreamResponse.status === 404 &&
        errBody?.message?.includes("is not registered")
      ) {
        upstreamHint =
          " The n8n workflow is currently inactive. Please open your n8n editor (n8n.ncai.club) and turn ON the 'Active' toggle in the top-right corner for the Transcripto workflow.";
      } else if (errBody?.message) {
        upstreamHint = ` (${errBody.message})`;
      }
    } catch {
      // ignore non-JSON error body
    }

    return errorJson(
      502,
      "UPSTREAM_WEBHOOK_ERROR",
      `Transcription submission was rejected by the upstream service (HTTP ${upstreamResponse.status}).${upstreamHint}`
    );
  }

  let rawJson: unknown;
  try {
    rawJson = await upstreamResponse.json();
  } catch {
    return errorJson(
      502,
      "INVALID_UPSTREAM_CONTRACT",
      "Upstream submission webhook returned a non-JSON response."
    );
  }

  // 7. Parse and validate returned JSON contract
  const parsed = parseSubmitWebhookResponse(rawJson);
  if (!parsed.ok) {
    return errorJson(502, "INVALID_UPSTREAM_CONTRACT", parsed.reason);
  }

  const { job_id, access_token, status } = parsed.data;

  // Bind access_token to a scoped HttpOnly signed session cookie
  const existingCookie = request.cookies.get(JOB_SESSION_COOKIE_NAME)?.value;
  const signedCookieValue = attachJobTokenToSession(
    existingCookie,
    job_id,
    access_token
  );

  const response = NextResponse.json(
    {
      job_id,
      access_token,
      status,
    },
    {
      status: 201,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );

  response.cookies.set({
    name: JOB_SESSION_COOKIE_NAME,
    value: signedCookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/transcriptions",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}

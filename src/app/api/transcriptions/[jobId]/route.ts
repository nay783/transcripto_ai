import { NextRequest, NextResponse } from "next/server";
import { getConfigDiagnostics, getServerEnv } from "@/lib/env";
import {
  JOB_SESSION_COOKIE_NAME,
  resolveJobAccessToken,
} from "@/lib/job-session";
import {
  checkRateLimit,
  extractClientIdentifier,
} from "@/lib/rate-limit";
import {
  isValidIdentifier,
  parseResultWebhookResponse,
} from "@/lib/validation";
import type { ApiErrorResponse } from "@/types/transcription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 35,
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  // 1. Rate limit polling requests per client
  const clientKey = extractClientIdentifier(request.headers);
  const rateCheck = checkRateLimit(
    clientKey,
    "poll_transcription",
    POLL_RATE_LIMIT
  );

  if (!rateCheck.allowed) {
    return errorJson(
      429,
      "RATE_LIMITED",
      "Polling rate limit exceeded. Please wait before checking status again.",
      { retryAfterSeconds: rateCheck.retryAfterSeconds },
      { "Retry-After": String(rateCheck.retryAfterSeconds) }
    );
  }

  // 2. Validate jobId parameter
  const { jobId } = await context.params;
  if (!isValidIdentifier(jobId)) {
    return errorJson(
      400,
      "INVALID_JOB_ID",
      "Invalid transcription job identifier format."
    );
  }

  // 3. Require corresponding access token from scoped HttpOnly cookie or header (never URL)
  const cookieValue = request.cookies.get(JOB_SESSION_COOKIE_NAME)?.value;
  const headerToken = request.headers.get("x-job-access-token");
  const accessToken = resolveJobAccessToken(jobId, cookieValue, headerToken);

  if (!accessToken) {
    return errorJson(
      401,
      "UNAUTHORIZED_JOB_ACCESS",
      "Missing or expired job access authorization. Only the session that initiated this transcription can retrieve its results."
    );
  }

  // 4. Verify server configuration for the exact n8n result endpoint
  const env = getServerEnv();
  const diagnostics = getConfigDiagnostics();

  if (!env.n8nResultWebhookUrl || !env.n8nWebhookSecret) {
    const missing = diagnostics.missingRequiredVariables.filter(
      (v) =>
        v === "N8N_RESULTS_WEBHOOK_URL" ||
        v === "N8N_RESULT_WEBHOOK_URL" ||
        v === "N8N_WEBHOOK_SECRET"
    );
    return errorJson(
      503,
      "MISSING_CONFIGURATION",
      `Result endpoint configuration is incomplete. Missing required environment variables: ${missing.join(
        ", "
      )}.`,
      { missingVariables: missing }
    );
  }

  // 5. Call the exact configured n8n results webhook from the server
  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL(env.n8nResultWebhookUrl);
    upstreamUrl.searchParams.set("job_id", jobId);
    upstreamUrl.searchParams.set("access_token", accessToken);
  } catch {
    return errorJson(
      500,
      "MISSING_CONFIGURATION",
      "Configured N8N_RESULT_WEBHOOK_URL is not a valid URL."
    );
  }

  let upstreamResponse: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: {
        "X-Webhook-Secret": env.n8nWebhookSecret,
        "X-Job-Id": jobId,
        "X-Access-Token": accessToken,
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
  } catch {
    return errorJson(
      502,
      "UPSTREAM_WEBHOOK_ERROR",
      "Temporary network error while reaching the transcription results service."
    );
  }

  if (upstreamResponse.status === 404) {
    let isUnregisteredWebhook = false;
    try {
      const errBody = (await upstreamResponse.json()) as { message?: string };
      if (errBody?.message?.includes("is not registered")) {
        isUnregisteredWebhook = true;
      }
    } catch {
      // ignore
    }

    if (isUnregisteredWebhook) {
      return errorJson(
        502,
        "UPSTREAM_WEBHOOK_ERROR",
        "The n8n results webhook ('GET transcripto-results') is not active. Please enable the 'Active' toggle on your n8n results workflow in n8n.ncai.club."
      );
    }

    return errorJson(
      404,
      "JOB_NOT_FOUND",
      "Transcription job was not found or has expired."
    );
  }

  if (upstreamResponse.status === 401 || upstreamResponse.status === 403) {
    return errorJson(
      403,
      "UNAUTHORIZED_JOB_ACCESS",
      "Access to this transcription job was denied by the backend."
    );
  }

  if (!upstreamResponse.ok) {
    return errorJson(
      502,
      "UPSTREAM_WEBHOOK_ERROR",
      `Upstream results service returned HTTP ${upstreamResponse.status}.`
    );
  }

  let rawJson: unknown;
  try {
    rawJson = await upstreamResponse.json();
  } catch {
    return errorJson(
      502,
      "INVALID_UPSTREAM_CONTRACT",
      "Upstream results webhook returned a non-JSON payload."
    );
  }

  // 6. Validate response contract without fabricating fields
  const parsed = parseResultWebhookResponse(rawJson);
  if (!parsed.ok) {
    return errorJson(502, "INVALID_UPSTREAM_CONTRACT", parsed.reason);
  }

  return NextResponse.json(parsed.data, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

import crypto from "crypto";
import { getServerEnv } from "@/lib/env";

export const JOB_SESSION_COOKIE_NAME = "transcripto_job_session";

interface JobTokenMap {
  [jobId: string]: {
    token: string;
    issuedAt: number;
  };
}

// Server-side ephemeral fallback map (in addition to signed HttpOnly cookie)
const serverJobTokenCache = new Map<
  string,
  { token: string; issuedAt: number }
>();

const MAX_JOBS_IN_COOKIE = 12;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function signPayload(encodedPayload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
}

export function serializeSignedJobCookie(map: JobTokenMap): string {
  const { sessionCookieSecret } = getServerEnv();
  const payload = Buffer.from(JSON.stringify(map), "utf8").toString("base64url");
  const signature = signPayload(payload, sessionCookieSecret);
  return `${payload}.${signature}`;
}

export function parseSignedJobCookie(
  cookieValue: string | undefined
): JobTokenMap {
  if (!cookieValue || !cookieValue.includes(".")) {
    return {};
  }

  const [payload, signature] = cookieValue.split(".");
  if (!payload || !signature) return {};

  const { sessionCookieSecret } = getServerEnv();
  const expectedSig = signPayload(payload, sessionCookieSecret);

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return {};
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );
    if (!decoded || typeof decoded !== "object") return {};

    const now = Date.now();
    const cleaned: JobTokenMap = {};
    for (const [jobId, entry] of Object.entries(
      decoded as Record<string, { token?: unknown; issuedAt?: unknown }>
    )) {
      if (
        entry &&
        typeof entry.token === "string" &&
        typeof entry.issuedAt === "number" &&
        now - entry.issuedAt < TOKEN_TTL_MS
      ) {
        cleaned[jobId] = { token: entry.token, issuedAt: entry.issuedAt };
      }
    }
    return cleaned;
  } catch {
    return {};
  }
}

export function attachJobTokenToSession(
  existingCookieValue: string | undefined,
  jobId: string,
  accessToken: string
): string {
  const now = Date.now();
  serverJobTokenCache.set(jobId, { token: accessToken, issuedAt: now });

  const currentMap = parseSignedJobCookie(existingCookieValue);
  currentMap[jobId] = {
    token: accessToken,
    issuedAt: now,
  };

  // Prune oldest entries if cookie exceeds max entries
  const entries = Object.entries(currentMap).sort(
    (a, b) => b[1].issuedAt - a[1].issuedAt
  );
  const trimmed: JobTokenMap = {};
  for (const [k, v] of entries.slice(0, MAX_JOBS_IN_COOKIE)) {
    trimmed[k] = v;
  }

  return serializeSignedJobCookie(trimmed);
}

/**
 * Resolves the access token for a job ID using:
 * 1. Scoped signed HttpOnly session cookie (primary browser mechanism)
 * 2. X-Job-Access-Token request header (never in URL query parameters)
 */
export function resolveJobAccessToken(
  jobId: string,
  cookieValue: string | undefined,
  headerToken: string | null
): string | null {
  const cookieMap = parseSignedJobCookie(cookieValue);
  if (cookieMap[jobId]?.token) {
    return cookieMap[jobId].token;
  }

  if (headerToken && headerToken.trim().length > 0) {
    const trimmed = headerToken.trim();
    const cached = serverJobTokenCache.get(jobId);
    if (!cached || cached.token === trimmed) {
      return trimmed;
    }
  }

  return null;
}

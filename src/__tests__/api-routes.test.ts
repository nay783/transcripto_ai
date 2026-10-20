import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as submitRoute } from "@/app/api/transcriptions/route";
import { GET as resultRoute } from "@/app/api/transcriptions/[jobId]/route";
import { GET as healthRoute } from "@/app/api/health/route";
import { resetRateLimitBucketsForTest } from "@/lib/rate-limit";

// Clearly labelled unit test fixture helper: builds a tiny valid WAV buffer ("RIFF....WAVE")
function createValidWavFile(filename = "fixture.wav"): File {
  const bytes = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    0x66, 0x6d, 0x74, 0x20,
  ]);
  return new File([bytes], filename, { type: "audio/wav" });
}

describe("Next.js Server Route Handlers (/api/transcriptions & /api/health)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetRateLimitBucketsForTest();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("reports missing required variables safely via GET /api/health when .env is empty", async () => {
    delete process.env.N8N_SUBMIT_WEBHOOK_URL;
    delete process.env.N8N_RESULTS_WEBHOOK_URL;
    delete process.env.N8N_RESULT_WEBHOOK_URL;
    delete process.env.N8N_WEBHOOK_SECRET;

    const res = await healthRoute();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.configured).toBe(false);
    expect(body.missingRequiredVariables).toEqual([
      "N8N_SUBMIT_WEBHOOK_URL",
      "N8N_RESULTS_WEBHOOK_URL",
      "N8N_WEBHOOK_SECRET",
    ]);
  });

  it("returns 503 MISSING_CONFIGURATION on POST /api/transcriptions when webhook env vars are absent", async () => {
    delete process.env.N8N_SUBMIT_WEBHOOK_URL;
    delete process.env.N8N_WEBHOOK_SECRET;

    const form = new FormData();
    form.append("audio", createValidWavFile());

    const req = new NextRequest("http://localhost:3000/api/transcriptions", {
      method: "POST",
      body: form,
    });

    const res = await submitRoute(req);
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error.code).toBe("MISSING_CONFIGURATION");
    expect(json.error.missingVariables).toContain("N8N_SUBMIT_WEBHOOK_URL");
    expect(json.error.missingVariables).toContain("N8N_WEBHOOK_SECRET");
  });

  it("rejects unauthorized polling on GET /api/transcriptions/[jobId] when access token is missing", async () => {
    process.env.N8N_RESULT_WEBHOOK_URL =
      "https://n8n.ncai.club/webhook/transcripto-result";
    process.env.N8N_WEBHOOK_SECRET = "test-only-fixture-secret";

    const req = new NextRequest(
      "http://localhost:3000/api/transcriptions/550e8400-e29b-41d4-a716-446655440000",
      { method: "GET" }
    );

    const res = await resultRoute(req, {
      params: Promise.resolve({
        jobId: "550e8400-e29b-41d4-a716-446655440000",
      }),
    });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe("UNAUTHORIZED_JOB_ACCESS");
  });

  it("completes submit -> HttpOnly session cookie -> poll lifecycle using mocked test fixture", async () => {
    process.env.N8N_SUBMIT_WEBHOOK_URL =
      "https://n8n.ncai.club/webhook/transcripto-submit";
    process.env.N8N_RESULT_WEBHOOK_URL =
      "https://n8n.ncai.club/webhook/transcripto-result";
    process.env.N8N_WEBHOOK_SECRET = "test-only-fixture-secret";

    const fetchSpy = vi.spyOn(global, "fetch");

    // 1. Mock POST response from n8n submit webhook
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          job_id: "job-uuid-9999",
          access_token: "token-uuid-8888",
          status: "transcribing",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const form = new FormData();
    form.append("audio", createValidWavFile("sample.wav"));
    form.append("language", "auto");
    form.append("summary_enabled", "true");

    const postReq = new NextRequest(
      "http://localhost:3000/api/transcriptions",
      {
        method: "POST",
        body: form,
      }
    );

    const postRes = await submitRoute(postReq);
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    expect(postData.job_id).toBe("job-uuid-9999");
    expect(postData.status).toBe("transcribing");

    // Verify Set-Cookie header contains HttpOnly session cookie
    const setCookieHeader = postRes.headers.get("set-cookie");
    expect(setCookieHeader).toContain("transcripto_job_session=");
    expect(setCookieHeader).toContain("HttpOnly");

    // 2. Mock GET response from n8n result webhook
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: "completed",
          filename: "sample.wav",
          language: "pt",
          title: "Fixture Test Title",
          transcription: "Fixture transcript body from test.",
          summary: "Fixture AI summary.",
          key_points: ["Point A", "Point B"],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const getReq = new NextRequest(
      "http://localhost:3000/api/transcriptions/job-uuid-9999",
      {
        method: "GET",
        headers: {
          "x-job-access-token": postData.access_token,
        },
      }
    );

    const getRes = await resultRoute(getReq, {
      params: Promise.resolve({ jobId: "job-uuid-9999" }),
    });

    expect(getRes.status).toBe(200);
    const resultData = await getRes.json();
    expect(resultData.status).toBe("completed");
    expect(resultData.title).toBe("Fixture Test Title");
    expect(resultData.transcription).toBe("Fixture transcript body from test.");
    expect(resultData.key_points).toEqual(["Point A", "Point B"]);
  });
});

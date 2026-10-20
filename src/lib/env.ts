import type { ConfigDiagnostics } from "@/types/transcription";

function firstNonEmptyEnv(keys: string[]): string | undefined {
  for (const key of keys) {
    const val = process.env[key];
    if (typeof val === "string" && val.trim().length > 0) {
      return val.trim();
    }
  }
  return undefined;
}

export interface ServerEnvConfig {
  n8nSubmitWebhookUrl: string | undefined;
  n8nResultWebhookUrl: string | undefined;
  n8nWebhookSecret: string | undefined;
  supabaseUrl: string | undefined;
  supabaseServiceRoleKey: string | undefined;
  supabaseAnonKey: string | undefined;
  maxAudioUploadMb: number;
  sessionCookieSecret: string;
}

export function getServerEnv(): ServerEnvConfig {
  if (typeof window !== "undefined") {
    throw new Error(
      "SECURITY VIOLATION: getServerEnv() must never be executed in the browser."
    );
  }

  const n8nSubmitWebhookUrl = firstNonEmptyEnv([
    "N8N_SUBMIT_WEBHOOK_URL",
    "N8N_WEBHOOK_SUBMIT_URL",
    "N8N_SUBMIT_URL",
    "TRANSCRIPTO_SUBMIT_WEBHOOK_URL",
  ]);

  const n8nResultWebhookUrl = firstNonEmptyEnv([
    "N8N_RESULTS_WEBHOOK_URL",
    "N8N_RESULT_WEBHOOK_URL",
    "N8N_WEBHOOK_RESULTS_URL",
    "N8N_WEBHOOK_RESULT_URL",
    "N8N_RESULT_URL",
    "TRANSCRIPTO_RESULT_WEBHOOK_URL",
  ]);

  const n8nWebhookSecret = firstNonEmptyEnv([
    "N8N_WEBHOOK_SECRET",
    "WEBHOOK_SECRET",
    "X_WEBHOOK_SECRET",
    "TRANSCRIPTO_WEBHOOK_SECRET",
  ]);

  const supabaseUrl = firstNonEmptyEnv([
    "SUPABASE_URL",
    "VITE_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
  ]);

  const supabaseServiceRoleKey = firstNonEmptyEnv([
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY",
  ]);

  const supabaseAnonKey = firstNonEmptyEnv([
    "SUPABASE_ANON_KEY",
    "VITE_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ]);

  const rawMaxMb = Number(process.env.MAX_AUDIO_UPLOAD_MB);
  const maxAudioUploadMb =
    Number.isFinite(rawMaxMb) && rawMaxMb > 0 && rawMaxMb <= 500
      ? rawMaxMb
      : 50;

  const sessionCookieSecret =
    firstNonEmptyEnv(["SESSION_COOKIE_SECRET"]) ||
    n8nWebhookSecret ||
    "transcripto-local-dev-ephemeral-hmac-key";

  return {
    n8nSubmitWebhookUrl,
    n8nResultWebhookUrl,
    n8nWebhookSecret,
    supabaseUrl,
    supabaseServiceRoleKey,
    supabaseAnonKey,
    maxAudioUploadMb,
    sessionCookieSecret,
  };
}

/**
 * Returns safe boolean flags and missing variable names without ever
 * exposing secret values or private URLs.
 */
export function getConfigDiagnostics(): ConfigDiagnostics {
  const env = getServerEnv();

  const missingRequiredVariables: string[] = [];
  if (!env.n8nSubmitWebhookUrl) {
    missingRequiredVariables.push("N8N_SUBMIT_WEBHOOK_URL");
  }
  if (!env.n8nResultWebhookUrl) {
    missingRequiredVariables.push("N8N_RESULTS_WEBHOOK_URL");
  }
  if (!env.n8nWebhookSecret) {
    missingRequiredVariables.push("N8N_WEBHOOK_SECRET");
  }

  const missingOptionalVariables: string[] = [];
  if (!env.supabaseUrl) {
    missingOptionalVariables.push("VITE_SUPABASE_URL");
  }
  if (!env.supabaseServiceRoleKey) {
    missingOptionalVariables.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    configured: missingRequiredVariables.length === 0,
    n8nSubmitConfigured: Boolean(env.n8nSubmitWebhookUrl),
    n8nResultConfigured: Boolean(env.n8nResultWebhookUrl),
    n8nSecretConfigured: Boolean(env.n8nWebhookSecret),
    supabaseConfigured: Boolean(
      env.supabaseUrl && (env.supabaseServiceRoleKey || env.supabaseAnonKey)
    ),
    missingRequiredVariables,
    missingOptionalVariables,
    maxUploadSizeMb: env.maxAudioUploadMb,
  };
}

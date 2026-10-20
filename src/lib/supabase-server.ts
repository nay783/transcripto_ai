import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

/**
 * Creates a strictly server-side Supabase client.
 * Never exposed to client components or browser bundles.
 * Uses the service role key if configured, or anon key for scoped read verification.
 */
export function createServerSupabaseClient(): SupabaseClient | null {
  const env = getServerEnv();
  const key = env.supabaseServiceRoleKey || env.supabaseAnonKey;

  if (!env.supabaseUrl || !key) {
    return null;
  }

  return createClient(env.supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export interface SupabaseTableDiagnostic {
  configured: boolean;
  reachable: boolean;
  tableExists: boolean;
  message: string;
}

/**
 * Safely verifies connectivity to the existing `transcription_jobs` table
 * without recreating tables or exposing any row data or secrets.
 */
export async function verifySupabaseTranscriptionJobsTable(): Promise<SupabaseTableDiagnostic> {
  const client = createServerSupabaseClient();
  if (!client) {
    return {
      configured: false,
      reachable: false,
      tableExists: false,
      message:
        "Supabase credentials (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) are not configured in .env.",
    };
  }

  try {
    const { error } = await client
      .from("transcription_jobs")
      .select("*", { count: "exact", head: true })
      .limit(1);

    if (error) {
      return {
        configured: true,
        reachable: true,
        tableExists: false,
        message: `Supabase reached, but transcription_jobs check returned: ${error.code || "query_error"}`,
      };
    }

    return {
      configured: true,
      reachable: true,
      tableExists: true,
      message: "Supabase transcription_jobs table verified via server-side client.",
    };
  } catch {
    return {
      configured: true,
      reachable: false,
      tableExists: false,
      message: "Could not reach configured SUPABASE_URL from server.",
    };
  }
}

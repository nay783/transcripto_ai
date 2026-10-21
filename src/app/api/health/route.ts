import { NextRequest, NextResponse } from "next/server";
import { getConfigDiagnostics } from "@/lib/env";
import { verifySupabaseTranscriptionJobsTable } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const diagnostics = getConfigDiagnostics();
  const verifySupabase =
    request.nextUrl.searchParams.get("verify_supabase") === "true";

  if (verifySupabase) {
    const supabaseCheck = await verifySupabaseTranscriptionJobsTable();
    return NextResponse.json(
      {
        ...diagnostics,
        supabaseVerification: supabaseCheck,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  return NextResponse.json(diagnostics, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

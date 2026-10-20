import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  AudioWaveform,
  CheckCircle2,
  Cpu,
  FileSpreadsheet,
  FileText,
  Globe2,
  Layers,
  Lock,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TranscriptionWorkspace } from "@/components/workspace/transcription-workspace";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#090C0A] text-[#F5F8F4]">
      <SiteHeader activePage="home" />

      <main className="flex-1">
        {/* ================================================================
            HERO SECTION
        ================================================================ */}
        <section className="relative border-b border-[#273329] pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#273329] bg-[#111812] px-3.5 py-1.5 text-xs font-medium text-[#A6B4A7]">
                <span className="h-2 w-2 rounded-full bg-[#B8FF65]" />
                <span>AI Audio Transcription & Synthesis Studio</span>
              </div>

              <h1 className="text-5xl font-bold tracking-tight text-[#F5F8F4] sm:text-7xl lg:text-8xl leading-[0.98]">
                Every word{" "}
                <span className="text-[#B8FF65]">matters.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg sm:text-xl leading-relaxed text-[#A6B4A7]">
                Convert spoken recordings into structured transcripts, executive
                AI summaries, and actionable key insights. Engineered for
                clarity, original-language fidelity, and instant document export.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Button asChild size="lg">
                  <a href="#workspace">
                    Start transcribing
                    <ArrowDown className="h-4 w-4" />
                  </a>
                </Button>

                <Button asChild variant="secondary" size="lg">
                  <Link href="/workspace">
                    Open dedicated studio
                    <ArrowUpRight className="h-4 w-4 text-[#B8FF65]" />
                  </Link>
                </Button>
              </div>

              {/* Technical Capability Strip */}
              <div className="mt-14 grid grid-cols-2 gap-4 border-t border-[#273329] pt-8 sm:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#A6B4A7]">
                    Audio Formats
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-[#F5F8F4]">
                    MP3 • M4A • WAV
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#A6B4A7]">
                    Speech Engine
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-[#F5F8F4]">
                    AssemblyAI via n8n
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#A6B4A7]">
                    Intelligence Layer
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-[#F5F8F4]">
                    OpenAI Synthesis
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#A6B4A7]">
                    Document Exports
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-[#B8FF65]">
                    TXT • DOCX • PDF
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            LIVE TRANSCRIPTION WORKSPACE SECTION
        ================================================================ */}
        <section
          id="workspace"
          className="scroll-mt-20 border-b border-[#273329] bg-[#090C0A] py-16 sm:py-24"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#B8FF65]">
                  Live Workspace
                </p>
                <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F8F4]">
                  Upload and transcribe your recording
                </h2>
              </div>
              <p className="text-xs text-[#A6B4A7]">
                No registration required • Session-scoped job protection
              </p>
            </div>

            <TranscriptionWorkspace />
          </div>
        </section>

        {/* ================================================================
            PRODUCT DEMONSTRATION SECTION
        ================================================================ */}
        <section
          id="demonstration"
          className="scroll-mt-20 border-b border-[#273329] bg-[#111812]/50 py-20 sm:py-28"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <Badge variant="default">Product Demonstration</Badge>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F8F4]">
                From raw voice recording to structured documentation.
              </h2>
              <p className="mt-3 text-base text-[#A6B4A7] leading-relaxed">
                Every recording processed through Transcripto AI is transformed into
                three synchronized deliverables: a verbatim editable transcript, a
                concise executive summary, and itemized key insights.
              </p>
            </div>

            {/* Architectural Output Preview Grid */}
            <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Column: Pipeline Stage Visual */}
              <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-[#273329] bg-[#111812] p-6 sm:p-7">
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-[#273329] pb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#A6B4A7]">
                      Workflow Contract Preview
                    </span>
                    <span className="rounded-md border border-[#273329] bg-[#172019] px-2 py-0.5 font-mono text-[11px] text-[#B8FF65]">
                      n8n Orchestrated
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-[#273329] bg-[#172019] p-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#F5F8F4]">
                          1. Server-Authenticated Ingestion
                        </span>
                        <span className="font-mono text-[#B8FF65]">POST</span>
                      </div>
                      <p className="mt-1 text-xs text-[#A6B4A7]">
                        Next.js validates format & magic bytes, attaches the server{" "}
                        <code className="font-mono text-[#F5F8F4]">
                          X-Webhook-Secret
                        </code>
                        , and binds the returned{" "}
                        <code className="font-mono text-[#F5F8F4]">
                          access_token
                        </code>{" "}
                        to an HttpOnly session cookie.
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#273329] bg-[#172019] p-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#F5F8F4]">
                          2. Acoustic & Language Recognition
                        </span>
                        <span className="font-mono text-[#B8FF65]">
                          AssemblyAI
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#A6B4A7]">
                        Detects the spoken language automatically and preserves
                        original-language phrasing without unwanted translation.
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#273329] bg-[#172019] p-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#F5F8F4]">
                          3. Executive Synthesis & Key Points
                        </span>
                        <span className="font-mono text-[#B8FF65]">OpenAI</span>
                      </div>
                      <p className="mt-1 text-xs text-[#A6B4A7]">
                        Generates a descriptive document title, structured summary,
                        and bulleted insights ready for DOCX, PDF, or TXT export.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-[#273329] pt-4 text-xs text-[#A6B4A7]">
                  Real-time status transitions:{" "}
                  <span className="font-mono text-[#F5F8F4]">
                    queued → processing → transcribing → summarising → completed
                  </span>
                </div>
              </div>

              {/* Right Column: Deliverable Structure Preview */}
              <div className="lg:col-span-7 rounded-2xl border border-[#273329] bg-[#111812] p-6 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#273329] pb-4">
                  <div className="flex items-center gap-2">
                    <AudioWaveform className="h-4 w-4 text-[#B8FF65]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#F5F8F4]">
                      Structured Output Schema
                    </span>
                  </div>
                  <span className="text-xs text-[#A6B4A7]">
                    Interactive Editor + Multi-Format Export
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-[#273329] bg-[#090C0A] p-4">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-[#B8FF65]">
                      Generated Title & Metadata
                    </p>
                    <p className="mt-1 text-base font-bold text-[#F5F8F4]">
                      Descriptive AI-Generated Document Title
                    </p>
                    <p className="mt-1 text-xs text-[#A6B4A7]">
                      Includes source filename, detected language code, word count,
                      and inline title editing before export.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#273329] bg-[#090C0A] p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#F5F8F4]">
                        <FileText className="h-3.5 w-3.5 text-[#B8FF65]" />
                        Editable Verbatim Transcript
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-[#A6B4A7]">
                        Refine speaker names, terminology, or punctuation directly
                        in the browser. Every export reflects your latest edits.
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#273329] bg-[#090C0A] p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#F5F8F4]">
                        <Sparkles className="h-3.5 w-3.5 text-[#B8FF65]" />
                        AI Summary & Key Insights
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-[#A6B4A7]">
                        Dedicated tabs for the high-level executive summary and
                        numbered key points extracted from the recording.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#273329] bg-[#172019] px-4 py-3 text-xs">
                    <span className="text-[#F5F8F4] font-medium">
                      Browser-side Document Generation
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[#B8FF65]">
                      <span>.TXT</span>
                      <span>•</span>
                      <span>.DOCX</span>
                      <span>•</span>
                      <span>.PDF</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            FEATURES SECTION
        ================================================================ */}
        <section
          id="features"
          className="scroll-mt-20 border-b border-[#273329] bg-[#090C0A] py-20 sm:py-28"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#B8FF65]">
                Capabilities
              </p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F8F4]">
                Purpose-built for accurate transcription workflows.
              </h2>
              <p className="mt-3 text-base text-[#A6B4A7]">
                Every component is designed around security, clarity, and
                faithful preservation of spoken content.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-[#111812] transition-colors hover:border-[#B8FF65]/40">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-[#273329] bg-[#172019] text-[#B8FF65]">
                    <Globe2 className="h-5 w-5" />
                  </div>
                  <CardTitle>Automatic Language Detection</CardTitle>
                  <CardDescription>
                    Detects the spoken language automatically or accepts an explicit
                    language hint while preserving the transcript in its original
                    language.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-[#111812] transition-colors hover:border-[#B8FF65]/40">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-[#273329] bg-[#172019] text-[#B8FF65]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <CardTitle>Executive AI Summarisation</CardTitle>
                  <CardDescription>
                    Synthesises long recordings into a descriptive title, concise
                    executive overview, and structured key insights via OpenAI.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-[#111812] transition-colors hover:border-[#B8FF65]/40">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-[#273329] bg-[#172019] text-[#B8FF65]">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <CardTitle>Native TXT, DOCX & PDF Exports</CardTitle>
                  <CardDescription>
                    Generates clean plain-text files, formatted Word documents, and
                    paginated printable PDFs directly in the browser using your
                    latest edits.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-[#111812] transition-colors hover:border-[#B8FF65]/40">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-[#273329] bg-[#172019] text-[#B8FF65]">
                    <Lock className="h-5 w-5" />
                  </div>
                  <CardTitle>Zero Client-Side Secret Exposure</CardTitle>
                  <CardDescription>
                    Webhook authentication secrets and Supabase credentials remain
                    strictly on the server. Job access tokens are bound to signed
                    HttpOnly cookies.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-[#111812] transition-colors hover:border-[#B8FF65]/40">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-[#273329] bg-[#172019] text-[#B8FF65]">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <CardTitle>Authentic Processing Telemetry</CardTitle>
                  <CardDescription>
                    Tracks real backend states (queued, processing, transcribing,
                    summarising, completed) with elapsed time and exponential
                    backoff polling.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-[#111812] transition-colors hover:border-[#B8FF65]/40">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-[#273329] bg-[#172019] text-[#B8FF65]">
                    <Layers className="h-5 w-5" />
                  </div>
                  <CardTitle>Interactive Transcript Editor</CardTitle>
                  <CardDescription>
                    Review audio playback alongside your transcript, make live text
                    corrections, copy with one click, or restore the original output
                    anytime.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* ================================================================
            HOW IT WORKS SECTION
        ================================================================ */}
        <section
          id="how-it-works"
          className="scroll-mt-20 bg-[#111812]/40 py-20 sm:py-28"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#B8FF65]">
                How It Works
              </p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F8F4]">
                Three steps from audio file to finished report.
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card className="bg-[#111812]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#B8FF65]">
                      STEP 01
                    </span>
                    <UploadCloud className="h-4 w-4 text-[#A6B4A7]" />
                  </div>
                  <CardTitle className="mt-2">
                    Select & Validate Recording
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-[#A6B4A7]">
                    Drop an MP3, M4A, or WAV file into the workspace. Preview the
                    audio track in the built-in player and choose automatic or
                    explicit language detection.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#111812]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#B8FF65]">
                      STEP 02
                    </span>
                    <Cpu className="h-4 w-4 text-[#A6B4A7]" />
                  </div>
                  <CardTitle className="mt-2">
                    Automated Transcription & Synthesis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-[#A6B4A7]">
                    Our Next.js server proxy securely forwards your recording to
                    the n8n workflow, where AssemblyAI transcribes the speech and
                    OpenAI extracts key insights.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#111812]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#B8FF65]">
                      STEP 03
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-[#B8FF65]" />
                  </div>
                  <CardTitle className="mt-2">
                    Edit & Export Instantly
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-[#A6B4A7]">
                    Explore the Transcription, AI Summary, and Key Insights tabs.
                    Refine the text in the live editor and download formatted TXT,
                    DOCX, or PDF documents.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

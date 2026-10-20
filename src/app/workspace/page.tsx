import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TranscriptionWorkspace } from "@/components/workspace/transcription-workspace";

export const metadata: Metadata = {
  title: "Workspace — Transcripto AI",
  description:
    "Upload MP3, M4A, or WAV audio files for AI transcription, executive summaries, and document export.",
};

export default function WorkspacePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#090C0A] text-[#F5F8F4]">
      <SiteHeader activePage="workspace" />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#B8FF65]">
              Dedicated Studio
            </p>
            <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F8F4]">
              Audio Transcription Workspace
            </h1>
          </div>

          <TranscriptionWorkspace />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

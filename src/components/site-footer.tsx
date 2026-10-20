import Link from "next/link";
import { AudioWaveform, Lock, FileText, Cpu } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#273329] bg-[#090C0A] text-[#A6B4A7]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#273329] bg-[#111812] text-[#B8FF65]">
                <AudioWaveform className="h-4 w-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-[#F5F8F4]">
                Transcripto<span className="text-[#B8FF65]">.AI</span>
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[#A6B4A7]">
              Minimalist, studio-grade audio transcription and executive synthesis.
              Built for teams that require verbatim accuracy and structured exports.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#A6B4A7]">
              <Lock className="h-3.5 w-3.5 text-[#B8FF65]" />
              <span>
                Data retention notice: Session-scoped access tokens expire automatically after 24 hours.
              </span>
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F5F8F4]">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#workspace"
                  className="transition-colors hover:text-[#B8FF65]"
                >
                  Transcription Workspace
                </a>
              </li>
              <li>
                <Link
                  href="/workspace"
                  className="transition-colors hover:text-[#B8FF65]"
                >
                  Dedicated Studio View
                </Link>
              </li>
              <li>
                <a
                  href="#features"
                  className="transition-colors hover:text-[#B8FF65]"
                >
                  Capabilities & Formats
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="transition-colors hover:text-[#B8FF65]"
                >
                  Workflow Architecture
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F5F8F4]">
              Architecture & Security
            </h4>
            <div className="space-y-2.5 rounded-xl border border-[#273329] bg-[#111812] p-4 text-xs leading-relaxed">
              <div className="flex items-start gap-2.5">
                <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-[#B8FF65]" />
                <span>
                  Orchestrated via server-side Next.js routes and n8n webhooks with AssemblyAI speech recognition and OpenAI synthesis.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#B8FF65]" />
                <span>
                  Client-side document generation for TXT, DOCX, and PDF preserves your latest transcript edits locally.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#273329] pt-8 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} Transcripto AI. Every word matters.</p>
          <p className="text-[#A6B4A7]">
            Supported inputs: MP3, M4A, WAV • Exports: TXT, DOCX, PDF
          </p>
        </div>
      </div>
    </footer>
  );
}

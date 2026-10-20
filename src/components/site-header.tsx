import Link from "next/link";
import { AudioWaveform, ArrowUpRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SiteHeaderProps {
  activePage?: "home" | "workspace";
}

export function SiteHeader({ activePage = "home" }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#273329] bg-[#090C0A]/90 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="group flex items-center gap-3 focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#273329] bg-[#111812] text-[#B8FF65] transition-colors group-hover:border-[#B8FF65]/50">
              <AudioWaveform className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-[#F5F8F4]">
                Transcripto<span className="text-[#B8FF65]">.AI</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#A6B4A7]">
                Voice Intelligence
              </span>
            </div>
          </Link>

          {activePage === "home" && (
            <nav className="hidden md:flex items-center gap-7 text-sm text-[#A6B4A7]">
              <a
                href="#workspace"
                className="transition-colors hover:text-[#F5F8F4]"
              >
                Workspace
              </a>
              <a
                href="#demonstration"
                className="transition-colors hover:text-[#F5F8F4]"
              >
                Product Overview
              </a>
              <a
                href="#features"
                className="transition-colors hover:text-[#F5F8F4]"
              >
                Capabilities
              </a>
              <a
                href="#how-it-works"
                className="transition-colors hover:text-[#F5F8F4]"
              >
                How It Works
              </a>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#273329] bg-[#111812] px-3 py-1 text-xs text-[#A6B4A7]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#B8FF65]" />
            <span>Server-Isolated Pipeline</span>
          </div>

          {activePage === "home" ? (
            <Button asChild size="sm">
              <a href="#workspace">
                Start transcribing
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : (
            <Button asChild variant="secondary" size="sm">
              <Link href="/">Back to overview</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

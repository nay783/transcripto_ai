"use client";

import * as React from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { formatDurationSeconds } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  filename: string;
  compact?: boolean;
}

const PLAYBACK_RATES = [1, 1.25, 1.5, 2] as const;

export function AudioPlayer({
  src,
  filename,
  compact = false,
}: AudioPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [rateIndex, setRateIndex] = React.useState(0);

  React.useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = Number(e.target.value);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const cycleRate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextIdx = (rateIndex + 1) % PLAYBACK_RATES.length;
    audio.playbackRate = PLAYBACK_RATES[nextIdx];
    setRateIndex(nextIdx);
  };

  const progressPercent =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      className={`rounded-xl border border-[#273329] bg-[#172019] ${
        compact ? "p-3.5" : "p-4"
      }`}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d)) setDuration(d);
        }}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#B8FF65] text-[#090C0A] transition-transform hover:bg-[#c6ff82] active:scale-95 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            title="Restart track"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#273329] bg-[#111812] text-[#A6B4A7] transition-colors hover:text-[#F5F8F4] cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-[#F5F8F4] max-w-[200px] sm:max-w-[260px]">
              {filename}
            </p>
            <p className="text-[11px] font-mono text-[#A6B4A7]">
              {formatDurationSeconds(currentTime)} /{" "}
              {duration > 0 ? formatDurationSeconds(duration) : "--:--"}
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-3 sm:max-w-md">
          <div className="relative flex flex-1 items-center">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#090C0A] border border-[#273329]">
              <div
                className="h-full bg-[#B8FF65] transition-all duration-100"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration > 0 ? duration : 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              aria-label="Seek audio position"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>

          <button
            type="button"
            onClick={cycleRate}
            title="Change playback speed"
            className="rounded-md border border-[#273329] bg-[#111812] px-2 py-1 text-[11px] font-mono font-medium text-[#F5F8F4] hover:border-[#B8FF65]/50 cursor-pointer"
          >
            {PLAYBACK_RATES[rateIndex]}x
          </button>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#273329] bg-[#111812] text-[#A6B4A7] hover:text-[#F5F8F4] cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-[#FCA5A5]" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

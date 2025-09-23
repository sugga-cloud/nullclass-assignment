"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useUser } from "@/lib/AuthContext";
import { usePremiumPayment } from "@/lib/PremiumPaymentContext";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const { user } = useUser();
  const { open: openPremium } = usePremiumPayment();
  const videoRef = useRef<HTMLVideoElement>(null);
  const videos = "/video/vdo.mp4";
  // Tap handling refs
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<number | null>(null);
  const lastRegionRef = useRef<string>("middle");

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) window.clearTimeout(tapTimeoutRef.current);
    };
  }, []);

  const handleTapAction = (count: number, region: string) => {
    const vid = videoRef.current;
    if (!vid) return;
    // normalize
    region = region || "middle";
    if (count === 1 && region === "middle") {
      // single tap middle -> toggle play/pause
      if (vid.paused) {
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
      return;
    }
    if (count === 2) {
      if (region === "right") {
        vid.currentTime = Math.min(vid.duration || Infinity, vid.currentTime + 10);
      } else if (region === "left") {
        vid.currentTime = Math.max(0, vid.currentTime - 10);
      }
      return;
    }
    if (count === 3) {
      if (region === "middle") {
        // next video - emit custom event so parent can handle change
        window.dispatchEvent(new CustomEvent("player:next", { detail: { id: video._id } }));
      } else if (region === "right") {
        // close website
        try {
          window.close();
          // fallback: navigate to home
          window.location.href = "/";
        } catch (e) {
          window.location.href = "/";
        }
      } else if (region === "left") {
        // show comments - scroll to element with id "comments" if exists
        const commentsEl = document.getElementById("comments");
        if (commentsEl) commentsEl.scrollIntoView({ behavior: "smooth" });
        // Dispatch event so comments component can react immediately
        window.dispatchEvent(new CustomEvent("player:show-comments", { detail: { videoId: video._id } }));
      }
      return;
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // shared logic: compute region based on container rect
    const container = (e.currentTarget as Element).getBoundingClientRect();
    const x = (e as React.PointerEvent).clientX - container.left;
    const xPct = x / container.width;
    const region = xPct < 0.33 ? "left" : xPct > 0.66 ? "right" : "middle";
    lastRegionRef.current = region;
    tapCountRef.current += 1;
    if (tapTimeoutRef.current) window.clearTimeout(tapTimeoutRef.current);
    // wait 350ms to decide number of taps
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    tapTimeoutRef.current = window.setTimeout(() => {
      handleTapAction(tapCountRef.current, lastRegionRef.current);
      tapCountRef.current = 0;
      lastRegionRef.current = "middle";
      tapTimeoutRef.current = null;
    }, 350);
  };

  // (removed duplicate onPointerDownCapture declaration)

  const srcUrl = useMemo(() => {
    const raw = video?.filepath || "";
    if (!raw) return "";
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "https://nullclass-assignment-1serser.onrender.com/";
  // replace backslashes with forward slashes (Windows paths) and strip leading slashes
  const cleaned = raw.replace(/\\/g, "/").replace(/^\/+/, "");
    const encoded = cleaned.split("/").map((seg) => encodeURIComponent(seg)).join("/");
    return `${backend}/${encoded}`;
  }, [video?.filepath]);

  const [videoError, setVideoError] = useState<string | null>(null);

  // ensure video element picks up new src and try to load it
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (!srcUrl) return;
    try {
      // set crossOrigin explicitly
      vid.crossOrigin = "anonymous";
      vid.src = srcUrl;
      vid.load();
    } catch (e) {
      console.error("Error setting video src:", e);
    }
  }, [srcUrl]);

  const handleVideoError = async (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error("Video element error", e);
    setVideoError("Failed to load video in <video> element. See console for details.");
    // Try a HEAD request to inspect headers (CORS / Accept-Ranges / Content-Type)
    if (!srcUrl) return;
    try {
      const resp = await fetch(srcUrl, { method: "HEAD", mode: "cors" });
      console.log("HEAD response for video:", resp.status, resp.headers);
      const headers: Record<string, string> = {};
      resp.headers.forEach((v, k) => (headers[k] = v));
      console.log(headers);
    } catch (err) {
      console.error("HEAD request failed:", err);
    }
  };

  // UI state for custom controls
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Plan time limits in minutes
  const planLimits: Record<string, number> = {
    free: 5,
    bronze: 7,
    silver: 10,
    gold: Infinity,
  };
  const userPlan = user?.plan || "free";
  const maxMinutes = planLimits[userPlan] ?? 5;

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onTime = () => {
      setCurrentTime(vid.currentTime);
      if (maxMinutes !== Infinity && vid.currentTime >= maxMinutes * 60) {
        vid.pause();
        setShowLimitModal(true);
      }
    };
    const onDur = () => setDuration(vid.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    vid.addEventListener("timeupdate", onTime);
    vid.addEventListener("loadedmetadata", onDur);
    vid.addEventListener("play", onPlay);
    vid.addEventListener("pause", onPause);
    return () => {
      vid.removeEventListener("timeupdate", onTime);
      vid.removeEventListener("loadedmetadata", onDur);
      vid.removeEventListener("play", onPlay);
      vid.removeEventListener("pause", onPause);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxMinutes]);

  const togglePlay = async () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) await vid.play().catch(() => {});
    else vid.pause();
  };

  const seekTo = (time: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = Math.max(0, Math.min((vid.duration || Infinity), time));
  };

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setMuted(vid.muted);
  };

  const enterFullscreen = () => {
    const el = videoRef.current?.parentElement;
    if (!el) return;
    // @ts-ignore
    if (el.requestFullscreen) el.requestFullscreen();
  };

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  // Gesture: ignore taps on controls
  const onPointerDownCapture = (e: React.PointerEvent) => {
    const target = e.target as Element | null;
    if (target && target.closest && target.closest('[data-gesture-ignore]')) {
      return;
    }
    onPointerDown(e);
  };

  return (
    <div className="relative aspect-video bg-gradient-to-br from-black to-gray-900 rounded-lg overflow-hidden shadow-lg">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        controls={false}
        preload="metadata"
        poster={`/placeholder.svg?height=480&width=854`}
      >
        <source src={srcUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Plan limit modal */}
      {showLimitModal && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 text-white">
          <div className="bg-white text-black rounded-lg p-6 shadow-lg max-w-xs w-full flex flex-col items-center">
            <h2 className="text-lg font-bold mb-2">Watch Time Limit Reached</h2>
            <p className="mb-4 text-center">
              {userPlan === "gold"
                ? "You have unlimited watch time."
                : `You have reached your ${maxMinutes} minute limit for the ${userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} plan.`}
            </p>
            {userPlan !== "gold" && (
              <button
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded mb-2"
                onClick={() => {
                  setShowLimitModal(false);
                  openPremium(user);
                }}
              >
                Upgrade Plan
              </button>
            )}
            <button
              className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded"
              onClick={() => setShowLimitModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Big center play button */}
      {!isPlaying && (
        <button
          aria-label="Play"
          onClick={togglePlay}
          data-gesture-ignore
          className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 bg-white/90 text-black rounded-full p-6 shadow-lg hover:scale-105 transition"
        >
          ▶
        </button>
      )}

      {/* Controls bar */}
      <div
        className={`absolute left-0 right-0 bottom-0 z-30 p-3 bg-gradient-to-t from-black/70 to-transparent transition-opacity ${showControls ? "opacity-100" : "opacity-0"}`}
        onMouseMove={() => setShowControls(true)}
      >
        <div className="flex items-center gap-3">
          <button data-gesture-ignore onClick={togglePlay} className="text-white p-2 bg-white/10 rounded">
            {isPlaying ? "Pause" : "Play"}
          </button>
          <div className="flex-1">
            <div className="w-full h-2 bg-white/20 rounded overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-white/80 mt-1">
              <span>{new Date(currentTime * 1000).toISOString().substr(11, 8)}</span>
              <span>{new Date(duration * 1000).toISOString().substr(11, 8)}</span>
            </div>
          </div>
          <button data-gesture-ignore onClick={toggleMute} className="text-white p-2 bg-white/10 rounded">{muted ? "Unmute" : "Mute"}</button>
          <button data-gesture-ignore onClick={enterFullscreen} className="text-white p-2 bg-white/10 rounded">Full</button>
        </div>
      </div>

      {/* overlay captures pointer events for gesture controls */}
      <div
        onPointerDownCapture={onPointerDownCapture}
        className="absolute inset-0 z-10"
        style={{ touchAction: "manipulation" }}
      />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { ExternalLink, MapPin, Navigation, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/asset";

/**
 * Google Earth fly-in to the MIX Center, played from a screen recording.
 * The raw recording includes Google Earth's own panels; the served files are
 * cropped to the map window at encode time (CROP can trim further). When
 * the clip ends, a pin drops where the building sits in the last frame and a
 * place card opens with links to Google Maps. The clip loops; the pin and
 * card hide again while the globe view replays.
 */

const SOURCES = {
  hd: asset("/video/mix-center-flyin-crop.mp4"), // 1110x790, cropped at encode time
  sd: asset("/video/mix-center-flyin-crop-720.mp4"), // 720x512, for small screens
};
const SOURCE_ASPECT = 1110 / 790;
/** Visible window of the source frame (fractions of width/height). The
 * current files are already cropped, so the whole frame shows. */
const CROP = { left: 0, right: 1, top: 0, bottom: 1 };
/** Where the building sits inside the cropped window on the last frame. */
const TARGET = { x: 0.47, y: 0.453 };
/** Seconds of static globe to skip at the start of the recording. */
const START_AT = 0;
/** The camera reaches the building here; it then orbits it until the end.
 * (The files are trimmed to start at the recording's 5th second.) */
const LAND_AT = 8;

const cropW = CROP.right - CROP.left;
const cropH = CROP.bottom - CROP.top;
const videoStyle: React.CSSProperties = {
  width: `${(100 / cropW).toFixed(3)}%`,
  left: `${(-(CROP.left / cropW) * 100).toFixed(3)}%`,
  top: `${(-(CROP.top / cropH) * 100).toFixed(3)}%`,
};
const containerAspect = `${(cropW * SOURCE_ASPECT).toFixed(4)} / ${cropH.toFixed(4)}`;

export type Place = {
  name: string;
  subtitle: string;
  address: string;
  lat: number;
  lng: number;
  mapsUrl: string;
  directionsUrl: string;
};

export function EarthZoom({ place, className }: { place: Place; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nearby = useInView(ref, { once: true, margin: "800px 0px" });
  const onScreen = useInView(ref, { once: true, amount: 0.6 });
  const reduced = useReducedMotion();

  const [landed, setLanded] = useState(false);
  const [pinHover, setPinHover] = useState(false);

  // Pick a source once the section is near, and start buffering early.
  useEffect(() => {
    const video = videoRef.current;
    if (!nearby || !video || video.getAttribute("src")) return;
    const small = window.matchMedia("(max-width: 640px)").matches;
    video.src = small ? SOURCES.sd : SOURCES.hd;
    video.load();
  }, [nearby]);

  // Fly when the section is in view; with reduced motion, jump to the building.
  useEffect(() => {
    const video = videoRef.current;
    if (!onScreen || !video) return;
    const start = () => {
      if (reduced) {
        video.currentTime = LAND_AT + 4;
        setLanded(true);
        return;
      }
      video.currentTime = START_AT;
      void video.play().catch(() => setLanded(true));
    };
    if (video.readyState >= 1) start();
    else video.addEventListener("loadedmetadata", start, { once: true });
    return () => video.removeEventListener("loadedmetadata", start);
  }, [onScreen, reduced]);

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    setLanded(false);
    video.currentTime = START_AT;
    void video.play().catch(() => setLanded(true));
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-border bg-neutral-950"
        style={{ aspectRatio: containerAspect }}
      >
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          onTimeUpdate={(e) => {
            // The clip loops: show the pin only while the camera is on the building.
            const atBuilding = e.currentTarget.currentTime >= LAND_AT;
            if (atBuilding !== landed) setLanded(atBuilding);
          }}
          onEnded={(e) => {
            // Only fires if a browser ignores `loop`; restart by hand.
            const video = e.currentTarget;
            video.currentTime = START_AT;
            void video.play().catch(() => {});
          }}
          className="absolute max-w-none"
          style={videoStyle}
        />
        {/* vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.4))]" />

        {/* HUD */}
        <div className="pointer-events-none absolute left-3 top-3 hidden items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[11px] tabular-nums text-white/85 backdrop-blur sm:flex">
          <span className="size-1.5 rounded-full bg-brand" />
          {Math.abs(place.lat).toFixed(4)}° {place.lat >= 0 ? "N" : "S"},{" "}
          {Math.abs(place.lng).toFixed(4)}° {place.lng >= 0 ? "E" : "W"}
        </div>

        {/* pin */}
        <AnimatePresence>
          {landed && (
            <motion.div
              key="pin"
              className="absolute z-10"
              style={{ left: `${TARGET.x * 100}%`, top: `${TARGET.y * 100}%` }}
              initial={{ opacity: 0, y: -60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            >
              <button
                type="button"
                aria-label={`${place.name} on the map`}
                onPointerEnter={() => setPinHover(true)}
                onPointerLeave={() => setPinHover(false)}
                className="group relative -translate-x-1/2 -translate-y-full"
              >
                <span className="absolute left-1/2 top-full block size-6 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-brand/30" />
                <MapPin
                  className={cn(
                    "relative size-10 fill-brand text-white drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)] transition-transform",
                    pinHover && "scale-110"
                  )}
                  strokeWidth={1.5}
                />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* controls + attribution */}
        <button
          type="button"
          onClick={replay}
          className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-medium text-white/85 backdrop-blur transition-colors hover:bg-black/75"
        >
          <RotateCcw className="size-3" />
          Replay
        </button>
        <p className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] text-white/70 backdrop-blur">
          Flyover: Google Earth
        </p>
      </div>

      {/* place card: over the video on wider screens, under it on phones */}
      <AnimatePresence>
        {landed && (
          <motion.div
            key="card"
            className="mt-3 w-full sm:absolute sm:mt-0 sm:w-64 sm:-translate-x-1/2"
            style={{ left: `${TARGET.x * 100}%`, top: `calc(${TARGET.y * 100}% - 58px)` }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: pinHover ? 1.03 : 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            transition={{ delay: 0.35, duration: 0.35 }}
          >
            <div className="relative rounded-xl border border-border bg-card p-3 text-left shadow-xl sm:-translate-y-full">
              <p className="text-sm font-semibold leading-tight">{place.name}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{place.subtitle}</p>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                <MapPin className="mt-0.5 size-3 shrink-0 text-brand" />
                {place.address}
              </p>
              <div className="mt-3 flex gap-1.5">
                <a
                  href={place.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-primary px-2.5 py-1.5 text-[11px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <ExternalLink className="size-3" />
                  Google Maps
                </a>
                <a
                  href={place.directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-muted"
                >
                  <Navigation className="size-3 text-brand" />
                  Directions
                </a>
              </div>
              <span className="absolute left-1/2 top-full hidden size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-border bg-card sm:block" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

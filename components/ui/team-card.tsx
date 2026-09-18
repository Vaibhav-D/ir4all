"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type TeamLink = { label: string; href: string; icon: React.ReactNode };

/* Phosphor glyphs, as used by the source component (viewBox 0 0 256 256). */
function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 256 256" className="size-5" fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const PLUS =
  "M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z";
export const LinkedInGlyph = () => (
  <Glyph d="M216,24H40A16,16,0,0,0,24,40V216a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V40A16,16,0,0,0,216,24ZM96,176a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0ZM88,96a12,12,0,1,1,12-12A12,12,0,0,1,88,96Zm96,80a8,8,0,0,1-16,0V140a20,20,0,0,0-40,0v36a8,8,0,0,1-16,0V112a8,8,0,0,1,15.79-1.78A36,36,0,0,1,184,140Z" />
);
export const FacebookGlyph = () => (
  <Glyph d="M232,128a104.16,104.16,0,0,1-91.55,103.26,4,4,0,0,1-4.45-4V152h24a8,8,0,0,0,8-8.53,8.17,8.17,0,0,0-8.25-7.47H136V112a16,16,0,0,1,16-16h16a8,8,0,0,0,8-8.53A8.17,8.17,0,0,0,167.73,80H152a32,32,0,0,0-32,32v24H96a8,8,0,0,0-8,8.53A8.17,8.17,0,0,0,96.27,152H120v75.28a4,4,0,0,1-4.44,4A104.15,104.15,0,0,1,24.07,124.09c2-54,45.74-97.9,99.78-100A104.12,104.12,0,0,1,232,128Z" />
);
export const TwitterGlyph = () => (
  <Glyph d="M245.66,77.66l-29.9,29.9C209.72,177.58,150.67,232,80,232c-14.52,0-26.49-2.3-35.58-6.84-7.33-3.67-10.33-7.6-11.08-8.72a8,8,0,0,1,3.85-11.93c.26-.1,24.24-9.31,39.47-26.84a110.93,110.93,0,0,1-21.88-24.2c-12.4-18.41-26.28-50.39-22-98.18a8,8,0,0,1,13.65-4.92c.35.35,33.28,33.1,73.54,43.72V88a47.87,47.87,0,0,1,14.36-34.3A46.87,46.87,0,0,1,168.1,40a48.66,48.66,0,0,1,41.47,24H240a8,8,0,0,1,5.66,13.66Z" />
);

/** Accent from the source component (rgb 219 139 0). */
const ACCENT = "#db8b00";
const ICON_BTN =
  "grid size-10 place-items-center rounded-[13px] bg-white/80 text-[#263016] shadow-md backdrop-blur-[5px] transition-colors hover:bg-white";

/**
 * Team member card, after the Framer component the design came from:
 * near-black tile, initials and an italic specialty over a cut-out portrait,
 * and a "+" that opens into "×" plus the person's links while an amber disc
 * rises behind the portrait and the portrait switches from grayscale to colour.
 * Hovering nudges the portrait down and the specialty up; opening resets both.
 * Clicking anywhere on the tile toggles it, so a click on the photo closes it.
 *
 * `photoStyle` "cutout" expects a transparent PNG anchored to the bottom;
 * "full" covers the tile with the photo instead.
 */
export function TeamCard({
  initials,
  tag,
  name,
  role,
  photo,
  photoStyle = "cutout",
  links,
}: {
  initials: string;
  tag: string;
  name: string;
  role: string;
  photo?: string;
  photoStyle?: "cutout" | "full";
  links: TeamLink[];
}) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const nudged = hover && !open;
  const slots = links.slice(0, 3);
  // Open: a centred row of 40px buttons, 10px apart.
  const step = 50;
  const first = -((slots.length * step) / 2);
  const spring = { type: "spring", stiffness: 300, damping: 22 } as const;
  const nudge = { type: "spring", stiffness: 260, damping: 26 } as const;

  return (
    <div className="group flex flex-col items-center">
      {/* The whole tile toggles the card; the "+" and the links stop the click
          from reaching it so they keep their own behaviour. */}
      <div
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        onClick={() => setOpen((o) => !o)}
        className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-[30px] bg-[#0a0a0a] text-white dark:bg-[#171717] dark:ring-1 dark:ring-white/10"
      >
        {/* Disc that rises on open. */}
        <motion.div
          aria-hidden
          className={cn(
            "absolute left-1/2 top-[24%] aspect-square w-[190%] -translate-x-1/2 rounded-full",
            photoStyle === "full" && "z-[2] mix-blend-multiply"
          )}
          style={{ backgroundColor: ACCENT }}
          initial={false}
          animate={{ y: open ? "0%" : "85%" }}
          transition={{ type: "spring", stiffness: 170, damping: 24 }}
        />
        {/* Bottom fade, as in the source. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[30%] bg-gradient-to-b from-transparent to-black/70"
        />

        {/* Portrait. */}
        {photo ? (
          <motion.div
            className={cn(
              "absolute z-[1]",
              photoStyle === "cutout" ? "inset-x-0 bottom-0 h-[86%]" : "inset-0"
            )}
            initial={false}
            animate={{ y: nudged ? 14 : 0 }}
            transition={nudge}
          >
            <Image
              src={photo}
              alt={name}
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
              className={cn(
                "contrast-[1.06] drop-shadow-[0_31px_27px_rgba(0,0,0,0.66)] transition-[filter] duration-500",
                !open && "grayscale",
                photoStyle === "cutout" ? "object-contain object-bottom" : "object-cover object-top"
              )}
            />
            {photoStyle === "full" && (
              <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-black via-black/70 to-transparent" />
            )}
          </motion.div>
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-7xl font-black text-white/10">{initials}</span>
          </div>
        )}

        <span className="absolute left-5 top-3 z-[3] text-5xl font-light leading-none tracking-tight [text-shadow:16px_8px_27px_rgba(0,0,0,0.25)]">
          {initials}
        </span>
        <motion.span
          className="absolute right-5 top-5 z-[3] text-right text-xl font-medium italic capitalize leading-[1.3] tracking-[-0.02em] [text-shadow:16px_8px_27px_rgba(0,0,0,0.46)]"
          initial={false}
          animate={{ y: nudged ? -8 : 0 }}
          transition={nudge}
        >
          {tag}
        </motion.span>

        {/* "+" and the links that spin out of it. */}
        <div className="absolute bottom-5 left-1/2 z-[4] h-10 w-0">
          {slots.map((link, i) => (
            <motion.a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={link.label}
              title={link.label}
              tabIndex={open ? 0 : -1}
              onClick={(e) => e.stopPropagation()}
              className={cn("absolute left-0 top-0 -translate-x-1/2", ICON_BTN, !open && "pointer-events-none")}
              initial={false}
              animate={{
                x: open ? first + (i + 1) * step : 0,
                rotate: open ? 0 : -180,
                opacity: open ? 1 : 0,
                scale: open ? 1 : 0.4,
              }}
              transition={{ ...spring, delay: open ? 0.06 * i : 0 }}
            >
              {link.icon}
            </motion.a>
          ))}
          <motion.button
            type="button"
            aria-expanded={open}
            aria-label={open ? `Hide ${name}'s links` : `Show ${name}'s links`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
            className={cn("absolute left-0 top-0 -translate-x-1/2", ICON_BTN)}
            initial={false}
            animate={{ x: open ? first : 0, rotate: open ? -45 : 0 }}
            transition={spring}
          >
            <Glyph d={PLUS} />
          </motion.button>
        </div>
      </div>

      <h3
        className="mt-4 text-lg font-semibold tracking-tight transition-colors"
        style={{ color: hover ? ACCENT : undefined }}
      >
        {name}
      </h3>
      <p
        className="text-sm text-muted-foreground transition-colors"
        style={{ color: hover ? ACCENT : undefined }}
      >
        {role}
      </p>
    </div>
  );
}

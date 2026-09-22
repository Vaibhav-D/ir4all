"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Stage = {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  chips: string[];
  cta: { label: string; href: string };
  image: { src: string; alt: string };
};

const CYCLE_MS = 6000;

/**
 * A row of photo panels, one per stage. The active panel widens and shows its
 * details over a gradient; the others collapse into slim strips carrying just
 * the number and a vertical title. Hover or click chooses a stage. Left alone,
 * it steps through the stages on its own. Stacks vertically on phones.
 */
export function ExpandingStages({ stages, className }: { stages: Stage[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [active, setActive] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const [cycle, setCycle] = useState(0);
  const reduced = useReducedMotion();
  // Only steps on its own while on screen and untouched.
  const autoplay = inView && !engaged && !reduced;

  // Auto-advance until the visitor engages.
  useEffect(() => {
    if (!autoplay) return;
    const id = setTimeout(() => {
      setActive((a) => (a + 1) % stages.length);
      setCycle((c) => c + 1);
    }, CYCLE_MS);
    return () => clearTimeout(id);
  }, [autoplay, active, cycle, stages.length]);

  const choose = (i: number) => {
    setEngaged(true);
    setActive(i);
  };

  return (
    <div ref={ref} className={className}>
      <div
        className="flex h-[38rem] flex-col gap-3 md:h-[34rem] md:flex-row"
        onPointerLeave={() => setEngaged(false)}
      >
        {stages.map((stage, i) => {
          const open = i === active;
          return (
            <article
              key={stage.number}
              onPointerEnter={() => choose(i)}
              onClick={() => choose(i)}
              aria-current={open ? "step" : undefined}
              className={cn(
                "group relative min-h-0 min-w-0 basis-0 cursor-pointer overflow-hidden rounded-[28px] bg-neutral-950 text-white",
                "transition-[flex-grow] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                open ? "grow-[4.6] md:grow-[3.2]" : "grow"
              )}
            >
              <Image
                src={stage.image.src}
                alt={stage.image.alt}
                fill
                sizes="(min-width: 768px) 60vw, 100vw"
                priority={i === 0}
                className={cn(
                  "object-cover transition-[filter,transform] duration-700",
                  open ? "scale-100" : "scale-105 grayscale group-hover:grayscale-0"
                )}
              />
              {/* Fade for the text. */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 transition-opacity duration-700",
                  open ? "opacity-100" : "opacity-80"
                )}
              />

              {/* Number, always. */}
              <span className="absolute left-5 top-5 rounded-full border border-white/25 bg-black/40 px-2.5 py-1 font-[family-name:var(--font-orbitron)] text-[11px] font-semibold tracking-[0.2em] backdrop-blur">
                {stage.number}
              </span>

              {/* Collapsed: a vertical title along the bottom-left. */}
              <AnimatePresence initial={false}>
                {!open && (
                  <motion.div
                    key="closed"
                    className="absolute bottom-6 left-5 origin-bottom-left md:left-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="text-lg font-semibold tracking-tight md:-rotate-90 md:translate-y-[-100%] md:whitespace-nowrap md:origin-bottom-left">
                      {stage.title}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Open: the details. */}
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key="open"
                    className="absolute inset-x-0 bottom-0 p-5 md:p-8"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                  >
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-brand md:text-[11px]">
                      {stage.eyebrow}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold tracking-tight md:mt-2 md:text-3xl">
                      {stage.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-3 max-w-xl text-pretty text-[13px] leading-snug text-white/80 md:mt-2 md:line-clamp-none md:text-base md:leading-normal">
                      {stage.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 md:mt-4 md:gap-2">
                      {stage.chips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium backdrop-blur"
                        >
                          {chip}
                        </span>
                      ))}
                      <a
                        href={stage.cta.href}
                        onClick={(e) => e.stopPropagation()}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-black transition-colors hover:bg-brand hover:text-white"
                      >
                        {stage.cta.label}
                        <ArrowRight className="size-3.5" />
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </article>
          );
        })}
      </div>

      {/* Story-style progress: which stage is showing, and how long until the next. */}
      <div className="mt-4 flex gap-2" aria-hidden>
        {stages.map((stage, i) => (
          <button
            key={stage.number}
            type="button"
            tabIndex={-1}
            onClick={() => choose(i)}
            className="h-1 flex-1 overflow-hidden rounded-full bg-border"
          >
            <span
              key={`${i}-${cycle}-${autoplay}`}
              className={cn(
                "block h-full rounded-full bg-brand",
                i < active && "w-full",
                i > active && "w-0",
                i === active && (autoplay ? "stage-progress" : "w-full")
              )}
              style={i === active && autoplay ? { animationDuration: `${CYCLE_MS}ms` } : undefined}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

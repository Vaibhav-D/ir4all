"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, ChevronDown, Hand, MapPin, Music, PackageCheck, Sliders, X } from "lucide-react";
import {
  BOT_HOME,
  BOT_JOINTS,
  SplineStage,
  type BotControl,
} from "@/components/demos/1-spline-demo";
import {
  ARM_ACTIONS,
  ARM_HOME,
  ARM_JOINTS,
  RobotArmHero,
  type ArmActionId,
  type ArmControl,
} from "@/components/demos/1b-arm-demo";
import { useInputMode } from "@/components/demos/use-input-mode";
import { useMediaQuery } from "@/components/demos/use-media-query";
import { Reveal } from "@/components/ui/reveal";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";

/**
 * Hero layout.
 *
 * Desktop (lg and up): a split. The copy sits in the left column, the robot
 * stage fills the right one, with the switcher along the stage's bottom edge
 * as before.
 *
 * Below that the two become two screens, one thing at a time: the copy fills
 * the first viewport (with a cue at its foot leading down), and the stage
 * fills the second. On that screen the switcher sits just under the floating
 * navbar so it reads as "pick your robot" and stays clear of the browser's
 * bottom bar, and the robot rises from the bottom of the screen. On touch
 * screens the manual toolbar takes over that same slot.
 */

const VARIANTS = [
  { id: "arm", label: "Robot arm" },
  { id: "humanoid", label: "Humanoid" },
] as const;

type Variant = (typeof VARIANTS)[number]["id"];

type Icon = React.ComponentType<{ className?: string }>;

const ARM_ICONS: Record<ArmActionId, Icon> = {
  wave: Hand,
  dance: Music,
  pick: PackageCheck,
};

const PARTNERS = [
  { name: "Arizona State University", src: asset("/partners/asu.png"), width: 191, height: 80 },
  { name: "APS Foundation", src: asset("/partners/aps.png"), width: 235, height: 80 },
  { name: "Tempe Union High School District", src: asset("/partners/tuhsd.png"), width: 300, height: 66 },
];

/** Canvas margins the arm keeps clear of the hero's overlays, per layout. */
const ARM_PAD = {
  /** Stacked: the navbar, then the switcher and hint, along the top of the stage. */
  stacked: { top: 184, bottom: 24 },
  /** Split: the floating navbar above, the switcher below. */
  split: { top: 100, bottom: 92 },
  /** Split on touch (landscape tablets): toolbar and hint above the switcher. */
  splitTouch: { top: 84, bottom: 124 },
};

/** What the control panel needs from either robot. */
type PanelSpec = {
  actions: Record<string, { label: string }>;
  icons: Record<string, Icon>;
  /** `index` is the joint's slot in the pose array. */
  joints: { name: string; label: string; limit: readonly number[]; index: number }[];
  home: number[];
  values: number[];
  setValues: React.Dispatch<React.SetStateAction<number[]>>;
};

const toDeg = (rad: number) => Math.round((rad * 180) / Math.PI);

export function Hero() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<Variant>("arm");
  const [manual, setManual] = useState(false);
  const [armJoints, setArmJoints] = useState<number[]>(ARM_HOME);
  const [botJoints, setBotJoints] = useState<number[]>(BOT_HOME);
  const [botReady, setBotReady] = useState(false);
  // Scripted actions exist only for the arm.
  const [action, setAction] = useState<{ id: ArmActionId; key: number } | null>(null);

  // Phones and tablets have no cursor: the robots idle on their own and react
  // to taps. Tablets get a sheet of controls; phones get none.
  const inputMode = useInputMode();
  const touch = inputMode !== "pointer";
  const input = touch ? "touch" : "pointer";
  // Split layout (see the note at the top). Only the arm's framing reads this;
  // the markup itself is laid out by CSS at the same breakpoint.
  const split = useMediaQuery("(min-width: 1024px)");
  const armPad = split ? (touch ? ARM_PAD.splitTouch : ARM_PAD.split) : ARM_PAD.stacked;

  const mode = action ? "action" : manual ? "manual" : "cursor";
  const armControl: ArmControl = {
    mode,
    joints: armJoints,
    action,
    input,
    dragGrip: inputMode === "tablet",
  };
  const botControl: BotControl = { mode: manual ? "manual" : "cursor", joints: botJoints, input };

  const spec: PanelSpec =
    variant === "arm"
      ? {
          actions: ARM_ACTIONS,
          icons: ARM_ICONS,
          joints: ARM_JOINTS.map((j, index) => ({ ...j, index })),
          home: ARM_HOME,
          values: armJoints,
          setValues: setArmJoints,
        }
      : {
          actions: {},
          icons: {},
          joints: BOT_JOINTS.map((j) => ({ ...j })),
          home: BOT_HOME,
          values: botJoints,
          setValues: setBotJoints,
        };

  const play = (id: ArmActionId) =>
    setAction((prev) => (prev?.id === id ? null : { id, key: Date.now() }));

  const handleActionEnd = useCallback(() => setAction(null), []);
  // On-model handles (touch screens) write straight into the joint arrays.
  const handleArmJointDrag = useCallback((index: number, value: number) => {
    setAction(null);
    setArmJoints((prev) => prev.map((v, i) => (i === index ? value : v)));
  }, []);
  const handleBotJointDrag = useCallback((index: number, value: number) => {
    setBotJoints((prev) => prev.map((v, i) => (i === index ? value : v)));
  }, []);
  // A click on the arm makes it say hi (unless it already is).
  const handleArmClick = useCallback(
    () => setAction((prev) => (prev?.id === "wave" ? prev : { id: "wave", key: Date.now() })),
    []
  );

  const openPanel = () => {
    setManual(true);
    // The arm greets the user as the panel opens.
    if (variant === "arm") setAction({ id: "wave", key: Date.now() });
  };

  const closePanel = () => {
    setManual(false);
    setAction(null);
  };

  // Stacked: the cue at the foot of the copy brings the stage screen up.
  // Direct scrollTo, since the page's scroll-padding (for the navbar) would
  // otherwise leave the stage 6rem short of the top.
  const scrollToStage = () => {
    const el = stageRef.current;
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "smooth" });
  };

  const switchVariant = (next: Variant) => {
    setVariant(next);
    setManual(false);
    setAction(null);
    setBotReady(false); // the humanoid re-reports once its scene reloads
  };

  const setJoint = (index: number, value: number) =>
    spec.setValues((prev) => prev.map((v, i) => (i === index ? value : v)));

  const canControl = variant === "arm" || botReady;
  const hasActions = Object.keys(spec.actions).length > 0;
  // Touch screens get dots on the model and a slim toolbar instead of the card.
  const sheet = touch;
  // Split layout: the card docks at the column's bottom-right, so the robot
  // steps aside (slides left and shrinks a little) while it is open.
  const stepAside = canControl && manual && !sheet;
  // Split, the robot layer is as wide as the page but centred on the stage
  // column (the column is 55% of the page, so the layer is 100/55 of it and
  // starts (55 - 100) / 2 = -22.5% of the page to its left). The robots keep
  // their full-screen size and are never clipped at the column's edge: a
  // reach toward the cursor runs under the copy, and the page edge clips the
  // far right as it always did.
  const robotClass = cn(
    "absolute inset-0 z-10 transition-transform duration-700 ease-out lg:left-[-40.9%] lg:right-auto lg:w-[181.8%]",
    stepAside && "lg:origin-bottom lg:-translate-x-40 lg:scale-[0.8]"
  );
  const hint = !touch
    ? null
    : variant === "arm"
      ? inputMode === "tablet"
        ? "Hold the gripper to move the arm · Tap to make it reach"
        : "Tap around the arm to make it reach"
      : "Tap anywhere to catch its eye";

  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-muted lg:h-svh lg:min-h-[680px]">
      <div className="lg:grid lg:h-full lg:grid-cols-[minmax(0,9fr)_minmax(0,11fr)]">
        {/* Screen one when stacked, the left column when split: the copy. On
            desktop its left edge lines up with the page's content column. */}
        <div className="relative z-20 flex min-h-svh flex-col justify-center px-6 pb-24 pt-24 sm:px-8 lg:min-h-0 lg:py-24 lg:pl-[max(2rem,calc((100vw-72rem)/2))] lg:pr-8">
          <div className="max-w-[30rem]">
            <Reveal>
              <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                <span className="font-[family-name:var(--font-orbitron)] text-sm font-bold tracking-[0.18em] text-foreground">
                  IR<span className="text-brand">4</span>ALL
                </span>
                <span aria-hidden className="h-px w-5 bg-muted-foreground/40" />
                stands for
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl xl:text-6xl">
                Immersive Robotics <span className="text-brand">for All.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-5 max-w-lg text-pretty text-base text-muted-foreground sm:text-lg">
                Free for every Tempe Union high schooler: simulate a robot arm in your
                browser, build a real one at ASU, and earn an ASU microcredential. No
                experience needed.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#program"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:px-6 sm:py-3"
                >
                  Start building
                  <ArrowRight className="size-4" />
                </a>
                <a
                  href="#visit"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted sm:px-6 sm:py-3"
                >
                  <MapPin className="size-4 text-brand" />
                  Visit the lab
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.32}>
              <div className="mt-8 border-t border-border pt-5 lg:mt-10">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  In partnership with
                </p>
                <ul className="mt-3 flex flex-wrap items-center gap-2.5">
                  {PARTNERS.map((partner) => (
                    <li
                      key={partner.name}
                      className="flex h-10 items-center rounded-lg bg-white px-2.5 ring-1 ring-border/70 dark:ring-0"
                    >
                      <Image
                        src={partner.src}
                        alt={partner.name}
                        width={partner.width}
                        height={partner.height}
                        priority
                        className="h-6 w-auto sm:h-7"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          {/* Stacked only: the way down to the robots. */}
          <button
            type="button"
            onClick={scrollToStage}
            className="absolute inset-x-0 bottom-7 mx-auto flex w-fit flex-col items-center gap-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            Meet the robots
            <ChevronDown className="size-4 animate-bounce" />
          </button>
        </div>

        {/* Screen two when stacked, the right column when split: the stage.
            Wordmark behind, the active robot over it, controls on top. */}
        <div ref={stageRef} className="relative h-svh lg:h-full">
          {/* Layer 0 — wordmark. Split, it sits behind the robot; stacked, it
              fills the band between the controls and the robot's head, like a
              title over it. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[34%] z-0 w-full -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-center font-[family-name:var(--font-orbitron)] text-[22.5vw] font-black leading-none tracking-tight text-foreground/10 md:text-[18vw] lg:top-[55%] lg:text-[11.5vw]"
          >
            IR4ALL
          </span>

          {/* Layer 10 — the active hero visual, occluding the wordmark. */}
          {variant === "humanoid" ? (
            <SplineStage
              className={robotClass}
              control={botControl}
              onRigReady={setBotReady}
              handles={manual && sheet}
              onJointDrag={handleBotJointDrag}
            />
          ) : (
            <RobotArmHero
              className={robotClass}
              control={armControl}
              onActionEnd={handleActionEnd}
              onArmClick={handleArmClick}
              compact={inputMode === "phone"}
              handles={manual && sheet}
              onJointDrag={handleArmJointDrag}
              pad={armPad}
            />
          )}

          {/* Layer 30 — action + joint controls for the active robot: a floating
              card with a pointer. Touch screens get dots on the model instead. */}
          {stepAside && (
            <div className="absolute bottom-6 right-4 z-30 max-h-[calc(100%-3rem)] w-72 overflow-y-auto rounded-2xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur lg:bottom-8 lg:right-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Controls</h2>
                <button
                  type="button"
                  onClick={closePanel}
                  aria-label="Close controls"
                  className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Predefined actions (the humanoid has none). */}
              {hasActions && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(Object.keys(spec.actions) as ArmActionId[]).map((id) => {
                    const Icon = spec.icons[id];
                    const active = action?.id === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => play(id)}
                        aria-pressed={active}
                        className={
                          active
                            ? "inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                            : "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        }
                      >
                        <Icon className="size-3.5" />
                        {spec.actions[id].label}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className={hasActions ? "mt-4 space-y-3 border-t border-border pt-4" : "mt-3 space-y-3"}>
                {spec.joints.map((joint) => (
                  <div key={joint.name}>
                    <div className="flex items-baseline justify-between text-xs">
                      <label htmlFor={joint.name} className="font-medium">
                        {joint.label}
                      </label>
                      <span className="tabular-nums text-muted-foreground">
                        {toDeg(spec.values[joint.index])}&deg;
                      </span>
                    </div>
                    <input
                      id={joint.name}
                      type="range"
                      min={joint.limit[0]}
                      max={joint.limit[1]}
                      step={0.01}
                      value={spec.values[joint.index]}
                      onChange={(e) => {
                        setAction(null); // grabbing a slider takes over
                        setJoint(joint.index, Number(e.target.value));
                      }}
                      className="mt-1.5 w-full accent-brand"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setAction(null);
                  spec.setValues(spec.home);
                }}
                className="mt-4 w-full rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Reset pose
              </button>
            </div>
          )}

          {/* Touch screens: the joints carry their own handles; this slim bar
              holds the actions, reset and close so the model stays in view. It
              takes the switcher's slot when stacked, and sits above it when split. */}
          {canControl && manual && sheet && (
            <>
              <p className="pointer-events-none absolute left-1/2 top-[9.5rem] z-30 w-max max-w-[90vw] -translate-x-1/2 rounded-full bg-card/80 px-3 py-1 text-center text-[11px] text-muted-foreground backdrop-blur lg:top-auto lg:bottom-[8.75rem]">
                Hold a dot and drag to move that joint
              </p>
              <div
                data-no-track
                className="absolute left-1/2 top-24 z-30 flex max-w-[94vw] -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card/90 p-1 shadow-lg backdrop-blur lg:top-auto lg:bottom-[5.25rem]"
              >
                {hasActions &&
                  (Object.keys(spec.actions) as ArmActionId[]).map((id) => {
                    const Icon = spec.icons[id];
                    const active = action?.id === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => play(id)}
                        aria-pressed={active}
                        aria-label={spec.actions[id].label}
                        title={spec.actions[id].label}
                        className={
                          active
                            ? "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                            : "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                        }
                      >
                        <Icon className="size-3.5" />
                        {/* Icon-only on phones, where the bar has no room for labels. */}
                        <span className="hidden sm:inline">{spec.actions[id].label}</span>
                      </button>
                    );
                  })}
                {hasActions && <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />}
                <button
                  type="button"
                  onClick={() => {
                    setAction(null);
                    spec.setValues(spec.home);
                  }}
                  className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Reset<span className="hidden sm:inline"> pose</span>
                </button>
                <button
                  type="button"
                  onClick={closePanel}
                  aria-label="Close controls"
                  className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </>
          )}

          {/* Touch hint, next to the switcher. */}
          {hint && !manual && (
            <p className="pointer-events-none absolute left-1/2 top-[9.5rem] z-30 w-max max-w-[90vw] -translate-x-1/2 rounded-full bg-card/80 px-3 py-1 text-center text-[11px] text-muted-foreground backdrop-blur lg:top-auto lg:bottom-[5.5rem]">
              {hint}
            </p>
          )}

          {/* Layer 30 — variant switcher and the control toggle. The robots ignore
              the cursor while it is over these (data-no-track). Stacked, the touch
              toolbar borrows this slot while it is open. */}
          <div
            data-no-track
            className={cn(
              "absolute left-1/2 top-24 z-30 flex -translate-x-1/2 items-center gap-2 lg:top-auto lg:bottom-8",
              manual && sheet && "max-lg:hidden"
            )}
          >
            <div
              role="tablist"
              aria-label="Hero animation"
              className="flex items-center gap-1 rounded-full border border-border bg-card/80 p-1 backdrop-blur"
            >
              {VARIANTS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="tab"
                  aria-selected={variant === v.id}
                  onClick={() => switchVariant(v.id)}
                  className={
                    variant === v.id
                      ? "whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                      : "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  }
                >
                  {v.label}
                </button>
              ))}
            </div>

            {canControl && !manual && (
              <button
                type="button"
                onClick={openPanel}
                aria-label="Manual control"
                title="Manual control"
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-card/80 px-3 py-2.5 text-sm font-medium text-muted-foreground backdrop-blur transition-colors hover:text-foreground sm:px-4"
              >
                <Sliders className="size-4" />
                {/* Icon-only on phones so it fits beside the switcher. */}
                <span className="hidden sm:inline">Manual control</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

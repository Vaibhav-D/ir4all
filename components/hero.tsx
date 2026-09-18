"use client";

import { useCallback, useState } from "react";
import { Hand, Music, PackageCheck, Sliders, X } from "lucide-react";
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

const VARIANTS = [
  { id: "humanoid", label: "Humanoid" },
  { id: "arm", label: "Robot arm" },
] as const;

type Variant = (typeof VARIANTS)[number]["id"];

type Icon = React.ComponentType<{ className?: string }>;

const ARM_ICONS: Record<ArmActionId, Icon> = {
  wave: Hand,
  dance: Music,
  pick: PackageCheck,
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
  const [variant, setVariant] = useState<Variant>("humanoid");
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
  const hint = !touch
    ? null
    : variant === "arm"
      ? inputMode === "tablet"
        ? "Hold the gripper to move the arm · Tap to make it reach"
        : "Tap around the arm to make it reach"
      : "Tap anywhere to catch its eye";

  return (
    <section className="relative isolate h-svh min-h-[560px] w-full overflow-hidden border-b border-border bg-muted">
      {/* Layer 0 — wordmark, sitting behind the robot. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[56%] z-0 w-full -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap px-4 text-center font-[family-name:var(--font-orbitron)] text-[22.5vw] font-black leading-none tracking-tight text-foreground/10 lg:text-[19vw]"
      >
        IR4ALL
      </span>

      {/* Layer 10 — the active hero visual, occluding the wordmark. */}
      {variant === "humanoid" ? (
        <SplineStage
          className="absolute inset-0 z-10"
          control={botControl}
          onRigReady={setBotReady}
          handles={manual && sheet}
          onJointDrag={handleBotJointDrag}
        />
      ) : (
        <RobotArmHero
          className="absolute inset-0 z-10"
          control={armControl}
          onActionEnd={handleActionEnd}
          onArmClick={handleArmClick}
          compact={inputMode === "phone"}
          handles={manual && sheet}
          onJointDrag={handleArmJointDrag}
        />
      )}

      {/* Layer 30 — action + joint controls for the active robot: a floating
          card with a pointer. Touch screens get dots on the model instead. */}
      {canControl && manual && !sheet && (
        <div className="absolute bottom-24 right-6 z-30 w-72 rounded-2xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur sm:bottom-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Controls</h2>
            <button
              type="button"
              onClick={() => {
                setManual(false);
                setAction(null);
              }}
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
          holds the actions, reset and close so the model stays in view. */}
      {canControl && manual && sheet && (
        <>
          <p className="pointer-events-none absolute bottom-[8.75rem] left-1/2 z-30 w-max max-w-[90vw] -translate-x-1/2 rounded-full bg-card/80 px-3 py-1 text-center text-[11px] text-muted-foreground backdrop-blur">
            Hold a dot and drag to move that joint
          </p>
          <div
            data-no-track
            className="absolute bottom-[5.25rem] left-1/2 z-30 flex max-w-[94vw] -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card/90 p-1 shadow-lg backdrop-blur"
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
              onClick={() => {
                setManual(false);
                setAction(null);
              }}
              aria-label="Close controls"
              className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </>
      )}

      {/* Touch hint, above the switcher. */}
      {hint && !manual && (
        <p className="pointer-events-none absolute bottom-[5.5rem] left-1/2 z-30 w-max max-w-[90vw] -translate-x-1/2 rounded-full bg-card/80 px-3 py-1 text-center text-[11px] text-muted-foreground backdrop-blur">
          {hint}
        </p>
      )}

      {/* Layer 30 — variant switcher and the control toggle. The robots ignore
          the cursor while it is over these (data-no-track). */}
      <div
        data-no-track
        className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2"
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
    </section>
  );
}

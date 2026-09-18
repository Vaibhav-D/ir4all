'use client'

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { Application } from "@splinetool/runtime";
import { SplineScene } from "@/components/ui/splite";
import { DragDot, type DragPhase } from "@/components/ui/drag-dot";
import { cn } from "@/lib/utils";
import { createCursorSmoother } from "@/components/demos/cursor-smoother";
import {
  BOT_NEUTRAL,
  attachHumanoidRig,
  isAppDisposed,
  type BotPose,
  type HumanoidRig,
} from "@/components/demos/humanoid-rig";

/** Neutral head and upper-body pose; see BotPose for the slots. */
export const BOT_HOME: number[] = [...BOT_NEUTRAL];

const deg = (d: number) => (d * Math.PI) / 180;

/** Manual sliders; `index` points into the pose. */
export const BOT_JOINTS = [
  { name: "bot_head_turn", label: "Head turn", index: 0, limit: [deg(-60), deg(60)] },
  { name: "bot_head_nod", label: "Head nod", index: 1, limit: [deg(-30), deg(30)] },
  { name: "bot_head_tilt", label: "Head tilt", index: 2, limit: [deg(-25), deg(25)] },
  { name: "bot_body_turn", label: "Upper body turn", index: 3, limit: [deg(-45), deg(45)] },
  { name: "bot_body_lean", label: "Upper body lean", index: 4, limit: [deg(-12), deg(12)] },
] as const;

/** Where to look (fraction of the stage height) to face straight ahead. */
const FRONT_Y = 0.3;

/**
 * Touch handles: where each dot sits in the robot's box (the camera is fixed,
 * so these fractions hold at any size) and which joints a drag moves, in
 * radians per pixel.
 */
const HEAD = "Scene 1/Bot/Top part/Head";
const TORSO = "Scene 1/Bot/Top part";
const ARMS = ["Scene 1/Bot/Top part/Hand/Hand LEFT/arm", "Scene 1/Bot/Top part/Hand Instance/Hand LEFT/arm"];
type Anchor = { paths: string[]; offset: readonly [number, number, number] };
const BOT_HANDLES: {
  label: string;
  /** Node (first path that lands on the viewer's right wins) and a point in its space. */
  anchor: Anchor;
  joints: number[];
  /** Chevron layout: drag axes and the angle of the first one (0 = sideways). */
  axes: 1 | 2;
  angle: number;
  drag: (dx: number, dy: number) => [index: number, delta: number][];
}[] = [
  // Offsets sit on the surface (z toward the viewer), so the dots visibly
  // ride along when the head or body turns rather than staying on the axis.
  { label: "Head tilt", anchor: { paths: [HEAD], offset: [0, 44, 14] }, joints: [2], axes: 1, angle: 0, drag: (dx) => [[2, dx / 220]] },
  {
    label: "Head",
    anchor: { paths: [HEAD], offset: [0, 24, 26] },
    joints: [0, 1],
    axes: 2,
    angle: 0,
    drag: (dx, dy) => [
      [0, dx / 220],
      [1, dy / 220],
    ],
  },
  { label: "Lean", anchor: { paths: ARMS, offset: [6, 14, 0] }, joints: [4], axes: 1, angle: 90, drag: (_dx, dy) => [[4, dy / 420]] },
  { label: "Upper body", anchor: { paths: [TORSO], offset: [0, 40, 32] }, joints: [3], axes: 1, angle: 0, drag: (dx) => [[3, dx / 300]] },
];

/**
 * How far to pull the arms in toward the body, by screen width: phones fully,
 * portrait tablets a little, wider screens not at all. Lets the robot be
 * framed larger without the idle swing leaving the display.
 */
const ARMS_IN = [
  { query: "(max-width: 767px)", amount: 1 },
  { query: "(max-width: 1023px)", amount: 0.4 },
];
function readArmsIn() {
  if (typeof window === "undefined") return 0;
  return ARMS_IN.find((a) => window.matchMedia(a.query).matches)?.amount ?? 0;
}
function subscribeArmsIn(onChange: () => void) {
  const qs = ARMS_IN.map((a) => window.matchMedia(a.query));
  qs.forEach((q) => q.addEventListener("change", onChange));
  return () => qs.forEach((q) => q.removeEventListener("change", onChange));
}

export type BotControl = {
  mode: "cursor" | "manual";
  joints: number[];
  /** "touch": no cursor, so the robot looks around by itself; a tap catches its eye. */
  input?: "pointer" | "touch";
};

/**
 * Humanoid hero visual. The canvas spans its container: Spline's camera has a
 * fixed vertical field of view, so horizontal framing scales with canvas width
 * and a narrow box crops the arms. Size the robot with `scale-*` rather than by
 * narrowing the box, since a CSS transform leaves the layout size untouched.
 *
 * By default the scene's own look-at turns the head toward the cursor. In
 * manual mode the sliders pose the head and upper body instead, and the face
 * stops following the cursor (see humanoid-rig.ts).
 */
export function SplineStage({
  className,
  control,
  onRigReady,
  handles = false,
  onJointDrag,
}: {
  className?: string;
  control?: BotControl;
  /** Reports whether head and body control is available for this scene. */
  onRigReady?: (ready: boolean) => void;
  /** Show draggable dots on the head and body (touch screens). */
  handles?: boolean;
  /** A dot was dragged: the joint's new target angle. */
  onJointDrag?: (index: number, value: number) => void;
}) {
  const dragVals = useRef<number[]>([]);
  const handleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const handlesRef = useRef(handles);
  useEffect(() => {
    handlesRef.current = handles;
  }, [handles]);
  const dragHandle = (h: (typeof BOT_HANDLES)[number], dx: number, dy: number, phase: DragPhase) => {
    if (phase === "start") {
      dragVals.current = [...(controlRef.current?.joints ?? BOT_HOME)];
      return;
    }
    if (phase !== "move") return;
    h.drag(dx, dy).forEach(([index, delta]) => {
      const [lo, hi] = BOT_JOINTS[index].limit;
      const v = Math.min(hi, Math.max(lo, (dragVals.current[index] ?? 0) + delta));
      dragVals.current[index] = v;
      onJointDrag?.(index, v);
    });
  };
  const readoutFor = (h: (typeof BOT_HANDLES)[number]) =>
    h.joints.map((i) => `${Math.round(((control?.joints[i] ?? 0) * 180) / Math.PI)}°`).join(" · ");
  const stageRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HumanoidRig | null>(null);
  const controlRef = useRef(control);
  const readyRef = useRef(onRigReady);
  const smootherRef = useRef<ReturnType<typeof createCursorSmoother> | null>(null);
  const armsIn = useSyncExternalStore(subscribeArmsIn, readArmsIn, () => 0);
  const armsInRef = useRef(armsIn);
  useEffect(() => {
    armsInRef.current = armsIn;
    rigRef.current?.setArmsIn(armsIn);
  }, [armsIn]);
  /** The cursor has left the window: face front until it comes back. */
  const awayRef = useRef(false);
  const holdUntilRef = useRef(0);

  useEffect(() => {
    controlRef.current = control;
    rigRef.current?.wake();
  }, [control]);
  useEffect(() => {
    readyRef.current = onRigReady;
  }, [onRigReady]);

  // Spline only tracks pointer events landing on its own canvas. The canvas
  // ignores the pointer (see the stage's class), and every window-level move is
  // re-dispatched to it instead, so the robot follows the cursor anywhere on
  // screen and the position can be eased when the cursor appears suddenly.
  useEffect(() => {
    const smoother = createCursorSmoother(
      (x, y) => {
        const canvas = stageRef.current?.querySelector("canvas");
        canvas?.dispatchEvent(
          new PointerEvent("pointermove", {
            clientX: x,
            clientY: y,
            bubbles: false,
            cancelable: true,
            pointerType: "mouse",
          })
        );
      },
      {
        origin: () => {
          const r = stageRef.current?.getBoundingClientRect();
          return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: 0, y: 0 };
        },
      }
    );
    smootherRef.current = smoother;
    const forward = (event: PointerEvent) => {
      awayRef.current = false;
      if (controlRef.current?.input === "touch") return; // no cursor to follow
      // Over the hero's own buttons the cursor is busy; leave the robot be.
      if ((event.target as Element | null)?.closest?.("[data-no-track]")) return;
      smoother.feed(event.clientX, event.clientY);
    };
    // The cursor left the window: the rig blends the head and body back to
    // their authored front pose (see onFrame), while the scene's own idle
    // (hands, blinking) keeps playing. The look-at is also pointed at the
    // middle, so handing back to it when the cursor returns starts near front.
    const leave = (event: PointerEvent) => {
      if (event.relatedTarget || controlRef.current?.input === "touch") return;
      awayRef.current = true;
      const r = stageRef.current?.getBoundingClientRect();
      if (r) smoother.feed(r.left + r.width / 2, r.top + r.height * FRONT_Y);
    };

    window.addEventListener("pointermove", forward);
    document.addEventListener("pointerout", leave);
    return () => {
      window.removeEventListener("pointermove", forward);
      document.removeEventListener("pointerout", leave);
      smoother.dispose();
      smootherRef.current = null;
    };
  }, []);

  // Keep Spline rendering every frame while the rig is attached, so the pose
  // responds even when the scene itself would otherwise idle. On touch, this
  // loop also picks a fresh spot to look at every few seconds.
  useEffect(() => {
    let frame = 0;
    let wanderNext = 0;
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      rigRef.current?.wake();
      // Touch handles: keep each dot on its node as the head and body move.
      const rig = rigRef.current;
      const canvas = stageRef.current?.querySelector("canvas");
      if (rig && canvas && handlesRef.current) {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        BOT_HANDLES.forEach((hd, i) => {
          const el = handleRefs.current[i];
          if (!el) return;
          // Of the candidate nodes (the two arms), take the one on the viewer's right.
          const pts = hd.anchor.paths.map((path) => rig.project(path, hd.anchor.offset)).filter((p) => p !== null);
          const ndc = pts.sort((a, b) => b.x - a.x)[0];
          if (!ndc) return;
          el.style.left = `${((ndc.x + 1) / 2) * w}px`;
          el.style.top = `${((1 - ndc.y) / 2) * h}px`;
          el.classList.remove("hidden");
        });
      }
      const ctl = controlRef.current;
      if (ctl?.input === "touch" && ctl.mode !== "manual" && now >= holdUntilRef.current && now >= wanderNext) {
        const r = stageRef.current?.getBoundingClientRect();
        if (r) {
          smootherRef.current?.feed(
            r.left + r.width * (0.15 + 0.7 * Math.random()),
            r.top + r.height * (0.2 + 0.45 * Math.random())
          );
        }
        wanderNext = now + 2000 + Math.random() * 2500;
      }
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      rigRef.current?.dispose();
      rigRef.current = null;
    };
  }, []);

  const handleLoad = (app: Application) => {
    // Spline builds its renderer a moment after onLoad; attach once it exists.
    // In dev, React mounts twice and the first, disposed app can still finish
    // loading; skip it rather than reporting the rig as unavailable.
    let tries = 0;
    const attach = () => {
      if (!stageRef.current || isAppDisposed(app)) return;
      const rig = attachHumanoidRig(app);
      if (!rig) {
        if (++tries < 60) return void setTimeout(attach, 50);
        if (!rigRef.current) readyRef.current?.(false);
        return;
      }
      rigRef.current?.dispose();
      rigRef.current = rig;
      rig.setArmsIn(armsInRef.current);
      // Sliders track quickly (rate 10); the hand-over between the scene's
      // look-at and manual control blends slowly (rate 2.5, ~1.2 s) so the
      // head glides instead of snapping when the panel opens or closes. A jump
      // in the slider values (Reset pose) is followed at a gentle rate too.
      let lastJoints: number[] | null = null;
      let gentleUntil = 0;
      rig.onFrame = () => {
        const ctl = controlRef.current;
        if (ctl?.mode === "manual") {
          const joints = ctl.joints.slice(0, 5);
          const now = performance.now();
          // A Reset jumps by up to ~1 rad; a fast finger swipe moves ~0.3 per event.
          if (lastJoints && joints.some((v, i) => Math.abs(v - (lastJoints as number[])[i]) > 0.6)) {
            gentleUntil = now + 1500;
          }
          lastJoints = joints;
          rig.drive(joints as BotPose, 1, now < gentleUntil ? 3 : 10, 2.5);
        } else if (awayRef.current) {
          // Cursor gone: face straight ahead.
          rig.drive(BOT_NEUTRAL, 1, 5, 2);
        } else {
          // Hand the head and body back to the scene's look-at.
          rig.drive(BOT_NEUTRAL, 0, 5, 2.5);
        }
      };
      readyRef.current?.(true);
    };
    attach();
  };

  // A tap catches the robot's eye for a few seconds.
  const handlePointerDown = (e: React.PointerEvent) => {
    if (controlRef.current?.input !== "touch") return;
    smootherRef.current?.feed(e.clientX, e.clientY);
    holdUntilRef.current = performance.now() + 3000;
  };

  return (
    <div
      ref={stageRef}
      onPointerDown={handlePointerDown}
      className={cn("[&_canvas]:pointer-events-none", className)}
    >
      {/* Below the desktop breakpoint the box is sized from the viewport width
          and anchored low, so the robot rises from the bottom, the arms stay
          inside the display and the wordmark stays visible. Phones sit the box
          on the bottom controls: the scene switches to a closer camera once the
          box grows past ~80vw there, which would push the head off the bottom. */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 h-[140vw] max-h-full md:h-[92vw] lg:h-auto",
          // Landscape tablets share the desktop breakpoint; start the box under
          // the navbar there so the head stays clear of it.
          control?.input === "touch" ? "lg:top-[5.5rem]" : "lg:top-0"
        )}
      >
        <SplineScene
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="h-full w-full"
          onLoad={handleLoad}
        />
        {/* Positioned every frame from the scene (see the rAF loop). */}
        {handles &&
          BOT_HANDLES.map((h, i) => (
            <DragDot
              key={h.label}
              ref={(el) => {
                handleRefs.current[i] = el;
              }}
              label={h.label}
              readout={readoutFor(h)}
              className="hidden"
              axes={h.axes}
              style={{ left: -100, top: -100, "--arrow-angle": `${h.angle}deg` } as React.CSSProperties}
              onDrag={(dx, dy, phase) => dragHandle(h, dx, dy, phase)}
            />
          ))}
      </div>
    </div>
  )
}

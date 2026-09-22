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
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

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
/** Touch: how long a tap keeps the robot's attention before it wanders again. */
const TAP_HOLD_MS = 4000;

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
 * framed larger without the idle swing leaving the display. The room the
 * layout leaves beside the robot adds to this (see armsInForRoom): the
 * desktop hero centres it on a column at the page's right edge.
 */
const ARMS_IN = [
  { query: "(max-width: 767px)", amount: 1 },
  { query: "(max-width: 1023px)", amount: 0.4 },
];
function readArmsIn() {
  if (typeof window === "undefined") return 0;
  return ARMS_IN.find((a) => window.matchMedia(a.query).matches)?.amount ?? 0;
}
/**
 * Arms-in amount for the room beside the robot: the distance from its centre
 * to the nearest visible edge, as a fraction of the box height. The camera
 * has a fixed vertical field of view, so the idle swing reaches about 0.39x
 * the box height to each side; below ~0.42 the arms start to come in.
 */
const armsInForRoom = (room: number) => clamp((0.42 - room) / 0.12, 0, 1);
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
  /**
   * Touch: the pose a tap asked for, and until when to hold it. The scene's
   * own look-at turns the head sideways well but barely tips it, so a tap
   * low on the screen would hardly register; the rig drives the head and
   * torso toward the tap itself, then hands back to the look-at.
   */
  const tapRef = useRef<{ pose: BotPose; until: number } | null>(null);

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
      const rig = rigRef.current;
      const canvas = stageRef.current?.querySelector("canvas");
      // Keep the idle swing on screen, whatever room the layout gives it. The
      // box is centred on its parent (the hero's stage column) and may be
      // wider than it, running off the page's right edge, so the room is half
      // the parent's width, not the canvas's.
      if (rig && canvas && canvas.clientHeight > 0) {
        const column = stageRef.current?.parentElement;
        const room = (column?.clientWidth ?? canvas.clientWidth) / 2 / canvas.clientHeight;
        rig.setArmsIn(Math.max(armsInRef.current, armsInForRoom(room)));
      }
      // Touch handles: keep each dot on its node as the head and body move.
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
        // Glance around at eye level and a little below, measured on the
        // robot's own box: the stage can be much taller than the box (a phone
        // screen with the robot in its lower part), and a spot near the top
        // of the stage would have it staring at the ceiling.
        const r = canvas?.getBoundingClientRect();
        if (r) {
          smootherRef.current?.feed(
            r.left + r.width * (0.15 + 0.7 * Math.random()),
            r.top + r.height * (0.12 + 0.33 * Math.random())
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
        } else if (tapRef.current && performance.now() < tapRef.current.until) {
          // A tap on a touch screen: look there for a few seconds.
          rig.drive(tapRef.current.pose, 1, 6, 4);
        } else {
          // Hand the head and body back to the scene's look-at.
          rig.drive(BOT_NEUTRAL, 0, 5, 2.5);
        }
      };
      readyRef.current?.(true);
    };
    attach();
  };

  // A tap catches the robot's eye for a few seconds. Taps on the hero's own
  // controls (the switcher and toolbar sit over the stage) are not for it.
  const handlePointerDown = (e: React.PointerEvent) => {
    if (controlRef.current?.input !== "touch") return;
    if ((e.target as Element | null)?.closest?.("[data-no-track], button, a, input")) return;
    // A tap well above the head (the stage runs up under the navbar) is read
    // as "just above the head", not a stare at the ceiling.
    const canvas = stageRef.current?.querySelector("canvas");
    const r = canvas?.getBoundingClientRect();
    const y = r ? Math.max(e.clientY, r.top + r.height * 0.08) : e.clientY;
    smootherRef.current?.feed(e.clientX, y);
    const now = performance.now();
    holdUntilRef.current = now + TAP_HOLD_MS;
    // Turn and tip the head (and a little of the torso) toward the tap, from
    // where the head is on screen right now.
    const rig = rigRef.current;
    if (rig && r && r.width > 0 && r.height > 0) {
      const head = rig.project(HEAD, [0, 24, 26]);
      const hx = head ? r.left + ((head.x + 1) / 2) * r.width : r.left + r.width / 2;
      const hy = head ? r.top + ((1 - head.y) / 2) * r.height : r.top + r.height * 0.3;
      const turn = clamp((e.clientX - hx) / r.width / 0.5, -1, 1) * deg(42);
      const nod = clamp((y - hy) / r.height / 0.55, -1, 1) * deg(28);
      tapRef.current = {
        pose: [turn, nod, turn * 0.15, turn * 0.35, turn * 0.12],
        until: now + TAP_HOLD_MS,
      };
    }
  };

  return (
    <div
      ref={stageRef}
      onPointerDown={handlePointerDown}
      className={cn("[&_canvas]:pointer-events-none", className)}
    >
      {/* Below the desktop breakpoint the stage is a screen of its own, with
          the floating navbar, the switcher and the hint stacked along its top
          (about 11.5rem). The box sits on the bottom edge and is capped to the
          space under that slot, which on most phones and tablets is what sizes
          it; the viewport-width heights only matter on short, wide screens.
          The hands may just touch the side edges. On desktop the box is the
          whole column. */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 h-[170vw] max-h-[calc(100%-11.5rem)] md:h-[120vw] lg:h-auto lg:max-h-none",
          // Landscape tablets share the desktop breakpoint; keep the box under
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

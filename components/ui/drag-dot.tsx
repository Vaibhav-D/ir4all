"use client";

import { forwardRef, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type DragPhase = "start" | "move" | "end";

/** One chevron, pointing along +x at the given distance from the centre. */
function Chevron({ rotate, active }: { rotate: number; active: boolean }) {
  return (
    <g transform={`rotate(${rotate})`}>
      <g className="dot-arrow">
        <path
          d="M 12.5 -3.5 L 16 0 L 12.5 3.5"
          fill="none"
          stroke="rgba(0,0,0,0.55)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 12.5 -3.5 L 16 0 L 12.5 3.5"
          fill="none"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("transition-opacity duration-150", active ? "opacity-100" : "opacity-85")}
        />
      </g>
    </g>
  );
}

/**
 * A small handle that sits on a model joint. Press and drag it to move that
 * joint; while held it grows, turns brand-coloured and shows its label and
 * current reading. Mini chevrons around the dot show which way to drag: one
 * axis (two chevrons) or two (four). Their direction follows the CSS variable
 * `--arrow-angle` on the root, so it can be set per frame for joints whose
 * screen direction changes with the pose. Position the root with `style`.
 */
export const DragDot = forwardRef<
  HTMLDivElement,
  {
    label: string;
    /** Current value, e.g. "−26°". Shown with the label while dragging. */
    readout?: string;
    /** `dx`/`dy` are the pointer's movement since the previous call, in px. */
    onDrag: (dx: number, dy: number, phase: DragPhase) => void;
    /** Drag axes: 1 shows two chevrons along `--arrow-angle`, 2 adds the cross axis. */
    axes?: 1 | 2;
    className?: string;
    style?: React.CSSProperties;
  }
>(function DragDot({ label, readout, onDrag, axes = 1, className, style }, ref) {
  const [active, setActive] = useState(false);
  const last = useRef({ x: 0, y: 0 });

  return (
    <div
      ref={ref}
      style={style}
      className={cn("absolute z-30 -translate-x-1/2 -translate-y-1/2 select-none", className)}
    >
      <button
        type="button"
        aria-label={`Drag to move ${label}`}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          last.current = { x: e.clientX, y: e.clientY };
          setActive(true);
          onDrag(0, 0, "start");
        }}
        onPointerMove={(e) => {
          if (!active) return;
          const dx = e.clientX - last.current.x;
          const dy = e.clientY - last.current.y;
          last.current = { x: e.clientX, y: e.clientY };
          onDrag(dx, dy, "move");
        }}
        onPointerUp={() => {
          setActive(false);
          onDrag(0, 0, "end");
        }}
        onPointerCancel={() => {
          setActive(false);
          onDrag(0, 0, "end");
        }}
        className="relative grid size-12 cursor-grab touch-none place-items-center rounded-full active:cursor-grabbing"
      >
        {/* Direction chevrons; the group rotates with --arrow-angle. */}
        <svg
          aria-hidden
          viewBox="-24 -24 48 48"
          className={cn("pointer-events-none absolute inset-0 size-12 overflow-visible", active && "dot-arrows-active")}
        >
          <g style={{ transform: "rotate(var(--arrow-angle, 0deg))" }}>
            <Chevron rotate={0} active={active} />
            <Chevron rotate={180} active={active} />
            {axes === 2 && (
              <>
                <Chevron rotate={90} active={active} />
                <Chevron rotate={270} active={active} />
              </>
            )}
          </g>
        </svg>
        <span
          className={cn(
            "block size-3.5 rounded-full bg-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.5),0_2px_8px_rgba(0,0,0,0.35)] transition-[transform,background-color] duration-150",
            active && "scale-[1.35] bg-brand"
          )}
        />
      </button>
      <span
        className={cn(
          "pointer-events-none absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur transition-opacity duration-150",
          active ? "opacity-100" : "opacity-0"
        )}
      >
        {label}
        {readout ? ` · ${readout}` : ""}
      </span>
    </div>
  );
});

import { cn } from "@/lib/utils";

/**
 * A beam of light that runs around the edge of its (relatively positioned)
 * parent. Drawn as a dashed SVG stroke with pathLength 100, so the dash
 * lengths are percentages of the perimeter regardless of the box size.
 */
export function BorderBeam({
  radius = 18,
  duration = 5,
  className,
}: {
  /** Corner radius in px; match the parent's border radius. */
  radius?: number;
  /** Seconds per lap. */
  duration?: number;
  className?: string;
}) {
  const style: React.CSSProperties = {
    x: 1,
    y: 1,
    width: "calc(100% - 2px)",
    height: "calc(100% - 2px)",
    animationDuration: `${duration}s`,
  };
  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full overflow-visible", className)}
    >
      {/* glow */}
      <rect
        rx={radius}
        fill="none"
        stroke="var(--brand)"
        strokeWidth="6"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="16 84"
        className="border-beam opacity-40 blur-[4px]"
        style={style}
      />
      {/* core */}
      <rect
        rx={radius}
        fill="none"
        stroke="var(--brand)"
        strokeWidth="2"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="16 84"
        className="border-beam"
        style={style}
      />
    </svg>
  );
}

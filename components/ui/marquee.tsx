import { cn } from "@/lib/utils";

/**
 * Continuous horizontal ticker. Items are rendered twice so the track can loop
 * seamlessly; the second copy is hidden from assistive tech. Pauses on hover
 * and stops entirely under prefers-reduced-motion (see globals.css).
 */
export function Marquee({
  items,
  duration = 40,
  className,
}: {
  items: React.ReactNode[];
  /** Seconds for one full loop. */
  duration?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "marquee relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className
      )}
      style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
    >
      <div className="marquee-track flex w-max items-center">
        {[...items, ...items].map((item, i) => (
          <div key={i} aria-hidden={i >= items.length} className="flex items-center">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

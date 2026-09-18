import { cn } from "@/lib/utils";

/**
 * Shared layout primitives.
 *
 * The page pulls sections from several different sources, each of which shipped
 * its own vertical rhythm, container width and type scale. Everything is routed
 * through these two components so the page reads as one document:
 *
 *   rhythm     py-24 -> md:py-32
 *   container  max-w-6xl, px-6 gutter
 *   heading    text-3xl -> md:text-4xl, semibold, tight tracking
 */

export function Section({
  children,
  className,
  bleed = false,
  divided = true,
  ...props
}: React.ComponentProps<"section"> & {
  /** Let the content span the full width, skipping the inner container. */
  bleed?: boolean;
  /** Hairline rule closing the section. */
  divided?: boolean;
}) {
  return (
    <section
      className={cn(
        "py-24 md:py-32",
        divided && "border-b border-border",
        className
      )}
      {...props}
    >
      {bleed ? children : <div className="mx-auto max-w-6xl px-6">{children}</div>}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
        className
      )}
    >
      {eyebrow && (
        <span className="text-sm font-medium tracking-wide text-brand">
          {eyebrow}
        </span>
      )}
      <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="text-pretty text-lg text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

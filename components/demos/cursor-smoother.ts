/**
 * Cursor positions for the hero robots. Normal movement passes straight
 * through, so tracking stays as responsive as before. When the cursor
 * appears suddenly (its first move, a big jump, or a move after a pause that
 * lands far from where it was) the reported position eases from the last known
 * point to the new one instead of snapping, so the robot visibly takes a
 * moment to find it.
 */
export type CursorSmoother = {
  feed(x: number, y: number): void;
  dispose(): void;
};

export function createCursorSmoother(
  emit: (x: number, y: number) => void,
  {
    gapMs = 350,
    jumpPx = 220,
    farPx = 90,
    durationMs = 1000,
    origin,
  }: {
    /** A pause longer than this makes the next move a candidate for easing. */
    gapMs?: number;
    /** Any jump bigger than this eases, pause or not. */
    jumpPx?: number;
    /** After a pause, only moves further than this ease. */
    farPx?: number;
    durationMs?: number;
    /** Where the robot is looking before the cursor has ever appeared. */
    origin?: () => { x: number; y: number };
  } = {}
): CursorSmoother {
  let last: { x: number; y: number } | null = null;
  let lastAt = 0;
  let target = { x: 0, y: 0 };
  let from = { x: 0, y: 0 };
  let startAt = 0;
  let raf = 0;

  // Slow start, slow finish: the robot noticeably takes a moment to find the cursor.
  const ease = (k: number) => k * k * (3 - 2 * k);

  const tick = () => {
    const now = performance.now();
    const k = Math.min(1, (now - startAt) / durationMs);
    const e = ease(k);
    const x = from.x + (target.x - from.x) * e;
    const y = from.y + (target.y - from.y) * e;
    emit(x, y);
    last = { x, y };
    lastAt = now;
    raf = k < 1 ? requestAnimationFrame(tick) : 0;
  };

  return {
    feed(x, y) {
      const now = performance.now();
      target = { x, y };
      // Already catching up: the tick keeps steering toward the newest target.
      if (raf) return;

      const start = last ?? origin?.() ?? null;
      const dist = start ? Math.hypot(x - start.x, y - start.y) : 0;
      const sudden =
        !!start && (dist > jumpPx || (now - lastAt > gapMs && dist > farPx));

      if (sudden) {
        from = start;
        startAt = now;
        raf = requestAnimationFrame(tick);
        return;
      }
      emit(x, y);
      last = { x, y };
      lastAt = now;
    },
    dispose() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}

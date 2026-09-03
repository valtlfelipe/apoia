"use client";

import { useMemo } from "react";

// Kept small and on-brand rather than reaching for a confetti library: a
// handful of DOM pieces animated with a CSS keyframe (see .confetti-piece in
// globals.css), colored from our own palette instead of generic rainbow.
const COLORS = [
  "var(--color-accent)",
  "var(--color-accent-strong)",
  "var(--color-mark)",
  "#e0b039",
];

const PIECE_COUNT = 28;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * A burst fired from one bottom corner of the screen, arcing up and inward —
 * the same "two side cannons" shape most confetti libraries use.
 *
 * This renders inside a <dialog>, and `position: fixed` on a dialog
 * descendant does NOT reliably resolve against the true viewport in every
 * browser — some contain it to the dialog's own box instead, which looked
 * like a second, smaller burst "stuck" to the modal. The fix doesn't depend
 * on knowing which behavior a given browser has: center a `100vw`×`100vh`
 * box on the dialog's own midpoint, and because the dialog itself is always
 * centered on the viewport, that box lands exactly on the viewport either
 * way — whether "50%" below resolved against the dialog or the viewport.
 */
export function ConfettiBurst({ side }: { side: "left" | "right" }) {
  const sign = side === "left" ? 1 : -1;

  const pieces = useMemo(
    () =>
      Array.from({ length: PIECE_COUNT }, (_, i) => ({
        id: i,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        // Horizontal travel, inward from this corner.
        x: sign * randomBetween(140, 420),
        // Peak height reached partway through the arc.
        peakY: -randomBetween(220, 420),
        // Where it ends up — usually still above the launch point, fading
        // out before gravity would pull it back past it.
        endY: -randomBetween(20, 160),
        rotate: randomBetween(360, 900) * (Math.random() < 0.5 ? -1 : 1),
        duration: randomBetween(1800, 3200),
        delay: randomBetween(0, 350),
        size: randomBetween(6, 10),
        wide: Math.random() < 0.5,
      })),
    [sign],
  );

  return (
    <div
      className="pointer-events-none fixed top-1/2 left-1/2 z-10 h-screen w-screen -translate-x-1/2 -translate-y-1/2"
      aria-hidden="true"
    >
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece absolute bottom-0 rounded-[1px]"
          style={
            {
              [side]: 0,
              width: piece.wide ? piece.size * 1.6 : piece.size,
              height: piece.wide ? piece.size * 0.6 : piece.size,
              backgroundColor: piece.color,
              animationDuration: `${piece.duration}ms`,
              animationDelay: `${piece.delay}ms`,
              "--confetti-x": `${piece.x}px`,
              "--confetti-peak-y": `${piece.peakY}px`,
              "--confetti-end-y": `${piece.endY}px`,
              "--confetti-rotate": `${piece.rotate}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

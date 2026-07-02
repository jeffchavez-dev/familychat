"use client";

import { useEffect, useMemo } from "react";

const PARTICLE_COUNT = 26;
const DURATION_MS = 4200;

// Pure, deterministic pseudo-random generator (mulberry32) so particle
// layout can be derived directly from props during render instead of
// calling the impure Math.random().
function seededRandom(seed: number) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function EmojiShower({
  content,
  seed,
  onDone,
}: {
  content: string;
  seed: number;
  onDone: () => void;
}) {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const r = (offset: number) => seededRandom(seed + i * 97 + offset);
        return {
          id: i,
          left: r(1) * 100,
          duration: 2.2 + r(2) * 1.6,
          delay: r(3) * 0.8,
          size: 22 + r(4) * 24,
          drift: (r(5) - 0.5) * 140,
          rotate: (r(6) > 0.5 ? 1 : -1) * (180 + r(7) * 180),
        };
      }),
    [seed],
  );

  useEffect(() => {
    const timer = setTimeout(onDone, DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 select-none drop-shadow"
          style={
            {
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              animation: `shower-fall ${p.duration}s ease-in ${p.delay}s forwards`,
              "--shower-drift": `${p.drift}px`,
              "--shower-rotate": `${p.rotate}deg`,
            } as React.CSSProperties
          }
        >
          {content}
        </span>
      ))}
    </div>
  );
}

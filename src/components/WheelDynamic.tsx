import { useState, useMemo, useEffect, useRef } from "react";

interface WheelProps {
  items: string[];
  onSpin: (item: string) => void;
  onStartSpin?: () => void;
  spinning?: boolean;
  winner?: string | null;
  showConfetti?: boolean;
  setShowConfetti?: (show: boolean) => void;
  initiatedBy?: string;
}

function Wheel({
  items,
  onSpin,
  onStartSpin,
  spinning = false,
  winner = null,
  setShowConfetti = () => {},
}: WheelProps) {
  const [angle, setAngle] = useState(0);
  const [localSpin, setLocalSpin] = useState(false);
  const [size] = useState(420);
  const tickSound = useRef<HTMLAudioElement | null>(null);
  const winSound = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);
  const [winningName, setWinningName] = useState<string | null>(null);

  // Refs to clear timers safely
  const tickIntervalRef = useRef<number | null>(null);
  const spinTimeoutRef = useRef<number | null>(null);

  // Track every cloned tick so we can stop them immediately
  const tickClonesRef = useRef<HTMLAudioElement[]>([]);

  // Initialize audio elements
  useEffect(() => {
    tickSound.current = new Audio("/spin.mp3");
    winSound.current = new Audio("/win.mp3");
    tickSound.current.volume = 0.5;
    winSound.current.volume = 0.5;

    return () => {
      // cleanup on unmount
      stopTickSounds();
      try {
        winSound.current?.pause();
        winSound.current = null;
      } catch {
        winSound.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const r = size / 2;
  const n = Math.max(items.length, 1);
  const step = 360 / n;
  const cx = r;
  const cy = r;

  const paths = useMemo(() => {
    const out: { d: string; mid: number }[] = [];
    const rad = (2 * Math.PI) / n;
    for (let i = 0; i < n; i++) {
      const a0 = i * rad - Math.PI / 2;
      const a1 = a0 + rad;
      const x0 = cx + r * Math.cos(a0);
      const y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const d = `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`;
      out.push({ d, mid: a0 + rad / 2 });
    }
    return out;
  }, [n, size, cx, cy, r]);

  // Helper to stop all ticking audio (base + clones) and clear interval
  const stopTickSounds = () => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }

    // Pause/reset base tick
    try {
      if (tickSound.current) {
        tickSound.current.pause();
        tickSound.current.currentTime = 0;
      }
    } catch {
      // ignore
    }

    // Pause & reset any clone currently playing and clear the list
    try {
      tickClonesRef.current.forEach((c) => {
        try {
          c.pause();
          c.currentTime = 0;
        } catch {
          /* ignore */
        }
      });
    } finally {
      tickClonesRef.current.length = 0;
    }
  };

  useEffect(() => {
    // Guard: only spin when Firestore says "spinning" and local spin isn't active
    // AND we don't already have a winner (so winner updates won't re-trigger)
    if (spinning && !localSpin && !winner) {
      console.log("[WHEEL] External spin triggered by Firestore.");
      spin(null);
    } else if (!spinning && localSpin) {
      // When Firestore resets, ensure we stop any ongoing animation
      console.log("[WHEEL] Firestore stopped spin → stopping animation.");
      setLocalSpin(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning]); // include localSpin to avoid stale closure

  // If winner is set externally, stop tick sounds immediately
  useEffect(() => {
    if (winner) {
      console.log(`[WHEEL] Firestore announced winner: ${winner}`);
      stopTickSounds();
      setLocalSpin(false);
      setShowConfetti(true);
      setWinningName(winner);

       // 🛑 Stop the spin visually at the winning segment
    const normalizedWinner = winner.trim().toLowerCase();
    const index = items.findIndex(
      (i) => i.trim().toLowerCase() === normalizedWinner
    );

    if (index >= 0) {
      const stopAngle = (360 - (index * step + step / 2)) % 360;
      setAngle(stopAngle); // Instantly rotate to winner
    }

    // Auto-hide winning name
    setTimeout(() => setWinningName(null), 2500);
    }
  }, [winner]);

  const spin = (forcedWinner: string | null) => {
    if (localSpin || items.length === 0) return;
    setLocalSpin(true);
    setShowConfetti(false);
    setWinningName(null);

    // Normalize winner
    const normalizedWinner = forcedWinner?.trim().toLowerCase();
    let pick = normalizedWinner
      ? items.findIndex((i) => i.trim().toLowerCase() === normalizedWinner)
      : -1;

    if (pick === -1) {
      pick = Math.floor(Math.random() * items.length);
    }

    const base = ((angle % 360) + 360) % 360;
    const desired = (360 - (pick * step + step / 2)) % 360;
    const delta = ((desired - base + 360) % 360) + 360 * 6;
    const end = angle + delta;

    setAngle(end);

    // Ensure no previous tick interval or clones are left
    stopTickSounds();

    // Start ticking clones if not muted
    if (!muted && tickSound.current) {
      tickIntervalRef.current = window.setInterval(() => {
        // clone a new audio element for overlap
        const t = tickSound.current!.cloneNode(true) as HTMLAudioElement;
        t.volume = 0.3;
        // keep a reference so we can stop it later
        tickClonesRef.current.push(t);

        // Remove clone from list when it finishes (or errors)
        const cleanup = () => {
          const idx = tickClonesRef.current.indexOf(t);
          if (idx >= 0) tickClonesRef.current.splice(idx, 1);
          t.removeEventListener("ended", cleanup);
          t.removeEventListener("error", cleanup);
        };
        t.addEventListener("ended", cleanup);
        t.addEventListener("error", cleanup);

        t.play().catch(() => {
          // If play fails (autoplay restrictions), remove from list so it can't be leaked
          cleanup();
          // console.error("tick play failed", err);
        });
      }, 120);
    }

    const spinDuration = 4200;
    // Clear any existing timeout first
    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = null;
    }

    spinTimeoutRef.current = window.setTimeout(() => {
      // Stop any ticking audio (interval + clones + base)
      stopTickSounds();

      setLocalSpin(false);
      const selected = items[pick];
      onSpin(selected);

      if (!muted && winSound.current) {
        winSound.current.play().catch(() => {
          /* ignore */
        });
      }
      setShowConfetti(true);
      setWinningName(selected);
      setTimeout(() => setWinningName(null), 2000);
    }, spinDuration);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      stopTickSounds();
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
        spinTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{ width: size, height: "auto" }}
    >
      {/* Pointer */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="w-0 h-0 border-l-8 border-r-8 border-b-[18px] border-l-transparent border-r-transparent border-b-rose-500" />
      </div>

      {/* Wheel */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          transform: `rotate(${angle}deg)`,
          transition: localSpin
            ? "transform 4.2s cubic-bezier(.17,.67,.29,1.02)"
            : "none",
        }}
      >
        {paths.map((p, idx) => (
          <path
            key={idx}
            d={p.d}
            fill={`hsl(${(idx * 45) % 360}, 70%, 70%)`}
            stroke="#fff"
            strokeWidth={2}
          />
        ))}
        {paths.map((p, idx) => (
          <text
            key={idx}
            x={cx + r * 0.62 * Math.cos(p.mid)}
            y={cy + r * 0.62 * Math.sin(p.mid)}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${(p.mid * 180) / Math.PI} ${
              cx + r * 0.62 * Math.cos(p.mid)
            } ${cy + r * 0.62 * Math.sin(p.mid)})`}
            fontWeight="700"
            fill="#0f172a"
            fontSize={Math.max(10, 16 - (items[idx]?.length || 0) / 3)}
          >
            {items[idx] && items[idx].length > 20
              ? `${items[idx].substring(0, 20)}...`
              : items[idx] || ""}
          </text>
        ))}
      </svg>

      {/* Spin button */}
      <button
        onClick={() => {
          if (onStartSpin) onStartSpin();
          else spin(null); // Local mode
        }}
        disabled={localSpin}
        className="absolute inset-0 m-auto bottom-0 w-12 h-12 md:w-20 md:h-20 rounded-full text-xs md:text-base bg-slate-900 text-white font-medium md:font-extrabold ring-2 md:ring-4 ring-amber-400 shadow flex items-center justify-center"
      >
        {localSpin ? "..." : "SPIN"}
      </button>

      {/* Mute toggle */}
      <button
        onClick={() => setMuted(!muted)}
        className="absolute bottom-4 right-4 bg-gray-800 text-white text-xs px-3 py-1 rounded-full opacity-80 hover:opacity-100"
      >
        {muted ? "Unmute" : "Mute"}
      </button>

      {/* Winning name popup */}
      {winningName && (
        <div className="absolute bottom-24 bg-amber-400 text-black font-bold text-lg px-4 py-2 rounded-full shadow-lg animate-bounce">
          🎉 {winningName} 🎉
        </div>
      )}
    </div>
  );
}

export default Wheel;

import { useState, useMemo, useEffect, useRef } from "react";
import AuthModal from "./AuthModal";
import { auth } from "@/firebase";
import { toast } from "react-hot-toast";

interface WheelProps {
  items: string[];
  onSpin: (item: string) => void;
  onStartSpin?: () => void;
  spinning?: boolean;
  winner?: string | null;
  showConfetti?: boolean;
  setShowConfetti?: (show: boolean) => void;
  initiatedBy?: string;
  requireAuth?: boolean;
}

function Wheel({
  items,
  onSpin,
  onStartSpin,
  spinning = false,
  winner = null,
  setShowConfetti = () => {},
  requireAuth = true,
}: WheelProps) {
  const [angle, setAngle] = useState(0);
  const [localSpin, setLocalSpin] = useState(false);
  const [size] = useState(420);
  const tickSound = useRef<HTMLAudioElement | null>(null);
  const winSound = useRef<HTMLAudioElement | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [muted, setMuted] = useState(() => {
    // Initialize from localStorage, default to false if not found
    try {
      const saved = localStorage.getItem("wheelSoundMuted");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [winningName, setWinningName] = useState<string | null>(null);

  // Refs to clear timers safely
  const tickIntervalRef = useRef<number | null>(null);
  const spinTimeoutRef = useRef<number | null>(null);
  const tickClonesRef = useRef<HTMLAudioElement[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem("wheelSoundMuted", JSON.stringify(muted));
      if (tickSound.current) {
        tickSound.current.muted = muted;
      }
      if (winSound.current) {
        winSound.current.muted = muted;
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [muted]);

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

    try {
      if (tickSound.current) {
        tickSound.current.pause();
        tickSound.current.currentTime = 0;
      }
    } catch {
      // Ignore
    }

    try {
      tickClonesRef.current.forEach((c) => {
        try {
          c.pause();
          c.currentTime = 0;
        } catch {
          // Ignore
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
    // Check authentication if required
    if (requireAuth && !auth.currentUser) {
      toast.error("Please log in to spin the wheel.");
      setAuthModalOpen(true);
      return;
    }

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

    // Play tick sound if not muted
    if (tickSound.current) {
      tickSound.current.play().catch((error) => {
        console.error("Error playing tick sound:", error);
      });
      if (!muted) {
        tickSound.current.muted = false;
      }
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

      if (winSound.current) {
        winSound.current.play().catch((error) => {
          console.error("Error playing win sound:", error);
        });
        if (!muted) {
          winSound.current.muted = false;
        }
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

  // Toggle mute/unmute
  const toggleMute = () => {
    setMuted((prev: boolean) => !prev);
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{ width: size, height: "auto" }}
    >
      {/* Pointer */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="w-0 h-0 border-l-8 border-r-8 border-b-[18px] border-l-transparent border-r-transparent border-b-rose-500" />
      </div>

      <audio ref={tickSound} src="/spin.mp3" className="hidden-audio" />
      <audio ref={winSound} src="/win.mp3" className="hidden-audio" />

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
               onClick={toggleMute}

        className="absolute bottom-4 right-4 bg-gray-800 text-white text-xs px-3 py-1 rounded-full opacity-80 hover:opacity-100"
      >
        {muted ? "Unmute" : "Mute"}
      </button>

      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            const fn = window.__afterAuth;
            window.__afterAuth = undefined;
            if (fn) fn();
          }}
        />
      )}
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

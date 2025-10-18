import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { type User } from "firebase/auth";
import Wheel from "@/components/Wheel";
import Confetti from "react-confetti";
import { toast } from "react-hot-toast";

interface Participant {
  email: string;
  role: "viewer" | "editor";
}

interface PublicWheel {
  id: string;
  title: string;
  items: string[];
  owner: string;
  isPublic: boolean;
  participants?: Participant[];
  isSpinning: boolean;
  currentSpin?: {
    winner: string | null;
    timestamp: number;
  };
  initiatedBy?: string; // Email of the user who initiated the spin
}

const WheelPage = ({ user }: { user: User | null }) => {
  const { wheelId } = useParams<{ wheelId: string }>();
  const [wheel, setWheel] = useState<PublicWheel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [winner, setWinner] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [canEdit, setCanEdit] = useState(false);
  const [localSpinning, setLocalSpinning] = useState(false);
  console.log(canEdit);
  const spinTriggeredRef = useRef(false); // prevent re-triggering animation on same snapshot

  // Track window size for confetti
  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Clear confetti when component unmounts and handle auto-hide
  useEffect(() => {
    // Auto-hide confetti after 8 seconds
    let confettiTimer: number | null = null;

    if (showConfetti) {
      confettiTimer = window.setTimeout(() => {
        setShowConfetti(false);
      }, 8000);
    }

    return () => {
      // Clear timer and confetti on unmount
      if (confettiTimer) {
        clearTimeout(confettiTimer);
      }
      setShowConfetti(false);
    };
  }, [showConfetti]);

  // ✅ Live listener for wheel updates
  useEffect(() => {
    if (!wheelId) return;

    const wheelRef = doc(db, "wheels", wheelId);

    const unsubscribe = onSnapshot(wheelRef, async (snap) => {
      if (!snap.exists()) {
        setError("Wheel not found.");
        setLoading(false);
        return;
      }

      const data = snap.data() as PublicWheel;
      const userEmail = user?.email;
      const participants = data.participants || [];
      const participant = participants.find((p) => p.email === userEmail);

      const hasAccess =
        data.isPublic || (user && data.owner === user.uid) || !!participant;

      if (!hasAccess) {
        setError("You do not have permission to view this wheel.");
        setLoading(false);
        return;
      }

      const canEditValue =
        user && (data.owner === user.uid || participant?.role === "editor");
      setCanEdit(!!canEditValue);

      // Update wheel state
      // Extract data without id, then add the id from snap to avoid duplicate
      const { id: _, ...wheelDataWithoutId } = data;
      setWheel({ id: snap.id, ...wheelDataWithoutId });

      // 🔄 Handle real-time spin sync
      if (data.isSpinning && !spinTriggeredRef.current) {
        // start local animation
        spinTriggeredRef.current = true;
        setLocalSpinning(true);
      }

      if (!data.isSpinning) {
        spinTriggeredRef.current = false;
        setLocalSpinning(false);
      }

      // 🎉 Handle winner reveal
      if (data.currentSpin?.winner) {
        setWinner(data.currentSpin.winner);
        setShowConfetti(true);
      } else {
        setWinner("");
        setShowConfetti(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [wheelId, user]);

  // Handle spin start (only host/editor)
  const handleSpinStart = async () => {
    if (!wheelId) {
      toast.error("Wheel not found.");
      return;
    }
    if (!user?.email) {
      toast.error("Unable to identify user. Please sign in again.");
      return;
    }

    try {
      const wheelRef = doc(db, "wheels", wheelId);
      await updateDoc(wheelRef, {
        isSpinning: true,
        initiatedBy: auth.currentUser?.uid, // Store who initiated the spin
        currentSpin: {
          winner: null,
          timestamp: Date.now(),
        },
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to start spin.");
    }
  };

  // 🏁 When spin animation completes → update winner
  const handleSpinComplete = async (result: string) => {
    if (!wheelId) return;

    try {
      const wheelRef = doc(db, "wheels", wheelId);

      // Preserve the initiatedBy field from the current spin
      const initiatedBy = wheel?.initiatedBy;
      if (initiatedBy === auth.currentUser?.uid) {
        await updateDoc(wheelRef, {
          isSpinning: false,
          initiatedBy: initiatedBy, // Preserve who initiated the spin
          currentSpin: {
            winner: result,
            timestamp: Date.now(),
          },
        });
      }
    } catch (err) {
      console.error("Error updating spin:", err);
    }
  };

  // Copy link
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-rose-100 via-white to-rose-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-6 text-lg font-semibold text-slate-700 animate-pulse">
            Loading wheel...
          </p>
        </div>
      </div>
    );
  }

  if (error)
    return (
      <div className="text-center py-10 text-red-600 font-semibold">
        {error}
      </div>
    );

  if (!wheel) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-50 text-slate-800">
      <div className="text-center py-10">
        <h1 className="text-4xl font-extrabold text-slate-900">
          {wheel.title}
        </h1>
        <button
          onClick={copyLink}
          className="mt-4 px-4 py-2 rounded-xl border bg-white hover:bg-slate-50 font-semibold"
        >
          Copy Link
        </button>
      </div>

      <div className="grid place-items-center">
        <Wheel
          items={wheel.items}
          onSpin={handleSpinComplete}
          spinning={localSpinning}
          onStartSpin={handleSpinStart}
          showConfetti={showConfetti}
          setShowConfetti={setShowConfetti}
          winner={wheel?.currentSpin?.winner || null}
          initiatedBy={wheel?.initiatedBy}
        />

        {winner && (
          <div className="mt-3 text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
              Winner!
            </div>
            <div className="mt-1 font-bold">{winner}</div>
          </div>
        )}
      </div>

      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={1800}
          gravity={0.5}
          recycle={false}
          tweenDuration={8000}
        />
      )}
    </div>
  );
};

export default WheelPage;

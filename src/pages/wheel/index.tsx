import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  onSnapshot,
  runTransaction,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import { type User } from "firebase/auth";
import Wheel from "@/components/WheelDynamic";
import Confetti from "react-confetti";
import { toast } from "react-hot-toast";
import AuthModal from "@/components/AuthModal";

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
  initiatedBy?: string; // UID of the user who initiated the spin
}

const WheelPage = ({ user }: { user: User | null }) => {
  const { wheelId } = useParams<{ wheelId: string }>();
  const [wheel, setWheel] = useState<PublicWheel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [canEdit, setCanEdit] = useState(false);
  const [localSpinning, setLocalSpinning] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const spinTriggeredRef = useRef(false); // Prevent re-triggering animation
  const lastWinnerTimestampRef = useRef<number>(0); // Track latest winner timestamp
  // NOTE: Keep for debugging, remove when done
  console.log("Current user can edit:", canEdit);
  const listenerInitializedRef = useRef(false);

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
    let confettiTimer: number | null = null;
    if (showConfetti) {
      confettiTimer = window.setTimeout(() => {
        setShowConfetti(false);
      }, 8000);
    }
    return () => {
      if (confettiTimer) clearTimeout(confettiTimer);
      setShowConfetti(false);
    };
  }, [showConfetti]);

  useEffect(() => {
    if (!wheelId) return;
    
    // Reset loading state when user changes (e.g., after login)
    setLoading(true);
    setError(null);
    
    // Reset listener flag to allow re-initialization
    listenerInitializedRef.current = false;
    
    console.log("🔁 [INIT] Setting up Firestore snapshot listener...");
    listenerInitializedRef.current = true;
    const wheelRef = doc(db, "wheels", wheelId);

    const unsubscribe = onSnapshot(
      wheelRef,
      (snap) => {
        if (!snap.exists()) {
          console.warn("❌ [SNAPSHOT] Wheel not found in Firestore.");
          setError("Wheel not found.");
          setLoading(false);
          return;
        }

        const data = snap.data() as PublicWheel;
        const userEmail = user?.email;
        const participants = data.participants || [];
        const participant = participants.find((p) => p.email === userEmail);

        /** 🧭 Access control check **/
        const hasAccess =
          data.isPublic || (user && data.owner === user.uid) || !!participant;

        if (!hasAccess) {
          console.warn("🚫 [ACCESS] No permission to view this wheel.");
          setError("You do not have permission to view this wheel.");
          setLoading(false);
          return;
        }

        /** 🛠️ Determine edit permission **/
        const canEditValue =
          user && (data.owner === user.uid || participant?.role === "editor");
        setCanEdit(!!canEditValue);

        /** 🧩 Clean data and update state **/
        const { id: _, ...wheelDataWithoutId } = data;
        setWheel({ id: snap.id, ...wheelDataWithoutId });

        const logMsg = [
          `[SNAPSHOT] isSpinning: ${data.isSpinning}`,
          `InitiatedBy: ${data.initiatedBy ?? "none"}`,
          `Winner: ${data.currentSpin?.winner ?? "none"}`,
          `spinTriggeredRef: ${spinTriggeredRef.current}`,
        ].join(" | ");
        console.log(logMsg);

        /** 🔄 Sync spin animation across clients **/
        if (data.isSpinning && !spinTriggeredRef.current) {
          console.log(
            "🌀 [SYNC] Spin started in Firestore → starting local animation."
          );
          spinTriggeredRef.current = true;
          setLocalSpinning(true);
        } else if (!data.isSpinning && spinTriggeredRef.current) {
          console.log(
            "✅ [SYNC] Spin stopped in Firestore → stopping local animation."
          );
          spinTriggeredRef.current = false;
          setLocalSpinning(false);
        }

        /** 🏁 Winner logic **/
        const newWinner = data.currentSpin?.winner || "";
        const newTimestamp = data.currentSpin?.timestamp || 0;
        const lastTimestamp = lastWinnerTimestampRef.current;

        // Case: New winner found
        if (newWinner && newTimestamp > lastTimestamp) {
          console.log(
            `🎉 [SNAPSHOT] New winner detected: ${newWinner} (ts: ${newTimestamp})`
          );
          setShowConfetti(true);
          lastWinnerTimestampRef.current = newTimestamp;
        }
        // Case: Winner cleared (new spin started)
        else if (!newWinner && lastTimestamp > 0) {
          console.log(
            "🧹 [SNAPSHOT] Winner cleared — resetting confetti/winner state."
          );
          setShowConfetti(false);
          lastWinnerTimestampRef.current = 0;
        }
        // Case: same or stale data
        else {
          console.log(
            `🕓 [SNAPSHOT IGNORED] No new winner. Current: ${newWinner} (ts: ${newTimestamp}), last: ${lastTimestamp}`
          );
        }

        setLoading(false);
      },
      (err) => {
        console.error("🔥 [SNAPSHOT ERROR]", err);
        setError("Failed to load wheel data.");
        setLoading(false);
      }
    );

    return () => {
      console.log("🧹 [CLEANUP] Unsubscribing from Firestore listener.");
      unsubscribe();
      listenerInitializedRef.current = false;
      // Reset refs when cleaning up
      spinTriggeredRef.current = false;
      lastWinnerTimestampRef.current = 0;
    };
  }, [wheelId, user]);

  // Handle spin start (only host/editor)
  const handleSpinStart = async () => {
    if (!wheelId || !auth.currentUser?.uid) {
      toast.error("Error: Wheel or user not identified.");
      return;
    }

    const wheelRef = doc(db, "wheels", wheelId);

    console.log(`[ACTION] User ${auth.currentUser.uid} initiating spin.`);
    try {
      await runTransaction(db, async (transaction) => {
        const wheelDoc = await transaction.get(wheelRef);
        if (!wheelDoc.exists()) throw new Error("Wheel not found");
        if (wheelDoc.data().isSpinning) throw new Error("Already spinning!");

        transaction.update(wheelRef, {
          isSpinning: true,
          initiatedBy: auth.currentUser?.uid,
          currentSpin: {
            winner: null,
            timestamp: Date.now(),
          },
        });
      });

      console.log(`[ACTION] Spin started by ${auth.currentUser.uid}`);
    } catch (err) {
      console.error(err);
      toast.error((err as Error)?.message || "Failed to start spin.");
    }
  };

  const spinCompleteLockRef = useRef(false);

  const handleSpinComplete = async (result: string) => {
    if (spinCompleteLockRef.current) {
      console.log("[COMPLETE] Duplicate call ignored.");
      return;
    }
    spinCompleteLockRef.current = true;

    if (!wheelId || !wheel || !auth.currentUser?.uid) {
      console.log("[COMPLETE] Missing wheelId, wheel, or user. Aborting.");
      return;
    }

    console.log(
      `[COMPLETE] Local animation finished. Winner is ${result}. Current DB Initiator: ${wheel.initiatedBy}. Local User: ${auth.currentUser?.uid}`
    );

    if (wheel.initiatedBy === auth.currentUser.uid) {
      try {
        const wheelRef = doc(db, "wheels", wheelId);
        await updateDoc(wheelRef, {
          isSpinning: false,
          initiatedBy: null,
          currentSpin: {
            winner: result,
            timestamp: Date.now(),
          },
        });
        console.log("[COMPLETE] Database updated with winner:", result);
      } catch (err) {
        console.error("Error updating spin:", err);
        toast.error("Failed to update winner.");
      }
    } else {
      console.log("[COMPLETE] Not initiator, ignoring local update.");
    }

    // Reset the lock after a short delay to allow next spin
    setTimeout(() => {
      spinCompleteLockRef.current = false;
    }, 2000);
  };

  // Copy link
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  // Show authentication prompt if user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Authentication Required</h2>
            <p className="text-slate-600">
              Please log in or sign up to access this wheel.
            </p>
          </div>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full px-6 py-3 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Log In / Sign Up
          </button>
        </div>
        
        {authModalOpen && (
          <AuthModal
            onClose={() => setAuthModalOpen(false)}
            onSuccess={() => {
              setAuthModalOpen(false);
              // The component will re-render with the authenticated user
            }}
          />
        )}
      </div>
    );
  }

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

        {/* {winner && (
          <div className="mt-3 text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
              Winner!
            </div>
            <div className="mt-1 font-bold">{winner}</div>
          </div>
        )} */}
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

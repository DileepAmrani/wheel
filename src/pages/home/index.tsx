import { useEffect, useState } from "react";
import Confetti from "react-confetti";

// Components
import Builder from "@/components/Builder";
import QA from "@/components/QA";
import PopularWheels from "@/components/PopularWheels";
import BlogTeasers from "@/components/BlogTeasers";
import SEOFAQSchema from "@/components/SEOFAQSchema";
import {
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase";
/******************** Utilities ********************/
import { load } from "@/utils";
import { type User } from 'firebase/auth';

// Global live spin counter (local demo)
const useTotalSpins = () => {
  const [n, setN] = useState(() => load("qw_total_spins", 0));
  useEffect(() => {
    const h = () => setN(load("qw_total_spins", 0));
    window.addEventListener("qw:spins", h);
    return () => window.removeEventListener("qw:spins", h);
  }, []);
  return n;
};

/******************** App ********************/
export default function Home({ user }: { user: User | null}) {
  const total = useTotalSpins();
  const [display, setDisplay] = useState(total);

  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [userSpins, setUserSpins] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let start = display,
      diff = total - start;
    if (!diff) return;
    let step = 0;
    const id = setInterval(() => {
      step++;
      setDisplay(Math.round(start + diff * (step / 25)));
      if (step >= 25) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [total]);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserSpins(docSnap.data().spinsCount || 0);
        } else {
          setUserSpins(0);
        }
      });
      return () => unsubscribe();
    } else {
      setUserSpins(null);
    }
  }, [user]);


  return (
    <div
      id="top"
      className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-50 text-slate-800"
    >
      
      <section className="text-center py-10">
        <h1 className="text-4xl font-extrabold text-slate-900">
          Create My Own Wheel
        </h1>
        <p className="text-slate-600 text-lg mt-2">
          Or choose from many of our popular wheels
        </p>
        <div className="mt-4 inline-block px-6 py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-bold text-2xl rounded-full shadow-lg animate-pulse relative">
          {/* 🎉 {display.toLocaleString()} Spins Played! 🎉 */}
          🎉 {userSpins?.toLocaleString()} Spins Played! 🎉
          <div className="absolute -top-2 -right-2 bg-amber-400 w-4 h-4 rounded-full animate-ping"></div>
        </div>
        <p className="text-slate-500 text-sm mt-2">and counting...</p>
      </section>

      <main className="max-w-7xl mx-auto px-2 md:px-6">
        <Builder
          showConfetti={showConfetti}
          setShowConfetti={setShowConfetti}
          user={user}
        />
        <PopularWheels />
        <BlogTeasers />
        <QA />
      </main>
      <SEOFAQSchema />

      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={1800} // more than default (200)
          gravity={0.5} // falls slower
          recycle={false}
          tweenDuration={8000}
        />
      )}
    </div>
  );
}

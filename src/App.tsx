import { useEffect, useState } from "react";
import Home from "./pages/home";
import { Routes, Route } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";
import TopBar from "./components/TopBar";
import Dashboard from "./pages/dashboard";
import AuthModal from "./components/AuthModal";
import { Toaster } from 'react-hot-toast';
import WheelPage from "./pages/wheel";

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-rose-100 via-white to-rose-50">
        <div className="flex flex-col items-center">
          {/* Spinner */}
          <div className="w-16 h-16 border-4 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
          {/* Text */}
          <p className="mt-6 text-lg font-semibold text-slate-700 animate-pulse">
            Loading your wheel...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <TopBar user={user} onLogin={() => setAuthOpen(true)} />
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onSuccess={() => {
            setAuthOpen(false);
          }}
        />
      )}
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/wheel/:wheelId" element={<WheelPage user={user} />} />
      </Routes>
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
};

export default App;

import { useState, useEffect, useRef } from "react";
import { auth } from "../firebase";
import { signOut as firebaseSignOut, type User } from "firebase/auth";
import { Link } from "react-router-dom";

interface TopBarProps {
  user: User | null;
  onLogin: () => void;
}

function TopBar({ user, onLogin }: TopBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when pressing Escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      setMobileMenuOpen(false);
    } catch (e) {
      console.error("Sign-out failed", e);
    }
  };

  return (
    <header className="bg-white/70 backdrop-blur border-b border-slate-200 shadow-sm relative z-30">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo + Title */}
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-grid place-items-center w-7 h-7 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 ring-2 ring-amber-400" />
          <span className="font-extrabold text-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            Quick Pick Wheel
          </span>
        </Link>

        {/* Mobile menu button */}
        <button 
          className="sm:hidden p-2 rounded-lg hover:bg-slate-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          )}
        </button>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-6 text-base font-medium text-slate-700">
          <nav className="flex gap-6">
            <a href="#builder" className="hover:text-indigo-600">
              Create
            </a>
            <a href="#popular" className="hover:text-indigo-600">
              Popular
            </a>
            <a href="#blog" className="hover:text-indigo-600">
              Blog
            </a>
            <a href="#faq" className="hover:text-indigo-600">
              Q&A
            </a>
          </nav>

          {/* Auth chip */}
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="px-3 py-1 rounded-full bg-slate-900 text-white text-sm font-semibold shadow hover:bg-slate-700">
                {user.displayName || user.email?.split("@")[0] || "Account"}
              </Link>
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="px-3 py-1.5 rounded-xl border hover:bg-slate-50"
            >
              Log in
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            ref={menuRef}
            className="absolute right-0 top-0 h-screen w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Menu</h2>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <nav className="flex flex-col gap-4 text-lg font-medium text-slate-700">
                <a 
                  href="#builder" 
                  className="px-3 py-2 rounded-lg hover:bg-slate-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create
                </a>
                <a 
                  href="#popular" 
                  className="px-3 py-2 rounded-lg hover:bg-slate-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Popular
                </a>
                <a 
                  href="#blog" 
                  className="px-3 py-2 rounded-lg hover:bg-slate-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Blog
                </a>
                <a 
                  href="#faq" 
                  className="px-3 py-2 rounded-lg hover:bg-slate-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Q&A
                </a>
              </nav>

              <div className="mt-8 border-t pt-6">
                {user ? (
                  <div className="space-y-3">
                    <Link 
                      to="/dashboard" 
                      className="block w-full px-4 py-2 text-center rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {user.displayName || user.email?.split("@")[0] || "Account"}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full px-4 py-2 text-center rounded-xl bg-red-500 text-white font-medium hover:bg-red-600"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onLogin();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-center rounded-xl border border-slate-300 font-medium hover:bg-slate-50"
                  >
                    Log in
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default TopBar;

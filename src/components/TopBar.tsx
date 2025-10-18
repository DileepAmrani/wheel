import { auth } from "../firebase";
import { signOut as firebaseSignOut, type User } from "firebase/auth";
import { Link } from "react-router-dom";

interface TopBarProps {
  user: User | null;
  onLogin: () => void;
}

function TopBar({ user, onLogin }: TopBarProps) {
  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error("Sign-out failed", e);
    }
  };

  return (
    <header className="bg-white/70 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo + Title */}
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-grid place-items-center w-7 h-7 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 ring-2 ring-amber-400" />
          <span className="font-extrabold text-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            Quick Pick Wheel
          </span>
        </Link>

        {/* Right Side Navigation */}
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
    </header>
  );
}

export default TopBar;

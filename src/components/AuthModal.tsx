import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  type User,
  sendEmailVerification,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import SpinnerIcon from "./SpinnerIcon";

// Define the three possible modes for the modal
type AuthMode = "signIn" | "signUp" | "forgotPassword";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("signIn"); // State for switching tabs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === "signUp";
  const isForgotPassword = mode === "forgotPassword";
  const buttonText = isSignUp ? "Sign Up" : isForgotPassword ? "Reset Password" : "Sign In";

  // Custom Tailwind classes for the active tab
  const activeTabClass = "bg-indigo-600 text-white font-semibold";
  const inactiveTabClass = "bg-gray-100 text-gray-700 hover:bg-gray-200";

  const handleAuth = async () => {
    setBusy(true);
    setError(null);

    // Validation for forgot password mode
    if (isForgotPassword) {
      if (!email) {
        setError("Please enter your email address.");
        setBusy(false);
        return;
      }

      try {
        await sendPasswordResetEmail(auth, email);
        setError("Password reset email sent! Please check your inbox.");
        // Switch back to sign in mode after successful reset email
        setTimeout(() => {
          setMode("signIn");
          setError(null);
        }, 3000);
        setBusy(false);
        return;
      } catch (resetError: any) {
        let errorMessage = "Failed to send password reset email.";
        if (resetError.code === "auth/user-not-found") {
          errorMessage = "No account found with this email address.";
        }
        setError(errorMessage);
        setBusy(false);
        return;
      }
    }

    // Basic validation for sign in/up modes
    if (!email || password.length < 6) {
      setError(
        "Please enter a valid email and a password of at least 6 characters."
      );
      setBusy(false);
      return;
    }

    // Additional validation for Sign Up mode
    if (isSignUp && !name) {
      setError("Please enter a username for your new account.");
      setBusy(false);
      return;
    }

    try {
      let user: User;

      if (isSignUp) {
        // --- SIGN UP LOGIC ---
        const newUserCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        user = newUserCredential.user;
        const displayName = name || email.split("@")[0];

        await updateProfile(user, { displayName });

        // Send verification email on signup
        try {
          await sendEmailVerification(user);
        } catch (sendErr: any) {
          // If we fail to send verification email, still create the user in Firestore
          // but surface an actionable error to the user.
          console.error("Failed to send verification email:", sendErr);
          setError(
            "Account created but we couldn't send a verification email. Please try resending from your account page."
          );
        }

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: displayName,
          spinsCount: 0,
          createdAt: new Date().toISOString(),
          isPublic: false, 
        });

        // Sign the user out so they must verify before using the app
        try {
          await signOut(auth);
        } catch (signOutErr) {
          console.warn("Failed to sign out after signup:", signOutErr);
        }

        // On sign up, show a message and switch to sign-in tab
        setError(
          "Success! A verification email has been sent. Please check your inbox and verify your email before signing in."
        );
        setMode("signIn"); // Switch to sign-in tab for next attempt
        // Clear sensitive inputs
        setPassword("");
        return; // Exit handleAuth function after sending email
      } else {
        // --- SIGN IN LOGIC (Updated to check verification) ---
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        user = userCredential.user;

        // ***** CORE CHANGE: CHECK FOR EMAIL VERIFICATION *****
        if (!user.emailVerified) {
          // Try to resend verification BEFORE signing out (sendEmailVerification needs a valid user)
          try {
            await sendEmailVerification(user);
          } catch (sendErr: any) {
            console.error("Failed to resend verification email:", sendErr);
            // If sending fails, still sign out and surface a helpful message
            await signOut(auth);
            setError(
              "Your email is not verified and we couldn't resend the verification email. Please try again later or contact support."
            );
            return;
          }

          // Sign out the user immediately if email is not verified
          await signOut(auth);

          setError(
            "Your email address is not verified. We've resent the verification email — please check your inbox."
          );
          return; // Stop execution
        }
        // ****************************************************

        // Success: User is verified and signed in
        onSuccess(user);
        onClose();
      }
    } catch (authError: any) {
      let errorMessage = authError.message;

      if (isSignUp) {
        if (authError.code === "auth/email-already-in-use") {
          errorMessage = "This email is already registered. Please sign in.";
        }
      } else {
        if (
          authError.code === "auth/user-not-found" ||
          authError.code === "auth/wrong-password"
        ) {
          errorMessage = "Invalid email or password.";
        }
      }

      setError(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose} // clicking outside closes modal
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-xl"
        onClick={(e) => e.stopPropagation()} // prevents closing when clicking inside modal
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg">{buttonText}</h3>
          <button onClick={onClose} className="px-2 py-1 border rounded-lg">
            ✕
          </button>
        </div>

        {/* --- Tab Switcher --- */}
        {!isForgotPassword ? (
          <div className="flex mb-4 p-1 rounded-xl border bg-gray-100">
            <button
              onClick={() => {
                setMode("signIn");
                setError(null);
              }}
              className={`w-1/2 py-2 rounded-lg transition-colors ${
                mode === "signIn" ? activeTabClass : inactiveTabClass
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode("signUp");
                setError(null);
              }}
              className={`w-1/2 py-2 rounded-lg transition-colors ${
                isSignUp ? activeTabClass : inactiveTabClass
              }`}
            >
              Sign Up
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <button
              onClick={() => {
                setMode("signIn");
                setError(null);
              }}
              className="text-indigo-600 hover:text-indigo-800 text-sm"
            >
              ← Back to Sign In
            </button>
          </div>
        )}
        {/* --- End Tab Switcher --- */}

        <div className="space-y-3">
          <input
            className="w-full px-3 py-2 border rounded-xl"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          
          {/* Password input - hidden in forgot password mode */}
          {!isForgotPassword && (
            <input
              className="w-full px-3 py-2 border rounded-xl"
              placeholder="Password (min. 6 characters)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}

          {/* Username Input only visible in Sign Up mode */}
          {isSignUp && (
            <input
              className="w-full px-3 py-2 border rounded-xl"
              placeholder="Username"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          {/* Forgot password description */}
          {isForgotPassword && (
            <p className="text-gray-600 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          )}

          {error && (
            <p className={`text-sm ${
              error.includes("Password reset email sent") ? "text-green-600" : "text-red-500"
            }`}>
              {error}
            </p>
          )}
          
          <button
            onClick={handleAuth}
            disabled={busy}
            className="w-full px-3 py-2 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 disabled:bg-indigo-400"
          >
            {busy && <SpinnerIcon />} {buttonText}
          </button>

          {/* Forgot password link - only show in sign in mode */}
          {mode === "signIn" && (
            <div className="text-center">
              <button
                onClick={() => {
                  setMode("forgotPassword");
                  setError(null);
                  setPassword(""); // Clear password when switching to forgot password
                }}
                className="text-indigo-600 hover:text-indigo-800 text-sm"
              >
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
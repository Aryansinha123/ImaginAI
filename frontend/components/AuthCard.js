"use client";

import { useState } from "react";
import { useStore } from "../store/useStore";
import { KeyRound, User, Loader2, Sparkles } from "lucide-react";

export default function AuthCard({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  const { login, register, isLoading, authError } = useStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (username.length < 3) {
      setValidationError("Username must be at least 3 characters.");
      return;
    }
    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters.");
      return;
    }

    let success;
    if (isLogin) {
      success = await login(username, password);
    } else {
      success = await register(username, password);
    }

    if (success && onClose) {
      onClose();
    }
  };

  return (
    <div className="relative w-full max-w-md p-8 rounded-3xl bg-zinc-950/70 backdrop-blur-xl border border-zinc-800 shadow-2xl overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 mb-4 shadow-inner">
          <Sparkles className="w-6 h-6 text-purple-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          {isLogin ? "Welcome back" : "Create account"}
        </h2>
        <p className="text-sm text-zinc-400 mt-2">
          {isLogin ? "Log in to continue your adventure" : "Join EchoVerse and start writing"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Username</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. aryan123"
              required
              className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/50 hover:bg-zinc-900/80 focus:bg-zinc-900 text-white rounded-2xl border border-zinc-800 focus:border-purple-500/50 outline-none transition-all duration-300 placeholder:text-zinc-600 focus:ring-4 focus:ring-purple-500/10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Password</label>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/50 hover:bg-zinc-900/80 focus:bg-zinc-900 text-white rounded-2xl border border-zinc-800 focus:border-purple-500/50 outline-none transition-all duration-300 placeholder:text-zinc-600 focus:ring-4 focus:ring-purple-500/10"
            />
          </div>
        </div>

        {(validationError || authError) && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center leading-relaxed">
            {validationError || authError}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="relative w-full py-4 bg-white text-black hover:bg-zinc-100 disabled:bg-zinc-700 disabled:text-zinc-400 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden shadow-lg hover:shadow-white/5 active:scale-[0.98] cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-black" />
          ) : (
            <span>{isLogin ? "Log In" : "Sign Up"}</span>
          )}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-zinc-800/60 pt-6">
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setValidationError("");
          }}
          className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-300 cursor-pointer"
        >
          {isLogin ? (
            <span>Don't have an account? <span className="text-purple-400 font-semibold hover:underline">Sign up</span></span>
          ) : (
            <span>Already have an account? <span className="text-purple-400 font-semibold hover:underline">Log in</span></span>
          )}
        </button>
      </div>
    </div>
  );
}

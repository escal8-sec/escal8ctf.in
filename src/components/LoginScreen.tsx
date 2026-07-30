import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Terminal, Lock, User, ArrowRight, AlertTriangle, Key, Sparkles, CheckCircle2 } from "lucide-react";
import { Escal8Logo } from "./Escal8Logo";

interface LoginScreenProps {
  onAuthSuccess: (username: string, isAdmin: boolean, teamName?: string) => void;
}

export default function LoginScreen({ onAuthSuccess }: LoginScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanTeamName = teamName.trim();

    if (!cleanUsername || !cleanPassword) {
      setError("Please fill out all operational fields.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegistering 
        ? { username: cleanUsername, password: cleanPassword, teamName: cleanTeamName }
        : { username: cleanUsername, password: cleanPassword };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textResp = await response.text();
        throw new Error(`Server returned non-JSON response (${response.status}). Server may be restarting, please try again in a moment.`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Authentication handshake failure.");
      }

      setSuccess(isRegistering ? "Enlistment verified. Logging you in..." : "Credentials accepted. Command access granted.");
      
      // Delay briefly to allow the success state to animate beautifully
      setTimeout(() => {
        onAuthSuccess(data.username, data.isAdmin, data.teamName);
      }, 1000);

    } catch (err: any) {
      setError(err.message || "Network link failure. Verify engine status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[#0e1424] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Cyber Grid/Glow background element */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="w-20 h-20 flex items-center justify-center mx-auto mb-3">
            <Escal8Logo className="w-20 h-20" glow={true} />
          </div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight flex items-center justify-center gap-2">
            ESCAL8 <span className="text-xs font-mono font-bold uppercase bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/40">CTF</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono tracking-wider mt-1.5">
            SECURE ACCESS HANDSHAKE PROTOCOL
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10" id="auth-form">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-1.5">
              Code Name / Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ENTER CODE NAME"
                className="w-full bg-[#0b0f19] border border-slate-800 focus:border-cyan-500/80 px-10 py-2.5 rounded-xl text-sm font-mono focus:outline-none transition-colors text-slate-200"
              />
            </div>
          </div>

          {isRegistering && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1.5"
            >
              <label className="block text-[11px] font-mono uppercase tracking-widest text-slate-400">
                Team Name / Alliance (Optional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Shield className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="SOLO (OR ENTER TEAM NAME)"
                  className="w-full bg-[#0b0f19] border border-slate-800 focus:border-cyan-500/80 px-10 py-2.5 rounded-xl text-sm font-mono focus:outline-none transition-colors text-slate-200"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                Join others under the same Team Name to compete together! Defaults to Code Name if empty.
              </p>
            </motion.div>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-1.5">
              Operational Access Key (Password)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0b0f19] border border-slate-800 focus:border-cyan-500/80 px-10 py-2.5 rounded-xl text-sm font-mono focus:outline-none transition-colors text-slate-200"
              />
            </div>
          </div>

          {/* Feedback Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs font-mono text-rose-400 flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-400 flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-cyan-500 hover:bg-cyan-400 text-[#0b0f19] font-display font-semibold text-sm py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <span>{loading ? "Authenticating..." : isRegistering ? "Initialize Account" : "Access Console"}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Mode Toggler */}
        <div className="mt-5 text-center relative z-10">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
              setSuccess("");
            }}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            {isRegistering
              ? "Already registered? Click here to Login"
              : "Need a command code? Register as a new Operator"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, Terminal, Trophy, Sparkles, Settings, 
  HelpCircle, Globe, Key, Cpu, User, Target, LogOut, CheckCircle2 
} from "lucide-react";
import { Challenge, Submission, UserScore, TeamScore, Category, EventConfig } from "./types";
import ChallengeCard from "./components/ChallengeCard";
import Leaderboard from "./components/Leaderboard";
import AIOracle from "./components/AIOracle";
import AdminPanel from "./components/AdminPanel";
import LoginScreen from "./components/LoginScreen";

export default function App() {
  const [activeTab, setActiveTab] = useState<"challenges" | "leaderboard" | "oracle" | "admin">("challenges");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userLeaderboard, setUserLeaderboard] = useState<UserScore[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamScore[]>([]);
  const [eventConfig, setEventConfig] = useState<EventConfig>({ status: 'active', statusMessage: 'CTF Competition is Live' });
  const [username, setUsername] = useState<string>("");
  const [teamName, setTeamName] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [oracleChallenge, setOracleChallenge] = useState<Challenge | null>(null);

  // Load username & sync state on start
  useEffect(() => {
    const stored = localStorage.getItem("escal8_username");
    const storedAdmin = localStorage.getItem("escal8_is_admin");
    const storedTeam = localStorage.getItem("escal8_team_name");
    if (stored) {
      setUsername(stored);
    }
    if (storedAdmin === "true") {
      setIsAdmin(true);
    }
    if (storedTeam) {
      setTeamName(storedTeam);
    }
    syncPlatformData();

    // Auto periodic refresh for live event sync
    const interval = setInterval(syncPlatformData, 10000);
    return () => clearInterval(interval);
  }, []);

  const syncPlatformData = async () => {
    setLoading(true);
    try {
      // Parallel fetch for latency reduction
      const [chalsRes, subsRes, lboardRes, eventRes] = await Promise.all([
        fetch("/api/challenges"),
        fetch("/api/submissions"),
        fetch("/api/leaderboard"),
        fetch("/api/event/config")
      ]);

      if (chalsRes.ok && subsRes.ok && lboardRes.ok) {
        const chals = await chalsRes.json();
        const subs = await subsRes.json();
        const lboard = await lboardRes.json();
        
        setChallenges(chals);
        setSubmissions(subs);
        setUserLeaderboard(lboard.users || []);
        setTeamLeaderboard(lboard.teams || []);
      }

      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setEventConfig(eventData);
      }
    } catch (err) {
      console.error("Failed to sync ESCAL8 platform data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (authUsername: string, authIsAdmin: boolean, authTeamName?: string) => {
    localStorage.setItem("escal8_username", authUsername);
    localStorage.setItem("escal8_is_admin", authIsAdmin ? "true" : "false");
    if (authTeamName) {
      localStorage.setItem("escal8_team_name", authTeamName);
      setTeamName(authTeamName);
    }
    setUsername(authUsername);
    setIsAdmin(authIsAdmin);
    syncPlatformData();
  };

  const handleLogout = () => {
    if (window.confirm("Disconnect your session? Your solved progress will still be saved on the leaderboard under your Code Name.")) {
      localStorage.removeItem("escal8_username");
      localStorage.removeItem("escal8_is_admin");
      localStorage.removeItem("escal8_team_name");
      setUsername("");
      setIsAdmin(false);
      setTeamName("");
      setActiveTab("challenges");
    }
  };

  const handleSolveSuccess = (challengeId: string, pointsAdded: number) => {
    // Play a tiny audio tick or just refresh immediately
    syncPlatformData();
  };

  const handleOpenOracleOnChallenge = (challenge: Challenge) => {
    setOracleChallenge(challenge);
    setActiveTab("oracle");
  };

  const handleResetScores = async () => {
    if (!window.confirm("ADMIN PERMISSION REQ: Are you sure you want to purge all user points and submission history? This is irreversible.")) return;
    
    try {
      const response = await fetch("/api/admin/reset", { method: "POST" });
      if (response.ok) {
        syncPlatformData();
        alert("Platform states successfully reset to clean seed mode.");
      }
    } catch (err) {
      alert("Error resetting database state.");
    }
  };

  const handleInstanceAction = async (challengeId: string, action: "start" | "stop" | "restart", timeoutMinutes?: number) => {
    try {
      const response = await fetch("/api/instances/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, action, timeoutMinutes })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.challenges) {
          setChallenges(data.challenges);
        }
      } else {
        const errData = await response.json();
        alert(errData.error || "Instance operation failed.");
      }
    } catch (err) {
      console.error("Instance action error:", err);
      alert("Network error executing sandbox instance controls.");
    }
  };

  // Filter logic
  const filteredChallenges = selectedCategory === "all"
    ? challenges
    : challenges.filter(c => c.category === selectedCategory);

  // Compute stats of active user
  const activeUserStanding = userLeaderboard.find(u => u.username === username);
  const userScoreValue = activeUserStanding?.score || 0;
  const userSolvedCount = activeUserStanding?.solvedChallenges.length || 0;

  const activeTeamStanding = teamName ? teamLeaderboard.find(t => t.teamName === teamName) : null;
  const teamScoreValue = activeTeamStanding?.score || 0;

  // Render tab indicator styling
  const tabClass = (tab: typeof activeTab) => {
    const isSelected = activeTab === tab;
    return `px-4 py-3 font-display font-medium text-sm rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
      isSelected 
        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 cyber-glow" 
        : "text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-900/40"
    }`;
  };

  if (!username) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-between">
        {/* 1. TOP HEADER & TELEMETRY */}
        <header className="border-b border-slate-800 bg-[#0e1424] shrink-0 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-4">
            {/* Platform Identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-950/60 border border-cyan-500/40 rounded-xl flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/10">
                <Shield className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xl tracking-tight text-white">ESCAL8</span>
                  <span className="text-[10px] font-mono tracking-widest font-bold uppercase bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/40">
                    CTF
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">CYBERSECURITY COMMUNITY PORTAL</p>
              </div>
            </div>
          </div>
        </header>

        {/* 2. LOGIN PAGE */}
        <main className="flex-1">
          <LoginScreen onAuthSuccess={handleAuthSuccess} />
        </main>

        {/* 3. FOOTER */}
        <footer className="border-t border-slate-800/60 bg-[#070b13] py-6 shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
            <div>
              <span>© {new Date().getFullYear()} ESCAL8 Cybersecurity Community. All Vectors Live.</span>
            </div>
            <div className="flex gap-4">
              <span className="text-[10px] text-emerald-500 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">
                Secure SSL Tunnel Established
              </span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-between">
      
      {/* GLOBAL EVENT / ANNOUNCEMENT BANNERS */}
      {eventConfig.announcement && (
        <div className="bg-cyan-950 border-b border-cyan-500/40 px-4 py-2 text-center text-xs font-mono font-bold text-cyan-300 flex items-center justify-center gap-2 shadow-md">
          <span>📢 OPERATOR ANNOUNCEMENT:</span>
          <span>{eventConfig.announcement}</span>
        </div>
      )}

      {eventConfig.status === "paused" && (
        <div className="bg-amber-950/90 border-b border-amber-500/60 px-4 py-2 text-center text-xs font-mono font-bold text-amber-300 flex items-center justify-center gap-2 shadow-md">
          <span>⚠️ COMPETITION PAUSED: Flag submissions are currently locked by the administrator.</span>
        </div>
      )}

      {eventConfig.status === "ended" && (
        <div className="bg-rose-950/90 border-b border-rose-500/60 px-4 py-2 text-center text-xs font-mono font-bold text-rose-300 flex items-center justify-center gap-2 shadow-md">
          <span>🔴 COMPETITION CLOSED: The CTF event has officially concluded. Standings are locked.</span>
        </div>
      )}

      {/* 1. TOP HEADER & TELEMETRY */}
      <header className="border-b border-slate-800 bg-[#0e1424] shrink-0 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-4">
          
          {/* Platform Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-950/60 border border-cyan-500/40 rounded-xl flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/10">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xl tracking-tight text-white">ESCAL8</span>
                <span className="text-[10px] font-mono tracking-widest font-bold uppercase bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/40">
                  CTF
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">CYBERSECURITY COMMUNITY PORTAL</p>
            </div>
          </div>

          {/* User Status Block */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-2 pl-3 rounded-xl">
              <div className="text-right">
                <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5 justify-end flex-wrap">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="uppercase font-bold">{username}</span>
                  {teamName && (
                    <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 uppercase">
                      TEAM: {teamName}
                    </span>
                  )}
                  {isAdmin && (
                    <span className="text-[9px] font-mono font-bold tracking-widest bg-rose-950/80 text-rose-400 border border-rose-800/50 px-1.5 py-0.5 rounded">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="text-sm font-mono font-bold text-emerald-400">
                  {userScoreValue} <span className="text-[10px] text-slate-400">PTS</span>
                  {teamName && (
                    <span className="text-xs text-slate-500 font-normal ml-2">
                      (TEAM: {teamScoreValue} PTS)
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/60 transition-all cursor-pointer"
                title="Disconnect Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* 2. MAIN HUB INTERFACE */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Operational View Tab Cockpit */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-2.5 flex flex-wrap gap-2">
          <button onClick={() => setActiveTab("challenges")} className={tabClass("challenges")}>
            <Terminal className="w-4 h-4" />
            <span>Cyber Vectors ({challenges.length})</span>
          </button>
          
          <button onClick={() => setActiveTab("leaderboard")} className={tabClass("leaderboard")}>
            <Trophy className="w-4 h-4" />
            <span>Live Standings</span>
          </button>

          <button onClick={() => { setActiveTab("oracle"); setOracleChallenge(null); }} className={tabClass("oracle")}>
            <Sparkles className="w-4 h-4" />
            <span>Oracle AI Mentor</span>
          </button>

          {isAdmin && (
            <button onClick={() => setActiveTab("admin")} className={tabClass("admin")}>
              <Settings className="w-4 h-4" />
              <span>Control Center</span>
            </button>
          )}
        </div>

        {/* View Switcher content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === "challenges" && (
              <motion.div
                key="challenges"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                {/* Category Filtering Panel */}
                <div className="flex flex-wrap items-center gap-2 pb-2">
                  {[
                    { id: "all", label: "All Vectors" },
                    { id: "crypto", label: "Cryptography" },
                    { id: "rev", label: "Reverse Eng" },
                    { id: "forensics", label: "Forensics" },
                    { id: "stego", label: "Steganography" },
                    { id: "osint", label: "OSINT" },
                    { id: "misc", label: "Misc / Scripting" },
                    { id: "web", label: "Web Exploitation" },
                    { id: "pwn", label: "Pwn (Binary Exploit)" },
                    { id: "blockchain", label: "Blockchain" }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all border shrink-0 cursor-pointer ${
                        selectedCategory === cat.id
                          ? "bg-cyan-500 text-[#0b0f19] border-cyan-500 font-bold shadow-md shadow-cyan-500/20"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Grid Lists */}
                {filteredChallenges.length === 0 ? (
                  <div className="p-16 border border-dashed border-slate-800 rounded-2xl text-center space-y-2">
                    <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-slate-400 font-mono text-sm">No active vectors matching this filter.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredChallenges.map(chal => {
                      const isSolved = username
                        ? submissions.some(s => (s.username === username || (teamName && s.teamName === teamName)) && s.challengeId === chal.id && s.success)
                        : false;

                      return (
                        <ChallengeCard
                          key={chal.id}
                          challenge={chal}
                          username={username}
                          isSolved={isSolved}
                          onSolveSuccess={handleSolveSuccess}
                          onOpenOracle={handleOpenOracleOnChallenge}
                          onInstanceAction={handleInstanceAction}
                        />
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "leaderboard" && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                <Leaderboard
                  userLeaderboard={userLeaderboard}
                  teamLeaderboard={teamLeaderboard}
                  onRefresh={syncPlatformData}
                  loading={loading}
                />
              </motion.div>
            )}

            {activeTab === "oracle" && (
              <motion.div
                key="oracle"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                <AIOracle
                  challenges={challenges}
                  activeChallenge={oracleChallenge}
                />
              </motion.div>
            )}

            {activeTab === "admin" && isAdmin && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                <AdminPanel
                  challenges={challenges}
                  submissions={submissions}
                  onRefreshData={syncPlatformData}
                  onResetDatabase={handleResetScores}
                  onInstanceAction={handleInstanceAction}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {/* 3. FOOTER */}
      <footer className="border-t border-slate-800/60 bg-[#070b13] py-6 mt-12 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div>
            <span>© {new Date().getFullYear()} ESCAL8 Cybersecurity Community. All Vectors Live.</span>
          </div>
          <div className="flex gap-4">
            <span className="text-[10px] text-emerald-500 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">
              Concurrent Engine Ready
            </span>
            <span className="text-[10px] text-cyan-500 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/30">
              Latency: &lt;5ms
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}

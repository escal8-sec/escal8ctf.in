import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, Terminal, Trophy, Sparkles, Settings, 
  HelpCircle, Globe, Key, Cpu, User, Target, LogOut, CheckCircle2,
  Search, Filter, SlidersHorizontal, Layers, Grid, ChevronDown, ChevronUp, Activity, X, Eye, FileCode, Map, Coins,
  MessageSquare, Users, Headphones, BrainCircuit, Award
} from "lucide-react";
import { Challenge, Submission, UserScore, TeamScore, Category, EventConfig } from "./types";
import ChallengeCard from "./components/ChallengeCard";
import CategoryBox from "./components/CategoryBox";
import Leaderboard from "./components/Leaderboard";
import AIOracle from "./components/AIOracle";
import AdminPanel from "./components/AdminPanel";
import LoginScreen from "./components/LoginScreen";
import PublicChatRoom from "./components/PublicChatRoom";
import SupportChat from "./components/SupportChat";
import { CTFCertificate } from "./components/CTFCertificate";
import { SquadPortal } from "./components/SquadPortal";
import { Escal8Logo } from "./components/Escal8Logo";

export default function App() {
  const [activeTab, setActiveTab] = useState<"challenges" | "leaderboard" | "oracle" | "public_chat" | "admin_chat" | "squad" | "certificate" | "admin">("challenges");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userLeaderboard, setUserLeaderboard] = useState<UserScore[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamScore[]>([]);
  const [eventConfig, setEventConfig] = useState<EventConfig>({ status: 'active', statusMessage: 'CTF Competition is Live' });
  const [username, setUsername] = useState<string>("");
  const [teamName, setTeamName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [teamId, setTeamId] = useState<string>("");
  const [isGroupUser, setIsGroupUser] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [copiedTeamId, setCopiedTeamId] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"category" | "grid">("category");
  const [expandAllCategories, setExpandAllCategories] = useState<boolean>(true);
  const [oracleChallenge, setOracleChallenge] = useState<Challenge | null>(null);

  // Load username & sync state on start
  useEffect(() => {
    const stored = localStorage.getItem("escal8_username");
    const storedAdmin = localStorage.getItem("escal8_is_admin");
    const storedTeam = localStorage.getItem("escal8_team_name");
    const storedUserId = localStorage.getItem("escal8_user_id");
    const storedTeamId = localStorage.getItem("escal8_team_id");
    const storedIsGroup = localStorage.getItem("escal8_is_group");
    if (stored) {
      setUsername(stored);
    }
    if (storedAdmin === "true") {
      setIsAdmin(true);
    }
    if (storedTeam) {
      setTeamName(storedTeam);
    }
    if (storedUserId) {
      setUserId(storedUserId);
    }
    if (storedTeamId) {
      setTeamId(storedTeamId);
    }
    if (storedIsGroup !== null) {
      setIsGroupUser(storedIsGroup === "true");
    }
    syncPlatformData();

    // Auto periodic refresh for live event sync
    const interval = setInterval(syncPlatformData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleForceLogout = (message?: string) => {
    localStorage.removeItem("escal8_username");
    localStorage.removeItem("escal8_is_admin");
    localStorage.removeItem("escal8_team_name");
    localStorage.removeItem("escal8_user_id");
    localStorage.removeItem("escal8_team_id");
    localStorage.removeItem("escal8_is_group");
    setUsername("");
    setIsAdmin(false);
    setTeamName("");
    setUserId("");
    setTeamId("");
    setIsGroupUser(false);
    setActiveTab("challenges");
    if (message) {
      alert(message);
    }
  };

  const syncPlatformData = async () => {
    setLoading(true);
    try {
      // Validate active session status if logged in as a regular user
      const activeUser = localStorage.getItem("escal8_username") || username;
      if (activeUser && activeUser !== "escal8" && activeUser !== "admin") {
        try {
          const meRes = await fetch(`/api/auth/me?username=${encodeURIComponent(activeUser)}`);
          if (meRes.ok) {
            const meData = await meRes.json();
            if (!meData.valid) {
              handleForceLogout(meData.message || "Your account was removed by the administrator.");
              return;
            }
          }
        } catch (authErr) {
          console.warn("Session check notice:", authErr);
        }
      }

      // Parallel fetch using Promise.allSettled for maximum fault tolerance
      const [chalsResult, subsResult, lboardResult, eventResult] = await Promise.allSettled([
        fetch("/api/challenges"),
        fetch("/api/submissions"),
        fetch("/api/leaderboard"),
        fetch("/api/event/config")
      ]);

      if (chalsResult.status === "fulfilled" && chalsResult.value.ok) {
        const chals = await chalsResult.value.json();
        if (Array.isArray(chals)) {
          const unique = Array.from(new Map(chals.map((c: Challenge) => [c.id, c])).values());
          setChallenges(unique);
        } else {
          setChallenges(chals);
        }
      }

      if (subsResult.status === "fulfilled" && subsResult.value.ok) {
        const subs = await subsResult.value.json();
        setSubmissions(subs);
      }

      if (lboardResult.status === "fulfilled" && lboardResult.value.ok) {
        const lboard = await lboardResult.value.json();
        setUserLeaderboard(lboard.users || []);
        setTeamLeaderboard(lboard.teams || []);
      }

      if (eventResult.status === "fulfilled" && eventResult.value.ok) {
        const eventData = await eventResult.value.json();
        setEventConfig(eventData);
      }
    } catch (err) {
      console.warn("Transient platform sync notice:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (authUsername: string, authIsAdmin: boolean, authTeamName?: string, authUserId?: string, authTeamId?: string, authIsGroup?: boolean) => {
    localStorage.setItem("escal8_username", authUsername);
    localStorage.setItem("escal8_is_admin", authIsAdmin ? "true" : "false");
    if (authTeamName) {
      localStorage.setItem("escal8_team_name", authTeamName);
      setTeamName(authTeamName);
    }
    if (authUserId) {
      localStorage.setItem("escal8_user_id", authUserId);
      setUserId(authUserId);
    }
    if (authTeamId) {
      localStorage.setItem("escal8_team_id", authTeamId);
      setTeamId(authTeamId);
    }
    localStorage.setItem("escal8_is_group", authIsGroup ? "true" : "false");
    setIsGroupUser(Boolean(authIsGroup));
    setUsername(authUsername);
    setIsAdmin(authIsAdmin);
    syncPlatformData();
  };

  const handleLogout = () => {
    if (window.confirm("Disconnect your session? Your solved progress will still be saved on the leaderboard under your Code Name.")) {
      localStorage.removeItem("escal8_username");
      localStorage.removeItem("escal8_is_admin");
      localStorage.removeItem("escal8_team_name");
      localStorage.removeItem("escal8_user_id");
      localStorage.removeItem("escal8_team_id");
      localStorage.removeItem("escal8_is_group");
      localStorage.removeItem("escal8_admin_token");
      setUsername("");
      setIsAdmin(false);
      setTeamName("");
      setUserId("");
      setTeamId("");
      setIsGroupUser(false);
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
        if (data.challenges && Array.isArray(data.challenges)) {
          const unique = Array.from(new Map(data.challenges.map((c: Challenge) => [c.id, c])).values());
          setChallenges(unique);
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

  // Category list configuration
  const categoriesList: { id: Category; label: string; description: string }[] = [
    { id: "web", label: "Web Exploitation", description: "Web vulnerabilities, HTTP smuggling, SQLi, XSS, APIs & SSRF" },
    { id: "crypto", label: "Cryptography", description: "Ciphers, RSA vulnerability, hashes & cryptanalysis" },
    { id: "rev", label: "Reverse Engineering", description: "Decompilation, disassembly, logic bypasses & binaries" },
    { id: "forensics", label: "Digital Forensics", description: "Disk images, packet captures (pcap), memory & log analysis" },
    { id: "stego", label: "Steganography", description: "Hidden media payloads, LSB, audio frequency & metadata" },
    { id: "osint", label: "OSINT & Intelligence", description: "Open source traces, social media, IP mapping & geolocation" },
    { id: "pwn", label: "Pwn (Binary Exploit)", description: "Buffer overflow, format string, ROP chains & memory corruptions" },
    { id: "misc", label: "Misc & Scripting", description: "Python scripts, logical puzzles & tactical automation" },
    { id: "blockchain", label: "Blockchain & Web3", description: "Smart contract audit, EVM reentrancy & DeFi vector exploits" },
  ];

  // Comprehensive Filter logic
  const filteredChallenges = challenges.filter(c => {
    // Category check
    if (selectedCategory !== "all" && c.category !== selectedCategory) return false;

    // Search query check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchAuthor = c.author.toLowerCase().includes(q);
      const matchId = c.id.toLowerCase().includes(q);
      const matchCat = c.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAuthor && !matchId && !matchCat) return false;
    }

    // Difficulty check
    if (difficultyFilter !== "all" && c.difficulty !== difficultyFilter) return false;

    // Solved status check
    const isSolved = username
      ? submissions.some(s => (s.username === username || (teamName && s.teamName === teamName)) && s.challengeId === c.id && s.success)
      : false;

    if (statusFilter === "solved" && !isSolved) return false;
    if (statusFilter === "unsolved" && isSolved) return false;

    return true;
  });

  // Calculate platform statistics
  const totalAvailablePoints = challenges.reduce((acc, c) => acc + (c.points || 0), 0);
  const activeSandboxesCount = challenges.filter(c => c.isLiveInstance && c.instanceConfig?.status === "running").length;

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
              <div className="w-11 h-11 flex items-center justify-center shrink-0">
                <Escal8Logo className="w-11 h-11" glow={true} />
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
            <div className="w-11 h-11 flex items-center justify-center shrink-0">
              <Escal8Logo className="w-11 h-11" glow={true} />
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
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-2.5 pl-3.5 rounded-xl shadow-lg">
              <div className="text-right space-y-1">
                {/* Header Row: Identity & Badge Tags */}
                <div className="text-xs font-mono text-slate-300 flex items-center gap-2 justify-end flex-wrap">
                  {/* Mode Badge (Group vs Individual) */}
                  {isGroupUser ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded border border-purple-800/50">
                      <Users className="w-3 h-3 text-purple-400" />
                      GROUP / SQUAD
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase bg-blue-950/80 text-blue-300 px-2 py-0.5 rounded border border-blue-800/50">
                      <User className="w-3 h-3 text-blue-400" />
                      INDIVIDUAL / SOLO
                    </span>
                  )}

                  {/* Admin Badge */}
                  {isAdmin && (
                    <span className="text-[9px] font-mono font-bold tracking-widest bg-rose-950/80 text-rose-400 border border-rose-800/50 px-1.5 py-0.5 rounded">
                      ADMIN
                    </span>
                  )}
                </div>

                {/* Main Details Row */}
                <div className="flex items-center gap-2 justify-end flex-wrap text-xs font-mono">
                  {/* Username & User ID */}
                  <div className="inline-flex items-center gap-1 text-slate-200">
                    <span className="text-slate-400">OPERATOR:</span>
                    <strong className="text-white uppercase">@{username}</strong>
                    {userId && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(userId);
                          setCopiedUserId(true);
                          setTimeout(() => setCopiedUserId(false), 2000);
                        }}
                        className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 hover:bg-emerald-900 px-1.5 py-0.5 rounded border border-emerald-800/50 cursor-pointer transition-colors"
                        title={`Click to copy User ID: ${userId}`}
                      >
                        {copiedUserId ? "USER ID COPIED!" : `USER ID: ${userId}`}
                      </button>
                    )}
                  </div>

                  {/* Team Name & Team ID - Render ONLY if user is participating in a Group / Squad */}
                  {isGroupUser && teamName && (
                    <div className="inline-flex items-center gap-1 bg-purple-950/70 text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-800/50 text-[11px] ml-1">
                      <span>SQUAD: {teamName}</span>
                      {teamId && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(teamId);
                            setCopiedTeamId(true);
                            setTimeout(() => setCopiedTeamId(false), 2000);
                          }}
                          className="ml-1 text-[10px] bg-purple-900 hover:bg-purple-800 text-purple-200 px-1.5 py-0.2 rounded border border-purple-700/60 cursor-pointer font-mono transition-colors"
                          title={`Click to copy Squad Team ID: ${teamId}`}
                        >
                          {copiedTeamId ? "SQUAD ID COPIED!" : `SQUAD JOIN KEY: ${teamId}`}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Score Summary */}
                <div className="text-xs font-mono font-bold text-emerald-400">
                  <span>{userScoreValue} PTS</span>
                  {teamName && (
                    <span className="text-[11px] text-slate-400 font-normal ml-2">
                      (GROUP TOTAL: {teamScoreValue} PTS)
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/60 transition-all cursor-pointer ml-1"
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
        <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-lg">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setActiveTab("challenges")} className={tabClass("challenges")}>
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Cyber Vectors ({challenges.length})</span>
            </button>
            
            <button onClick={() => setActiveTab("leaderboard")} className={tabClass("leaderboard")}>
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>Live Standings</span>
            </button>

            <button onClick={() => setActiveTab("squad")} className={tabClass("squad")}>
              <Users className="w-4 h-4 text-purple-400" />
              <span>Squad Control Center</span>
            </button>

            <button onClick={() => setActiveTab("certificate")} className={tabClass("certificate")}>
              <Award className="w-4 h-4 text-amber-400" />
              <span>CTF Certificate & Credentials</span>
            </button>

            <button onClick={() => { setActiveTab("oracle"); setOracleChallenge(null); }} className={tabClass("oracle")}>
              <BrainCircuit className="w-4 h-4 text-cyan-400" />
              <span>AI Oracle Mentor</span>
            </button>

            <button onClick={() => setActiveTab("public_chat")} className={tabClass("public_chat")}>
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Participant Chat Room</span>
            </button>

            {isAdmin && (
              <button onClick={() => setActiveTab("admin")} className={tabClass("admin")}>
                <Settings className="w-4 h-4 text-purple-400" />
                <span>Control Center</span>
              </button>
            )}
          </div>

          {/* HIGHLIGHTED ADMIN SUPPORT CHAT BUTTON IN THE TOP BAR */}
          <button 
            onClick={() => setActiveTab("admin_chat")} 
            className={`px-4 py-2.5 rounded-xl font-display font-bold text-xs flex items-center gap-2 transition-all cursor-pointer relative overflow-hidden border ${
              activeTab === "admin_chat"
                ? "bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/25 font-black scale-[1.02]"
                : "bg-gradient-to-r from-amber-950/90 via-rose-950/70 to-slate-900/90 text-amber-300 border-amber-500/50 hover:border-amber-400 hover:text-amber-200 shadow-md shadow-amber-950/40"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span className="uppercase tracking-wider">Direct Admin Chat</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-500/30">
              SUPPORT
            </span>
          </button>
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
                {/* 1. TOP TELEMETRY & STATS SUMMARY BANNER */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
                  <div className="p-4 bg-[#0a0e1a] border border-cyan-500/30 rounded-xl flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/40 shrink-0">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Tactical Solves</div>
                      <div className="text-base sm:text-lg font-bold text-white">
                        {userSolvedCount} <span className="text-xs text-slate-500">/ {challenges.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#0a0e1a] border border-emerald-500/30 rounded-xl flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/40 shrink-0">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Score & Points</div>
                      <div className="text-base sm:text-lg font-bold text-emerald-400">
                        {userScoreValue} <span className="text-xs text-slate-500">/ {totalAvailablePoints} PTS</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#0a0e1a] border border-purple-500/30 rounded-xl flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-purple-950 text-purple-400 border border-purple-500/40 shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Category Boxes</div>
                      <div className="text-base sm:text-lg font-bold text-purple-300">
                        {categoriesList.length} <span className="text-xs text-slate-500">Categories</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#0a0e1a] border border-amber-500/30 rounded-xl flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-amber-950 text-amber-400 border border-amber-500/40 shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Active Sandboxes</div>
                      <div className="text-base sm:text-lg font-bold text-amber-300">
                        {activeSandboxesCount} <span className="text-xs text-slate-500">Running</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. CATEGORY JUMP TABS */}
                <div className="flex flex-wrap items-center gap-2 pb-1 overflow-x-auto">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all border shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      selectedCategory === "all"
                        ? "bg-cyan-500 text-[#0b0f19] border-cyan-500 font-bold shadow-md shadow-cyan-500/20"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>All Category Boxes ({challenges.length})</span>
                  </button>

                  {categoriesList.map(cat => {
                    const catCount = challenges.filter(c => c.category === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all border shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          selectedCategory === cat.id
                            ? "bg-cyan-500 text-[#0b0f19] border-cyan-500 font-bold shadow-md shadow-cyan-500/20"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-black/40 rounded font-bold">
                          {catCount}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 3. SEARCH & CONTROLS TOOLBAR */}
                <div className="p-4 bg-[#0e1424] border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    
                    {/* Live Search Input */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search vector titles, IDs, authors, descriptions..."
                        className="w-full bg-slate-950 border border-slate-800 pl-9 pr-8 py-2 rounded-lg text-slate-200 focus:border-cyan-500/80 outline-none text-xs transition-colors"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Filter Pills & Toggles */}
                    <div className="flex flex-wrap items-center gap-2">
                      
                      {/* Difficulty Selector */}
                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-bold px-1.5">Difficulty:</span>
                        {["all", "Easy", "Medium", "Hard", "Expert"].map(diff => (
                          <button
                            key={diff}
                            onClick={() => setDifficultyFilter(diff)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                              difficultyFilter === diff
                                ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {diff === "all" ? "All" : diff}
                          </button>
                        ))}
                      </div>

                      {/* Status Selector */}
                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-bold px-1.5">Status:</span>
                        {[
                          { id: "all", label: "All" },
                          { id: "unsolved", label: "Unsolved" },
                          { id: "solved", label: "Solved" }
                        ].map(st => (
                          <button
                            key={st.id}
                            onClick={() => setStatusFilter(st.id)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                              statusFilter === st.id
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>

                      {/* View Mode Switcher */}
                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button
                          onClick={() => setViewMode("category")}
                          className={`p-1.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                            viewMode === "category"
                              ? "bg-cyan-500 text-slate-950 font-bold"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                          title="Category Boxes View"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span className="text-[10px] hidden sm:inline">Boxes</span>
                        </button>
                        <button
                          onClick={() => setViewMode("grid")}
                          className={`p-1.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                            viewMode === "grid"
                              ? "bg-cyan-500 text-slate-950 font-bold"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                          title="Compact Grid View"
                        >
                          <Grid className="w-3.5 h-3.5" />
                          <span className="text-[10px] hidden sm:inline">Grid</span>
                        </button>
                      </div>

                      {/* Expand / Collapse All */}
                      {viewMode === "category" && (
                        <button
                          onClick={() => setExpandAllCategories(!expandAllCategories)}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                          title={expandAllCategories ? "Collapse All Category Boxes" : "Expand All Category Boxes"}
                        >
                          {expandAllCategories ? <ChevronUp className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />}
                          <span className="text-[11px]">{expandAllCategories ? "Collapse All" : "Expand All"}</span>
                        </button>
                      )}

                    </div>
                  </div>
                </div>

                {/* 4. MAIN CATEGORY BOXES OR GRID RENDER */}
                {filteredChallenges.length === 0 ? (
                  <div className="p-16 border border-dashed border-slate-800 rounded-2xl text-center space-y-3 bg-[#0a0e1a]">
                    <HelpCircle className="w-10 h-10 text-slate-600 mx-auto animate-bounce" />
                    <p className="text-slate-300 font-mono text-sm font-bold">No active vectors matching your selected filters.</p>
                    <p className="text-slate-500 font-mono text-xs">Try clearing search terms or resetting difficulty and status filters.</p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("all");
                        setDifficultyFilter("all");
                        setStatusFilter("all");
                      }}
                      className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-mono text-xs rounded-lg cursor-pointer font-bold inline-block"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : viewMode === "category" ? (
                  /* CATEGORY BOXES VIEW */
                  <div className="space-y-6">
                    {categoriesList
                      .filter(cat => selectedCategory === "all" || selectedCategory === cat.id)
                      .map(cat => {
                        const catChallenges = filteredChallenges.filter(c => c.category === cat.id);
                        if (catChallenges.length === 0) return null;

                        return (
                          <CategoryBox
                            key={cat.id}
                            categoryKey={cat.id}
                            categoryLabel={cat.label}
                            categoryDescription={cat.description}
                            challenges={catChallenges}
                            username={username}
                            teamName={teamName}
                            submissions={submissions}
                            onSolveSuccess={handleSolveSuccess}
                            onOpenOracle={handleOpenOracleOnChallenge}
                            onInstanceAction={handleInstanceAction}
                            defaultExpanded={expandAllCategories}
                          />
                        );
                      })}
                  </div>
                ) : (
                  /* COMPACT GRID VIEW */
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {filteredChallenges.map((chal, idx) => {
                      const isSolved = username
                        ? submissions.some(s => (s.username === username || (teamName && s.teamName === teamName)) && s.challengeId === chal.id && s.success)
                        : false;

                      return (
                        <ChallengeCard
                          key={`${chal.id}_${idx}`}
                          challenge={chal}
                          username={username}
                          isSolved={isSolved}
                          submissions={submissions}
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
                  isFrozen={Boolean(eventConfig?.scoreboardFrozen)}
                  freezeMessage={eventConfig?.freezeMessage}
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
                  username={username}
                  teamName={teamName || "INDIVIDUAL"}
                  initialTab="ai"
                />
              </motion.div>
            )}

            {activeTab === "public_chat" && (
              <motion.div
                key="public_chat"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-[#0a0e1a] border border-emerald-500/30 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                        PARTICIPANT COMMUNITY CHAT ROOM
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                          LIVE BROADCAST
                        </span>
                      </h2>
                      <p className="text-xs font-mono text-slate-400">
                        Public discussion channel for all registered CTF hackers and teams. No spoiler flags!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-[600px]">
                  <PublicChatRoom
                    username={username}
                    teamName={teamName || "INDIVIDUAL"}
                    isAdmin={isAdmin}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === "admin_chat" && (
              <motion.div
                key="admin_chat"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-[#0a0e1a] border-2 border-amber-500/40 rounded-2xl p-4 sm:p-6 shadow-2xl shadow-amber-500/10 space-y-4 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-950 border border-amber-500/50 text-amber-400 shrink-0">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                        DIRECT ORGANIZER & ADMIN SUPPORT CHAT
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse">
                          1-ON-1 PRIVATE HELP
                        </span>
                      </h2>
                      <p className="text-xs font-mono text-slate-400">
                        Direct encrypted communication channel to the CTF organizers and platform administrators.
                      </p>
                    </div>
                  </div>

                  <div className="text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Admin Status: <strong className="text-emerald-400">ONLINE</strong></span>
                  </div>
                </div>

                <div className="h-[600px]">
                  <SupportChat
                    username={username}
                    teamName={teamName || "INDIVIDUAL"}
                    isAdmin={isAdmin}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === "squad" && (
              <motion.div
                key="squad"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                <SquadPortal
                  currentUsername={username}
                  teamName={teamName || username.toUpperCase() + "_SQUAD"}
                  teamId={teamId || "TEAM-E8-9921"}
                  isGroupUser={isGroupUser}
                  userScore={userScoreValue}
                  teamScore={teamScoreValue}
                  solvedCount={userSolvedCount}
                  submissions={submissions}
                  onLeaveTeam={() => {
                    localStorage.removeItem("escal8_team_name");
                    localStorage.removeItem("escal8_team_id");
                    setTeamName("");
                    setTeamId("");
                    setIsGroupUser(false);
                    setActiveTab("challenges");
                  }}
                />
              </motion.div>
            )}

            {activeTab === "certificate" && (
              <motion.div
                key="certificate"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                <CTFCertificate
                  username={username}
                  teamName={teamName}
                  isGroup={isGroupUser}
                  score={userScoreValue}
                  solvedCount={userSolvedCount}
                  totalChallenges={challenges.length}
                  rank={1}
                  userId={userId}
                  teamId={teamId}
                  onClose={() => setActiveTab("challenges")}
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

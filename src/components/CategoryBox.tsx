import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronDown, ChevronUp, Key, Cpu, Eye, FileCode, Map, 
  Shield, Globe, Terminal, Coins, CheckCircle2, Trophy, Layers, Sparkles
} from "lucide-react";
import { Challenge, Category, Submission } from "../types";
import ChallengeCard from "./ChallengeCard";

interface CategoryBoxProps {
  key?: string;
  categoryKey: Category;
  categoryLabel: string;
  categoryDescription?: string;
  challenges: Challenge[];
  username: string;
  teamName?: string;
  submissions: Submission[];
  onSolveSuccess: (challengeId: string, points: number) => void;
  onOpenOracle: (challenge: Challenge) => void;
  onInstanceAction?: (challengeId: string, action: "start" | "stop" | "restart", timeoutMinutes?: number) => void;
  defaultExpanded?: boolean;
}

const categoryIcons: Record<Category, React.ComponentType<any>> = {
  web: Globe,
  crypto: Key,
  rev: Cpu,
  forensics: Eye,
  stego: FileCode,
  osint: Map,
  pwn: Terminal,
  misc: Shield,
  blockchain: Coins
};

const categoryDescriptions: Record<Category, string> = {
  web: "Web vulnerability research, HTTP smuggling, XSS, SQLi & API exploitation",
  crypto: "Ciphers, RSA vulnerability analysis, Hash cracking & Cryptanalysis",
  rev: "Binary decompilation, Assembly reverse engineering & Logic bypasses",
  forensics: "Disk dumps, Packet captures (pcap), Memory inspection & File carving",
  stego: "Hidden payloads in media, LSB analysis, Audio & Metadata extraction",
  osint: "Open source intelligence, Social media traces & Geolocation tracking",
  pwn: "Buffer overflows, ROP chains, Format strings & Binary exploitation",
  misc: "Scripting challenges, Python puzzles & Uncategorized tactical vectors",
  blockchain: "Smart contract audit, EVM reentrancy & DeFi vector exploits"
};

const categoryStyles: Record<Category, { 
  border: string; 
  bgHeader: string; 
  iconBg: string; 
  iconText: string; 
  accentColor: string;
  glow: string;
  badgeBg: string;
}> = {
  web: {
    border: "border-cyan-500/40 hover:border-cyan-400/60",
    bgHeader: "bg-gradient-to-r from-cyan-950/40 via-cyan-900/20 to-slate-900/60",
    iconBg: "bg-cyan-950 border border-cyan-500/50 shadow-cyan-500/20",
    iconText: "text-cyan-400",
    accentColor: "bg-cyan-500",
    glow: "shadow-cyan-500/10",
    badgeBg: "bg-cyan-950/80 text-cyan-300 border-cyan-500/30"
  },
  crypto: {
    border: "border-purple-500/40 hover:border-purple-400/60",
    bgHeader: "bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-slate-900/60",
    iconBg: "bg-purple-950 border border-purple-500/50 shadow-purple-500/20",
    iconText: "text-purple-400",
    accentColor: "bg-purple-500",
    glow: "shadow-purple-500/10",
    badgeBg: "bg-purple-950/80 text-purple-300 border-purple-500/30"
  },
  rev: {
    border: "border-rose-500/40 hover:border-rose-400/60",
    bgHeader: "bg-gradient-to-r from-rose-950/40 via-rose-900/20 to-slate-900/60",
    iconBg: "bg-rose-950 border border-rose-500/50 shadow-rose-500/20",
    iconText: "text-rose-400",
    accentColor: "bg-rose-500",
    glow: "shadow-rose-500/10",
    badgeBg: "bg-rose-950/80 text-rose-300 border-rose-500/30"
  },
  forensics: {
    border: "border-emerald-500/40 hover:border-emerald-400/60",
    bgHeader: "bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-slate-900/60",
    iconBg: "bg-emerald-950 border border-emerald-500/50 shadow-emerald-500/20",
    iconText: "text-emerald-400",
    accentColor: "bg-emerald-500",
    glow: "shadow-emerald-500/10",
    badgeBg: "bg-emerald-950/80 text-emerald-300 border-emerald-500/30"
  },
  stego: {
    border: "border-amber-500/40 hover:border-amber-400/60",
    bgHeader: "bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900/60",
    iconBg: "bg-amber-950 border border-amber-500/50 shadow-amber-500/20",
    iconText: "text-amber-400",
    accentColor: "bg-amber-500",
    glow: "shadow-amber-500/10",
    badgeBg: "bg-amber-950/80 text-amber-300 border-amber-500/30"
  },
  osint: {
    border: "border-blue-500/40 hover:border-blue-400/60",
    bgHeader: "bg-gradient-to-r from-blue-950/40 via-blue-900/20 to-slate-900/60",
    iconBg: "bg-blue-950 border border-blue-500/50 shadow-blue-500/20",
    iconText: "text-blue-400",
    accentColor: "bg-blue-500",
    glow: "shadow-blue-500/10",
    badgeBg: "bg-blue-950/80 text-blue-300 border-blue-500/30"
  },
  pwn: {
    border: "border-red-500/40 hover:border-red-400/60",
    bgHeader: "bg-gradient-to-r from-red-950/40 via-red-900/20 to-slate-900/60",
    iconBg: "bg-red-950 border border-red-500/50 shadow-red-500/20",
    iconText: "text-red-400",
    accentColor: "bg-red-500",
    glow: "shadow-red-500/10",
    badgeBg: "bg-red-950/80 text-red-300 border-red-500/30"
  },
  misc: {
    border: "border-slate-700/60 hover:border-slate-600",
    bgHeader: "bg-gradient-to-r from-slate-900/60 via-slate-850/40 to-slate-900/60",
    iconBg: "bg-slate-900 border border-slate-700 shadow-slate-500/10",
    iconText: "text-slate-300",
    accentColor: "bg-slate-400",
    glow: "shadow-slate-500/10",
    badgeBg: "bg-slate-900/80 text-slate-300 border-slate-700/50"
  },
  blockchain: {
    border: "border-yellow-500/40 hover:border-yellow-400/60",
    bgHeader: "bg-gradient-to-r from-yellow-950/40 via-yellow-900/20 to-slate-900/60",
    iconBg: "bg-yellow-950 border border-yellow-500/50 shadow-yellow-500/20",
    iconText: "text-yellow-400",
    accentColor: "bg-yellow-500",
    glow: "shadow-yellow-500/10",
    badgeBg: "bg-yellow-950/80 text-yellow-300 border-yellow-500/30"
  }
};

export default function CategoryBox({
  categoryKey,
  categoryLabel,
  categoryDescription,
  challenges,
  username,
  teamName,
  submissions,
  onSolveSuccess,
  onOpenOracle,
  onInstanceAction,
  defaultExpanded = true
}: CategoryBoxProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  if (challenges.length === 0) return null;

  const IconComponent = categoryIcons[categoryKey] || Shield;
  const style = categoryStyles[categoryKey] || categoryStyles.misc;
  const description = categoryDescription || categoryDescriptions[categoryKey] || "Tactical security challenges";

  // Calculate solves & points in this category
  let solvedCount = 0;
  let totalPoints = 0;
  let earnedPoints = 0;

  challenges.forEach(chal => {
    totalPoints += chal.points || 0;
    const isSolved = username
      ? submissions.some(s => (s.username === username || (teamName && s.teamName === teamName)) && s.challengeId === chal.id && s.success)
      : false;
    if (isSolved) {
      solvedCount++;
      earnedPoints += chal.points || 0;
    }
  });

  const progressPercent = challenges.length > 0 ? Math.round((solvedCount / challenges.length) * 100) : 0;
  const isCategoryCompleted = solvedCount === challenges.length && challenges.length > 0;

  return (
    <div className={`border rounded-2xl overflow-hidden bg-[#0a0e1a] transition-all duration-300 shadow-xl ${style.border} ${style.glow}`}>
      
      {/* Category Box Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none ${style.bgHeader} border-b border-slate-800/80 relative overflow-hidden`}
      >
        {/* Decorative Top Accent Glow Bar */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] ${style.accentColor} opacity-80`} />

        {/* Left Side: Icon & Title */}
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-xl ${style.iconBg} shrink-0`}>
            <IconComponent className={`w-6 h-6 ${style.iconText}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-display font-bold text-white tracking-tight uppercase flex items-center gap-2">
                {categoryLabel}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-slate-900/80 text-slate-300 border-slate-700/60 font-medium">
                  {challenges.length} {challenges.length === 1 ? "Vector" : "Vectors"}
                </span>
              </h2>
              {isCategoryCompleted && (
                <span className="inline-flex items-center gap-1 bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  CATEGORY CLEARED (100%)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5 line-clamp-1">
              {description}
            </p>
          </div>
        </div>

        {/* Right Side: Progress Bar, Points & Chevron */}
        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 font-mono">
          {/* Progress Pill & Stats */}
          <div className="text-left sm:text-right space-y-1">
            <div className="flex items-center gap-2 justify-start sm:justify-end text-xs">
              <span className="text-slate-300 font-bold">
                {solvedCount}/{challenges.length} Solved
              </span>
              <span className="text-slate-500">•</span>
              <span className={`${style.iconText} font-bold`}>
                {earnedPoints}/{totalPoints} PTS
              </span>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-36 sm:w-44 h-1.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
              <div 
                className={`h-full ${style.accentColor} transition-all duration-500 rounded-full`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <div className={`p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 ${style.iconText} hover:bg-slate-850 transition-colors`}>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Category Box Content Grid */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="p-4 sm:p-5 bg-[#080b13]/80 space-y-4"
          >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {challenges.map((chal, idx) => {
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
                    onSolveSuccess={onSolveSuccess}
                    onOpenOracle={onOpenOracle}
                    onInstanceAction={onInstanceAction}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

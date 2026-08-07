import React, { useState } from "react";
import { Shield, AlertTriangle, Zap, Radio, Activity, RefreshCw, Flame, Lock, Unlock, Eye, CheckCircle2, Server, Globe } from "lucide-react";
import { Submission, EventConfig, Challenge } from "../types";

interface CyberRangeRadarProps {
  submissions: Submission[];
  challenges: Challenge[];
  eventConfig: EventConfig;
  onToggleEventStatus?: (newStatus: "active" | "paused" | "ended") => void;
  onSendAnnouncement?: (msg: string) => void;
}

export function CyberRangeRadar({
  submissions,
  challenges,
  eventConfig,
  onToggleEventStatus,
  onSendAnnouncement,
}: CyberRangeRadarProps) {
  const [firstBloodMultiplier, setFirstBloodMultiplier] = useState<number>(1.5);
  const [announcementInput, setAnnouncementInput] = useState("");
  const [systemAlertMessage, setSystemAlertMessage] = useState<string | null>(null);
  const [simulatedBruteForceIp, setSimulatedBruteForceIp] = useState("192.168.1.104");
  const [quarantinedIps, setQuarantinedIps] = useState<string[]>(["10.0.4.88", "198.51.100.12"]);

  const failedSubmissionsCount = submissions.filter((s) => !s.success).length;
  const totalSolvesCount = submissions.filter((s) => s.success).length;
  const firstBloodSolves = submissions.filter((s) => s.isFirstBlood);

  const handleBroadcastAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementInput.trim()) return;
    if (onSendAnnouncement) {
      onSendAnnouncement(announcementInput.trim());
    }
    setSystemAlertMessage(`Alert broadcasted: "${announcementInput.trim()}"`);
    setAnnouncementInput("");
    setTimeout(() => setSystemAlertMessage(null), 3500);
  };

  const handleQuarantineIp = (ip: string) => {
    if (!quarantinedIps.includes(ip)) {
      setQuarantinedIps([...quarantinedIps, ip]);
      setSystemAlertMessage(`IP ${ip} quarantined and blacklisted immediately.`);
      setTimeout(() => setSystemAlertMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Incident Command Banner */}
      <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/80 border border-rose-800/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10 font-mono">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-rose-300 bg-rose-900/60 px-3 py-1 rounded-full border border-rose-700/50">
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              CYBER RANGE INCIDENT COMMAND & THREAT RADAR
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight uppercase flex items-center gap-3">
              <span>LIVE THREAT MATRIX</span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-time monitoring of flag exploitation velocity, brute-force anomaly detection, and target telemetry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {eventConfig.status === "active" ? (
              <button
                onClick={() => onToggleEventStatus && onToggleEventStatus("paused")}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Lock className="w-4 h-4" />
                EMERGENCY PAUSE COMPETITION
              </button>
            ) : (
              <button
                onClick={() => onToggleEventStatus && onToggleEventStatus("active")}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Unlock className="w-4 h-4" />
                RESUME CTF OPERATIONS
              </button>
            )}
          </div>
        </div>
      </div>

      {systemAlertMessage && (
        <div className="p-3 bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-mono rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{systemAlertMessage}</span>
        </div>
      )}

      {/* Radar Canvas & Telemetry Gauges Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        {/* Radar Map Visualizer */}
        <div className="lg:col-span-2 bg-[#060a12] border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[360px] shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 relative z-10">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              ACTIVE VECTORS RADAR SCANNER
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800/60 font-bold">
              SYSTEM HEALTH: OPTIMAL (100% ONLINE)
            </span>
          </div>

          {/* Animated Target Sweep Display */}
          <div className="relative my-8 h-48 flex items-center justify-center">
            {/* Concentric Circles */}
            <div className="absolute w-44 h-44 rounded-full border border-cyan-500/20" />
            <div className="absolute w-32 h-32 rounded-full border border-cyan-500/30" />
            <div className="absolute w-20 h-20 rounded-full border border-cyan-500/40" />
            <div className="absolute w-2 h-2 rounded-full bg-cyan-400 animate-ping" />

            {/* Radar Crosshairs */}
            <div className="absolute w-full h-[1px] bg-cyan-500/20" />
            <div className="absolute h-full w-[1px] bg-cyan-500/20" />

            {/* Target Nodes */}
            <div className="absolute top-6 left-1/4 flex items-center gap-1.5 bg-rose-950/90 text-rose-300 px-2 py-0.5 rounded border border-rose-800 text-[10px] font-bold shadow-lg">
              <Flame className="w-3 h-3 text-rose-400 animate-bounce" />
              PWN-01 TARGET
            </div>

            <div className="absolute bottom-8 right-1/4 flex items-center gap-1.5 bg-cyan-950/90 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 text-[10px] font-bold shadow-lg">
              <Zap className="w-3 h-3 text-cyan-400" />
              WEB-04 ACTIVE
            </div>

            <div className="absolute top-1/3 right-10 flex items-center gap-1.5 bg-amber-950/90 text-amber-300 px-2 py-0.5 rounded border border-amber-800 text-[10px] font-bold shadow-lg">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              ANOMALY BURST
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-4 relative z-10">
            <span>TOTAL CHALLENGES: {challenges.length}</span>
            <span>FIRST BLOODS: {firstBloodSolves.length}</span>
            <span>SOLVE VELOCITY: {(totalSolvesCount / Math.max(1, submissions.length) * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* First Blood & Scoring Controls */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              FIRST BLOOD & SCORING MULTIPLIER
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Configure dynamic bonus score rates for first solver bloods.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <label className="text-slate-300 font-bold block">
              FIRST BLOOD BONUS MULTIPLIER
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1.2, 1.5, 2.0].map((mult) => (
                <button
                  key={mult}
                  onClick={() => {
                    setFirstBloodMultiplier(mult);
                    setSystemAlertMessage(`First blood multiplier set to ${mult}x bonus!`);
                    setTimeout(() => setSystemAlertMessage(null), 2500);
                  }}
                  className={`py-2 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                    firstBloodMultiplier === mult
                      ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20"
                      : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
                  }`}
                >
                  +{((mult - 1) * 100).toFixed(0)}% ({mult}x)
                </button>
              ))}
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-400 space-y-1">
              <span className="text-amber-400 font-bold block">🩸 CURRENT FIRST BLOOD RULE:</span>
              <span>First operator to capture a vector gets <strong>{firstBloodMultiplier}x</strong> base challenge points!</span>
            </div>
          </div>

          {/* Quick Broadcast Announcement */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <label className="text-xs text-slate-300 font-bold block">
              BROADCAST PLATFORM ALERT
            </label>
            <form onSubmit={handleBroadcastAlert} className="space-y-2">
              <input
                type="text"
                value={announcementInput}
                onChange={(e) => setAnnouncementInput(e.target.value)}
                placeholder="e.g. 🚨 New Web Challenge Released!"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                SEND PLATFORM ANNOUNCEMENT
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Quarantined IPs & Security Anomaly Controls */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-5 space-y-4 font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-400" />
            AUTOMATED BRUTE-FORCE PROTECTION & QUARANTINED IPS
          </h3>
          <span className="text-xs text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
            {quarantinedIps.length} IPS ISOLATED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
            <span className="text-xs font-bold text-slate-300 block">DETECTED ANOMALOUS IP</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">{simulatedBruteForceIp}</span>
              <button
                onClick={() => handleQuarantineIp(simulatedBruteForceIp)}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
              >
                INSTANT QUARANTINE
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              High invalid flag rate detected (&gt;15 failed attempts/min).
            </p>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2">
            <span className="text-xs font-bold text-slate-300 block">ACTIVE QUARANTINED IPS</span>
            <div className="flex flex-wrap gap-2">
              {quarantinedIps.map((ip) => (
                <span key={ip} className="text-[11px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-bold">
                  {ip} (BLOCKED)
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal, Shield, Key, Cpu, FileCode, Map, Globe, 
  CheckCircle2, XCircle, Sparkles, Copy, Lock, Unlock, HelpCircle,
  Play, Square, RotateCcw, Clock, Activity, Eye, Network, Smartphone, Coins,
  Download, Image as ImageIcon
} from "lucide-react";
import { Challenge, Category } from "../types";
import baseImage from "../assets/images/forensics_base_image_1784827631762.jpg";
import corruptedImage from "../assets/images/forensics_corrupted_image_1784827646286.jpg";

const localImageMap: Record<string, string> = {
  "escal8_base_metadata.png": baseImage,
  "corrupted_evidence.png": corruptedImage,
};

// Countdown timer subcomponent for live sandbox instances
function InstanceCountdown({ startedAt, timeoutMinutes }: { startedAt?: string; timeoutMinutes: number }) {
  const [timeLeft, setTimeLeft] = useState<string>("00:00");

  useEffect(() => {
    if (!startedAt) return;

    const startedTime = new Date(startedAt).getTime();
    const durationMs = timeoutMinutes * 60 * 1000;
    const endTime = startedTime + durationMs;

    const updateTimer = () => {
      const now = Date.now();
      const diff = endTime - now;
      if (diff <= 0) {
        setTimeLeft("00:00 (Expired)");
        return;
      }
      const min = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      const paddedMin = String(min).padStart(2, "0");
      const paddedSec = String(sec).padStart(2, "0");
      setTimeLeft(`${paddedMin}:${paddedSec} Remaining`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startedAt, timeoutMinutes]);

  return <span>{timeLeft}</span>;
}

interface ChallengeCardProps {
  key?: string;
  challenge: Challenge;
  username: string;
  isSolved: boolean;
  onSolveSuccess: (challengeId: string, points: number) => void;
  onOpenOracle: (challenge: Challenge) => void;
  onInstanceAction?: (challengeId: string, action: "start" | "stop" | "restart", timeoutMinutes?: number) => void;
}

export default function ChallengeCard({ 
  challenge, 
  username, 
  isSolved, 
  onSolveSuccess,
  onOpenOracle,
  onInstanceAction
}: ChallengeCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [flagInput, setFlagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showHints, setShowHints] = useState<boolean[]>([]);
  const [copiedFileIndex, setCopiedFileIndex] = useState<number | null>(null);
  const [showSandboxFrame, setShowSandboxFrame] = useState<boolean>(false);
  const [sandboxPayload, setSandboxPayload] = useState<string>("");
  const [sandboxUser, setSandboxUser] = useState<string>("' OR '1'='1");
  const [sandboxPass, setSandboxPass] = useState<string>("pass123");
  const [sandboxOutput, setSandboxOutput] = useState<any>(null);
  const [sandboxLoading, setSandboxLoading] = useState<boolean>(false);

  const runSandboxInteract = async (overrideBody?: any) => {
    setSandboxLoading(true);
    setSandboxOutput(null);
    try {
      const body = overrideBody || {
        payload: sandboxPayload,
        username: sandboxUser,
        password: sandboxPass
      };
      const res = await fetch(`/api/sandbox/${challenge.id}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setSandboxOutput(data);
      if (data.flag) {
        setFlagInput(data.flag);
      }
    } catch (err) {
      setSandboxOutput({ error: "Failed to connect to sandbox container socket." });
    } finally {
      setSandboxLoading(false);
    }
  };

  const categoryIcons: Record<Category, React.ComponentType<any>> = {
    crypto: Key,
    rev: Cpu,
    forensics: Eye,
    stego: FileCode,
    osint: Map,
    misc: Shield,
    web: Globe,
    pwn: Terminal,
    blockchain: Coins
  };

  const categoryColors: Record<Category, { bg: string; text: string; border: string; glow: string }> = {
    crypto: { bg: "bg-purple-950/40", text: "text-purple-400", border: "border-purple-800/60", glow: "shadow-purple-500/10" },
    rev: { bg: "bg-rose-950/40", text: "text-rose-400", border: "border-rose-800/60", glow: "shadow-rose-500/10" },
    forensics: { bg: "bg-emerald-950/40", text: "text-emerald-400", border: "border-emerald-800/60", glow: "shadow-emerald-500/10" },
    stego: { bg: "bg-amber-950/40", text: "text-amber-400", border: "border-amber-800/60", glow: "shadow-amber-500/10" },
    osint: { bg: "bg-blue-950/40", text: "text-blue-400", border: "border-blue-800/60", glow: "shadow-blue-500/10" },
    misc: { bg: "bg-slate-950/40", text: "text-slate-400", border: "border-slate-800/60", glow: "shadow-slate-500/10" },
    web: { bg: "bg-cyan-950/40", text: "text-cyan-400", border: "border-cyan-800/60", glow: "shadow-cyan-500/10" },
    pwn: { bg: "bg-red-950/40", text: "text-red-400", border: "border-red-800/60", glow: "shadow-red-500/10" },
    blockchain: { bg: "bg-yellow-950/40", text: "text-yellow-400", border: "border-yellow-800/60", glow: "shadow-yellow-500/10" }
  };

  const Icon = categoryIcons[challenge.category] || Shield;
  const colors = categoryColors[challenge.category] || categoryColors.misc;

  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setResult({ success: false, message: "Please register or enter a Code Name above first!" });
      return;
    }
    if (!flagInput.trim()) return;

    setSubmitting(true);
    setResult(null);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          challengeId: challenge.id,
          flag: flagInput.trim()
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        setResult({ success: data.success, message: data.message });
        if (data.success) {
          onSolveSuccess(challenge.id, challenge.points);
        }
      } else {
        setResult({ success: false, message: data.error || "Submission error." });
      }
    } catch (err) {
      setResult({ success: false, message: "Engine connection lost. Please check server." });
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedFileIndex(index);
    setTimeout(() => setCopiedFileIndex(null), 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const element = document.createElement("a");
    let fileUri = content;
    
    if (!content.startsWith("data:")) {
      const file = new Blob([content], { type: 'text/plain' });
      fileUri = URL.createObjectURL(file);
    }
    
    element.href = fileUri;
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div 
      id={`chal-card-${challenge.id}`}
      className={`border rounded-xl transition-all duration-300 overflow-hidden bg-cyber-card ${
        isSolved ? "border-emerald-500/30 bg-emerald-950/5 shadow-inner" : "border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* Header Bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-5 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${colors.bg} ${colors.text} ${colors.border} border`}>
            <Icon className="w-6 height-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-medium text-lg text-slate-100 tracking-tight">
                {challenge.title}
              </h3>
              {challenge.isDown && (
                <span className="inline-flex items-center gap-1 bg-amber-950/80 border border-amber-500/60 text-amber-300 text-xs px-2 py-0.5 rounded-full font-mono font-bold">
                  🔴 TAKEN DOWN / PAUSED
                </span>
              )}
              {isSolved && (
                <span className="inline-flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-mono">
                  <CheckCircle2 className="w-3 h-3" /> Solved
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-mono">
              <span className={`uppercase font-bold tracking-wider ${colors.text}`}>{challenge.category}</span>
              <span>•</span>
              <span className={`
                ${challenge.difficulty === 'Easy' && 'text-emerald-400'}
                ${challenge.difficulty === 'Medium' && 'text-cyan-400'}
                ${challenge.difficulty === 'Hard' && 'text-amber-500'}
                ${challenge.difficulty === 'Expert' && 'text-rose-500'}
              `}>{challenge.difficulty}</span>
              <span>•</span>
              <span>By {challenge.author}</span>
            </div>
          </div>
        </div>

        <div className="text-right flex items-center gap-4">
          <div className="font-mono text-right">
            <div className="text-xl font-bold text-slate-200">
              {challenge.points} <span className="text-xs text-slate-400">PTS</span>
            </div>
            <div className="text-xs text-slate-500">
              {challenge.solvedCount || 0} Solves
            </div>
          </div>
          <div className="text-slate-500 text-lg font-mono">
            {isOpen ? "[-]" : "[+]"}
          </div>
        </div>
      </div>

      {/* Expanded Section */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="border-t border-slate-800 bg-[#0e1320]"
          >
            <div className="p-6 space-y-6">
              {/* Challenge Description */}
              <div className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap font-sans">
                {challenge.description}
              </div>

              {/* Live Sandbox Instance Management */}
              {challenge.isLiveInstance && (
                <div className="p-4 bg-slate-950/60 border border-cyan-500/20 rounded-xl space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-mono text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      Dynamic Container Sandbox:
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Status:{" "}
                      <span className={`font-bold ${challenge.instanceConfig?.status === "running" ? "text-emerald-400" : "text-amber-500"}`}>
                        {challenge.instanceConfig?.status === "running" ? "RUNNING" : "STOPPED"}
                      </span>
                    </span>
                  </div>

                  {challenge.instanceConfig?.status === "running" ? (
                    <div className="space-y-3">
                      {/* Connection Details */}
                      <div className="p-3 bg-black/40 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs text-slate-300">
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">Target Address:</span>
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            <span className="text-emerald-400 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 text-[11px] break-all flex items-center gap-1">
                              {challenge.category === "web" ? <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> : <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                              {challenge.instanceConfig.connectionUrl || `/sandbox/${challenge.id}`}
                            </span>
                          </div>
                        </div>
                        {challenge.instanceConfig.port && (
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Allocated Port:</span>
                            <span className="text-amber-400 font-bold">{challenge.instanceConfig.port}</span>
                          </div>
                        )}
                      </div>

                      {/* Web & Interactive Launch Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <a
                          href={`/sandbox/${challenge.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Launch Web Sandbox (New Tab)
                        </a>

                        <button
                          type="button"
                          onClick={() => setShowSandboxFrame(!showSandboxFrame)}
                          className="px-3 py-2 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          {showSandboxFrame ? "Hide Embedded Inspector" : "⚡ Open Embedded Inspector"}
                        </button>
                      </div>

                      {/* Embedded Interactive Inspector / Console */}
                      {showSandboxFrame && (
                        <div className="p-4 bg-slate-950/90 border border-purple-500/30 rounded-xl space-y-4 text-xs font-mono animate-fadeIn">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-purple-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                              <Terminal className="w-4 h-4" />
                              Interactive Container Inspector: {challenge.title}
                            </span>
                            <span className="text-[10px] text-slate-500">Live Socket Active</span>
                          </div>

                          {challenge.id === "web-01" && (
                            <div className="space-y-3">
                              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-slate-300 text-[11px] leading-relaxed">
                                ℹ️ <strong>Vault Session Cookie Challenge:</strong> Set <code>admin_session=true</code> in cookies or test the HTTP request payload below.
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => runSandboxInteract({ action: "set_admin_cookie" })}
                                  className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 rounded font-bold text-[11px] cursor-pointer"
                                >
                                  Inject Cookie (admin_session=true)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => runSandboxInteract({ cookies: { admin_session: "false" } })}
                                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] cursor-pointer"
                                >
                                  Test Guest Request
                                </button>
                              </div>
                            </div>
                          )}

                          {challenge.id === "web-02" && (
                            <div className="space-y-3">
                              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-slate-300 text-[11px] leading-relaxed">
                                🔑 <strong>SQL Injection Tester:</strong> Input raw SQL username injection payload (e.g. <code>' OR '1'='1</code> or <code>admin'--</code>).
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Username Payload:</label>
                                  <input
                                    type="text"
                                    value={sandboxUser}
                                    onChange={(e) => setSandboxUser(e.target.value)}
                                    className="w-full bg-black/60 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:border-cyan-500 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Password:</label>
                                  <input
                                    type="text"
                                    value={sandboxPass}
                                    onChange={(e) => setSandboxPass(e.target.value)}
                                    className="w-full bg-black/60 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:border-cyan-500 outline-none"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => runSandboxInteract()}
                                className="px-4 py-2 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 font-bold rounded text-xs cursor-pointer"
                              >
                                Execute SQL Auth Bypass
                              </button>
                            </div>
                          )}

                          {challenge.id !== "web-01" && challenge.id !== "web-02" && (
                            <div className="space-y-3">
                              <label className="text-[10px] text-slate-400 uppercase font-bold block">Terminal Socket Payload Input:</label>
                              <textarea
                                value={sandboxPayload}
                                onChange={(e) => setSandboxPayload(e.target.value)}
                                placeholder="Enter input payload string (e.g. 32 A's, %x %x %x %x, withdraw)..."
                                className="w-full h-20 bg-black border border-slate-800 rounded p-2 text-cyan-400 font-mono text-xs focus:border-cyan-500 outline-none resize-none"
                              />
                              <button
                                type="button"
                                onClick={() => runSandboxInteract()}
                                className="px-4 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-bold rounded text-xs cursor-pointer"
                              >
                                Transmit Socket Payload
                              </button>
                            </div>
                          )}

                          {sandboxLoading && (
                            <div className="text-cyan-400 animate-pulse text-[11px]">
                              Connecting to container runtime socket...
                            </div>
                          )}

                          {sandboxOutput && (
                            <div className="p-3 bg-black/80 border border-slate-800 rounded font-mono text-[11px] text-slate-200 whitespace-pre-wrap break-all">
                              {sandboxOutput.success ? (
                                <div className="text-emerald-400 font-bold mb-1">
                                  ✅ {sandboxOutput.message || "SUCCESS!"}
                                </div>
                              ) : (
                                <div className="text-rose-400 font-bold mb-1">
                                  ❌ {sandboxOutput.message || "Execution output returned."}
                                </div>
                              )}
                              {sandboxOutput.output && <div>{sandboxOutput.output}</div>}
                              {sandboxOutput.flag && (
                                <div className="mt-2 p-2 bg-emerald-950/80 border border-emerald-500/40 rounded text-emerald-300 font-bold text-xs">
                                  FLAG CAPTURED: {sandboxOutput.flag} (Copied to submission input!)
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Controls and Countdown */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                        {/* Countdown display */}
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono bg-slate-900/60 border border-slate-800/80 px-3 py-2 rounded-lg">
                          <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
                          <InstanceCountdown startedAt={challenge.instanceConfig.startedAt} timeoutMinutes={challenge.instanceConfig.timeoutMinutes || 15} />
                        </div>

                        {/* Interactive Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onInstanceAction?.(challenge.id, "restart")}
                            className="flex-1 sm:flex-none px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restart
                          </button>
                          <button
                            onClick={() => onInstanceAction?.(challenge.id, "stop")}
                            className="flex-1 sm:flex-none px-3 py-2 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/30 hover:border-rose-800/60 text-rose-400 text-xs font-mono rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Square className="w-3.5 h-3.5" />
                            Destroy
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3 bg-slate-900/40 rounded-lg border border-slate-800/80">
                      <div className="space-y-1">
                        <span className="text-slate-300 font-sans text-xs block">
                          This challenge runs in an isolated sandbox. Deploy the instance to reveal your connection target.
                        </span>
                        <span className="text-slate-500 font-mono text-[10px] block">
                          Timeout limit: {challenge.instanceConfig?.timeoutMinutes || 15} minutes of inactivity
                        </span>
                      </div>
                      <button
                        onClick={() => onInstanceAction?.(challenge.id, "start")}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#0b0f19] font-mono font-bold text-xs rounded-lg transition-all shadow-md shadow-cyan-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Deploy Instance
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Simulated Files Attachments */}
              {challenge.files && challenge.files.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                    Target Payload Resources / Attachments:
                  </span>
                  <div className="grid grid-cols-1 gap-3">
                    {challenge.files.map((file, idx) => {
                      const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(file.name) || Boolean(file.imageUrl) || Boolean(file.url) || Boolean(localImageMap[file.name]);
                      const mappedImage = localImageMap[file.name] || file.imageUrl || file.url;
                      const isDataUrl = file.content?.startsWith("data:");
                      const displayImgSrc = mappedImage || (isDataUrl || file.content?.startsWith("http") || file.content?.startsWith("/") ? file.content : null);

                      return (
                        <div key={idx} className="bg-cyber-bg border border-slate-800 rounded-lg overflow-hidden">
                          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
                            <span className="font-mono text-xs text-slate-400 flex items-center gap-1.5">
                              {isImage ? (
                                <ImageIcon className="w-4 h-4 text-cyan-400" />
                              ) : (
                                <FileCode className="w-4 h-4 text-cyan-400" />
                              )}
                              {file.name}
                              {file.size && <span className="text-[10px] text-slate-500">({file.size})</span>}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              {file.content && !isDataUrl && !displayImgSrc && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(file.content || "", idx)}
                                  className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 cursor-pointer border border-slate-850"
                                >
                                  <Copy className="w-3 h-3" />
                                  {copiedFileIndex === idx ? "Copied!" : "Copy"}
                                </button>
                              )}
                              
                              <button
                                type="button"
                                onClick={() => handleDownload(file.name, displayImgSrc || file.content || "")}
                                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors px-2.5 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/40 cursor-pointer border border-cyan-900/30 font-bold"
                              >
                                <Download className="w-3 h-3" />
                                Download File
                              </button>
                            </div>
                          </div>

                          <div className="p-4 bg-black/20">
                            {isImage ? (
                              <div className="flex flex-col items-center justify-center p-3 bg-black/50 rounded-lg border border-slate-800/80 space-y-3">
                                {displayImgSrc ? (
                                  <div className="relative group max-w-full">
                                    <img 
                                      src={displayImgSrc} 
                                      className="max-w-full h-auto max-h-96 object-contain rounded-md shadow-xl border border-slate-800/80" 
                                      alt={file.name} 
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-md">
                                      <a 
                                        href={displayImgSrc} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="px-3 py-1.5 bg-cyan-500 text-slate-950 font-mono text-xs font-bold rounded shadow hover:bg-cyan-400"
                                      >
                                        View Fullsize Image
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center p-2">
                                    <span className="text-xs font-mono text-slate-400">[Forensic Image Attachment: {file.name}]</span>
                                  </div>
                                )}

                                {file.content && !isDataUrl && !file.content.startsWith("http") && !file.content.startsWith("/") && (
                                  <div className="w-full text-left">
                                    <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase mb-1">
                                      Embedded Forensic Inspection Stream:
                                    </div>
                                    <pre className="p-3 overflow-x-auto text-left text-[11px] font-mono text-slate-300 bg-black/80 rounded border border-slate-800/80 leading-5 w-full">
                                      <code>{file.content}</code>
                                    </pre>
                                  </div>
                                )}
                              </div>
                            ) : isDataUrl ? (
                              <div className="p-4 text-center">
                                <span className="text-xs font-mono text-slate-400">
                                  [Binary Payload Resource: {file.name}]
                                </span>
                                <p className="text-[10px] text-slate-500 font-mono mt-1">
                                  Use the "Download" button to save and analyze this file locally.
                                </p>
                              </div>
                            ) : (
                              <pre className="overflow-x-auto text-xs font-mono text-slate-300 bg-black/30 p-3 rounded border border-slate-800/50 leading-5">
                                <code>{file.content}</code>
                              </pre>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Interactive Help & AI Oracle Assistance */}
              <div className="flex flex-col md:flex-row gap-4 py-2">
                {/* Traditional Static Hints with Point Cost */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                      Hints Manual:
                    </span>
                    {challenge.hintCost ? (
                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        (Cost: -{challenge.hintCost} PTS per hint)
                      </span>
                    ) : null}
                  </div>
                  {challenge.hints && challenge.hints.length > 0 ? (
                    <div className="space-y-2">
                      {challenge.hints.map((hint, hIdx) => {
                        const isRevealed = showHints[hIdx];
                        const cost = challenge.hintCost || 0;

                        const handleUnlockHint = async () => {
                          if (cost > 0) {
                            const confirmUnlock = window.confirm(
                              `Unlocking Hint #${hIdx + 1} will deduct ${cost} PTS from your total score. Proceed?`
                            );
                            if (!confirmUnlock) return;
                          }

                          try {
                            const res = await fetch(`/api/challenges/${challenge.id}/hint/unlock`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ username, hintIndex: hIdx })
                            });
                            if (res.ok) {
                              const updated = [...showHints];
                              updated[hIdx] = true;
                              setShowHints(updated);
                              onSolveSuccess(challenge.id, 0); // Trigger leaderboard sync
                            }
                          } catch (err) {
                            // Fallback client reveal
                            const updated = [...showHints];
                            updated[hIdx] = true;
                            setShowHints(updated);
                          }
                        };

                        return (
                          <div key={hIdx} className="text-xs font-mono">
                            {isRevealed ? (
                              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 animate-fadeIn">
                                <span className="text-amber-500 font-bold mr-1">Hint {hIdx + 1}:</span> {hint}
                              </div>
                            ) : (
                              <button
                                onClick={handleUnlockHint}
                                className="w-full text-left p-3 rounded-lg border border-slate-800 hover:border-amber-500/50 bg-slate-950/40 text-slate-400 hover:text-slate-200 transition-all flex items-center justify-between cursor-pointer group"
                              >
                                <span className="flex items-center gap-1.5 font-bold">
                                  <HelpCircle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                                  Unlock Hint #{hIdx + 1}
                                </span>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                                  cost > 0
                                    ? "bg-amber-950/80 text-amber-300 border-amber-500/40"
                                    : "bg-slate-900 text-emerald-400 border-slate-800"
                                }`}>
                                  {cost > 0 ? `-${cost} PTS` : "Free"}
                                </span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-slate-500 italic">No built-in hints for this level.</p>
                  )}
                </div>

                {/* Gemini AI Mentor Trigger */}
                <div className="md:w-80 p-4 bg-gradient-to-br from-[#121b2d] to-[#0d1424] border border-cyan-500/20 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span className="font-display font-bold text-xs uppercase tracking-wider text-cyan-400">
                        ESCAL8 AI Security Oracle
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Need advanced conceptual guidance? Run our offline mentor bot. It teaches the target vulnerabilities without spoiling the exact flag!
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenOracle(challenge)}
                    className="mt-4 w-full py-2 px-3 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 text-xs font-mono rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Query Oracle on This Chal
                  </button>
                </div>
              </div>

              {/* Secure Flag Submission Form */}
              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label htmlFor={`flag-${challenge.id}`} className="font-mono text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                    {isSolved ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-slate-500" />}
                    Capture the Flag Validator:
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    Expected Format: <code className="text-cyan-500">ESCAL8&#123;your_secret_string&#125;</code>
                  </span>
                </div>

                <form onSubmit={handleSubmitFlag} className="flex gap-2">
                  <input
                    id={`flag-${challenge.id}`}
                    type="text"
                    value={flagInput}
                    onChange={(e) => setFlagInput(e.target.value)}
                    disabled={isSolved || submitting || challenge.isDown}
                    placeholder={
                      challenge.isDown
                        ? "🔴 CHALLENGE TAKEN DOWN BY ADMINISTRATOR"
                        : isSolved
                        ? "CHALLENGE SOLVED!"
                        : "ESCAL8{f1nd_the_fl4g_h3r3}"
                    }
                    className={`flex-1 bg-cyber-bg border px-4 py-2.5 rounded-lg text-sm font-mono focus:outline-none transition-colors ${
                      challenge.isDown
                        ? "border-amber-800 text-amber-500 cursor-not-allowed bg-amber-950/20 font-bold"
                        : isSolved 
                        ? "border-emerald-800 text-emerald-500 cursor-not-allowed bg-emerald-950/10" 
                        : "border-slate-800 focus:border-cyan-500/60 text-slate-200"
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isSolved || submitting || challenge.isDown || !flagInput.trim()}
                    className={`px-5 py-2.5 font-display text-sm font-medium rounded-lg transition-all duration-200 shrink-0 ${
                      challenge.isDown
                        ? "bg-amber-950/40 text-amber-500/60 border border-amber-800/60 cursor-not-allowed"
                        : isSolved
                        ? "bg-emerald-950/40 text-emerald-500/60 border border-emerald-800/60 cursor-not-allowed"
                        : "bg-emerald-500 hover:bg-emerald-400 text-[#0b0f19] shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                    }`}
                  >
                    {submitting ? "Checking..." : challenge.isDown ? "Offline" : "Submit Flag"}
                  </button>
                </form>

                {/* Submission Feedback Messages */}
                <AnimatePresence mode="wait">
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                        result.success
                          ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
                          : "bg-rose-950/40 border-rose-500/40 text-rose-400"
                      }`}
                    >
                      {result.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                      <span>{result.message}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

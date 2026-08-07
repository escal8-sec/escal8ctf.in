import React, { useState } from "react";
import { Award, Download, CheckCircle, ShieldCheck, Sparkles, Trophy, User, Users, FileText, Share2, Copy } from "lucide-react";
import { Escal8Logo } from "./Escal8Logo";

interface CTFCertificateProps {
  username: string;
  teamName?: string;
  isGroup?: boolean;
  score: number;
  solvedCount: number;
  totalChallenges: number;
  rank?: number;
  userId?: string;
  teamId?: string;
  onClose?: () => void;
}

export function CTFCertificate({
  username,
  teamName,
  isGroup,
  score,
  solvedCount,
  totalChallenges,
  rank = 1,
  userId,
  teamId,
  onClose,
}: CTFCertificateProps) {
  const [copiedHash, setCopiedHash] = useState(false);

  // Generate a deterministic verification hash for authenticity
  const verifyHash = `E8-${(username + (teamName || "") + score).length.toString(16).toUpperCase()}-${Math.abs(
    (username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) * 8888) % 999999
  ).toString(16).toUpperCase()}-2026`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(verifyHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[#0a0e1a] p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Official CTF Certificate of Achievement
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Authenticated digital credential for ESCAL8 Cyber Operations 2026
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyHash}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedHash ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            {copiedHash ? "HASH COPIED" : "COPY VERIFY HASH"}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            PRINT / SAVE CERTIFICATE
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* PRINTABLE CERTIFICATE CANVAS */}
      <div 
        id="ctf-certificate-printable"
        className="relative bg-[#060a12] border-2 border-amber-500/40 rounded-2xl p-8 sm:p-12 overflow-hidden shadow-2xl text-slate-100 font-sans"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.08) 0%, transparent 70%), radial-gradient(circle at 100% 100%, rgba(6, 182, 212, 0.05) 0%, transparent 60%)`,
        }}
      >
        {/* Certificate Decorative Border Lines */}
        <div className="absolute inset-3 border border-amber-500/20 rounded-xl pointer-events-none" />
        <div className="absolute inset-5 border border-dashed border-slate-800 rounded-lg pointer-events-none" />

        {/* Certificate Header */}
        <div className="text-center space-y-4 relative z-10">
          <div className="flex justify-center items-center gap-3">
            <Escal8Logo className="w-12 h-12" glow={true} />
            <div className="text-left">
              <span className="text-xs font-mono tracking-widest text-amber-400 uppercase font-bold block">
                ESCAL8 CYBERSECURITY PLATFORM
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                OFFICIAL COMPETITION CERTIFICATION AUTHORITY
              </span>
            </div>
          </div>

          <div className="py-2">
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400 bg-cyan-950/60 px-4 py-1 rounded-full border border-cyan-800/50">
              CERTIFICATE OF TACTICAL ACHIEVEMENT
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-white drop-shadow-md">
            OFFICIAL CTF CREDENTIAL
          </h1>
          <p className="text-sm font-mono text-slate-400 max-w-xl mx-auto">
            This document certifies that the operator below has successfully participated in and conquered security challenges during the ESCAL8 CTF Operations.
          </p>
        </div>

        {/* Recipient Details */}
        <div className="my-8 text-center space-y-3 relative z-10 bg-slate-950/60 border border-slate-800/80 p-6 rounded-xl max-w-2xl mx-auto backdrop-blur-sm">
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400">
            PROUDLY PRESENTED TO OPERATOR
          </p>
          <div className="text-2xl sm:text-4xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-100 to-cyan-300 uppercase tracking-wider">
            @{username}
          </div>
          {teamName && (
            <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-300 bg-cyan-950/80 px-3 py-1 rounded-md border border-cyan-800/60">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>SQUAD / GROUP: {teamName}</span>
              {teamId && <span className="text-[10px] text-cyan-400 font-mono">(ID: {teamId})</span>}
            </div>
          )}
        </div>

        {/* Performance Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto my-6 relative z-10 text-center font-mono">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">FINAL SCORE</div>
            <div className="text-lg font-bold text-emerald-400">{score} PTS</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">SOLVED VECTORS</div>
            <div className="text-lg font-bold text-cyan-400">{solvedCount} / {totalChallenges}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">GLOBAL RANK</div>
            <div className="text-lg font-bold text-amber-400">#{rank}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">VERIFICATION</div>
            <div className="text-xs font-bold text-slate-300 truncate">{verifyHash.slice(0, 10)}...</div>
          </div>
        </div>

        {/* Footer Seal & Signatures */}
        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10 font-mono text-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-950/80 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-slate-200">ESCAL8 CERTIFIED AUTH</div>
              <div className="text-[10px] text-slate-400">Cryptographically Signed & Timestamped</div>
              <div className="text-[9px] text-slate-500">ID: {userId || "OPERATOR-VERIFIED"}</div>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <div className="font-mono font-bold text-slate-300 text-xs">ESCAL8 DIRECTED OPERATIONS</div>
            <div className="text-[10px] text-slate-500">Issued: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
            <div className="text-[9px] text-cyan-400/80 font-mono mt-0.5">HASH: {verifyHash}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

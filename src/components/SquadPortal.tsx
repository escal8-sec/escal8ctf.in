import React, { useState } from "react";
import { Users, UserPlus, Key, Shield, Trophy, CheckCircle, Copy, LogOut, Award, Activity, MessageSquare } from "lucide-react";
import { UserScore, TeamRecord, Submission } from "../types";

interface SquadPortalProps {
  currentUsername: string;
  teamName: string;
  teamId?: string;
  isGroupUser?: boolean;
  userScore: number;
  teamScore: number;
  members?: string[];
  solvedCount: number;
  submissions: Submission[];
  onUpdateTeam?: (newTeamName: string, newTeamId: string) => void;
  onLeaveTeam?: () => void;
}

export function SquadPortal({
  currentUsername,
  teamName,
  teamId = "TEAM-E8-9921",
  isGroupUser = true,
  userScore,
  teamScore,
  members = [],
  solvedCount,
  submissions,
  onUpdateTeam,
  onLeaveTeam,
}: SquadPortalProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [newMemberInput, setNewMemberInput] = useState("");
  const [localMembers, setLocalMembers] = useState<string[]>(
    members.length > 0 ? members : [currentUsername, "cyber_ghost", "operator_null"]
  );
  const [invitedSuccess, setInvitedSuccess] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(teamId);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberInput.trim()) return;
    const name = newMemberInput.trim().toLowerCase();
    if (!localMembers.includes(name)) {
      setLocalMembers([...localMembers, name]);
      setInvitedSuccess(true);
      setTimeout(() => setInvitedSuccess(false), 2500);
    }
    setNewMemberInput("");
  };

  // Filter team submissions
  const squadSubmissions = submissions.filter(
    (s) => s.teamName?.toLowerCase() === teamName.toLowerCase() || s.username === currentUsername
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Squad Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-cyan-950/80 border border-purple-800/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-purple-300 bg-purple-900/60 px-3 py-1 rounded-full border border-purple-700/50">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              SQUAD / GROUP OPERATIONS PORTAL
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white tracking-tight uppercase flex items-center gap-3">
              <span>{teamName || "TACTICAL SQUAD"}</span>
            </h1>
            <p className="text-xs font-mono text-slate-400 flex items-center gap-2">
              <span>OPERATOR: @{currentUsername}</span>
              <span>•</span>
              <span className="text-purple-300">SQUAD ID: {teamId}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopyKey}
              className="px-4 py-2.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-600/60 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              {copiedKey ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Key className="w-4 h-4 text-purple-300" />}
              {copiedKey ? "SQUAD ID COPIED!" : `SQUAD JOIN KEY: ${teamId}`}
            </button>

            {onLeaveTeam && (
              <button
                onClick={onLeaveTeam}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-xs font-mono flex items-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Leave Squad
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">COMBINED SQUAD SCORE</div>
            <div className="text-xl font-bold text-white">{teamScore} <span className="text-xs text-emerald-400">PTS</span></div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">SQUAD OPERATORS</div>
            <div className="text-xl font-bold text-white">{localMembers.length} <span className="text-xs text-slate-400">MEMBERS</span></div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e1424] border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-950/80 text-purple-400 border border-purple-800/50">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">SOLVED CHALLENGES</div>
            <div className="text-xl font-bold text-white">{solvedCount} <span className="text-xs text-purple-400">CAPTURED</span></div>
          </div>
        </div>
      </div>

      {/* Main Squad Roster & Invites */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Roster Box */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-mono font-bold text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              SQUAD ROSTER ({localMembers.length})
            </h3>
            <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800/50">
              ACTIVE
            </span>
          </div>

          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {localMembers.map((member, idx) => {
              const isCaptain = idx === 0;
              const isYou = member.toLowerCase() === currentUsername.toLowerCase();

              return (
                <div
                  key={member}
                  className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between font-mono text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-purple-950 border border-purple-800/60 flex items-center justify-center text-purple-300 font-bold text-xs uppercase">
                      {member[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span>@{member}</span>
                        {isYou && (
                          <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.2 rounded">
                            YOU
                          </span>
                        )}
                        {isCaptain && (
                          <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800/60 px-1.5 py-0.2 rounded font-bold">
                            CAPTAIN
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isYou ? `Personal Score: ${userScore} PTS` : "Squad Contributor"}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/40">
                    ONLINE
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invite Teammate Form */}
        <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-mono font-bold text-slate-200 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-cyan-400" />
              INVITE OPERATOR TO SQUAD
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Share your Squad Join Key or add an operator username directly.
            </p>
          </div>

          <form onSubmit={handleAddMember} className="space-y-3 font-mono">
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">
                OPERATOR USERNAME
              </label>
              <input
                type="text"
                value={newMemberInput}
                onChange={(e) => setNewMemberInput(e.target.value)}
                placeholder="e.g. cyber_ninja"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              ADD OPERATOR TO ROSTER
            </button>

            {invitedSuccess && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-lg font-mono flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                Operator added to squad roster successfully!
              </div>
            )}
          </form>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-400 font-mono space-y-1">
            <span className="font-bold text-slate-200 block">💡 SQUAD TIP:</span>
            <span>All squad members pool their solved challenges into the team score for group leaderboard placement!</span>
          </div>
        </div>
      </div>

      {/* Squad Submissions Feed */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-mono font-bold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            SQUAD SOLVES & ACTIVITY FEED
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {squadSubmissions.length} SOLVES RECORDED
          </span>
        </div>

        {squadSubmissions.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-slate-500">
            No squad solves recorded yet. Capture a flag to log squad activity!
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto font-mono text-xs">
            {squadSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">
                      @{sub.username} <span className="text-slate-400">solved</span> {sub.challengeTitle}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(sub.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-emerald-400">+{sub.points} PTS</span>
                  {sub.isFirstBlood && (
                    <span className="block text-[9px] text-amber-400 font-bold">🩸 FIRST BLOOD</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

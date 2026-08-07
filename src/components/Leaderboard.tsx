import React, { useState } from "react";
import { Award, Trophy, Clock, Target, RefreshCw, Users, Shield } from "lucide-react";
import { UserScore, TeamScore } from "../types";

interface LeaderboardProps {
  userLeaderboard: UserScore[];
  teamLeaderboard: TeamScore[];
  onRefresh: () => void;
  loading: boolean;
  isFrozen?: boolean;
  freezeMessage?: string;
}

export default function Leaderboard({ 
  userLeaderboard, 
  teamLeaderboard, 
  onRefresh, 
  loading,
  isFrozen = false,
  freezeMessage = "🧊 SCOREBOARD FROZEN - Final Hour Hype Mode Active! Rankings are locked until competition end, but challenges remain active!"
}: LeaderboardProps) {
  const [viewMode, setViewMode] = useState<"teams" | "users">("teams");

  const activeDataList = viewMode === "teams" ? teamLeaderboard : userLeaderboard;

  return (
    <div className="bg-cyber-card border border-slate-800 rounded-xl overflow-hidden shadow-xl" id="leaderboard-panel">
      {/* Scoreboard Freeze Banner */}
      {isFrozen && (
        <div className="bg-gradient-to-r from-cyan-950 via-blue-900 to-indigo-950 border-b border-cyan-500/30 p-4 text-center text-cyan-200 font-mono text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
          <span className="text-base">🧊</span>
          <span>{freezeMessage}</span>
          <span className="text-base">🔒</span>
        </div>
      )}

      {/* Table Header Controls */}
      <div className="p-5 bg-slate-900/60 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-medium text-lg text-slate-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Live Global Standings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time standings of ESCAL8 cybersecurity operatives and tactical alliances.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* View Toggle */}
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center gap-1 font-mono text-xs">
            <button
              onClick={() => setViewMode("teams")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "teams"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Teams ({teamLeaderboard.length})
            </button>
            <button
              onClick={() => setViewMode("users")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "users"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Individuals ({userLeaderboard.length})
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-mono text-slate-300 rounded-lg transition-colors border border-slate-700 flex items-center gap-2 cursor-pointer h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Re-syncing..." : "Sync"}
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        {activeDataList.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <p className="text-slate-400 text-sm font-mono">No captures logged yet in this category.</p>
            <p className="text-xs text-slate-500 font-mono">Enlist / launch container sandboxes to score first blood!</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-950/20 text-slate-400 font-mono text-xs uppercase tracking-wider">
                <th className="py-3.5 px-5 text-center w-16">Rank</th>
                <th className="py-3.5 px-5">
                  {viewMode === "teams" ? "Tactical Team / Alliance" : "Operator Code Name"}
                </th>
                {viewMode === "users" && <th className="py-3.5 px-5">Assigned Team</th>}
                {viewMode === "teams" && <th className="py-3.5 px-5">Active Agents</th>}
                <th className="py-3.5 px-5 text-center">Solved Vectors</th>
                <th className="py-3.5 px-5 text-right">Points</th>
                <th className="py-3.5 px-5 text-right hidden md:table-cell">Last Capture Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {activeDataList.map((item, idx) => {
                const rank = idx + 1;
                let rankBadge = null;
                let rowBg = "hover:bg-slate-900/10";

                if (rank === 1) {
                  rankBadge = <Trophy className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" />;
                  rowBg = "bg-amber-500/5 hover:bg-amber-500/10";
                } else if (rank === 2) {
                  rankBadge = <Trophy className="w-5 h-5 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.3)]" />;
                  rowBg = "bg-slate-300/5 hover:bg-slate-300/10";
                } else if (rank === 3) {
                  rankBadge = <Trophy className="w-5 h-5 text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.3)]" />;
                  rowBg = "bg-amber-700/5 hover:bg-amber-700/10";
                }

                // Type casting helpers
                const isTeamRow = viewMode === "teams";
                const teamItem = item as TeamScore;
                const userItem = item as UserScore;

                const displayName = isTeamRow ? teamItem.teamName : userItem.username;
                const displayTeam = !isTeamRow ? userItem.teamName : null;

                const rowKey = isTeamRow
                  ? (teamItem.teamId ? `team_${teamItem.teamId}` : `team_${teamItem.teamName}_${idx}`)
                  : (userItem.id ? `user_${userItem.id}` : `user_${userItem.username}_${idx}`);

                return (
                  <tr 
                    key={rowKey} 
                    className={`transition-colors duration-150 text-sm ${rowBg}`}
                  >
                    {/* Rank */}
                    <td className="py-4 px-5 text-center font-mono font-bold">
                      <div className="flex justify-center items-center">
                        {rankBadge ? rankBadge : rank}
                      </div>
                    </td>

                    {/* Team or Code Name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                          rank === 1 ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" :
                          rank === 2 ? "bg-slate-400/20 text-slate-300 border border-slate-400/40" :
                          rank === 3 ? "bg-amber-700/20 text-amber-600 border border-amber-700/40" :
                          "bg-slate-800 text-slate-300"
                        }`}>
                          {displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-mono font-medium text-slate-200 hover:text-cyan-400 transition-colors block uppercase">
                            {displayName}
                          </span>
                          {rank === 1 && (
                            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-amber-400 animate-pulse block">
                              🥇 CHAMPION UNIT
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* User's Team Name Column */}
                    {!isTeamRow && displayTeam && (
                      <td className="py-4 px-5">
                        <span className="font-mono text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 uppercase">
                          {displayTeam}
                        </span>
                      </td>
                    )}

                    {/* Team Members List */}
                    {isTeamRow && (
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {teamItem.members.map(member => (
                            <span key={member} className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800/50">
                              {member}
                            </span>
                          ))}
                        </div>
                      </td>
                    )}

                    {/* Solved Count */}
                    <td className="py-4 px-5 text-center font-mono">
                      <div className="inline-flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-900 text-slate-300 text-xs">
                        <Target className="w-3 h-3 text-cyan-400" />
                        {item.solvedChallenges.length}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-4 px-5 text-right font-mono font-bold text-base text-emerald-400">
                      {item.score} <span className="text-xs text-slate-500">PTS</span>
                    </td>

                    {/* Last Solve Timestamp */}
                    <td className="py-4 px-5 text-right font-mono text-xs text-slate-400 hidden md:table-cell">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(item.lastSolvedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { 
  Plus, Trash2, Edit3, Shield, Terminal, History, 
  Settings, AlertTriangle, CheckCircle2, XCircle, FileCode, PlusCircle,
  Play, Square, RotateCcw, Clock, Activity, UploadCloud, Power,
  Users, UserX, UserCheck, DollarSign, Download, Upload, Megaphone,
  Filter, Search, Award, Lock, Unlock, Pause, PlayCircle, StopCircle,
  MessageSquare
} from "lucide-react";
import { Challenge, Submission, Category, EventConfig, TeamRecord, SupportTicket } from "../types";
import SupportChat from "./SupportChat";
import PublicChatRoom from "./PublicChatRoom";

interface AdminPanelProps {
  challenges: Challenge[];
  submissions: Submission[];
  onRefreshData: () => void;
  onResetDatabase: () => void;
  onInstanceAction?: (challengeId: string, action: "start" | "stop" | "restart", timeoutMinutes?: number) => void;
}

export default function AdminPanel({ 
  challenges, 
  submissions, 
  onRefreshData,
  onResetDatabase,
  onInstanceAction
}: AdminPanelProps) {
  // Main Sub-Tab State
  const [adminTab, setAdminTab] = useState<"challenges" | "event" | "teams" | "telemetry" | "support" | "public_chat" | "backup">("challenges");
  
  // Support Tickets State
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [selectedChatTeam, setSelectedChatTeam] = useState<string>("");

  // Challenge Form State
  const [editingChallenge, setEditingChallenge] = useState<Partial<Challenge> | null>(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Custom file helper states inside form
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [newHint, setNewHint] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Event Config State
  const [eventConfig, setEventConfig] = useState<EventConfig>({
    status: "active",
    statusMessage: "CTF Competition is Live",
    announcement: "",
    startTime: "",
    endTime: ""
  });
  const [eventSaveSuccess, setEventSaveSuccess] = useState("");

  // Teams Moderation State
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [pointsAdjustTeam, setPointsAdjustTeam] = useState<string | null>(null);
  const [adjustPointsDelta, setAdjustPointsDelta] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState("");

  useEffect(() => {
    fetchEventConfig();
    fetchTeams();
    fetchSupportTickets();
  }, []);

  const fetchSupportTickets = async () => {
    try {
      const res = await fetch("/api/support/tickets");
      if (res.ok) {
        const data = await res.json();
        setSupportTickets(data);
        if (data.length > 0 && !selectedChatTeam) {
          setSelectedChatTeam(data[0].teamName);
        }
      }
    } catch (err) {
      console.error("Failed to fetch support tickets:", err);
    }
  };

  const fetchEventConfig = async () => {
    try {
      const res = await fetch("/api/event/config");
      if (res.ok) {
        const data = await res.json();
        setEventConfig(data);
      }
    } catch (err) {
      console.error("Failed to fetch event config:", err);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/admin/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    }
  };

  const emptyChallenge = (): Partial<Challenge> => ({
    id: `chal-${Date.now()}`,
    title: "",
    category: "crypto",
    difficulty: "Easy",
    points: 100,
    description: "",
    flag: "ESCAL8{...}",
    hints: [],
    author: "Admin_Operator",
    files: [],
    isLiveInstance: false
  });

  const handleStartCreate = () => {
    setEditingChallenge(emptyChallenge());
    setFormError("");
    setFormSuccess("");
    setFileName("");
    setFileContent("");
  };

  const handleEdit = (chal: Challenge) => {
    setEditingChallenge({ ...chal });
    setFormError("");
    setFormSuccess("");
    setFileName("");
    setFileContent("");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this challenge? This is irreversible.")) return;

    try {
      const res = await fetch(`/api/challenges/${id}`, { method: "DELETE" });
      if (res.ok) {
        onRefreshData();
      }
    } catch (err) {
      alert("Error deleting challenge from the engine.");
    }
  };

  const handleToggleSingleDown = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/challenges/${id}/toggle`, { method: "POST" });
      if (res.ok) {
        onRefreshData();
      }
    } catch (err) {
      alert("Error toggling challenge status.");
    }
  };

  const handleBulkStatusChange = async (status: "up" | "down") => {
    if (!window.confirm(`Are you sure you want to bring ALL challenges ${status.toUpperCase()}?`)) return;
    try {
      const res = await fetch("/api/admin/challenges/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        onRefreshData();
      }
    } catch (err) {
      alert("Error updating bulk status.");
    }
  };

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChallenge) return;

    const { id, title, category, difficulty, points, description, flag, author } = editingChallenge;

    if (!title || !description || !flag || !points) {
      setFormError("Please fill in all mandatory fields: Title, Points, Description, Flag");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingChallenge)
      });
      const data = await response.json();

      if (response.ok) {
        setFormSuccess("Challenge synced successfully!");
        setEditingChallenge(null);
        onRefreshData();
      } else {
        setFormError(data.error || "Save failure.");
      }
    } catch (err) {
      setFormError("Network error syncing with security backend.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEventConfig = async (overrideStatus?: 'active' | 'paused' | 'ended') => {
    const updated = {
      ...eventConfig,
      status: overrideStatus || eventConfig.status
    };

    try {
      const res = await fetch("/api/admin/event/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        setEventConfig(data.eventConfig);
        setEventSaveSuccess("Event configuration updated successfully!");
        setTimeout(() => setEventSaveSuccess(""), 3000);
      }
    } catch (err) {
      alert("Failed to update event configuration.");
    }
  };

  const handleTeamAction = async (teamName: string, action: "ban" | "unban" | "disqualify" | "adjust_points", pointsDelta?: number, reason?: string) => {
    try {
      const res = await fetch("/api/admin/teams/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, action, pointsDelta, reason })
      });
      if (res.ok) {
        fetchTeams();
        onRefreshData();
        setPointsAdjustTeam(null);
        setAdjustReason("");
      }
    } catch (err) {
      alert("Failed to apply team moderation action.");
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string || "{}");
        const res = await fetch("/api/admin/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed)
        });
        if (res.ok) {
          alert("Database imported successfully!");
          onRefreshData();
          fetchTeams();
          fetchEventConfig();
        } else {
          alert("Invalid database format.");
        }
      } catch (err) {
        alert("JSON parse error reading database backup.");
      }
    };
    reader.readAsText(file);
  };

  const addFileToForm = () => {
    if (!fileName.trim()) return;
    const currentFiles = editingChallenge?.files || [];
    const updatedFiles = [...currentFiles, { name: fileName, content: fileContent }];
    setEditingChallenge({
      ...editingChallenge,
      files: updatedFiles
    });
    setFileName("");
    setFileContent("");
  };

  const removeFileFromForm = (idx: number) => {
    const currentFiles = editingChallenge?.files || [];
    const updatedFiles = currentFiles.filter((_, i) => i !== idx);
    setEditingChallenge({
      ...editingChallenge,
      files: updatedFiles
    });
  };

  const filteredChallenges = challenges.filter(c => {
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
    const matchesSearch = !searchFilter || c.title.toLowerCase().includes(searchFilter.toLowerCase()) || c.id.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const onlineCount = challenges.filter(c => !c.isDown).length;
  const offlineCount = challenges.filter(c => c.isDown).length;

  return (
    <div className="space-y-6">
      
      {/* 1. TOP STATS & QUICK CONTROLS BAR */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-display font-bold text-white tracking-tight">Admin Control Center</h2>
              <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/40 uppercase">
                CTF OPERATOR
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Live Challenge Toggles, Event Timer Controls & Team Moderation
            </p>
          </div>

          {/* Quick Action Matrix */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleBulkStatusChange("up")}
              className="px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Power className="w-3.5 h-3.5 text-emerald-400" />
              <span>BRING ALL UP</span>
            </button>
            <button
              onClick={() => handleBulkStatusChange("down")}
              className="px-3 py-2 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-300 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Power className="w-3.5 h-3.5 text-amber-400" />
              <span>TAKE ALL DOWN</span>
            </button>
            <button
              onClick={handleStartCreate}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#0b0f19] font-mono text-xs font-bold rounded-lg flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Vector</span>
            </button>
          </div>
        </div>

        {/* Telemetry Counter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Total Vectors</div>
            <div className="text-xl font-mono font-bold text-white mt-1">{challenges.length}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <div className="text-[10px] font-mono text-emerald-400 uppercase">ONLINE (UP)</div>
            <div className="text-xl font-mono font-bold text-emerald-400 mt-1">{onlineCount}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <div className="text-[10px] font-mono text-amber-400 uppercase">PAUSED (DOWN)</div>
            <div className="text-xl font-mono font-bold text-amber-400 mt-1">{offlineCount}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Teams Active</div>
            <div className="text-xl font-mono font-bold text-cyan-400 mt-1">{teams.length}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Event Status</div>
            <div className="text-sm font-mono font-bold mt-1 flex items-center gap-1.5">
              {eventConfig.status === "active" && <span className="text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> LIVE</span>}
              {eventConfig.status === "paused" && <span className="text-amber-400">🟡 PAUSED</span>}
              {eventConfig.status === "ended" && <span className="text-rose-400">🔴 ENDED</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUB-TAB NAVIGATION */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-2 flex flex-wrap gap-2">
        <button
          onClick={() => setAdminTab("challenges")}
          className={`px-4 py-2.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all ${
            adminTab === "challenges"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Challenge Matrix ({challenges.length})</span>
        </button>

        <button
          onClick={() => setAdminTab("event")}
          className={`px-4 py-2.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all ${
            adminTab === "event"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Event & Timer Control</span>
        </button>

        <button
          onClick={() => setAdminTab("teams")}
          className={`px-4 py-2.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all ${
            adminTab === "teams"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Moderation ({teams.length})</span>
        </button>

        <button
          onClick={() => setAdminTab("telemetry")}
          className={`px-4 py-2.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all ${
            adminTab === "telemetry"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Submissions Stream ({submissions.length})</span>
        </button>

        <button
          onClick={() => {
            setAdminTab("support");
            fetchSupportTickets();
          }}
          className={`px-4 py-2.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all ${
            adminTab === "support"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span>Team Support Inbox ({supportTickets.length})</span>
        </button>

        <button
          onClick={() => setAdminTab("public_chat")}
          className={`px-4 py-2.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all ${
            adminTab === "public_chat"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Global Chat Arena (Moderation)</span>
        </button>

        <button
          onClick={() => setAdminTab("backup")}
          className={`px-4 py-2.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all ${
            adminTab === "backup"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Backup & Reset</span>
        </button>
      </div>

      {/* 3. SUB-TAB VIEW SWITCHING */}

      {/* TAB 1: CHALLENGE MATRIX & FORM */}
      {adminTab === "challenges" && (
        <div className="space-y-6">
          
          {/* Create/Edit Form Modal/Section */}
          {editingChallenge && (
            <div className="bg-[#0e1424] border border-cyan-500/30 rounded-xl p-6 space-y-4 shadow-xl shadow-cyan-950/20">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-display font-bold text-lg text-cyan-400 flex items-center gap-2">
                  <FileCode className="w-5 h-5" />
                  {editingChallenge.id && challenges.some(c => c.id === editingChallenge.id) 
                    ? `Modify Challenge Vector [${editingChallenge.id}]` 
                    : "Create New Challenge Vector"}
                </h3>
                <button 
                  onClick={() => setEditingChallenge(null)}
                  className="text-slate-400 hover:text-rose-400 text-xs font-mono"
                >
                  [ Cancel ]
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-lg text-rose-300 text-xs font-mono">
                  ⚠️ {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs font-mono">
                  ✅ {formSuccess}
                </div>
              )}

              <form onSubmit={handleSaveChallenge} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Title *</label>
                    <input
                      type="text"
                      value={editingChallenge.title || ""}
                      onChange={(e) => setEditingChallenge({ ...editingChallenge, title: e.target.value })}
                      placeholder="e.g. RSA Wiener Small Prime Flaw"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Category *</label>
                    <select
                      value={editingChallenge.category || "crypto"}
                      onChange={(e) => setEditingChallenge({ ...editingChallenge, category: e.target.value as Category })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                    >
                      <option value="crypto">Cryptography</option>
                      <option value="rev">Reverse Engineering</option>
                      <option value="forensics">Forensics</option>
                      <option value="stego">Steganography</option>
                      <option value="osint">OSINT</option>
                      <option value="misc">Misc / Scripting</option>
                      <option value="web">Web Exploitation</option>
                      <option value="pwn">Pwn (Binary Exploit)</option>
                      <option value="blockchain">Blockchain</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Difficulty *</label>
                    <select
                      value={editingChallenge.difficulty || "Easy"}
                      onChange={(e) => setEditingChallenge({ ...editingChallenge, difficulty: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Points *</label>
                    <input
                      type="number"
                      value={editingChallenge.points || 100}
                      onChange={(e) => setEditingChallenge({ ...editingChallenge, points: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Author *</label>
                    <input
                      type="text"
                      value={editingChallenge.author || "Admin_Operator"}
                      onChange={(e) => setEditingChallenge({ ...editingChallenge, author: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Exact Flag Secret *</label>
                    <input
                      type="text"
                      value={editingChallenge.flag || ""}
                      onChange={(e) => setEditingChallenge({ ...editingChallenge, flag: e.target.value })}
                      placeholder="ESCAL8{secret_flag_value}"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-emerald-400 font-mono focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Description *</label>
                  <textarea
                    rows={3}
                    value={editingChallenge.description || ""}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, description: e.target.value })}
                    placeholder="Provide mission background, objectives, or code context..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:border-cyan-500 outline-none"
                  />
                </div>

                {/* Attachments Section */}
                <div className="border border-slate-800 rounded-lg p-3 bg-slate-950/40 space-y-2">
                  <div className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                    <span>Attached Reference Files ({editingChallenge.files?.length || 0})</span>
                  </div>

                  {editingChallenge.files && editingChallenge.files.length > 0 && (
                    <div className="space-y-1">
                      {editingChallenge.files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded text-xs font-mono">
                          <span className="text-cyan-300">{file.name} <span className="text-slate-500">({file.size || 'Attachment'})</span></span>
                          <button type="button" onClick={() => removeFileFromForm(idx)} className="text-rose-400 hover:text-rose-300">
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="File Name (e.g. cipher_data.txt)"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="File Content / Text Body"
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addFileToForm}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 rounded"
                  >
                    + Add File Attachment
                  </button>
                </div>

                {/* Live Sandbox Toggle */}
                <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <input
                    type="checkbox"
                    id="isLiveInstance"
                    checked={editingChallenge.isLiveInstance || false}
                    onChange={(e) => setEditingChallenge({ ...editingChallenge, isLiveInstance: e.target.checked })}
                    className="w-4 h-4 accent-cyan-500 cursor-pointer"
                  />
                  <label htmlFor="isLiveInstance" className="text-xs font-mono text-slate-300 cursor-pointer">
                    Enable Live Container Sandbox Instance (Spawns socket/HTTP endpoint)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingChallenge(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-mono rounded-lg hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#0b0f19] text-xs font-mono font-bold rounded-lg shadow-md shadow-cyan-500/20"
                  >
                    {submitting ? "Saving..." : "Save Vector"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search & Category Filter Bar */}
          <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search vector by title or ID..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none font-mono"
              >
                <option value="all">All Categories</option>
                <option value="crypto">Cryptography</option>
                <option value="rev">Reverse Eng</option>
                <option value="forensics">Forensics</option>
                <option value="stego">Steganography</option>
                <option value="osint">OSINT</option>
                <option value="misc">Misc / Scripting</option>
                <option value="web">Web Exploitation</option>
                <option value="pwn">Pwn (Binary Exploit)</option>
                <option value="blockchain">Blockchain</option>
              </select>
            </div>
          </div>

          {/* Challenges List Table */}
          <div className="bg-[#0e1424] border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 font-mono text-[11px] text-slate-400 uppercase">
                  <th className="p-3">Status</th>
                  <th className="p-3">Vector Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Difficulty</th>
                  <th className="p-3">Points</th>
                  <th className="p-3">Solves</th>
                  <th className="p-3 text-right">Actions / Toggle Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {filteredChallenges.map(chal => {
                  const isDown = chal.isDown;
                  return (
                    <tr key={chal.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3">
                        {isDown ? (
                          <span className="inline-flex items-center gap-1 bg-amber-950/80 border border-amber-500/50 text-amber-400 text-[10px] px-2 py-0.5 rounded font-bold">
                            🔴 DOWN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
                            🟢 UP
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white">{chal.title}</div>
                        <div className="text-[10px] text-slate-500">{chal.id} • Flag: <span className="text-emerald-400">{chal.flag}</span></div>
                      </td>
                      <td className="p-3 text-cyan-400 uppercase font-bold">{chal.category}</td>
                      <td className="p-3">
                        <span className={`
                          ${chal.difficulty === 'Easy' && 'text-emerald-400'}
                          ${chal.difficulty === 'Medium' && 'text-cyan-400'}
                          ${chal.difficulty === 'Hard' && 'text-amber-500'}
                          ${chal.difficulty === 'Expert' && 'text-rose-500'}
                        `}>
                          {chal.difficulty}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-200">{chal.points} PTS</td>
                      <td className="p-3 text-slate-400">{chal.solvedCount || 0}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleSingleDown(chal.id)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded border cursor-pointer transition-all ${
                              isDown
                                ? "bg-emerald-950 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900"
                                : "bg-amber-950 text-amber-300 border-amber-700/60 hover:bg-amber-900"
                            }`}
                          >
                            {isDown ? "BRING UP 🟢" : "TAKE DOWN 🔴"}
                          </button>
                          <button
                            onClick={() => handleEdit(chal)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(chal.id)}
                            className="p-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-400 rounded border border-rose-800/40 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EVENT & TIMER CONTROL */}
      {adminTab === "event" && (
        <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              CTF Competition Timer & Access Controls
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Prevent foul attempts by locking flag submissions outside active contest hours.
            </p>
          </div>

          {eventSaveSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs font-mono">
              ✅ {eventSaveSuccess}
            </div>
          )}

          {/* Competition Mode Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-mono text-slate-400 uppercase font-bold">Global Competition Status State *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSaveEventConfig("active")}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  eventConfig.status === "active"
                    ? "bg-emerald-950/60 border-emerald-500/80 text-emerald-300 shadow-lg shadow-emerald-950/40"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 font-mono font-bold text-sm text-emerald-400">
                  <PlayCircle className="w-4 h-4" />
                  <span>1. COMPETITION LIVE</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  All flag submissions & live web sandboxes are active.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSaveEventConfig("paused")}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  eventConfig.status === "paused"
                    ? "bg-amber-950/60 border-amber-500/80 text-amber-300 shadow-lg shadow-amber-950/40"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 font-mono font-bold text-sm text-amber-400">
                  <Pause className="w-4 h-4" />
                  <span>2. PAUSE SUBMISSIONS</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Locks flag submissions temporarily (prevents foul submissions during breaks).
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSaveEventConfig("ended")}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  eventConfig.status === "ended"
                    ? "bg-rose-950/60 border-rose-500/80 text-rose-300 shadow-lg shadow-rose-950/40"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 font-mono font-bold text-sm text-rose-400">
                  <StopCircle className="w-4 h-4" />
                  <span>3. END COMPETITION</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Finalizes event standings. Rejects any further submissions.
                </p>
              </button>
            </div>
          </div>

          {/* Announcement Broadcast Banner Input */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-mono text-slate-400 flex items-center gap-1.5 font-bold uppercase">
              <Megaphone className="w-4 h-4 text-cyan-400" />
              Global Operator Announcement Banner
            </label>
            <input
              type="text"
              value={eventConfig.announcement || ""}
              onChange={(e) => setEventConfig({ ...eventConfig, announcement: e.target.value })}
              placeholder="e.g. 📢 HINT RELEASED: Check Cryptography Vector #3! 15 minutes remaining!"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-cyan-300 font-mono focus:border-cyan-500 outline-none"
            />
            <p className="text-[10px] text-slate-500 font-mono">This message will instantly display in a banner across the entire platform for all active contestants.</p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => handleSaveEventConfig()}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-[#0b0f19] text-xs font-mono font-bold rounded-lg shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              Save Event Settings & Broadcast
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: TEAMS MANAGEMENT & MODERATION */}
      {adminTab === "teams" && (
        <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Team Roster & Moderation Panel
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                View team score stats, adjust points, or disqualify teams violating CTF rules.
              </p>
            </div>
            <button
              onClick={fetchTeams}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 rounded cursor-pointer"
            >
              Refresh Teams
            </button>
          </div>

          {/* Adjust Points Form Modal */}
          {pointsAdjustTeam && (
            <div className="p-4 bg-slate-900 border border-cyan-500/40 rounded-xl space-y-3">
              <div className="text-xs font-mono font-bold text-cyan-300">
                Adjust Score Points for Team: <span className="text-white uppercase">{pointsAdjustTeam}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Point Delta (+ Bonus or - Penalty)</label>
                  <input
                    type="number"
                    value={adjustPointsDelta}
                    onChange={(e) => setAdjustPointsDelta(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">Reason / Note</label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="e.g. First blood bonus or Rule penalty"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setPointsAdjustTeam(null)}
                  className="px-3 py-1 bg-slate-800 text-xs text-slate-400 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleTeamAction(pointsAdjustTeam, "adjust_points", adjustPointsDelta, adjustReason)}
                  className="px-4 py-1 bg-cyan-500 hover:bg-cyan-400 text-[#0b0f19] text-xs font-mono font-bold rounded"
                >
                  Apply Score Adjustment
                </button>
              </div>
            </div>
          )}

          {/* Teams Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 font-mono text-[11px] text-slate-400 uppercase">
                  <th className="p-3">Status</th>
                  <th className="p-3">Team Name</th>
                  <th className="p-3">Members</th>
                  <th className="p-3">Total Score</th>
                  <th className="p-3">Solved Count</th>
                  <th className="p-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {teams.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                      No teams currently registered in database.
                    </td>
                  </tr>
                ) : (
                  teams.map((t) => {
                    const isBanned = t.status === "banned";
                    const isDisqualified = t.status === "disqualified";

                    return (
                      <tr key={t.teamName} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3">
                          {isBanned && (
                            <span className="bg-rose-950 text-rose-400 border border-rose-800/60 px-2 py-0.5 rounded text-[10px] font-bold">
                              BANNED
                            </span>
                          )}
                          {isDisqualified && (
                            <span className="bg-amber-950 text-amber-400 border border-amber-800/60 px-2 py-0.5 rounded text-[10px] font-bold">
                              DISQUALIFIED
                            </span>
                          )}
                          {!isBanned && !isDisqualified && (
                            <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded text-[10px] font-bold">
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-white uppercase">{t.teamName}</td>
                        <td className="p-3 text-slate-300">
                          {t.members && t.members.length > 0 ? t.members.join(", ") : "Single Operator"}
                        </td>
                        <td className="p-3 font-bold text-emerald-400">{t.score} PTS</td>
                        <td className="p-3 text-slate-400">{t.solvedChallenges?.length || 0}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setPointsAdjustTeam(t.teamName)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] rounded cursor-pointer"
                            >
                              + Adjust Score
                            </button>
                            {isBanned ? (
                              <button
                                onClick={() => handleTeamAction(t.teamName, "unban")}
                                className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[10px] rounded cursor-pointer"
                              >
                                Unban
                              </button>
                            ) : (
                              <button
                                onClick={() => handleTeamAction(t.teamName, "ban")}
                                className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 text-[10px] rounded cursor-pointer"
                              >
                                Ban Team
                              </button>
                            )}
                            <button
                              onClick={() => handleTeamAction(t.teamName, "disqualify")}
                              className="px-2 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 text-[10px] rounded cursor-pointer"
                            >
                              Disqualify
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TELEMETRY STREAM */}
      {adminTab === "telemetry" && (
        <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Live Submissions Telemetry Stream
            </h3>
            <span className="text-xs font-mono text-slate-400">Total Attempts: {submissions.length}</span>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
            {submissions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                No submissions recorded yet.
              </div>
            ) : (
              submissions.slice().reverse().map((sub) => (
                <div 
                  key={sub.id} 
                  className={`p-3 rounded-lg border font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    sub.success 
                      ? "bg-emerald-950/20 border-emerald-500/30 text-slate-200" 
                      : "bg-rose-950/20 border-rose-800/30 text-slate-300"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${sub.success ? "text-emerald-400" : "text-rose-400"}`}>
                        {sub.success ? "PASS [FLAG CAPTURED]" : "FAIL [INCORRECT FLAG]"}
                      </span>
                      <span className="text-slate-400">• Operator: <strong className="text-white">{sub.username}</strong> (Team: {sub.teamName || 'N/A'})</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Challenge Vector: <span className="text-cyan-300">{sub.challengeTitle || sub.challengeId}</span> | Points: {sub.points} PTS
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-500">
                      {new Date(sub.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]">
                      Submitted: "{sub.flagSubmitted}"
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: TEAM DIRECT SUPPORT INBOX */}
      {adminTab === "support" && (
        <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                Team Support Inbox & Live Direct Chat
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Inspect queries from each participant team separately and reply directly as Administrator
              </p>
            </div>
            <button
              onClick={fetchSupportTickets}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refresh Tickets
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team List Sidebar */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Active Team Tickets ({supportTickets.length})
              </h4>

              {supportTickets.length === 0 ? (
                <div className="p-6 text-center text-slate-500 font-mono text-xs">
                  No active support tickets. When participants request help, their team thread will appear here.
                </div>
              ) : (
                <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                  {supportTickets.map((t) => {
                    const isSelected = selectedChatTeam.toLowerCase() === t.teamName.toLowerCase();
                    const lastMsg = t.messages[t.messages.length - 1];

                    return (
                      <button
                        key={t.teamName}
                        onClick={() => setSelectedChatTeam(t.teamName)}
                        className={`w-full p-3 rounded-lg text-left transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-amber-950/40 border-amber-500/60 text-white shadow-md shadow-amber-950/30"
                            : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-xs text-cyan-300 uppercase">
                            {t.teamName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(t.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate">
                          {lastMsg ? `${lastMsg.sender}: ${lastMsg.message}` : "No messages yet"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chat Box Area */}
            <div className="lg:col-span-2">
              {selectedChatTeam ? (
                <SupportChat
                  username="ADMINISTRATOR"
                  teamName={selectedChatTeam}
                  isAdmin={true}
                />
              ) : (
                <div className="h-[520px] bg-slate-900/40 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 font-mono text-xs">
                  Select a team from the left sidebar to start live support chat
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: GLOBAL PARTICIPANT CHAT MODERATION */}
      {adminTab === "public_chat" && (
        <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Global Participant Chat Room (Moderation Console)
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Live moderation channel for all participant chat messages across teams. You can pin announcements or delete abusive messages.
            </p>
          </div>

          <PublicChatRoom
            username="ADMINISTRATOR"
            teamName="ADMIN"
            isAdmin={true}
          />
        </div>
      )}

      {/* TAB 7: BACKUP & SYSTEM RESET */}
      {adminTab === "backup" && (
        <div className="bg-[#0e1424] border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              Database Export, Import & Reset Controls
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Download Backup */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="text-sm font-mono font-bold text-cyan-400 flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span>Download Database Backup</span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Export full database state including challenges, submissions, and users to JSON format.
              </p>
              <a
                href="/api/admin/backup"
                download="escal8_ctf_database_backup.json"
                className="inline-block px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#0b0f19] text-xs font-mono font-bold rounded-lg shadow-md cursor-pointer"
              >
                Export database.json
              </a>
            </div>

            {/* Import Backup */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="text-sm font-mono font-bold text-amber-400 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Import JSON Backup</span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Restore database from JSON file backup. Replaces current active database.
              </p>
              <label className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-800/40 text-xs font-mono font-bold rounded-lg cursor-pointer">
                Select JSON File
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>

            {/* Purge Submissions */}
            <div className="bg-slate-900 border border-rose-950 rounded-xl p-4 space-y-3">
              <div className="text-sm font-mono font-bold text-rose-400 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                <span>Reset Submissions Log</span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Purge all test flag submissions and reset challenge solve counts to zero before contest launch.
              </p>
              <button
                onClick={onResetDatabase}
                className="px-4 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/50 text-xs font-mono font-bold rounded-lg cursor-pointer"
              >
                Purge All Submissions
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

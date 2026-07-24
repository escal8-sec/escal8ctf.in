import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Shield, User, Pin, Trash2, RefreshCw, Users, Sparkles } from "lucide-react";
import { PublicChatMessage } from "../types";

interface PublicChatRoomProps {
  username: string;
  teamName: string;
  isAdmin?: boolean;
}

export default function PublicChatRoom({ username, teamName, isAdmin }: PublicChatRoomProps) {
  const [messages, setMessages] = useState<PublicChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChat();
    const interval = setInterval(fetchChat, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChat = async () => {
    try {
      const res = await fetch("/api/chat/public");
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to load public chat:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/chat/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: username || "Participant",
          teamName: teamName || "INDIVIDUAL",
          message: inputMessage,
          isAdmin: Boolean(isAdmin)
        })
      });

      if (res.ok) {
        setInputMessage("");
        fetchChat();
      }
    } catch (err) {
      alert("Failed to send message to participant chat.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      await fetch(`/api/chat/public/${id}`, { method: "DELETE" });
      fetchChat();
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleTogglePin = async (id: string) => {
    if (!isAdmin) return;
    try {
      await fetch(`/api/chat/public/pin/${id}`, { method: "POST" });
      fetchChat();
    } catch (err) {
      console.error("Failed to pin message:", err);
    }
  };

  const pinnedMessages = messages.filter(m => m.isPinned);

  return (
    <div className="bg-[#0e1424] border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-[550px]">
      
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950 border border-cyan-500/40 rounded-lg text-cyan-400">
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
              Global Participant Chat Arena
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE ROOM
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Public chat for all teams & individual contestants
            </p>
          </div>
        </div>

        <button
          onClick={fetchChat}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
          title="Refresh Room"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && (
        <div className="bg-amber-950/30 border-b border-amber-500/30 px-4 py-2 space-y-1">
          {pinnedMessages.map((pin) => (
            <div key={pin.id} className="flex items-center justify-between text-xs font-mono text-amber-200">
              <div className="flex items-center gap-2 truncate">
                <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0 rotate-45" />
                <span className="font-bold text-amber-400">PINNED:</span>
                <span className="truncate">{pin.message}</span>
              </div>
              <span className="text-[10px] text-amber-400/80 shrink-0 ml-2">by {pin.sender}</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0b0f19]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2 font-mono text-xs">
            <MessageSquare className="w-8 h-8 text-slate-600" />
            <p className="text-slate-400">The participant chat arena is empty.</p>
            <p className="text-[11px] text-slate-500">Be the first contestant to drop a message in the room!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.toLowerCase() === username.toLowerCase();
            const isAdminSender = msg.isAdmin;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mb-1 px-1">
                  {isAdminSender ? (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Shield className="w-3 h-3 text-amber-400" /> [ADMINISTRATOR]
                    </span>
                  ) : (
                    <span className="text-cyan-300 font-bold flex items-center gap-1">
                      <User className="w-3 h-3 text-cyan-400" /> {msg.sender}
                      <span className="text-slate-500 font-normal">({msg.teamName})</span>
                    </span>
                  )}
                  <span>• {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                  {isAdmin && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleTogglePin(msg.id)}
                        className={`p-1 rounded ${msg.isPinned ? "text-amber-400" : "text-slate-600 hover:text-slate-300"}`}
                        title="Toggle Pin"
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="p-1 text-slate-600 hover:text-rose-400 rounded"
                        title="Delete Message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div
                  className={`max-w-[80%] rounded-xl p-3 text-xs font-mono border ${
                    isAdminSender
                      ? "bg-amber-950/40 border-amber-500/50 text-amber-100 shadow-md shadow-amber-950/30"
                      : isMe
                      ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-100"
                      : "bg-slate-900 border-slate-800 text-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="bg-slate-900 border-t border-slate-800 p-3 flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Chat with all participants as ${username} (${teamName || "Individual"})...`}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white font-mono focus:border-cyan-500 outline-none"
        />
        <button
          type="submit"
          disabled={sending || !inputMessage.trim()}
          className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-[#0b0f19] font-mono font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{sending ? "Sending..." : "Post"}</span>
        </button>
      </form>
    </div>
  );
}

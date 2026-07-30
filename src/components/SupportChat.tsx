import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Shield, User, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { SupportTicket, SupportMessage } from "../types";

interface SupportChatProps {
  username: string;
  teamName: string;
  isAdmin?: boolean;
}

export default function SupportChat({ username, teamName, isAdmin }: SupportChatProps) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  useEffect(() => {
    fetchChat();
    const interval = setInterval(fetchChat, 5000);
    return () => clearInterval(interval);
  }, [teamName]);

  useEffect(() => {
    const currentLength = ticket?.messages?.length || 0;
    if (currentLength > prevMessageCountRef.current) {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
    prevMessageCountRef.current = currentLength;
  }, [ticket?.messages]);

  const fetchChat = async () => {
    if (!teamName) return;
    try {
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(teamName)}`);
      if (res.ok) {
        const data = await res.json();
        setTicket(data);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !teamName) return;

    setSending(true);
    try {
      const res = await fetch("/api/support/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: username || "Operator",
          teamName: teamName,
          message: inputMessage,
          isAdminReply: isAdmin
        })
      });

      if (res.ok) {
        setInputMessage("");
        fetchChat();
      }
    } catch (err) {
      alert("Failed to send message to support chat.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#0e1424] border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-[520px]">
      
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950 border border-cyan-500/40 rounded-lg text-cyan-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
              Direct Admin Support Channel
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded">
                ONLINE
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Team: <strong className="text-cyan-300 uppercase">{teamName || "INDIVIDUAL"}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={fetchChat}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
          title="Refresh Messages"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0b0f19]">
        {(!ticket?.messages || ticket.messages.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2 font-mono text-xs">
            <AlertCircle className="w-8 h-8 text-slate-600" />
            <p className="text-slate-400">No support tickets opened yet.</p>
            <p className="text-[11px] text-slate-500 max-w-sm">
              Type your query below to send a direct notification to the CTF Administrator.
            </p>
          </div>
        ) : (
          ticket.messages.map((msg) => {
            const isMe = msg.sender.toLowerCase() === username.toLowerCase();
            const isAdminMessage = msg.isAdminReply;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mb-1 px-1">
                  {isAdminMessage ? (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Shield className="w-3 h-3" /> [ADMINISTRATOR]
                    </span>
                  ) : (
                    <span className="text-cyan-400 font-bold flex items-center gap-1">
                      <User className="w-3 h-3" /> {msg.sender}
                    </span>
                  )}
                  <span>• {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`max-w-[80%] rounded-xl p-3 text-xs font-mono border ${
                    isAdminMessage
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
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="bg-slate-900 border-t border-slate-800 p-3 flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask admin for assistance or report issue..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white font-mono focus:border-cyan-500 outline-none"
        />
        <button
          type="submit"
          disabled={sending || !inputMessage.trim()}
          className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-[#0b0f19] font-mono font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{sending ? "Sending..." : "Send"}</span>
        </button>
      </form>
    </div>
  );
}

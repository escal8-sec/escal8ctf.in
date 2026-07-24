import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Terminal, Send, ArrowRight, BookOpen, BrainCircuit, ShieldAlert, MessageSquare, Shield } from "lucide-react";
import { Challenge } from "../types";
import SupportChat from "./SupportChat";

interface Message {
  sender: "user" | "oracle";
  text: string;
  timestamp: Date;
}

interface AIOracleProps {
  challenges: Challenge[];
  activeChallenge: Challenge | null;
  onClose?: () => void;
  username?: string;
  teamName?: string;
}

export default function AIOracle({ challenges, activeChallenge, onClose, username = "Operator", teamName = "INDIVIDUAL" }: AIOracleProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "admin">("ai");
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // If parent sets an active challenge, pre-select it and greet user
  useEffect(() => {
    if (activeChallenge) {
      setSelectedChallengeId(activeChallenge.id);
      setMessages([
        {
          sender: "oracle",
          text: `[DECRYPTING COMM LINK...] ESCAL8 AI Oracle online. I see you are analyzing the target challenge: **"${activeChallenge.title}"** (${activeChallenge.points} pts). \n\nI have scanned its encryption vectors and architecture description. Ask me any conceptual question about the vulnerabilities or cryptographic mechanisms involved, and I will guide your research safely. **Flag safety shields are enabled.**`,
          timestamp: new Date()
        }
      ]);
    } else {
      setMessages([
        {
          sender: "oracle",
          text: `Welcome, ESCAL8 recruit. I am the cybersecurity Oracle. \n\nI can assist you in mastering cryptography, buffer overflow dynamics, web security, EXIF steganography, and reverse engineering. Select a specific challenge from the cockpit above for targeted guidance, or ask me any general cybersecurity question!`,
          timestamp: new Date()
        }
      ]);
    }
  }, [activeChallenge]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");
    setMessages(prev => [...prev, { sender: "user", text: userText, timestamp: new Date() }]);
    setLoading(true);

    try {
      const response = await fetch("/api/gemini/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: selectedChallengeId || undefined,
          userMessage: userText
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessages(prev => [...prev, { sender: "oracle", text: data.text, timestamp: new Date() }]);
      } else {
        setMessages(prev => [
          ...prev, 
          { 
            sender: "oracle", 
            text: `[SYSTEM DIAGNOSTIC] Oracle interface error: ${data.error || "Connection timed out."}`, 
            timestamp: new Date() 
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev, 
        { 
          sender: "oracle", 
          text: `[TELEMETRY FAILURE] Unable to parse response. Please verify the Gemini API credentials.`, 
          timestamp: new Date() 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    // Submit in next tick
    setTimeout(() => {
      setInput(question);
    }, 50);
  };

  // Simple, ultra-fast custom parser for basic markdown elements (bold, code blocks, bullet points)
  const formatOracleResponse = (raw: string) => {
    if (!raw) return "";
    
    // Split text by triple-backticks code blocks
    const parts = raw.split("```");
    
    return parts.map((part, index) => {
      // It is a code block
      if (index % 2 === 1) {
        // Extract language name if exists
        const lines = part.split("\n");
        const firstLine = lines[0].trim();
        const hasLang = ["c", "cpp", "python", "javascript", "js", "assembly", "asm", "bash", "sh", "html"].includes(firstLine.toLowerCase());
        const displayCode = hasLang ? lines.slice(1).join("\n") : part;

        return (
          <div key={index} className="my-3 border border-slate-800 rounded-lg overflow-hidden bg-black/40">
            {hasLang && (
              <div className="bg-slate-900 border-b border-slate-800 px-3 py-1 font-mono text-[10px] text-slate-500 uppercase">
                {firstLine}
              </div>
            )}
            <pre className="p-3 overflow-x-auto text-xs text-emerald-400 font-mono leading-5 whitespace-pre">
              <code>{displayCode}</code>
            </pre>
          </div>
        );
      }

      // Inline formatting (bold and inline code)
      const lines = part.split("\n");
      return (
        <div key={index} className="space-y-2">
          {lines.map((line, lIdx) => {
            // Check if it's a bullet point
            const isBullet = line.trim().startsWith("* ") || line.trim().startsWith("- ");
            const cleanLine = isBullet ? line.trim().slice(2) : line;

            // Simple parser for bolds (**text**) and inline-code (`code`)
            const inlineParts = cleanLine.split(/(\*\*.*?\*\*|`.*?`)/g);
            const lineContent = inlineParts.map((sub, sIdx) => {
              if (sub.startsWith("**") && sub.endsWith("**")) {
                return <strong key={sIdx} className="font-bold text-slate-200">{sub.slice(2, -2)}</strong>;
              }
              if (sub.startsWith("`") && sub.endsWith("`")) {
                return <code key={sIdx} className="bg-slate-950 border border-slate-800 text-cyan-400 px-1.5 py-0.5 rounded font-mono text-xs">{sub.slice(1, -1)}</code>;
              }
              return sub;
            });

            if (isBullet) {
              return (
                <div key={lIdx} className="flex gap-2 pl-4 text-sm text-slate-300">
                  <span className="text-cyan-500">•</span>
                  <span>{lineContent}</span>
                </div>
              );
            }

            return <p key={lIdx} className="text-sm text-slate-300 leading-relaxed font-sans">{lineContent}</p>;
          })}
        </div>
      );
    });
  };

  const activeChallengeObj = challenges.find(c => c.id === selectedChallengeId);

  return (
    <div className="bg-cyber-card border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[650px] lg:h-[700px]">
      
      {/* Oracle Controller Selector */}
      <div className="p-4 bg-slate-900/80 border-b border-slate-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="font-display font-medium text-slate-100 flex items-center gap-1.5">
              ESCAL8 Oracle AI Console
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1.5" />
            </h2>
            <p className="text-[10px] font-mono text-slate-400">
              SECURE TELEMETRY CHANNEL // NO COGNITIVE INTERCEPTION ALLOWED
            </p>
          </div>
        </div>

        {/* Challenge Context Selector Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="oracle-challenge-context" className="text-xs font-mono text-slate-400 uppercase shrink-0">
            Context:
          </label>
          <select
            id="oracle-challenge-context"
            value={selectedChallengeId}
            onChange={(e) => setSelectedChallengeId(e.target.value)}
            className="flex-1 sm:w-60 bg-cyber-bg border border-slate-800 text-xs text-slate-200 p-2 rounded focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="">-- General Security Concepts --</option>
            {challenges.map(c => (
              <option key={c.id} value={c.id}>
                [{c.category.toUpperCase()}] {c.title} ({c.points} pts)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-5 overflow-y-auto bg-black/10 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] rounded-xl p-4 border space-y-2 leading-relaxed ${
              msg.sender === "user"
                ? "bg-slate-900 border-slate-800 text-slate-100 font-sans"
                : "bg-gradient-to-br from-[#121c2c] to-[#0e1625] border-cyan-500/20 text-slate-200"
            }`}>
              
              {/* Header inside bubble */}
              <div className="flex items-center justify-between gap-6 mb-1 text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1 font-bold">
                  {msg.sender === "user" ? (
                    <span className="text-slate-400">Recruit Operator</span>
                  ) : (
                    <span className="text-cyan-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      ESCAL8 Security Oracle
                    </span>
                  )}
                </span>
                <span>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              {/* Message Content */}
              <div className="space-y-1.5">
                {msg.sender === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  formatOracleResponse(msg.text)
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-xl p-4 border border-slate-800 bg-slate-950/40 text-slate-400 font-mono text-xs space-y-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>Interrogating model structures...</span>
              </div>
              <div className="w-full bg-slate-900 h-1 rounded overflow-hidden">
                <div className="bg-cyan-500 h-1 w-2/3 rounded animate-pulse" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Prompt Input Bar */}
      <div className="p-4 bg-slate-900/60 border-t border-slate-800 shrink-0 space-y-4">
        {/* Suggested research shortcuts (Quick Questions) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-[10px] font-mono text-slate-400 uppercase shrink-0">Research prompts:</span>
          
          {!selectedChallengeId ? (
            <>
              <button
                onClick={() => handleQuickQuestion("Explain how cookie tampering works in web CTF")}
                className="text-[10px] font-mono bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors shrink-0 cursor-pointer"
              >
                Cookie Tampering
              </button>
              <button
                onClick={() => handleQuickQuestion("What are standard tools for XOR cipher decryption?")}
                className="text-[10px] font-mono bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors shrink-0 cursor-pointer"
              >
                XOR Analysis
              </button>
              <button
                onClick={() => handleQuickQuestion("Explain standard gets() buffer overflows simply")}
                className="text-[10px] font-mono bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors shrink-0 cursor-pointer"
              >
                gets() Overflows
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleQuickQuestion(`What security concept is involved in challenge "${activeChallengeObj?.title}"?`)}
                className="text-[10px] font-mono bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors shrink-0 cursor-pointer"
              >
                Concept Explanation
              </button>
              <button
                onClick={() => handleQuickQuestion(`Explain any cryptographic or disassembly principles related to "${activeChallengeObj?.title}"`)}
                className="text-[10px] font-mono bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors shrink-0 cursor-pointer"
              >
                Core Formula/Disassembly
              </button>
            </>
          )}
        </div>

        {/* Input box */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={
              selectedChallengeId 
                ? `Ask hint on "${activeChallengeObj?.title}"...` 
                : "Ask anything about cybersecurity tools & tactics..."
            }
            className="flex-1 bg-cyber-bg border border-slate-800 focus:border-cyan-500/60 text-sm text-slate-200 px-4 py-2.5 rounded-lg focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4.5 bg-cyan-500 hover:bg-cyan-400 text-[#0b0f19] rounded-lg font-mono text-sm transition-all flex items-center justify-center gap-1 disabled:opacity-40 disabled:scale-100 hover:scale-102 active:scale-98 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>

        <div className="flex items-center gap-1.5 justify-center text-[10px] font-mono text-slate-500">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Oracle complies with prompt armor protocols: exact flag characters are locked.</span>
        </div>
      </div>

    </div>
  );
}

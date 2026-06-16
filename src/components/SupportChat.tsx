/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import { SupportChatMessage } from '../types.js';
import { Send, Bot, Headset, ArrowLeft, ShieldAlert } from 'lucide-react';

interface SupportChatProps {
  onBack: () => void;
}

export default function SupportChat({ onBack }: SupportChatProps) {
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync initial and follow-up support messages
  const fetchMessages = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/users/support/messages`, {
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error("Failed support sync:", e);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const textToSend = inputText;
    setInputText("");
    setLoading(true);

    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/users/support/messages`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ text: textToSend })
      });
      const data = await response.json();
      if (data.success) {
        // Sync immediate message list
        await fetchMessages();
        // Give a secondary check timer for the delayed reply
        setTimeout(fetchMessages, 1100);
      }
    } catch (err) {
      console.error("Support chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#170000] text-neutral-100">
      {/* Header bar */}
      <div className="px-4 py-3 bg-neutral-900/90 border-b border-rose-955/20 flex items-center gap-3">
        <button 
          onClick={onBack} 
          className="p-1 px-2 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-rose-300 flex items-center gap-1 cursor-pointer"
          id="btn-support-back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs">Lobby</span>
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-amber-400 flex items-center gap-1.5 leading-none">
            <Headset className="w-4 h-4 text-amber-500" />
            CUSTOMER HELPDESK
          </h2>
          <span className="text-[10px] text-emerald-400">● Live Agents Online</span>
        </div>
      </div>

      {/* Messages stack */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isBot = msg.sender === 'agent';
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}>
              {isBot && (
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-amber-400" />
                </div>
              )}
              <div className={`
                max-w-[80%] rounded-xl p-3 text-xs leading-relaxed shadow-md
                ${isBot 
                  ? 'bg-neutral-900 border border-rose-950/40 text-neutral-200' 
                  : 'bg-gradient-to-br from-amber-500 to-amber-600 text-neutral-950 font-medium'
                }
              `}>
                <p>{msg.text}</p>
                <span className={`text-[8px] block mt-1.5 text-right ${isBot ? 'text-neutral-500' : 'text-neutral-900/60'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Quick suggest tags helper */}
      <div className="px-4 py-2 border-t border-neutral-900 bg-neutral-950/40 flex flex-wrap gap-1.5">
        <button 
          onClick={() => setInputText("How do I approve my pending withdrawal?")}
          className="text-[10px] px-2.5 py-1 rounded-full bg-neutral-900 border border-rose-950/30 text-rose-300 hover:bg-neutral-850 cursor-pointer"
        >
          🔑 Approve withdrawal?
        </button>
        <button 
          onClick={() => setInputText("How do I add deposit cash?")}
          className="text-[10px] px-2.5 py-1 rounded-full bg-neutral-900 border border-rose-950/30 text-rose-300 hover:bg-neutral-850 cursor-pointer"
        >
          💳 How to add cash?
        </button>
        <button 
          onClick={() => setInputText("How do I play Ludo Pro matches?")}
          className="text-[10px] px-2.5 py-1 rounded-full bg-neutral-900 border border-rose-950/30 text-rose-300 hover:bg-neutral-850 cursor-pointer"
        >
          🎲 Roll rules & escape base
        </button>
      </div>

      {/* Form submit */}
      <form onSubmit={handleSendMessage} className="p-3 bg-neutral-950 border-t border-rose-950/20 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask us anything..."
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-neutral-500"
          id="input-support"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="w-10 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-neutral-950 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
          id="btn-support-send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

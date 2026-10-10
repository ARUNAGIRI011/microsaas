/**
 * BizMate AI - Marketing & Business Assistant Chat (/dashboard/chat)
 * Grounded conversational assistant helping users optimize campaigns and prompts.
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Sparkles, Send, Bot, User, ArrowRight } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const ChatAssistantPage: React.FC = () => {
  const { user, navigate } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      role: 'model',
      text: `Hello ${user?.name || 'there'}! I am your BizMate AI Marketing Strategist. 
I can help refine your campaign prompts, recommend promotional angles for your ${user?.industry || 'business'}, and calculate expected ROAS across social channels. What are you planning to promote?`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text, history })
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-rep-${Date.now()}`,
            role: 'model',
            text: data.reply,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'model',
          text: 'Sorry, I encountered an issue connecting to the Gemini engine. Please try again.',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="p-4 px-6 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-neutral-950">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">BizMate AI Marketing Strategist</h2>
            <p className="text-[11px] text-neutral-400">Powered by Google Gemini 3.8 Flash</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard/creative-studio')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-semibold text-xs transition"
        >
          <span>Open Creative Studio</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 max-w-2xl ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs ${
                m.role === 'user'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'bg-neutral-800 text-amber-400'
              }`}
            >
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`p-4 rounded-2xl whitespace-pre-line leading-relaxed ${
                m.role === 'user'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-100'
                  : 'bg-neutral-950 border border-neutral-800 text-neutral-200'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-neutral-400 italic">
            <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>Strategizing recommendations...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-4 bg-neutral-950 border-t border-neutral-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for campaign ideas, prompt advice, or budget allocation..."
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

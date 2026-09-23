import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  ExternalLink,
  History,
  Trash2,
} from 'lucide-react';
import { chatApi } from '../services/api';
import { ChatMessage } from '../types';
import { useAuth } from '../hooks/useAuth';

export const ChatPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'assistant',
      text: "👋 Welcome to your Personal AI Assistant! I analyze verified daily news across India, World, Tech, Science, Business, and more to answer your questions factually and neutrally.\n\nTry asking:\n• What important things happened today?\n• What happened in India today?\n• Explain the latest technology and AI news\n• What is AI governance?\n• Why is this important?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionPrompts = [
    "What happened today?",
    "Give me today's India news",
    "Explain latest technology news",
    "What is AI governance?",
    "Why are interest rates changing?",
    "Explain RAG in simple English",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (queryText?: string) => {
    const text = (queryText || input).trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const data = await chatApi.sendMessage(text);
      const botMessage: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: data.response,
        relatedArticles: data.relatedArticles,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: 'I encountered an error retrieving recent news context. Please ensure the backend is connected and try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: String(Date.now()),
        sender: 'assistant',
        text: "Conversation cleared. What would you like to know about today's world?",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in">
      {/* Top Bar */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Personal AI News Assistant</h2>
            <p className="text-[11px] text-slate-400">
              RAG engine with verified multi-source news grounding
            </p>
          </div>
        </div>

        <button
          onClick={handleClear}
          title="Clear Conversation"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-xs flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-slate-50/60">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-sky-600 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {/* News Citations */}
                {m.relatedArticles && m.relatedArticles.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Grounding Sources ({m.relatedArticles.length}):
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {m.relatedArticles.map((art) => (
                        <a
                          key={art.id}
                          href={art.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs text-sky-700 transition-colors"
                        >
                          <span className="truncate max-w-[90%] font-medium">
                            {art.title}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isSending && (
          <div className="flex gap-3 items-center text-xs text-slate-500 py-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin text-sky-600" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm text-slate-500">
              Retrieving context & generating answer...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Chips Bar */}
      <div className="p-2.5 bg-white border-t border-slate-100 overflow-x-auto scrollbar-none flex gap-2">
        {suggestionPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 rounded-xl text-xs whitespace-nowrap font-medium transition-colors border border-slate-200/60"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 md:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about today's news or a concept..."
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="p-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-2xl shadow-sm transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

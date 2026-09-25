import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  ExternalLink,
  Trash2,
  X,
  Plus,
  HelpCircle,
} from 'lucide-react';
import { chatApi, newsApi } from '../services/api';
import { ChatMessage, NewsArticle } from '../types';
import { useLanguage } from '../hooks/useLanguage';

export const ChatPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language, isHinglish } = useLanguage();

  const articleId = searchParams.get('articleId');
  const [articleContext, setArticleContext] = useState<NewsArticle | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'assistant',
      text: "👋 Welcome to your Personal AI News & Knowledge Assistant!\n\nI analyze verified daily news across India, World, Tech, Science, Business, and more to answer your questions factually and neutrally.\n\nAsk me anything about today's headlines, or ask for simple explanations of any concept or event.",
      timestamp: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch article context if articleId is in URL
  useEffect(() => {
    if (articleId) {
      setLoadingContext(true);
      newsApi
        .getNewsById(articleId)
        .then((res) => {
          setArticleContext(res.article);
          // Add helpful context intro message
          setMessages((prev) => [
            ...prev,
            {
              id: `ctx-${Date.now()}`,
              sender: 'assistant',
              text: `📌 I have loaded context for: **"${res.article.title}"** (${res.article.sourceName}).\n\nAsk me anything about this story, like "Explain what happened in simple language" or "Why is this important?"`,
              timestamp: new Date().toISOString(),
            },
          ]);
        })
        .catch(() => {
          setArticleContext(null);
        })
        .finally(() => {
          setLoadingContext(false);
        });
    } else {
      setArticleContext(null);
    }
  }, [articleId]);

  const handleClearContext = () => {
    setArticleContext(null);
    const next = new URLSearchParams(searchParams);
    next.delete('articleId');
    setSearchParams(next);
  };

  const suggestionPrompts = articleContext
    ? [
        'Explain this news in simple language',
        'Why does this matter to common people?',
        'What is the background of this event?',
        'What are the key facts?',
      ]
    : [
        'What important things happened today?',
        'What happened in India today?',
        'Explain latest technology and AI news',
        'What are the top business headlines?',
        'Explain the latest science and space discovery',
      ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

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
    setShowPrompts(false);
    setIsSending(true);

    try {
      const data = await chatApi.sendMessage(
        text,
        articleContext?._id,
        language
      );
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
        text: 'I encountered an error retrieving news context. Please ensure the backend is connected and try again.',
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

  /**
   * Safe text renderer with code-block and URL handling to strictly prevent horizontal overflow
   */
  const renderMessageContent = (text: string) => {
    // Check if contains markdown code block ```code```
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const firstLine = lines[0];
        const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
        const codeContent = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

        return (
          <div key={index} className="my-2 rounded-xl bg-slate-900 text-slate-100 overflow-hidden text-xs max-w-full">
            {hasLang && (
              <div className="px-3 py-1 bg-slate-800 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                {firstLine}
              </div>
            )}
            <pre className="p-3 overflow-x-auto max-w-full font-mono leading-relaxed scrollbar-none">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      }

      // Format bold markdown **bold** and basic text
      const subParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={index} className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
          {subParts.map((sub, i) => {
            if (sub.startsWith('**') && sub.endsWith('**')) {
              return <strong key={i} className="font-bold">{sub.slice(2, -2)}</strong>;
            }
            return sub;
          })}
        </span>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100dvh-5.5rem)] lg:h-[calc(100vh-6.5rem)] flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden animate-fade-in">
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold truncate">AI News Assistant</h2>
            <p className="text-[10px] text-slate-400 truncate">
              {isHinglish ? 'Hinglish Mode Active' : 'Verified Multi-Source News Grounding'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleClear}
            title="Clear Conversation"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-xs flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Article Context Card (Requirement 7: Discussing: [Article headline]) */}
      {articleContext && (
        <div className="bg-sky-50 border-b border-sky-200/90 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-sky-950 shrink-0 animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shrink-0" />
            <span className="font-bold text-sky-900 shrink-0">Discussing:</span>
            <span className="font-semibold truncate text-sky-950">
              {articleContext.title}
            </span>
          </div>

          <button
            onClick={handleClearContext}
            className="p-1 hover:bg-sky-100 rounded-lg text-sky-700 transition-colors shrink-0 flex items-center gap-1"
            title="Remove article context"
            aria-label="Remove article context"
          >
            <span className="text-[10px] font-medium hidden sm:inline">Remove</span>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message Area: Scrolls Independently, NO Horizontal Overflow */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden min-h-0 space-y-4 bg-slate-50/60">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-2.5 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'} max-w-full`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed break-words [overflow-wrap:anywhere] ${
                  isUser
                    ? 'bg-sky-600 text-white rounded-br-sm shadow-sm'
                    : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-sm shadow-sm'
                }`}
              >
                <div>{renderMessageContent(m.text)}</div>

                {/* News Citations & Grounding Sources */}
                {m.relatedArticles && m.relatedArticles.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
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
                          className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs text-sky-700 transition-colors min-w-0"
                        >
                          <span className="truncate max-w-[90%] font-medium">
                            {art.title}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isSending && (
          <div className="flex gap-2.5 items-center text-xs text-slate-500 py-1">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin text-sky-600" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm text-slate-600 font-medium">
              Analyzing verified news sources...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Drawer (Toggleable via [+] button) */}
      {showPrompts && (
        <div className="p-3 bg-slate-100/90 border-t border-slate-200 space-y-2 shrink-0 animate-slide-up">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Suggested Questions</span>
            <button
              onClick={() => setShowPrompts(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestionPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="px-3 py-1.5 bg-white hover:bg-sky-50 hover:text-sky-700 text-slate-700 rounded-xl text-xs font-medium transition-colors border border-slate-200 shadow-xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fixed Bottom Input Composer: [ + ] [Ask anything...] [Send] */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2.5 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
      >
        <button
          type="button"
          onClick={() => setShowPrompts(!showPrompts)}
          className={`p-2.5 rounded-2xl transition-all shrink-0 ${
            showPrompts
              ? 'bg-sky-100 text-sky-700'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          }`}
          title="Suggested prompts"
          aria-label="Toggle suggested prompts"
        >
          <Plus className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            articleContext
              ? `Ask about "${articleContext.title.slice(0, 25)}..."`
              : 'Ask anything about today’s news or concepts...'
          }
          className="flex-1 min-w-0 px-4 py-2.5 bg-slate-100/80 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all truncate"
        />

        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="p-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-2xl shadow-sm transition-colors shrink-0"
          title="Send question"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { chatApi } from '../services/api';
import { ChatMessage } from '../types';
import { useLanguage } from '../hooks/useLanguage';

export const ChatDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, isHindi, decodeText } = useLanguage();

  const getWelcomeText = () =>
    isHindi
      ? 'नमस्ते! मैं आपका व्यक्तिगत एआई समाचार और ज्ञान सहायक हूँ। आज के भारत, विश्व, टेक्नोलॉजी, विज्ञान या व्यापार के समाचारों या किसी भी अवधारणा को आसान हिंदी में समझने के लिए मुझसे पूछें।'
      : "Hello! I'm your Personal AI News & Knowledge Assistant. Ask me anything about today's news in India, World, Technology, Science, Business, or ask for simple explanations of any concept.";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: getWelcomeText(),
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{ ...prev[0], text: getWelcomeText() }];
      }
      return prev;
    });
  }, [isHindi]);

  const suggestionChips = isHindi
    ? [
        'आज क्या महत्वपूर्ण हुआ?',
        'भारत के ताज़ा समाचार',
        'ताज़ा AI समाचार समझाएं',
        'यह क्यों महत्वपूर्ण है?',
      ]
    : [
        'What happened today?',
        'Give me India news',
        'Explain latest AI news',
        'Why is AI governance important?',
      ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isSending) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setShowChips(false);
    setIsSending(true);

    try {
      const data = await chatApi.sendMessage(query, undefined, language);
      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: decodeText(data.response),
        relatedArticles: data.relatedArticles?.map((a) => ({
          ...a,
          title: decodeText(a.title),
        })),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: isHindi
          ? 'समाचार संदर्भ प्राप्त करने में त्रुटि हुई। कृपया पुनः प्रयास करें।'
          : 'Sorry, I encountered an issue retrieving the latest news context. Please try asking again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 z-40 p-3.5 bg-gradient-to-tr from-sky-600 to-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
          aria-label="Open AI News Chat"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="hidden md:inline text-xs font-bold pr-1">
            {isHindi ? 'एआई से पूछें' : 'Ask AI'}
          </span>
        </button>
      )}

      {/* Chat Drawer Window */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-slide-left overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold truncate">
                  {isHindi ? 'व्यक्तिगत एआई समाचार सहायक' : 'Personal AI News Assistant'}
                </h3>
                <p className="text-[10px] text-slate-400 truncate">
                  {isHindi ? 'सत्यापित समाचार आधार' : 'Verified news grounding'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden space-y-3.5 bg-slate-50/50 min-h-0">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} max-w-full`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 text-xs mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed break-words [overflow-wrap:anywhere] ${
                      isUser
                        ? 'bg-sky-600 text-white rounded-br-sm shadow-sm'
                        : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.text}</div>

                    {m.relatedArticles && m.relatedArticles.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          {isHindi ? 'सत्यापित स्रोत:' : 'Verified Sources:'}
                        </span>
                        {m.relatedArticles.map((art) => (
                          <a
                            key={art.id}
                            href={art.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[11px] text-sky-600 truncate transition-colors"
                          >
                            <span className="truncate max-w-[90%] font-medium">
                              {decodeText(art.title)}
                            </span>
                            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {isSending && (
              <div className="flex gap-2 items-center text-xs text-slate-400 py-1">
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-sky-600" />
                </div>
                <span>{isHindi ? 'विश्लेषण जारी है...' : 'Analyzing news context...'}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {showChips && (
            <div className="p-2.5 bg-white border-t border-slate-100 flex flex-wrap gap-1.5 shrink-0">
              {suggestionChips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(chip)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 rounded-lg text-[11px] font-medium transition-colors border border-slate-200"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Fixed Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <button
              type="button"
              onClick={() => setShowChips(!showChips)}
              className={`p-2 rounded-xl transition-colors shrink-0 ${
                showChips
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
              title={isHindi ? 'सुझाए गए प्रश्न' : 'Suggested questions'}
              aria-label="Toggle suggestions"
            >
              <Plus className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isHindi
                  ? 'आज के समाचारों के बारे में कुछ भी पूछें...'
                  : "Ask anything about today's news..."
              }
              className="flex-1 min-w-0 px-3.5 py-2 bg-slate-100/80 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all truncate"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="p-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-xl shadow-sm transition-colors shrink-0"
              aria-label="Send"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

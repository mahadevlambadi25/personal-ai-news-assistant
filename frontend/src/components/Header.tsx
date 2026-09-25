import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  RotateCw,
  Download,
  User as UserIcon,
  Sparkles,
  Languages,
} from 'lucide-react';
import { formatFullDate } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../hooks/useLanguage';

interface HeaderProps {
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
  lastUpdated?: Date;
  onSearch?: (query: string) => void;
  searchValue?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isRefreshing = false,
  lastUpdated,
  onSearch,
  searchValue = '',
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canInstall, promptInstall } = usePWAInstall();
  const { language, setLanguage, t, isHindi } = useLanguage();
  const [searchTerm, setSearchTerm] = useState(searchValue);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      navigate(`/latest?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-2.5 sm:px-6 py-2 transition-all">
      <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-7xl mx-auto w-full">
        {/* Brand Logo & Name (visible on mobile and tablet) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-xl"
            aria-label="Personal AI News Home"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/15 group-hover:scale-105 transition-transform shrink-0">
              <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight block leading-tight">
                {t('AI News & Knowledge')}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                {t('Verified & Neutral')}
              </span>
            </div>
          </Link>

          {/* Live News Pulse Indicator */}
          <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t('Live Feed')}</span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 max-w-md mx-1 sm:mx-2 min-w-0"
          role="search"
        >
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('Search news, topics, concepts...')}
            aria-label="Search articles"
            className="w-full pl-8 sm:pl-9 pr-2.5 sm:pr-3 py-1.5 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all truncate"
          />
        </form>

        {/* Right Area: Language Selector + Refresh + Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Global Language Selector: 🌐 Language English | हिंदी */}
          <div
            className="flex items-center p-0.5 bg-slate-100/90 rounded-xl border border-slate-200/90 text-xs font-semibold"
            role="group"
            aria-label="Language selection"
          >
            <div className="hidden md:flex items-center gap-1 pl-2 pr-1 text-slate-500 text-[11px] font-medium select-none">
              <Languages className="w-3.5 h-3.5 text-sky-600" />
              <span>{t('Language')}:</span>
            </div>
            <div className="flex md:hidden items-center pl-1.5 pr-0.5 text-slate-500 select-none">
              <Languages className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-lg text-[11px] sm:text-xs transition-all ${
                language === 'en'
                  ? 'bg-white text-slate-950 font-bold shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              aria-pressed={language === 'en'}
              title="English"
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-2 py-1 rounded-lg text-[11px] sm:text-xs transition-all ${
                language === 'hi'
                  ? 'bg-sky-600 text-white font-bold shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              aria-pressed={language === 'hi'}
              title="हिंदी (Hindi)"
            >
              हिंदी
            </button>
          </div>

          {/* Refresh Feeds Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              title={t('Refresh')}
              aria-label={t('Refresh')}
              className="p-1.5 sm:p-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 border border-slate-200 rounded-xl text-xs font-medium flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`}
              />
              <span className="hidden md:inline">{t('Refresh')}</span>
            </button>
          )}

          {/* PWA Install Button */}
          {canInstall && (
            <button
              type="button"
              onClick={promptInstall}
              title={t('Install')}
              aria-label={t('Install')}
              className="hidden lg:inline-flex px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold items-center gap-1.5 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('Install')}</span>
            </button>
          )}

          {/* User Profile / Settings */}
          <button
            type="button"
            onClick={() => navigate(user ? '/settings' : '/login')}
            className="p-1.5 sm:p-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors shrink-0"
            title={user ? user.name : t('Account Profile')}
            aria-label={t('Account Profile')}
          >
            <UserIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

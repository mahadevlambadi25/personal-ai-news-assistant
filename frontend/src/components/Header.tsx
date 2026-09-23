import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RotateCw,
  Download,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { getGreeting, formatFullDate } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';
import { usePWAInstall } from '../hooks/usePWAInstall';

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
  const [searchTerm, setSearchTerm] = useState(searchValue);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      navigate(`/latest?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3.5 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Left: Greeting & Current Date */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">
              {getGreeting()}{user ? `, ${user.name.split(' ')[0]}` : ''}!
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live News
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {formatFullDate()}
            {lastUpdated && (
              <span className="ml-2 text-[11px] text-slate-400">
                • Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>

        {/* Right: Search, Refresh, Install, Profile */}
        <div className="flex items-center gap-2.5">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search news, topics..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </form>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh latest news"
              className="p-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 border border-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          {/* Install PWA Button */}
          {canInstall && (
            <button
              onClick={promptInstall}
              title="Install Web App"
              className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install</span>
            </button>
          )}

          {/* User Profile / Login */}
          <button
            onClick={() => navigate(user ? '/settings' : '/login')}
            className="p-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors shrink-0"
            title={user ? user.name : 'Log in'}
          >
            <UserIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

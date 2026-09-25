import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Newspaper,
  BookOpen,
  Bookmark,
  MessageSquare,
  Settings,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Cpu,
  Globe,
  Landmark,
  Rocket,
  Leaf,
  AlertTriangle,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  categoryCounts?: Array<{ name: string; count: number }>;
}

export const Sidebar: React.FC<SidebarProps> = ({ categoryCounts = [] }) => {
  const { user } = useAuth();
  const { t, isHindi } = useLanguage();
  const countMap = new Map(categoryCounts.map((c) => [c.name, c.count]));

  const mainLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/latest', label: 'Latest News', icon: Newspaper },
    { to: '/knowledge', label: 'Knowledge Hub', icon: BookOpen },
    { to: '/saved', label: 'Saved News', icon: Bookmark },
    { to: '/chat', label: 'AI Assistant', icon: MessageSquare },
  ];

  const categoryLinks = [
    { to: '/category/India', label: 'India', icon: Landmark, emoji: '🇮🇳' },
    { to: '/category/World', label: 'World', icon: Globe, emoji: '🌍' },
    { to: '/category/Politics', label: 'Politics', icon: Landmark, emoji: '🏛️' },
    { to: '/category/Business%20%26%20Economy', label: 'Business & Economy', icon: TrendingUp, emoji: '📈' },
    { to: '/category/Technology%20%26%20AI', label: 'Technology & AI', icon: Cpu, emoji: '🤖' },
    { to: '/category/Science%20%26%20Space', label: 'Science & Space', icon: Rocket, emoji: '🚀' },
    { to: '/category/Environment', label: 'Environment', icon: Leaf, emoji: '🌱' },
    { to: '/category/Major%20Incidents', label: 'Major Incidents', icon: AlertTriangle, emoji: '⚠️' },
    { to: '/category/Sports', label: 'Sports', icon: Trophy, emoji: '🏆' },
    { to: '/category/Knowledge', label: 'Knowledge', icon: BookOpen, emoji: '🧠' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/80 h-screen sticky top-0 overflow-y-auto select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight">{t('AI News & Knowledge')}</h1>
          <p className="text-[11px] text-slate-500 font-medium">
            {isHindi ? 'सत्यापित दैनिक समाचार' : 'Objective Daily Insights'}
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="p-3 space-y-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
          {t('Feeds')}
        </div>
        {mainLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{t(item.label)}</span>
              </div>
            </NavLink>
          );
        })}
      </div>

      {/* 10 Topic Categories */}
      <div className="p-3 space-y-1 border-t border-slate-100">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
          {t('Categories')}
        </div>
        {categoryLinks.map((item) => {
          const rawName = decodeURIComponent(item.to.replace('/category/', ''));
          const count = countMap.get(rawName);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-sm shrink-0">{item.emoji}</span>
                <span className="truncate">{item.label}</span>
              </div>
              {count !== undefined && count > 0 && (
                <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded-md">
                  {count}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer & User Profile */}
      <div className="mt-auto p-3 border-t border-slate-100">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all mb-2 ${
              isActive
                ? 'bg-sky-50 text-sky-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </NavLink>

        {user ? (
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="truncate">
              <div className="text-xs font-bold text-slate-800 truncate">{user.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
            </div>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl text-center block shadow-sm transition-colors"
          >
            Log In / Sign Up
          </NavLink>
        )}
      </div>
    </aside>
  );
};

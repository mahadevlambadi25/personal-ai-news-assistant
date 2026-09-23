import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Newspaper,
  BookOpen,
  Bookmark,
  MessageSquare,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const items = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/latest', label: 'Latest', icon: Newspaper },
    { to: '/knowledge', label: 'Knowledge', icon: BookOpen },
    { to: '/saved', label: 'Saved', icon: Bookmark },
    { to: '/chat', label: 'AI Chat', icon: MessageSquare },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center py-1.5 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-sky-600 font-semibold'
                    : 'text-slate-500 hover:text-slate-900 font-medium'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

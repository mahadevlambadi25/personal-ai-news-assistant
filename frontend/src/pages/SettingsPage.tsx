import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Bell,
  Sliders,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { CATEGORIES_DATA } from '../data/categoriesData';
import { NewsCategory } from '../types';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, preferences, updatePreferences, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>(
    preferences?.categories || CATEGORIES_DATA.map((c) => c.name)
  );
  const [newsLimit, setNewsLimit] = useState<number>(preferences?.newsLimit || 20);
  const [whatsappDigest, setWhatsappDigest] = useState<boolean>(
    preferences?.notificationSettings?.whatsappDailyDigest || false
  );
  const [digestTime, setDigestTime] = useState<string>(
    preferences?.notificationSettings?.digestTime || '08:00'
  );

  const toggleCategory = (catName: NewsCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catName)) {
        if (prev.length <= 1) return prev; // keep at least 1
        return prev.filter((c) => c !== catName);
      } else {
        return [...prev, catName];
      }
    });
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      await updatePreferences({
        categories: selectedCategories,
        newsLimit,
        notificationSettings: {
          emailDailyDigest: false,
          whatsappDailyDigest: whatsappDigest,
          digestTime,
        },
      });
      setSuccessMsg('Preferences saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-600" />
          <span>User Preferences & Settings</span>
        </h2>
        <p className="text-xs text-slate-500">
          Personalize your news feeds, daily digest limits, and notification alerts.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Account Info */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-slate-500" />
          <span>Account Profile</span>
        </h3>

        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <div className="text-sm font-bold text-slate-900">{user.name}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
              {user.whatsappNumber && (
                <div className="text-xs text-slate-500">WhatsApp: {user.whatsappNumber}</div>
              )}
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="px-3.5 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-center"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              You are currently browsing as a guest. Sign in to sync your bookmarks across devices.
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap"
            >
              Log In
            </button>
          </div>
        )}
      </div>

      {/* Form: Preferences */}
      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* Favorite Categories */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Favorite News Categories</span>
          </h3>
          <p className="text-xs text-slate-500">
            Select the categories you want to see by default on your dashboard feed.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
            {CATEGORIES_DATA.map((cat) => {
              const checked = selectedCategories.includes(cat.name);
              return (
                <button
                  type="button"
                  key={cat.name}
                  onClick={() => toggleCategory(cat.name)}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center gap-2 transition-all ${
                    checked
                      ? 'bg-sky-50 border-sky-300 text-sky-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm">{cat.emoji}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily Digest & WhatsApp Settings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-500" />
            <span>Daily Notifications & WhatsApp Digest</span>
          </h3>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <div className="text-xs font-semibold text-slate-800">
                WhatsApp Morning News Digest
              </div>
              <div className="text-[11px] text-slate-500">
                Receive top 3 news stories + 1 knowledge concept on your WhatsApp
              </div>
            </div>
            <input
              type="checkbox"
              checked={whatsappDigest}
              onChange={(e) => setWhatsappDigest(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <div className="text-xs font-semibold text-slate-800">Preferred Digest Time</div>
              <div className="text-[11px] text-slate-500">Local time for scheduled delivery</div>
            </div>
            <input
              type="time"
              value={digestTime}
              onChange={(e) => setDigestTime(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <div className="text-xs font-semibold text-slate-800">Articles Per Page</div>
              <div className="text-[11px] text-slate-500">Default feed batch size (5–50)</div>
            </div>
            <input
              type="number"
              min={5}
              max={50}
              value={newsLimit}
              onChange={(e) => setNewsLimit(parseInt(e.target.value, 10) || 20)}
              className="w-16 px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white text-center"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
};

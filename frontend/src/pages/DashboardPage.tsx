import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  MessageSquare,
  TrendingUp,
  RotateCw,
} from 'lucide-react';
import { NewsArticle, KnowledgeItem, CategoryCount } from '../types';
import { newsApi, knowledgeApi } from '../services/api';
import { NewsCard } from '../components/NewsCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { CategoryPills } from '../components/CategoryPills';
import { InstallPrompt } from '../components/InstallPrompt';
import { useSavedNews } from '../hooks/useSavedNews';

interface ContextType {
  onOpenDetail: (article: NewsArticle) => void;
  showToast: (msg: string) => void;
  categoryCounts: CategoryCount[];
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { onOpenDetail, showToast, categoryCounts } = useOutletContext<ContextType>();
  const { isSaved, toggleSave } = useSavedNews();

  const [topArticles, setTopArticles] = useState<NewsArticle[]>([]);
  const [latestArticles, setLatestArticles] = useState<NewsArticle[]>([]);
  const [todayKnowledge, setTodayKnowledge] = useState<KnowledgeItem | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [newsRes, knowRes] = await Promise.all([
        newsApi.getNews({ limit: 12 }),
        knowledgeApi.getKnowledge({ limit: 1 }),
      ]);

      const all = newsRes.articles || [];
      // Top 3 as featured stories, remaining as latest stream
      setTopArticles(all.slice(0, 3));
      setLatestArticles(all.slice(3, 12));

      if (knowRes.items && knowRes.items.length > 0) {
        setTodayKnowledge(knowRes.items[0]);
      }
    } catch {
      showToast('Could not load dashboard data. Retrying...');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboardData();

    // Listen for global refresh events
    const handleNewsRefreshed = () => {
      loadDashboardData();
    };
    window.addEventListener('news_refreshed', handleNewsRefreshed);
    return () => window.removeEventListener('news_refreshed', handleNewsRefreshed);
  }, [loadDashboardData]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* PWA Install Banner */}
      <InstallPrompt />

      {/* Hero Welcome & Value Proposition */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Synthesized News & Knowledge</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
            What important things happened in the world today?
          </h2>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            Real-world news across 10 categories, explained with simple background, why it matters,
            and key lessons to expand your knowledge. Strictly neutral and verified.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/latest')}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Explore All News</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 backdrop-blur-sm transition-all flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span>Ask AI Assistant</span>
            </button>
          </div>
        </div>

        {/* Decorative background radial pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-500/20 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Category Pills Navigation */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Explore Categories</span>
          </h3>
          <span className="text-[11px] text-slate-400">10 Hubs Available</span>
        </div>
        <CategoryPills
          categoryCounts={categoryCounts}
          onSelectCategory={(cat) => {
            if (cat === 'all') navigate('/latest');
            else navigate(`/category/${encodeURIComponent(cat)}`);
          }}
        />
      </div>

      {/* Today's Knowledge Spotlight */}
      {todayKnowledge && (
        <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 rounded-3xl p-6 border border-violet-200/80 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-600 text-white shadow-sm">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Today’s Knowledge Concept</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-violet-950">
                {todayKnowledge.topic}
              </h3>
              <p className="text-xs md:text-sm text-violet-900 leading-relaxed">
                {todayKnowledge.simpleExplanation}
              </p>
              {todayKnowledge.whyItMatters && (
                <p className="text-xs text-violet-700 italic">
                  💡 <strong>Why it matters:</strong> {todayKnowledge.whyItMatters}
                </p>
              )}
            </div>

            <button
              onClick={() => navigate('/knowledge')}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors whitespace-nowrap self-start md:self-center flex items-center gap-1.5"
            >
              <span>View Knowledge Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Important News Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              <span>Top Important Stories</span>
            </h3>
            <p className="text-xs text-slate-500">Key developments you should know about</p>
          </div>
          <button
            onClick={() => navigate('/latest')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {topArticles.map((article) => (
              <NewsCard
                key={article._id}
                article={article}
                isSaved={isSaved(article._id)}
                onToggleSave={toggleSave}
                onShowToast={showToast}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        )}
      </div>

      {/* Latest Stream Section */}
      {latestArticles.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Latest Feed Updates
              </h3>
              <p className="text-xs text-slate-500">Recently verified stories</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {latestArticles.map((article) => (
              <NewsCard
                key={article._id}
                article={article}
                isSaved={isSaved(article._id)}
                onToggleSave={toggleSave}
                onShowToast={showToast}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

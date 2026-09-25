import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  TrendingUp,
  RotateCw,
  AlertCircle,
} from 'lucide-react';
import { NewsArticle, KnowledgeItem, CategoryCount } from '../types';
import { newsApi, knowledgeApi } from '../services/api';
import { FeaturedStoryCard } from '../components/FeaturedStoryCard';
import { SecondaryStoryCard } from '../components/SecondaryStoryCard';
import { NewsCard } from '../components/NewsCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { CategoryPills } from '../components/CategoryPills';
import { InstallPrompt } from '../components/InstallPrompt';
import { useSavedNews } from '../hooks/useSavedNews';
import { useLanguage } from '../hooks/useLanguage';

interface ContextType {
  onOpenDetail?: (article: NewsArticle) => void;
  showToast: (msg: string) => void;
  categoryCounts: CategoryCount[];
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, categoryCounts } = useOutletContext<ContextType>();
  const { isSaved, toggleSave } = useSavedNews();
  const { isHindi, t, synthesizeHindi, decodeText } = useLanguage();

  const [topArticles, setTopArticles] = useState<NewsArticle[]>([]);
  const [secondaryArticles, setSecondaryArticles] = useState<NewsArticle[]>([]);
  const [streamArticles, setStreamArticles] = useState<NewsArticle[]>([]);
  const [todayKnowledge, setTodayKnowledge] = useState<KnowledgeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [newsRes, knowRes] = await Promise.all([
        newsApi.getNews({ limit: 12 }),
        knowledgeApi.getKnowledge({ limit: 1 }),
      ]);

      const all = newsRes.articles || [];
      if (all.length > 0) {
        setTopArticles(all.slice(0, 1));
        setSecondaryArticles(all.slice(1, 3));
        setStreamArticles(all.slice(3));
      } else {
        setTopArticles([]);
        setSecondaryArticles([]);
        setStreamArticles([]);
      }

      if (knowRes.items && knowRes.items.length > 0) {
        setTodayKnowledge(knowRes.items[0]);
      }
    } catch {
      setLoadError(isHindi ? 'आज के समाचार लोड नहीं हो सके।' : "Unable to load today's news feeds.");
      showToast?.(isHindi ? 'डैशबोर्ड समाचार लोड नहीं हो सके' : 'Could not load dashboard news.');
    } finally {
      setLoading(false);
    }
  }, [showToast, isHindi]);

  useEffect(() => {
    loadDashboardData();

    const handleNewsRefreshed = () => {
      loadDashboardData();
    };
    window.addEventListener('news_refreshed', handleNewsRefreshed);
    return () => window.removeEventListener('news_refreshed', handleNewsRefreshed);
  }, [loadDashboardData]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* PWA Install Banner */}
      <InstallPrompt />

      {/* Category Pills Navigation */}
      <div>
        <CategoryPills
          categoryCounts={categoryCounts}
          selectedCategory="all"
          onSelectCategory={(cat) => {
            if (cat === 'all') navigate('/latest');
            else if (cat.toLowerCase() === 'knowledge') navigate('/knowledge');
            else navigate(`/category/${encodeURIComponent(cat)}`);
          }}
        />
      </div>

      {/* Error State with Retry Button */}
      {loadError && (
        <div className="p-6 bg-white rounded-3xl border border-rose-200 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">{loadError}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isHindi
              ? 'कृपया अपना इंटरनेट कनेक्शन और बैकएंड सर्वर जांचें।'
              : 'Please verify your network connection and backend server status.'}
          </p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors inline-flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{isHindi ? 'पुनः प्रयास करें' : 'Retry'}</span>
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !loadError && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 h-96 bg-slate-200/70 rounded-3xl animate-pulse" />
            <div className="lg:col-span-5 space-y-4">
              <div className="h-44 bg-slate-200/70 rounded-2xl animate-pulse" />
              <div className="h-44 bg-slate-200/70 rounded-2xl animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      )}

      {/* Main Top Stories Section with Strong Visual Hierarchy */}
      {!loading && !loadError && topArticles.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-950 tracking-tight">
                  {isHindi ? 'आज के प्रमुख समाचार' : 'Top Stories Today'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {isHindi
                    ? 'एआई विश्लेषण और सरल व्याख्या के साथ महत्वपूर्ण समाचार'
                    : 'Important developments curated with AI synthesis'}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/latest')}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 group"
            >
              <span>{isHindi ? 'सभी देखें' : 'View all'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* 1 Main Featured Hero Story */}
            <div className="lg:col-span-7 flex flex-col">
              <FeaturedStoryCard
                article={topArticles[0]}
                isSaved={isSaved(topArticles[0]._id)}
                onToggleSave={toggleSave}
                onShowToast={showToast}
              />
            </div>

            {/* Smaller Secondary Stories */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              {secondaryArticles.map((article) => (
                <SecondaryStoryCard
                  key={article._id}
                  article={article}
                  isSaved={isSaved(article._id)}
                  onToggleSave={toggleSave}
                  onShowToast={showToast}
                />
              ))}

              {/* Quick AI Prompt Teaser */}
              <div
                onClick={() => navigate('/chat')}
                className="p-4 rounded-2xl bg-gradient-to-r from-sky-900 to-indigo-950 text-white cursor-pointer hover:shadow-md transition-all flex items-center justify-between gap-3 group border border-sky-800/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-400/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold group-hover:text-sky-300 transition-colors">
                      {isHindi ? 'आज की खबरों के बारे में AI से पूछें' : "Ask AI anything about today's news"}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {isHindi ? 'सत्यापित समाचार स्रोतों पर आधारित' : 'Grounded in verified multi-source news'}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-sky-400 shrink-0 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Today's Knowledge Spotlight */}
      {!loading && !loadError && todayKnowledge && (
        <section className="bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 rounded-3xl p-5 sm:p-6 border border-violet-200/90 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-600 text-white shadow-sm">
                <BookOpen className="w-3 h-3" />
                <span>{isHindi ? 'आज की मुख्य अवधारणा' : 'Knowledge Concept of the Day'}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-violet-950">
                {isHindi ? synthesizeHindi(todayKnowledge.topic) : decodeText(todayKnowledge.topic)}
              </h3>
              <p className="text-xs sm:text-sm text-violet-900 leading-relaxed">
                {isHindi
                  ? synthesizeHindi(todayKnowledge.simpleExplanation)
                  : decodeText(todayKnowledge.simpleExplanation)}
              </p>
            </div>

            <button
              onClick={() => navigate('/knowledge')}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors whitespace-nowrap self-start md:self-center flex items-center gap-1.5"
            >
              <span>{isHindi ? 'ज्ञान केंद्र देखें' : 'Explore Knowledge Hub'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* Normal Compact News Cards Section */}
      {!loading && !loadError && streamArticles.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight">
                {isHindi ? 'ताज़ा समाचार' : 'More Recent Stories'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isHindi ? 'देश और दुनिया की ताज़ा सत्यापित खबरें' : 'Fresh reports across national and international desks'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {streamArticles.map((article) => (
              <NewsCard
                key={article._id}
                article={article}
                isSaved={isSaved(article._id)}
                onToggleSave={toggleSave}
                onShowToast={showToast}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

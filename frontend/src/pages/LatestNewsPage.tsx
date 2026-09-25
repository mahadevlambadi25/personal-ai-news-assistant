import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useOutletContext, useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';
import { NewsArticle, CategoryCount } from '../types';
import { newsApi } from '../services/api';
import { NewsCard } from '../components/NewsCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { CategoryPills } from '../components/CategoryPills';
import { useSavedNews } from '../hooks/useSavedNews';
import { useLanguage } from '../hooks/useLanguage';

interface ContextType {
  onOpenDetail?: (article: NewsArticle) => void;
  showToast: (msg: string) => void;
  categoryCounts: CategoryCount[];
}

export const LatestNewsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast, categoryCounts } = useOutletContext<ContextType>();
  const { isSaved, toggleSave } = useSavedNews();
  const { isHindi } = useLanguage();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('search') || '';
  const sort = (searchParams.get('sort') as 'newest' | 'oldest') || 'newest';

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await newsApi.getNews({
        page,
        limit: 12,
        category: category !== 'all' ? category : undefined,
        search: search.trim() || undefined,
        sort,
      });

      setArticles(data.articles || []);
      setTotalPages(data.pagination.totalPages || 1);
      setTotalCount(data.pagination.total || 0);
    } catch {
      showToast(
        isHindi
          ? 'समाचार लोड नहीं हो सके। कृपया अपना इंटरनेट जांचें।'
          : 'Could not fetch articles. Please check your connection.'
      );
    } finally {
      setLoading(false);
    }
  }, [page, category, search, sort, showToast, isHindi]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== 'page') {
      next.set('page', '1');
    }
    setSearchParams(next);
  };

  const handleClearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('search');
    next.set('page', '1');
    setSearchParams(next);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Search Header Banner or Page Header */}
      {search ? (
        <div className="p-5 sm:p-6 bg-white rounded-3xl border border-sky-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                {isHindi ? `"${search}" के लिए खोज परिणाम` : `Search Results for "${search}"`}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isHindi
                  ? `${totalCount} समाचार मिले`
                  : `${totalCount} ${totalCount === 1 ? 'article' : 'articles'} found matching your query`}
              </p>
            </div>
          </div>

          <button
            onClick={handleClearSearch}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0"
          >
            <X className="w-4 h-4" />
            <span>{isHindi ? 'खोज हटाएं' : 'Clear search'}</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
              {isHindi ? 'ताज़ा राष्ट्रीय और अंतरराष्ट्रीय समाचार' : 'Latest World & National News'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {isHindi
                ? totalCount > 0
                  ? `${totalCount} सत्यापित समाचार उपलब्ध`
                  : 'लाइव समाचार फ़ीड'
                : totalCount > 0
                ? `${totalCount} verified articles indexed`
                : 'Live feeds'}
            </p>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateParam('sort', sort === 'newest' ? 'oldest' : 'newest')}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>
                {isHindi
                  ? sort === 'newest'
                    ? 'क्रम: नए पहले'
                    : 'क्रम: पुराने पहले'
                  : sort === 'newest'
                  ? 'Sort: Newest First'
                  : 'Sort: Oldest First'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Category Pills Filter */}
      <CategoryPills
        selectedCategory={category}
        onSelectCategory={(cat) => updateParam('category', cat)}
        categoryCounts={categoryCounts}
      />

      {/* Loading Skeleton Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Search className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {search
                ? isHindi
                  ? `"${search}" के लिए कोई समाचार नहीं मिला`
                  : `No news found for "${search}"`
                : isHindi
                ? 'इस श्रेणी में कोई समाचार नहीं मिला'
                : 'No articles found in this category'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isHindi
                ? 'कृपया वर्तनी जांचें, सरल शब्दों से खोजें, या अन्य श्रेणियों में देखें।'
                : 'Try checking for spelling errors, using simpler keywords, or browsing our news categories.'}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-2">
            {search && (
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                {isHindi ? 'सभी समाचार देखें' : 'Clear Search & View All'}
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
            >
              {isHindi ? 'डैशबोर्ड पर जाएं' : 'Go to Dashboard'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article) => (
            <NewsCard
              key={article._id}
              article={article}
              isSaved={isSaved(article._id)}
              onToggleSave={toggleSave}
              onShowToast={showToast}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            onClick={() => updateParam('page', String(Math.max(1, page - 1)))}
            disabled={page <= 1}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{isHindi ? 'पिछला' : 'Previous'}</span>
          </button>

          <span className="text-xs font-semibold text-slate-500">
            {isHindi ? `पृष्ठ ${page} / ${totalPages}` : `Page ${page} of ${totalPages}`}
          </span>

          <button
            onClick={() => updateParam('page', String(Math.min(totalPages, page + 1)))}
            disabled={page >= totalPages}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>{isHindi ? 'अगला' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

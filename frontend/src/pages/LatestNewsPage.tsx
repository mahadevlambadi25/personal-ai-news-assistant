import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { Filter, ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { NewsArticle, CategoryCount } from '../types';
import { newsApi } from '../services/api';
import { NewsCard } from '../components/NewsCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { EmptyState } from '../components/EmptyState';
import { CategoryPills } from '../components/CategoryPills';
import { useSavedNews } from '../hooks/useSavedNews';

interface ContextType {
  onOpenDetail: (article: NewsArticle) => void;
  showToast: (msg: string) => void;
  categoryCounts: CategoryCount[];
}

export const LatestNewsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { onOpenDetail, showToast, categoryCounts } = useOutletContext<ContextType>();
  const { isSaved, toggleSave } = useSavedNews();

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
      showToast('Could not fetch articles. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [page, category, search, sort, showToast]);

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
    // reset to page 1 on filter change
    if (key !== 'page') {
      next.set('page', '1');
    }
    setSearchParams(next);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Latest World & National News
          </h2>
          <p className="text-xs text-slate-500">
            {totalCount > 0 ? `${totalCount} verified articles indexed` : 'Live feeds'}
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateParam('sort', sort === 'newest' ? 'oldest' : 'newest')}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort: {sort === 'newest' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <CategoryPills
        selectedCategory={category}
        onSelectCategory={(cat) => updateParam('category', cat)}
        categoryCounts={categoryCounts}
      />

      {/* Search Filter Banner (if search is active) */}
      {search && (
        <div className="bg-sky-50 border border-sky-200 text-sky-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
          <span>
            Showing search results for: <strong>"{search}"</strong>
          </span>
          <button
            onClick={() => updateParam('search', '')}
            className="font-bold underline hover:text-sky-700"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* News Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          title="No articles found"
          description="Try changing your search query or choosing another category."
          actionText="Show All News"
          onAction={() => setSearchParams(new URLSearchParams())}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article) => (
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6 pb-4">
          <button
            disabled={page <= 1}
            onClick={() => updateParam('page', String(page - 1))}
            className="px-3 py-1.5 bg-white border border-slate-200 disabled:opacity-40 text-slate-700 text-xs font-medium rounded-xl flex items-center gap-1 shadow-sm transition-colors hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-slate-500 font-medium">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => updateParam('page', String(page + 1))}
            className="px-3 py-1.5 bg-white border border-slate-200 disabled:opacity-40 text-slate-700 text-xs font-medium rounded-xl flex items-center gap-1 shadow-sm transition-colors hover:bg-slate-50"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

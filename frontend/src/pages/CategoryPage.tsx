import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NewsArticle } from '../types';
import { newsApi } from '../services/api';
import { getCategoryMeta } from '../data/categoriesData';
import { NewsCard } from '../components/NewsCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { EmptyState } from '../components/EmptyState';
import { useSavedNews } from '../hooks/useSavedNews';

interface ContextType {
  onOpenDetail: (article: NewsArticle) => void;
  showToast: (msg: string) => void;
}

export const CategoryPage: React.FC = () => {
  const { category = 'India' } = useParams<{ category: string }>();
  const decodedCategory = decodeURIComponent(category);
  const catMeta = getCategoryMeta(decodedCategory);

  const { onOpenDetail, showToast } = useOutletContext<ContextType>();
  const { isSaved, toggleSave } = useSavedNews();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCategoryArticles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await newsApi.getNews({
        category: decodedCategory,
        page,
        limit: 12,
      });
      setArticles(data.articles || []);
      setTotalPages(data.pagination.totalPages || 1);
      setTotalCount(data.pagination.total || 0);
    } catch {
      showToast(`Could not load ${decodedCategory} articles.`);
    } finally {
      setLoading(false);
    }
  }, [decodedCategory, page, showToast]);

  useEffect(() => {
    setPage(1);
  }, [decodedCategory]);

  useEffect(() => {
    fetchCategoryArticles();
  }, [fetchCategoryArticles]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Category Banner */}
      <div className={`p-6 md:p-8 rounded-3xl border ${catMeta.bgColor} ${catMeta.borderColor} shadow-sm space-y-2`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl md:text-4xl p-2 bg-white rounded-2xl shadow-sm border border-slate-100">
            {catMeta.emoji}
          </span>
          <div>
            <h2 className={`text-xl md:text-2xl font-extrabold ${catMeta.color}`}>
              {catMeta.name} News
            </h2>
            <p className="text-xs text-slate-600 max-w-xl">
              {catMeta.description}
            </p>
          </div>
        </div>
        <div className="text-[11px] font-semibold text-slate-400 pt-1">
          {totalCount} total verified stories
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          title={`No news in ${catMeta.name} yet`}
          description="Click refresh or check back shortly as new RSS feeds are ingested."
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6 pb-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
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
            onClick={() => setPage((p) => p + 1)}
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

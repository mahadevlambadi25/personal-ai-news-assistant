import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Bookmark, Lock, ArrowRight } from 'lucide-react';
import { NewsArticle } from '../types';
import { newsApi } from '../services/api';
import { NewsCard } from '../components/NewsCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';
import { useSavedNews } from '../hooks/useSavedNews';

interface ContextType {
  onOpenDetail: (article: NewsArticle) => void;
  showToast: (msg: string) => void;
}

export const SavedPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { onOpenDetail, showToast } = useOutletContext<ContextType>();
  const { isSaved, toggleSave } = useSavedNews();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await newsApi.getSavedNews({ limit: 50 });
      setArticles(data.articles || []);
    } catch {
      showToast('Could not load saved bookmarks.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, showToast]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const handleToggle = async (articleId: string) => {
    const stillSaved = await toggleSave(articleId);
    if (!stillSaved) {
      // Remove from list view immediately
      setArticles((prev) => prev.filter((a) => a._id !== articleId));
    }
    return stillSaved;
  };

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={Lock}
        title="Sign in to save articles"
        description="Create a personal account or log in to bookmark stories, save knowledge concepts, and sync across devices."
        actionText="Log In / Sign Up"
        onAction={() => navigate('/login')}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-sky-600 fill-sky-600" />
            <span>Saved Bookmarks</span>
          </h2>
          <p className="text-xs text-slate-500">
            {articles.length} articles saved in your personal library
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved articles yet"
          description="Click the bookmark icon on any news card to save stories for later reading."
          actionText="Browse Latest News"
          onAction={() => navigate('/latest')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article) => (
            <NewsCard
              key={article._id}
              article={article}
              isSaved={isSaved(article._id)}
              onToggleSave={handleToggle}
              onShowToast={showToast}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
};

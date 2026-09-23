import { useState, useEffect, useCallback } from 'react';
import { newsApi } from '../services/api';
import { useAuth } from './useAuth';

export function useSavedNews() {
  const { isAuthenticated } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchSavedIds = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedIds(new Set());
      return;
    }
    try {
      setLoading(true);
      const ids = await newsApi.getSavedIds();
      setSavedIds(new Set(ids));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSavedIds();
  }, [fetchSavedIds]);

  const toggleSave = async (articleId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      throw new Error('Please log in to save articles.');
    }

    const isCurrentlySaved = savedIds.has(articleId);

    // Optimistic update
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlySaved) {
        next.delete(articleId);
      } else {
        next.add(articleId);
      }
      return next;
    });

    try {
      if (isCurrentlySaved) {
        await newsApi.unsaveArticle(articleId);
        return false;
      } else {
        await newsApi.saveArticle(articleId);
        return true;
      }
    } catch (err) {
      // Revert on failure
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) {
          next.add(articleId);
        } else {
          next.delete(articleId);
        }
        return next;
      });
      throw err;
    }
  };

  const isSaved = (articleId: string) => savedIds.has(articleId);

  return {
    savedIds,
    isSaved,
    toggleSave,
    loading,
    refreshSavedIds: fetchSavedIds,
  };
}

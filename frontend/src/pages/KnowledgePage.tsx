import React, { useEffect, useState, useCallback } from 'react';
import { BookOpen, Search, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { KnowledgeItem } from '../types';
import { knowledgeApi } from '../services/api';
import { KnowledgeCard } from '../components/KnowledgeCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { EmptyState } from '../components/EmptyState';

export const KnowledgePage: React.FC = () => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchKnowledge = useCallback(async () => {
    setLoading(true);
    try {
      const data = await knowledgeApi.getKnowledge({
        page,
        limit: 12,
        search: search.trim() || undefined,
      });
      setItems(data.items || []);
      setTotalPages(data.pagination.totalPages || 1);
      setTotalCount(data.pagination.total || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchKnowledge();
  }, [fetchKnowledge]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchKnowledge();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-violet-900 via-indigo-950 to-slate-950 text-white shadow-xl border border-violet-900/60 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold border border-violet-400/30">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Educational Concepts Derived From Current Events</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Today's Knowledge Library
        </h2>
        <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Every important news story has underlying principles. Expand your civic, scientific, and
          technological literacy with simple, beginner-friendly explanations.
        </p>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="pt-2 max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search concepts (e.g. UPI, Quantum, Inflation)..."
              className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:bg-white/20 focus:border-violet-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Concept Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No knowledge items found"
          description="Try searching for a different topic or refresh news feeds to generate new educational cards."
          actionText="Clear Search"
          onAction={() => setSearch('')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <KnowledgeCard key={item.id} item={item} />
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

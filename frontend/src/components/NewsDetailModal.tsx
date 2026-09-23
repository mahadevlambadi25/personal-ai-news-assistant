import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Bookmark,
  Share2,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { NewsArticle, ArticleDetailResponse } from '../types';
import { newsApi } from '../services/api';
import { timeAgo, formatFullDate, copyToClipboard } from '../utils/formatters';
import { getCategoryMeta } from '../data/categoriesData';

interface NewsDetailModalProps {
  article: NewsArticle | null;
  onClose: () => void;
  isSaved?: boolean;
  onToggleSave?: (articleId: string) => Promise<boolean>;
  onShowToast?: (message: string) => void;
  onSelectRelated?: (article: NewsArticle) => void;
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({
  article,
  onClose,
  isSaved = false,
  onToggleSave,
  onShowToast,
  onSelectRelated,
}) => {
  const [detailData, setDetailData] = useState<ArticleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!article) return;
    setLoading(true);
    newsApi
      .getNewsById(article._id)
      .then((data) => setDetailData(data))
      .catch(() => setDetailData(null))
      .finally(() => setLoading(false));
  }, [article]);

  if (!article) return null;

  const catMeta = getCategoryMeta(article.category);
  const summary = detailData?.summary;
  const related = detailData?.relatedNews || [];

  const handleShare = async () => {
    const success = await copyToClipboard(article.url || window.location.href);
    onShowToast?.(success ? 'Article link copied to clipboard!' : 'Failed to copy link');
  };

  const handleSave = async () => {
    if (!onToggleSave) return;
    try {
      const nowSaved = await onToggleSave(article._id);
      onShowToast?.(nowSaved ? 'Saved to bookmarks' : 'Removed from bookmarks');
    } catch (err: any) {
      onShowToast?.(err.message || 'Please log in to save');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 md:p-6 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-auto overflow-hidden shadow-2xl border border-slate-200 animate-scale-up">
        {/* Header Bar */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${catMeta.bgColor} ${catMeta.color} border ${catMeta.borderColor}`}
          >
            <span>{catMeta.emoji}</span>
            <span>{article.category}</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className={`p-2 rounded-xl border border-slate-200 transition-colors ${
                isSaved ? 'text-sky-600 bg-sky-50' : 'text-slate-600 hover:bg-slate-50'
              }`}
              title="Bookmark"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-sky-600' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-800">{article.sourceName}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo(article.publishedAt)} ({formatFullDate(new Date(article.publishedAt))})
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
            {article.title}
          </h2>

          {/* Neutrality & Source Guarantee Notice */}
          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50/80 p-3 rounded-xl border border-emerald-200/60">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Neutral, verified reporting synthesized directly from official coverage by{' '}
              <strong>{article.sourceName}</strong>. Zero partisan bias.
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
              <Sparkles className="w-6 h-6 animate-spin text-sky-500" />
              <span>Analyzing article context and background...</span>
            </div>
          ) : (
            <div className="space-y-6 text-sm text-slate-700">
              {/* What happened? */}
              <section className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2 text-base">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  What happened?
                </h3>
                <p className="leading-relaxed">
                  {summary?.summary || article.content || article.description}
                </p>
              </section>

              {/* Why it matters? */}
              {summary?.whyItMatters && (
                <section className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100/80">
                  <h3 className="font-bold text-amber-950 mb-2 flex items-center gap-2 text-base">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Why it matters?
                  </h3>
                  <p className="leading-relaxed text-amber-900">{summary.whyItMatters}</p>
                </section>
              )}

              {/* Background */}
              {summary?.background && (
                <section className="p-5 rounded-2xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2 text-base">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Background & Context
                  </h3>
                  <p className="leading-relaxed text-slate-600">{summary.background}</p>
                </section>
              )}

              {/* Key Facts */}
              {summary?.keyFacts && summary.keyFacts.length > 0 && (
                <section className="p-5 rounded-2xl bg-white border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-3 text-base">Key Verified Facts</h3>
                  <ul className="space-y-2">
                    {summary.keyFacts.map((fact, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Related Knowledge Lesson */}
              {summary?.knowledge && summary.knowledge.topic && (
                <section className="bg-violet-50 p-5 rounded-2xl border border-violet-100">
                  <div className="flex items-center gap-2 text-violet-800 font-bold text-base mb-1.5">
                    <BookOpen className="w-5 h-5 text-violet-600" />
                    <span>Knowledge Lesson: {summary.knowledge.topic}</span>
                  </div>
                  <p className="text-violet-900 leading-relaxed text-sm">
                    {summary.knowledge.simpleExplanation}
                  </p>
                </section>
              )}

              {/* Original Source Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex-1 py-3 px-5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-center flex items-center justify-center gap-2 shadow-sm transition-colors text-xs"
                >
                  <span>Read Original Story on {article.sourceName}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Related News in Same Category */}
              {related.length > 0 && (
                <div className="pt-6 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-3 text-sm">Related in {article.category}</h4>
                  <div className="space-y-2.5">
                    {related.map((rel) => (
                      <div
                        key={rel._id}
                        onClick={() => onSelectRelated?.(rel)}
                        className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 line-clamp-1">{rel.title}</div>
                          <div className="text-slate-400 text-[11px]">{rel.sourceName} • {timeAgo(rel.publishedAt)}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

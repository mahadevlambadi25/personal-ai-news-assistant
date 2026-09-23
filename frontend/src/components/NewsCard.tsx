import React, { useState } from 'react';
import {
  Bookmark,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  BookOpen,
  Info,
} from 'lucide-react';
import { NewsArticle, SummaryData } from '../types';
import { timeAgo, copyToClipboard } from '../utils/formatters';
import { getCategoryMeta } from '../data/categoriesData';
import { newsApi } from '../services/api';

interface NewsCardProps {
  article: NewsArticle;
  isSaved?: boolean;
  onToggleSave?: (articleId: string) => Promise<boolean>;
  onShowToast?: (message: string) => void;
  onOpenDetail?: (article: NewsArticle) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  article,
  isSaved = false,
  onToggleSave,
  onShowToast,
  onOpenDetail,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [saving, setSaving] = useState(false);

  const catMeta = getCategoryMeta(article.category);

  const handleToggleExpand = async () => {
    if (!isExpanded && !summaryData) {
      setLoadingSummary(true);
      try {
        const detail = await newsApi.getNewsById(article._id);
        if (detail.summary) {
          setSummaryData(detail.summary);
        }
      } catch {
        // use article description if summary endpoint fails
      } finally {
        setLoadingSummary(false);
      }
    }
    setIsExpanded((prev) => !prev);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onToggleSave) return;
    setSaving(true);
    try {
      const nowSaved = await onToggleSave(article._id);
      onShowToast?.(nowSaved ? 'Article saved to your bookmarks' : 'Article removed from bookmarks');
    } catch (err: any) {
      onShowToast?.(err.message || 'Could not save article. Please log in.');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = article.url || window.location.href;
    const success = await copyToClipboard(link);
    onShowToast?.(success ? 'Article link copied to clipboard!' : 'Failed to copy link');
  };

  return (
    <article className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
      <div className="p-5">
        {/* Category Pill & Source / Timestamp */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${catMeta.bgColor} ${catMeta.color} border ${catMeta.borderColor}`}
          >
            <span>{catMeta.emoji}</span>
            <span>{article.category}</span>
          </span>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium text-slate-700 truncate max-w-[120px]">
              {article.sourceName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Clock className="w-3 h-3 text-slate-400" />
              {timeAgo(article.publishedAt)}
            </span>
          </div>
        </div>

        {/* Headline */}
        <h3
          onClick={() => onOpenDetail?.(article)}
          className="text-base font-bold text-slate-900 leading-snug hover:text-sky-600 transition-colors cursor-pointer mb-2 line-clamp-2"
        >
          {article.title}
        </h3>

        {/* Short Summary */}
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">
          {article.description || article.content || 'Read full verified coverage below.'}
        </p>

        {/* Expandable Deep AI Explanation Section */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3.5 text-xs animate-fade-in bg-slate-50/70 -mx-5 px-5 py-4">
            {loadingSummary ? (
              <div className="flex items-center gap-2 text-slate-500 py-2">
                <Sparkles className="w-4 h-4 animate-spin text-sky-500" />
                <span>Loading structured AI analysis...</span>
              </div>
            ) : (
              <>
                {/* What happened? */}
                <div>
                  <h4 className="font-semibold text-slate-900 flex items-center gap-1 mb-1">
                    <Info className="w-3.5 h-3.5 text-sky-600" /> What happened?
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    {summaryData?.summary || article.description || 'Details reported by official source.'}
                  </p>
                </div>

                {/* Why it matters? */}
                {summaryData?.whyItMatters && (
                  <div>
                    <h4 className="font-semibold text-slate-900 flex items-center gap-1 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Why it matters?
                    </h4>
                    <p className="text-slate-600 leading-relaxed">{summaryData.whyItMatters}</p>
                  </div>
                )}

                {/* Background */}
                {summaryData?.background && (
                  <div>
                    <h4 className="font-semibold text-slate-900 flex items-center gap-1 mb-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" /> Background
                    </h4>
                    <p className="text-slate-600 leading-relaxed">{summaryData.background}</p>
                  </div>
                )}

                {/* Key Facts */}
                {summaryData?.keyFacts && summaryData.keyFacts.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Key Facts</h4>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      {summaryData.keyFacts.map((fact, i) => (
                        <li key={i}>{fact}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Knowledge Concept */}
                {summaryData?.knowledge && summaryData.knowledge.topic && (
                  <div className="p-3 bg-violet-50 rounded-xl border border-violet-100">
                    <h4 className="font-semibold text-violet-900 flex items-center gap-1.5 mb-1">
                      <BookOpen className="w-3.5 h-3.5 text-violet-600" />
                      Knowledge: {summaryData.knowledge.topic}
                    </h4>
                    <p className="text-violet-700 leading-relaxed">
                      {summaryData.knowledge.simpleExplanation}
                    </p>
                  </div>
                )}

                {/* Sources */}
                <div className="text-[11px] text-slate-400 pt-1">
                  Source: <span className="font-medium text-slate-600">{article.sourceName}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={handleToggleExpand}
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors"
        >
          {isExpanded ? (
            <>
              <span>Collapse</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>AI Explanation</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>

        <div className="flex items-center gap-1">
          {/* Read Source */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Read original source"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Share */}
          <button
            onClick={handleShare}
            title="Copy link"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            title={isSaved ? 'Remove bookmark' : 'Save article'}
            className={`p-1.5 rounded-lg transition-colors ${
              isSaved
                ? 'text-sky-600 bg-sky-50 hover:bg-sky-100'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-sky-600' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
};

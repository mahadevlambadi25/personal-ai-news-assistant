import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Share2, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { NewsArticle } from '../types';
import { timeAgo, copyToClipboard } from '../utils/formatters';
import { getCategoryMeta } from '../data/categoriesData';
import { useLanguage } from '../hooks/useLanguage';

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
  const navigate = useNavigate();
  const { isHindi, t, synthesizeHindi, decodeText } = useLanguage();
  const [imageError, setImageError] = useState(false);
  const [saving, setSaving] = useState(false);
  const catMeta = getCategoryMeta(article.category);

  const handleCardClick = () => {
    if (onOpenDetail) {
      navigate(`/news/${article._id}`);
    } else {
      navigate(`/news/${article._id}`);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onToggleSave) return;
    setSaving(true);
    try {
      const nowSaved = await onToggleSave(article._id);
      onShowToast?.(
        nowSaved
          ? isHindi
            ? 'बुकमार्क में सहेज लिया गया'
            : 'Article saved to bookmarks'
          : isHindi
          ? 'बुकमार्क से हटा दिया गया'
          : 'Article removed from bookmarks'
      );
    } catch (err: any) {
      onShowToast?.(err.message || (isHindi ? 'कृपया सहेजने के लिए लॉगिन करें' : 'Please log in to save'));
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/news/${article._id}`;
    const success = await copyToClipboard(link);
    onShowToast?.(
      success
        ? isHindi
          ? 'लेख का लिंक कॉपी हो गया!'
          : 'Article link copied!'
        : isHindi
        ? 'लिंक कॉपी करने में विफल'
        : 'Failed to copy link'
    );
  };

  const displayTitle = isHindi ? synthesizeHindi(article.title) : decodeText(article.title);
  const displayCategory = isHindi ? t(article.category) : article.category;
  const displayDesc = isHindi
    ? synthesizeHindi(article.description || article.content)
    : decodeText(article.description || article.content || 'Tap to read full neutral analysis.');

  return (
    <article
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Read article: ${displayTitle}`}
      className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-sky-300 transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500"
    >
      <div>
        {/* Card Media Preview (if available) */}
        {article.imageUrl && !imageError ? (
          <div className="relative h-44 w-full overflow-hidden bg-slate-100">
            <img
              src={article.imageUrl}
              alt=""
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ) : null}

        <div className="p-4 sm:p-5 space-y-2.5">
          {/* Category Pill & Source / Published Time */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold ${catMeta.bgColor} ${catMeta.color} border ${catMeta.borderColor}`}
            >
              <span>{catMeta.emoji}</span>
              <span>{displayCategory}</span>
            </span>

            <div className="flex items-center gap-1.5 text-slate-400 font-medium truncate">
              <span className="truncate max-w-[110px] text-slate-600 font-semibold">
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
          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug group-hover:text-sky-600 transition-colors line-clamp-2">
            {displayTitle}
          </h3>

          {/* Short Summary (2-3 lines) */}
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {displayDesc}
          </p>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="px-4 sm:px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100/80">
          <Sparkles className="w-3 h-3 text-sky-500" />
          <span>{isHindi ? 'एआई सारांश' : 'AI Summary'}</span>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            title={isHindi ? 'शेयर करें' : 'Share'}
            aria-label="Share article"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`p-1.5 rounded-lg transition-colors ${
              isSaved
                ? 'text-sky-600 bg-sky-50 hover:bg-sky-100'
                : 'hover:text-slate-700 hover:bg-slate-200/60'
            }`}
            title={isSaved ? (isHindi ? 'सहेजा गया' : 'Bookmarked') : (isHindi ? 'सहेजें' : 'Save bookmark')}
            aria-label="Bookmark article"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-sky-600' : ''}`} />
          </button>
          <span className="text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all ml-1">
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Clock, Sparkles, Newspaper } from 'lucide-react';
import { NewsArticle } from '../types';
import { timeAgo } from '../utils/formatters';
import { getCategoryMeta } from '../data/categoriesData';
import { useLanguage } from '../hooks/useLanguage';

interface SecondaryStoryCardProps {
  article: NewsArticle;
  isSaved?: boolean;
  onToggleSave?: (articleId: string) => Promise<boolean>;
  onShowToast?: (message: string) => void;
}

export const SecondaryStoryCard: React.FC<SecondaryStoryCardProps> = ({
  article,
  isSaved = false,
  onToggleSave,
  onShowToast,
}) => {
  const navigate = useNavigate();
  const { isHindi, t, synthesizeHindi, decodeText } = useLanguage();
  const [imageError, setImageError] = useState(false);
  const [saving, setSaving] = useState(false);
  const catMeta = getCategoryMeta(article.category);

  const handleCardClick = () => {
    navigate(`/news/${article._id}`);
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
            : 'Saved to bookmarks'
          : isHindi
          ? 'बुकमार्क से हटा दिया गया'
          : 'Removed from bookmarks'
      );
    } catch (err: any) {
      onShowToast?.(err.message || (isHindi ? 'कृपया सहेजने के लिए लॉगिन करें' : 'Please log in to save'));
    } finally {
      setSaving(false);
    }
  };

  const displayTitle = isHindi ? synthesizeHindi(article.title) : decodeText(article.title);
  const displayCategory = isHindi ? t(article.category) : article.category;
  const displayDesc = isHindi
    ? synthesizeHindi(article.description || article.content)
    : decodeText(article.description || article.content || 'Tap to read full structured story.');

  return (
    <article
      onClick={handleCardClick}
      className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-sky-300 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col sm:flex-row p-4 gap-4 justify-between items-start"
    >
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${catMeta.bgColor} ${catMeta.color} border ${catMeta.borderColor}`}
          >
            <span>{catMeta.emoji}</span>
            <span>{displayCategory}</span>
          </span>
          <span className="text-[11px] text-slate-400 font-medium truncate">
            {article.sourceName}
          </span>
        </div>

        <h4 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-sky-600 transition-colors line-clamp-2">
          {displayTitle}
        </h4>

        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {displayDesc}
        </p>

        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            {timeAgo(article.publishedAt)}
          </span>

          <span className="inline-flex items-center gap-1 text-sky-600 font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>{isHindi ? 'एआई तैयार' : 'AI Ready'}</span>
          </span>
        </div>
      </div>

      {/* Thumbnail */}
      <div className="relative w-full sm:w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-slate-100 self-stretch sm:self-auto">
        {article.imageUrl && !imageError ? (
          <img
            src={article.imageUrl}
            alt={displayTitle}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
            <Newspaper className="w-6 h-6" />
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition-all ${
            isSaved
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-900/60 text-white hover:bg-slate-900/90'
          }`}
          title={isSaved ? (isHindi ? 'सहेजा गया' : 'Bookmarked') : (isHindi ? 'बुकमार्क करें' : 'Bookmark story')}
          aria-label="Bookmark story"
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
        </button>
      </div>
    </article>
  );
};

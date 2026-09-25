import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Share2, Sparkles, Clock, ArrowRight, Newspaper } from 'lucide-react';
import { NewsArticle } from '../types';
import { timeAgo, copyToClipboard } from '../utils/formatters';
import { getCategoryMeta } from '../data/categoriesData';
import { useLanguage } from '../hooks/useLanguage';

interface FeaturedStoryCardProps {
  article: NewsArticle;
  isSaved?: boolean;
  onToggleSave?: (articleId: string) => Promise<boolean>;
  onShowToast?: (message: string) => void;
}

export const FeaturedStoryCard: React.FC<FeaturedStoryCardProps> = ({
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
    : decodeText(article.description || article.content || 'Read verified structured breakdown and AI insights.');

  return (
    <article
      onClick={handleCardClick}
      className="group relative bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-sky-300 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
    >
      {/* Top Media / Visual */}
      <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-slate-900">
        {article.imageUrl && !imageError ? (
          <img
            src={article.imageUrl}
            alt={displayTitle}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-900 via-sky-950 to-indigo-950 text-white p-6 text-center">
            <Newspaper className="w-12 h-12 text-sky-400/60 mb-2" />
            <span className="text-xs font-semibold text-slate-300 tracking-wider uppercase">
              {displayCategory} {isHindi ? 'सत्यापित रिपोर्ट' : 'Verified Report'}
            </span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500 text-slate-950 shadow-md">
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>{isHindi ? 'प्रमुख समाचार' : 'Top Story'}</span>
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${catMeta.bgColor} ${catMeta.color} border ${catMeta.borderColor} shadow-sm backdrop-blur-md`}
            >
              <span>{catMeta.emoji}</span>
              <span>{displayCategory}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`p-2 rounded-xl backdrop-blur-md transition-all ${
                isSaved
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-slate-900/60 text-white hover:bg-slate-900/90'
              }`}
              title={isSaved ? (isHindi ? 'सहेजा गया' : 'Bookmarked') : (isHindi ? 'बुकमार्क करें' : 'Bookmark story')}
              aria-label="Save story"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-900/60 text-white hover:bg-slate-900/90 backdrop-blur-md transition-all"
              title={isHindi ? 'शेयर करें' : 'Share story'}
              aria-label="Share story"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Bar inside image */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-200 font-medium">
          <span className="truncate font-semibold">{article.sourceName}</span>
          <span className="flex items-center gap-1 shrink-0">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            {timeAgo(article.publishedAt)}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 sm:p-6 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug group-hover:text-sky-600 transition-colors line-clamp-2">
            {displayTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
            {displayDesc}
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="inline-flex items-center gap-1.5 text-sky-700 font-semibold bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>{isHindi ? 'एआई सारांश और ज्ञान' : 'AI Summary & Knowledge'}</span>
          </div>

          <span className="font-bold text-sky-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
            <span>{isHindi ? 'पूरी खबर पढ़ें' : 'Read full story'}</span>
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </article>
  );
};

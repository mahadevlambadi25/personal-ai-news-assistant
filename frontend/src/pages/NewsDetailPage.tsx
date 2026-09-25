import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  Share2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Clock,
  BookOpen,
  Info,
  Building2,
  CheckCircle2,
  HelpCircle,
  RotateCw,
  Newspaper,
  ChevronRight,
} from 'lucide-react';
import { NewsArticle, ArticleDetailResponse, SummaryData, AppLanguage } from '../types';
import { newsApi } from '../services/api';
import { timeAgo, formatFullDate, copyToClipboard } from '../utils/formatters';
import { getCategoryMeta } from '../data/categoriesData';
import { useSavedNews } from '../hooks/useSavedNews';
import { useLanguage } from '../hooks/useLanguage';

export const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, setLanguage, isHinglish, synthesizeHinglishSummary } = useLanguage();
  const { isSaved, toggleSave } = useSavedNews();

  const [data, setData] = useState<ArticleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    newsApi
      .getNewsById(id, language)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Unable to load article details.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, language]);

  const article = data?.article;

  // Derive entities / people / places involved from tags, title, or description
  const involvedEntities = useMemo(() => {
    if (!article) return [];
    const set = new Set<string>();

    if (article.tags && Array.isArray(article.tags)) {
      article.tags.forEach((t) => t && t.trim() && set.add(t.trim()));
    }

    // Common institutions, places, and organizations
    const fullText = `${article.title} ${article.description || ''} ${article.content || ''}`;
    const patterns = [
      /\b(RBI|Reserve Bank of India)\b/i,
      /\b(ISRO|NASA|SpaceX|DRDO)\b/i,
      /\b(Supreme Court|High Court|Parliament|Lok Sabha|Rajya Sabha)\b/i,
      /\b(SEBI|GST Council|NITI Aayog|CBI|ED)\b/i,
      /\b(United Nations|UN|IMF|World Bank|WHO|NATO)\b/i,
      /\b(Government of India|Union Cabinet|Election Commission)\b/i,
      /\b(Apple|Google|Microsoft|Meta|Tesla|NVIDIA|Amazon)\b/i,
      /\b(Delhi|New Delhi|Mumbai|Bengaluru|Washington|London|Beijing|Tokyo)\b/i,
    ];

    for (const pat of patterns) {
      const match = fullText.match(pat);
      if (match) {
        set.add(match[1]);
      }
    }

    return Array.from(set).slice(0, 6);
  }, [article]);

  // Compute active summary with Hinglish translation if active
  const activeSummary: SummaryData | null = useMemo(() => {
    if (!data?.summary) return null;
    if (isHinglish) {
      // If server returned English, synthesize Hinglish client-side seamlessly
      return synthesizeHinglishSummary(data.summary);
    }
    return data.summary;
  }, [data?.summary, isHinglish, synthesizeHinglishSummary]);

  const handleToggleSave = async () => {
    if (!article) return;
    setSaving(true);
    try {
      const nowSaved = await toggleSave(article._id);
      showToast(nowSaved ? 'Saved to your bookmarks' : 'Removed from bookmarks');
    } catch (err: any) {
      showToast(err.message || 'Please log in to save');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!article) return;
    const url = window.location.href;
    const success = await copyToClipboard(url);
    showToast(success ? 'Article link copied to clipboard!' : 'Failed to copy link');
  };

  const handleAskAI = () => {
    if (!article) return;
    navigate(`/chat?articleId=${article._id}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded-lg" />
        <div className="h-10 w-4/5 bg-slate-200 rounded-xl" />
        <div className="h-5 w-1/2 bg-slate-100 rounded-lg" />
        <div className="h-64 sm:h-96 bg-slate-200 rounded-3xl" />
        <div className="h-32 bg-slate-100 rounded-2xl" />
        <div className="h-40 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
          <Info className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Article Not Found</h2>
        <p className="text-xs text-slate-500">
          {error || 'This article could not be loaded or may have been updated.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const catMeta = getCategoryMeta(article.category);
  const currentlySaved = isSaved(article._id);

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-8 animate-fade-in">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-3 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-xl border border-slate-800 flex items-center gap-2 animate-bounce-short">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Nav: Back button + Language Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to feeds</span>
        </button>

        {/* Language Selector on Detail Page */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Explanation Language:</span>
          <div
            className="flex items-center p-0.5 bg-white rounded-xl border border-slate-200/90 text-xs font-semibold shadow-sm"
            role="group"
          >
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-lg transition-all ${
                language === 'en'
                  ? 'bg-slate-900 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1 rounded-lg transition-all ${
                language === 'hi'
                  ? 'bg-sky-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>
      </div>

      {/* Main Article Header Card */}
      <header className="space-y-4">
        {/* Category Pill */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${catMeta.bgColor} ${catMeta.color} border ${catMeta.borderColor}`}
          >
            <span>{catMeta.emoji}</span>
            <span>{article.category}</span>
          </span>

          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Verified Source
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
          {article.title}
        </h1>

        {/* Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-slate-200/80 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{article.sourceName}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{timeAgo(article.publishedAt)}</span>
            </span>
            <span className="hidden sm:inline">({formatFullDate(new Date(article.publishedAt))})</span>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={saving}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentlySaved
                  ? 'bg-sky-50 border-sky-300 text-sky-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Save to bookmarks"
            >
              <Bookmark className={`w-3.5 h-3.5 ${currentlySaved ? 'fill-sky-600 text-sky-600' : ''}`} />
              <span>{currentlySaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Share article"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={handleAskAI}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>
          </div>
        </div>

        {/* Hero Image */}
        {article.imageUrl && !imageError ? (
          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 bg-slate-900 max-h-[460px]">
            <img
              src={article.imageUrl}
              alt={article.title}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover max-h-[460px]"
            />
            <div className="absolute bottom-3 right-4 px-3 py-1 rounded-full bg-slate-900/70 backdrop-blur-md text-[11px] text-slate-300 font-medium">
              Source: {article.sourceName}
            </div>
          </div>
        ) : null}
      </header>

      {/* Structured Deep Dive Sections */}
      <div className="space-y-6">
        {/* Section 1: Quick Summary */}
        <section className="bg-sky-50/70 border border-sky-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-600 text-white text-xs font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quick Summary</span>
          </div>

          <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed">
            {activeSummary?.summary || article.description || article.content}
          </p>

          {isHinglish && (
            <p className="text-[11px] text-sky-700 font-semibold italic">
              ⚡ Displaying natural Hinglish explanation (proper nouns & technical terms preserved).
            </p>
          )}
        </section>

        {/* Section 2: What Happened? */}
        <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-900">
            <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold">What Happened?</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {article.content || activeSummary?.summary || article.description}
          </p>
        </section>

        {/* Section 3: Why It Matters */}
        {activeSummary?.whyItMatters && (
          <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-900">
              <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold">Why It Matters</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {activeSummary.whyItMatters}
            </p>
          </section>
        )}

        {/* Section 4: Background */}
        {activeSummary?.background && (
          <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-900">
              <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold">Background Context</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {activeSummary.background}
            </p>
          </section>
        )}

        {/* Section 5: Key Facts */}
        {activeSummary?.keyFacts && activeSummary.keyFacts.length > 0 && (
          <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold">Key Facts</h2>
            </div>

            <ul className="space-y-2.5">
              {activeSummary.keyFacts.map((fact, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Section 6: People / Organizations / Places Involved (when relevant) */}
        {involvedEntities.length > 0 && (
          <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-900">
              <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold">People & Organizations Involved</h2>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {involvedEntities.map((entity, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200"
                >
                  {entity}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Section 7: Knowledge & Concepts */}
        {activeSummary?.knowledge && (
          <section className="bg-gradient-to-tr from-violet-50 via-purple-50 to-indigo-50 rounded-3xl p-6 sm:p-7 border border-violet-200/90 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-violet-950">
              <div className="w-7 h-7 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold">Knowledge Primer: {activeSummary.knowledge.topic}</h2>
            </div>

            <p className="text-xs sm:text-sm text-violet-900 leading-relaxed">
              {activeSummary.knowledge.simpleExplanation}
            </p>
          </section>
        )}

        {/* Section 8: Source Attribution & Original Article Action */}
        <section className="p-6 sm:p-7 rounded-3xl bg-slate-100/70 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-900">Source Attribution</div>
            <p className="text-xs text-slate-500">
              Reported by <strong className="text-slate-700">{article.sourceName}</strong>. Original publication indexed on {formatFullDate(new Date(article.publishedAt))}.
            </p>
          </div>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap self-start sm:self-auto"
          >
            <span>Read Original Article</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </section>

        {/* Section 9: Ask AI Banner */}
        <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-lg">
            <h3 className="text-base sm:text-lg font-bold">Have more questions about this event?</h3>
            <p className="text-xs text-slate-300">
              Our AI Assistant is grounded directly in this article's verified facts.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAskAI}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask AI About This Story</span>
          </button>
        </div>

        {/* Related Stories in same category */}
        {data.relatedNews && data.relatedNews.length > 0 && (
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                More in {article.category}
              </h3>
              <Link
                to={`/category/${encodeURIComponent(article.category)}`}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.relatedNews.map((rel) => (
                <div
                  key={rel._id}
                  onClick={() => navigate(`/news/${rel._id}`)}
                  className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-sky-300 shadow-sm hover:shadow-md cursor-pointer transition-all space-y-2"
                >
                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                    <span>{rel.sourceName}</span>
                    <span>•</span>
                    <span>{timeAgo(rel.publishedAt)}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 hover:text-sky-600 transition-colors">
                    {rel.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { BookOpen, Sparkles, ExternalLink } from 'lucide-react';
import { KnowledgeItem } from '../types';
import { timeAgo } from '../utils/formatters';

interface KnowledgeCardProps {
  item: KnowledgeItem;
  onOpenArticle?: (articleId: string) => void;
}

export const KnowledgeCard: React.FC<KnowledgeCardProps> = ({ item, onOpenArticle }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Core Knowledge</span>
          </span>
          <span className="text-[11px] text-slate-400">{timeAgo(item.createdAt)}</span>
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
          {item.topic}
        </h3>

        <p className="text-xs text-slate-700 leading-relaxed mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
          {item.simpleExplanation}
        </p>

        {item.whyItMatters && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Why this matters
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">{item.whyItMatters}</p>
          </div>
        )}
      </div>

      {item.relatedArticle && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="truncate max-w-[200px]">
            <span className="text-[11px] text-slate-400 block">From real-world news:</span>
            <span className="font-medium text-slate-700 truncate block">
              {item.relatedArticle.title}
            </span>
          </div>

          <a
            href={item.relatedArticle.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Read source"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { CATEGORIES_DATA } from '../data/categoriesData';
import { CategoryCount } from '../types';

interface CategoryPillsProps {
  selectedCategory?: string;
  onSelectCategory: (categoryName: string) => void;
  categoryCounts?: CategoryCount[];
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  selectedCategory = 'all',
  onSelectCategory,
  categoryCounts = [],
}) => {
  const countMap = new Map(categoryCounts.map((c) => [c.name.toLowerCase(), c.count]));

  const normalizeCat = (c: string) => {
    const l = c.toLowerCase().trim();
    if (l === 'business') return 'business & economy';
    return l;
  };

  const currentNormalized = normalizeCat(selectedCategory);

  return (
    <nav
      className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0 text-xs font-semibold select-none"
      aria-label="News category navigation"
    >
      {/* "All" Pill */}
      <button
        type="button"
        onClick={() => onSelectCategory('all')}
        className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
          currentNormalized === 'all'
            ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
            : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-100/70 hover:text-slate-900'
        }`}
        aria-current={currentNormalized === 'all' ? 'page' : undefined}
      >
        <span>🌐</span>
        <span>All</span>
      </button>

      {CATEGORIES_DATA.map((cat) => {
        const catNormalized = normalizeCat(cat.name);
        const isSelected = currentNormalized === catNormalized;
        const count = countMap.get(catNormalized);
        // Short label for mobile display if needed (e.g. Business instead of Business & Economy)
        const displayLabel = cat.name === 'Business & Economy' ? 'Business' : cat.name;

        return (
          <button
            key={cat.name}
            type="button"
            onClick={() => onSelectCategory(cat.name)}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
              isSelected
                ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-200 font-bold'
                : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-100/70 hover:text-slate-900'
            }`}
            aria-current={isSelected ? 'page' : undefined}
          >
            <span aria-hidden="true">{cat.emoji}</span>
            <span>{displayLabel}</span>
            {count !== undefined && count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-500 font-medium'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

import React from 'react';
import { CATEGORIES_DATA } from '../data/categoriesData';
import { NewsCategory, CategoryCount } from '../types';

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
  const countMap = new Map(categoryCounts.map((c) => [c.name, c.count]));

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
      <button
        onClick={() => onSelectCategory('all')}
        className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
          selectedCategory === 'all'
            ? 'bg-slate-900 text-white shadow-sm'
            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        <span>🌐</span>
        <span>All News</span>
      </button>

      {CATEGORIES_DATA.map((cat) => {
        const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
        const count = countMap.get(cat.name);

        return (
          <button
            key={cat.name}
            onClick={() => onSelectCategory(cat.name)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              isSelected
                ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-200'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.name}</span>
            {count !== undefined && count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

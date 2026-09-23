import { NewsCategory } from '../types';

export interface CategoryMeta {
  name: NewsCategory;
  slug: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export const CATEGORIES_DATA: CategoryMeta[] = [
  {
    name: 'India',
    slug: 'india',
    emoji: '🇮🇳',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'National public policy, economy, infrastructure, and developments across India.',
  },
  {
    name: 'World',
    slug: 'world',
    emoji: '🌍',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Global geopolitical summits, multilateral treaties, and international developments.',
  },
  {
    name: 'Politics',
    slug: 'politics',
    emoji: '🏛️',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Neutral, factual coverage of parliamentary bills, policy debates, and diplomatic statecraft.',
  },
  {
    name: 'Business & Economy',
    slug: 'business',
    emoji: '📈',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    description: 'Central bank rates, corporate investments, inflation trends, and macro-economics.',
  },
  {
    name: 'Technology & AI',
    slug: 'technology',
    emoji: '🤖',
    color: 'text-sky-700',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    description: 'Frontier AI developments, semiconductor breakthroughs, software, and cybersecurity.',
  },
  {
    name: 'Science & Space',
    slug: 'science',
    emoji: '🚀',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    description: 'Astrophysics, space exploration, biomedical discoveries, and scientific frontiers.',
  },
  {
    name: 'Environment',
    slug: 'environment',
    emoji: '🌱',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    description: 'Clean energy transitions, climate research, biodiversity, and conservation.',
  },
  {
    name: 'Major Incidents',
    slug: 'major-incidents',
    emoji: '⚠️',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    description: 'Critical emergency updates, natural disasters, humanitarian responses, and safety advisories.',
  },
  {
    name: 'Sports',
    slug: 'sports',
    emoji: '🏆',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'International tournaments, championships, records, and athletics updates.',
  },
  {
    name: 'Knowledge',
    slug: 'knowledge',
    emoji: '🧠',
    color: 'text-violet-700',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    description: 'Educational primers, foundational concepts, and historical insights derived from current events.',
  },
];

export function getCategoryMeta(name: string): CategoryMeta {
  const found = CATEGORIES_DATA.find((c) => c.name.toLowerCase() === name.toLowerCase());
  return (
    found || {
      name: name as NewsCategory,
      slug: name.toLowerCase().replace(/[^\w]/g, '-'),
      emoji: '📰',
      color: 'text-slate-700',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      description: 'Verified news reporting.',
    }
  );
}

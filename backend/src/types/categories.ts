export const NEWS_CATEGORIES = [
  'India',
  'World',
  'Politics',
  'Business & Economy',
  'Technology & AI',
  'Science & Space',
  'Environment',
  'Major Incidents',
  'Sports',
  'Knowledge',
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

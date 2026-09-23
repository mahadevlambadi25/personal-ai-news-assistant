import { NewsCategory } from '../types/categories';

interface KeywordRule {
  category: NewsCategory;
  keywords: string[];
}

const CATEGORY_RULES: KeywordRule[] = [
  {
    category: 'India',
    keywords: [
      'india', 'delhi', 'mumbai', 'bengaluru', 'modi', 'isro', 'bharat', 'chennai', 'kolkata', 'hyderabad',
      'aadhaar', 'upi', 'lok sabha', 'rajya sabha', 'kashmir', 'punjab', 'kerala', 'maharashtra', 'rupee', 'rbi'
    ],
  },
  {
    category: 'Technology & AI',
    keywords: [
      'ai', 'artificial intelligence', 'machine learning', 'chatgpt', 'openai', 'anthropic', 'google', 'meta',
      'apple', 'microsoft', 'nvidia', 'algorithm', 'software', 'semiconductor', 'chipmaker', 'cybersecurity',
      'quantum', 'robotics', 'deep learning', 'llm', 'autonomous', 'cryptocurrency', 'bitcoin', 'blockchain'
    ],
  },
  {
    category: 'Science & Space',
    keywords: [
      'nasa', 'space', 'astronomy', 'telescope', 'galaxy', 'planet', 'mars', 'moon', 'cosmic', 'physics',
      'quantum', 'biology', 'genetics', 'dna', 'vaccine', 'medical research', 'archaeology', 'supernova'
    ],
  },
  {
    category: 'Environment',
    keywords: [
      'climate', 'global warming', 'cop28', 'cop29', 'renewable', 'solar energy', 'wind energy', 'pollution',
      'carbon', 'wildlife', 'conservation', 'biodiversity', 'drought', 'flood', 'glacier', 'deforestation', 'greenhouse'
    ],
  },
  {
    category: 'Business & Economy',
    keywords: [
      'economy', 'inflation', 'stock market', 'wall street', 'sensex', 'nifty', 'shares', 'interest rate',
      'central bank', 'federal reserve', 'revenue', 'profit', 'gdp', 'trade', 'tariff', 'acquisition', 'merger'
    ],
  },
  {
    category: 'Politics',
    keywords: [
      'parliament', 'congress', 'senate', 'white house', 'election', 'democracy', 'diplomacy', 'legislation',
      'vote', 'policy', 'minister', 'president', 'prime minister', 'treaty', 'sanctions', 'geopolitics'
    ],
  },
  {
    category: 'Major Incidents',
    keywords: [
      'earthquake', 'tsunami', 'explosion', 'crash', 'disaster', 'catastrophe', 'emergency', 'accident',
      'casualty', 'evacuation', 'wildfire', 'hurricane', 'typhoon', 'derailment'
    ],
  },
  {
    category: 'Sports',
    keywords: [
      'cricket', 'football', 'soccer', 'olympics', 'fifa', 'icc', 'ipl', 'tennis', 'grand slam', 'wimbledon',
      'formula 1', 'f1', 'nba', 'championship', 'tournament', 'badminton', 'athletics', 'medal'
    ],
  },
  {
    category: 'Knowledge',
    keywords: [
      'explained', 'how it works', 'guide', 'primer', 'history', 'origins', 'discovery', 'fundamentals', 'deep dive'
    ],
  },
  {
    category: 'World',
    keywords: [
      'united nations', 'un', 'europe', 'asia', 'africa', 'america', 'middle east', 'china', 'uk', 'global',
      'international', 'summit', 'nato', 'ukraine', 'treaty'
    ],
  },
];

export function classifyArticleCategory(
  title: string,
  description?: string,
  categoryHint?: string
): NewsCategory {
  // If the source already gave a strong matching category hint
  if (categoryHint) {
    const hintLower = categoryHint.toLowerCase();
    for (const rule of CATEGORY_RULES) {
      if (rule.category.toLowerCase() === hintLower || hintLower.includes(rule.category.toLowerCase())) {
        return rule.category;
      }
    }
  }

  const textToAnalyze = `${title} ${description || ''}`.toLowerCase();

  // Check categories by matching score
  let bestCategory: NewsCategory = 'World';
  let highestScore = 0;

  for (const rule of CATEGORY_RULES) {
    let score = 0;
    for (const keyword of rule.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(textToAnalyze)) {
        // High-specificity terms get higher weight
        if (rule.category === 'Sports' || rule.category === 'Science & Space' || rule.category === 'Technology & AI' || rule.category === 'Environment' || rule.category === 'Major Incidents') {
          score += 4;
        } else if (rule.category === 'India' && (keyword === 'india' || keyword === 'delhi')) {
          score += 2;
        } else {
          score += 2;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestCategory = rule.category;
    }
  }

  return bestCategory;
}

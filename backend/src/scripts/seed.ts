import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { News } from '../models/News';
import { Summary } from '../models/Summary';
import { Preferences } from '../models/Preferences';
import { AuthService } from '../services/auth.service';
import { computeContentHash } from '../utils/contentHash';
import { NEWS_CATEGORIES, NewsCategory } from '../types/categories';
import { Logger } from '../utils/logger';

const logger = new Logger('Seed');

const DEMO_ARTICLES: Array<{
  title: string;
  description: string;
  content: string;
  source: string;
  sourceName: string;
  url: string;
  category: NewsCategory;
  summary: string;
  whyItMatters: string;
  background: string;
  keyFacts: string[];
  knowledge: { topic: string; simpleExplanation: string };
}> = [
  {
    title: '[DEMO] India expands Unified Payments Interface (UPI) across 15 nations',
    description: 'National Payments Corporation of India (NPCI) connects cross-border instant settlements for international travel and trade.',
    content: 'NPCI International has expanded cross-border payment integration, allowing instant QR code settlements in 15 countries.',
    source: 'demo-source-india',
    sourceName: 'The Hindu (Demo Edition)',
    url: 'https://example.com/demo-india-upi',
    category: 'India',
    summary: 'India has expanded UPI international integration across 15 partner nations, enabling instant zero-fee remittances and tourist payments.',
    whyItMatters: 'Reduces foreign exchange fees, accelerates travel commerce, and demonstrates exportable digital public infrastructure.',
    background: 'Launched in 2016 by NPCI, UPI has become one of the largest real-time payment ecosystems globally.',
    keyFacts: [
      'Operates across 15 partner countries including Singapore, UAE, and France',
      'Over 14 billion monthly transactions processed',
      'Zero merchant commission fees for micro-transactions',
    ],
    knowledge: {
      topic: 'Digital Public Infrastructure (DPI)',
      simpleExplanation: 'Nationwide foundational digital systems—like digital IDs and payment switches—that empower public and private services at scale.',
    },
  },
  {
    title: '[DEMO] Global Artificial Intelligence Summit signs historic safety treaty',
    description: 'Representatives from 30 nations agree on standardized third-party safety evaluations for frontier autonomous models.',
    content: 'Global leaders concluded discussions establishing multilateral safety protocols for frontier AI development.',
    source: 'demo-source-world',
    sourceName: 'BBC World (Demo Edition)',
    url: 'https://example.com/demo-world-ai-treaty',
    category: 'World',
    summary: 'Thirty nations ratified a multilateral agreement establishing independent safety audits before frontier AI models can be deployed publicly.',
    whyItMatters: 'Creates the first coordinated international safeguard against automated cybersecurity attacks and systemic misinformation.',
    background: 'Follows earlier initiatives in the UK, EU, and US establishing voluntary testing standards.',
    keyFacts: [
      '30 member nations signed the treaty',
      'Mandatory pre-deployment testing for models exceeding compute thresholds',
      'Open sharing of vulnerability benchmarks between national institutes',
    ],
    knowledge: {
      topic: 'Multilateral Treaties',
      simpleExplanation: 'Binding international agreements entered into by three or more sovereign states to address shared global challenges.',
    },
  },
  {
    title: '[DEMO] Supreme Court reviews landmark data privacy and digital rights framework',
    description: 'Constitutional bench hears arguments on surveillance boundaries and algorithmic decision-making standards.',
    content: 'The five-judge constitutional bench commenced hearing petitions on digital privacy protections.',
    source: 'demo-source-politics',
    sourceName: 'National Legal Tribune (Demo Edition)',
    url: 'https://example.com/demo-politics-privacy',
    category: 'Politics',
    summary: 'The Constitutional Bench opened hearings to determine how strictly digital privacy rights apply to government automated data processing.',
    whyItMatters: 'Defines the legal boundaries between state national security interests and individual constitutional rights to digital privacy.',
    background: 'Follows landmark precedents establishing informational self-determination as an intrinsic right under the constitution.',
    keyFacts: [
      'Hearing conducted by a five-judge constitutional bench',
      'Evaluates consent mechanisms in automated public service delivery',
      'Neutral review of arguments from both civil liberties groups and government counsel',
    ],
    knowledge: {
      topic: 'Constitutional Review',
      simpleExplanation: 'The authority of supreme courts to review the constitutionality of legislative and executive decisions.',
    },
  },
  {
    title: '[DEMO] Central banks signal shift toward neutral interest rates as inflation cools',
    description: 'Global economic indicators suggest consumer price pressures have stabilized near central bank 2% target bands.',
    content: 'Economic reports across major developed economies indicate cooling inflation and resilient employment figures.',
    source: 'demo-source-business',
    sourceName: 'Financial Times (Demo Edition)',
    url: 'https://example.com/demo-business-rates',
    category: 'Business & Economy',
    summary: 'Leading central banks signaled upcoming benchmark interest rate reductions as core inflation metrics returned to target ranges.',
    whyItMatters: 'Lower borrowing costs stimulate business investments, ease mortgage payments, and boost consumer spending power.',
    background: 'Central banks previously hiked interest rates rapidly following post-pandemic supply chain disruptions and energy shocks.',
    keyFacts: [
      'Inflation cooled from peak levels toward 2.4% annually',
      'Commercial mortgage rates began slight declines',
      'Equity indices reacted favorably to monetary easing prospects',
    ],
    knowledge: {
      topic: 'Monetary Policy',
      simpleExplanation: 'The actions taken by a central bank (such as adjusting interest rates) to manage economic growth and price stability.',
    },
  },
  {
    title: '[DEMO] Researchers achieve 100-qubit quantum error correction milestone',
    description: 'Fault-tolerant quantum computing reaches key milestone by successfully isolating logical qubits from environmental decoherence.',
    content: 'Scientists published experimental results demonstrating quantum error correction at unprecedented physical fidelity.',
    source: 'demo-source-tech',
    sourceName: 'TechCrunch (Demo Edition)',
    url: 'https://example.com/demo-tech-quantum',
    category: 'Technology & AI',
    summary: 'Physicists demonstrated fault-tolerant quantum error correction across 100 physical qubits, bringing practical quantum computation closer.',
    whyItMatters: 'Enables complex quantum simulations for drug discovery, battery materials, and optimization problems impossible for classical computers.',
    background: 'Quantum bits are notoriously fragile; quantum error correction arranges multiple noisy physical qubits into reliable logical qubits.',
    keyFacts: [
      'Physical error rates reduced below fault-tolerance thresholds',
      'Coherence maintained over 1000 operation cycles',
      'Published in leading peer-reviewed physics literature',
    ],
    knowledge: {
      topic: 'Quantum Decoherence',
      simpleExplanation: 'The loss of quantum behavior when a quantum system interacts with its surrounding physical environment.',
    },
  },
  {
    title: '[DEMO] James Webb Space Telescope detects organic molecules in distant proto-planetary disk',
    description: 'Infrared spectroscopy reveals carbon-rich chemistry in a young stellar system 400 light-years from Earth.',
    content: 'Astronomers using the James Webb Space Telescope detected prebiotic organic molecules in circumstellar dust disks.',
    source: 'demo-source-science',
    sourceName: 'ScienceDaily (Demo Edition)',
    url: 'https://example.com/demo-science-space',
    category: 'Science & Space',
    summary: 'The James Webb Telescope detected prebiotic organic compounds in planet-forming gas disks, showing ingredients for life are common.',
    whyItMatters: 'Provides empirical evidence that basic biological building blocks form naturally during planet birth across the galaxy.',
    background: 'Webb uses high-resolution infrared spectrographs capable of peering through dense cosmic dust obscured to visible light.',
    keyFacts: [
      'Observed system located 400 light-years away in the Chamaeleon constellation',
      'Identified benzene, methane, and complex hydrocarbons',
      'Demonstrates telescope spectroscopic precision at extreme cosmic distances',
    ],
    knowledge: {
      topic: 'Spectroscopy',
      simpleExplanation: 'A scientific technique that splits light into its constituent wavelengths to analyze the chemical makeup of distant stars and planets.',
    },
  },
  {
    title: '[DEMO] Global renewable electricity generation surpasses coal for first time',
    description: 'Surging solar installations and offshore wind capacity generate unprecedented clean power shares.',
    content: 'International energy data shows renewable generation exceeding fossil fuel benchmarks in quarterly reports.',
    source: 'demo-source-environment',
    sourceName: 'Nature Environment (Demo Edition)',
    url: 'https://example.com/demo-environment-renewables',
    category: 'Environment',
    summary: 'Solar and wind installations generated more electricity worldwide than coal power plants during the past quarter.',
    whyItMatters: 'A critical tipping point in global decarbonization, proving that clean power has achieved economic and operational parity.',
    background: 'Solar module production costs plummeted over 80% over the last decade, sparking exponential adoption across emerging markets.',
    keyFacts: [
      'Renewable capacity grew by 450 gigawatts in the past 12 months',
      'Solar energy led additions in China, India, and the European Union',
      'Avoided an estimated 2.1 billion metric tons of CO2 emissions',
    ],
    knowledge: {
      topic: 'Levelized Cost of Energy (LCOE)',
      simpleExplanation: 'The average lifetime cost of building and operating an electricity-generating plant per unit of electricity produced.',
    },
  },
  {
    title: '[DEMO] Pacific rim nations test advanced AI tsunami early-warning network',
    description: 'Undersea acoustic sensors coupled with machine learning detect oceanic displacement in under 90 seconds.',
    content: 'Disaster management agencies across Pacific coastal countries successfully validated real-time tsunami modeling.',
    source: 'demo-source-incidents',
    sourceName: 'Global Disaster Response (Demo Edition)',
    url: 'https://example.com/demo-incidents-warning',
    category: 'Major Incidents',
    summary: 'Pacific nations completed operational tests on deep-sea acoustic sensor arrays that predict tsunami heights within 90 seconds.',
    whyItMatters: 'Provides up to 30 additional minutes of coastal evacuation warning, potentially saving thousands of lives during mega-earthquakes.',
    background: 'Conventional seismic alerts often estimate tsunami wave heights slowly; direct deep-ocean pressure sensors measure wave water column energy directly.',
    keyFacts: [
      'System tested along the Japan-Chile subduction trench',
      'AI simulation models deep ocean pressure waves in under 90 seconds',
      'Integrated with regional mobile emergency broadcasting sirens',
    ],
    knowledge: {
      topic: 'Early Warning Systems (EWS)',
      simpleExplanation: 'Integrated networks of sensors, communication channels, and community alerts designed to prepare populations before disasters strike.',
    },
  },
  {
    title: '[DEMO] World Athletics Championship announces next-generation digital timing accuracy',
    description: 'Millimeter-wave optical sensors track velocity and finishes down to the microsecond for international competitions.',
    content: 'The International Sports Federation announced upgrades to track and field timing systems for the upcoming championship cycle.',
    source: 'demo-source-sports',
    sourceName: 'ESPN Sports (Demo Edition)',
    url: 'https://example.com/demo-sports-timing',
    category: 'Sports',
    summary: 'World Athletics adopted optical microsecond tracking sensors to eliminate finish-line ambiguity in sprint and hurdle finals.',
    whyItMatters: 'Guarantees absolute fairness and transparent data verification for athletes competing at world-record margins.',
    background: 'Modern photo-finish cameras capture up to 10,000 frames per second, replacing subjective human line-judging.',
    keyFacts: [
      'Captures 20,000 laser scan lines per second',
      'Provides biometric split-second pacing data for broadcast viewers',
      'Full athlete consensus across Olympic federation delegates',
    ],
    knowledge: {
      topic: 'Sports Analytics',
      simpleExplanation: 'The application of objective performance data and statistics to improve athletic coaching, judging, and spectator experience.',
    },
  },
  {
    title: '[DEMO] The History of Knowledge: How the Printing Press revolutionized science',
    description: 'An educational primer exploring how movable type democratized scientific inquiry and fostered the Enlightenment.',
    content: 'In 1440, Johannes Gutenberg developed movable metal type, transforming the dissemination of human thought across Europe.',
    source: 'demo-source-knowledge',
    sourceName: 'Knowledge Primer (Demo Edition)',
    url: 'https://example.com/demo-knowledge-printing-press',
    category: 'Knowledge',
    summary: 'An exploration of how Gutenberg’s printing press dismantled information monopolies, sparking the Scientific Revolution and public literacy.',
    whyItMatters: 'Parallels today’s digital and AI revolution in democratizing access to human information and knowledge production.',
    background: 'Before movable type, manuscripts had to be painstakingly hand-copied by scribes, restricting literacy to wealthy elites.',
    keyFacts: [
      'Invented circa 1440 in Mainz, Germany',
      'Book production rose from thousands to millions within 50 years',
      'Accelerated scientific peer review by standardizing diagrams and mathematical tables',
    ],
    knowledge: {
      topic: 'Information Democratization',
      simpleExplanation: 'The historical process where technology makes information, tools, and education accessible to everyday people rather than a select elite.',
    },
  },
];

export async function seedDatabase() {
  logger.info('Starting database seeding with clearly marked [DEMO] data...');
  await connectDatabase();

  // Clean demo records
  await News.deleteMany({ source: { $regex: '^demo-source' } });
  await User.deleteMany({ email: 'demo@newsexplorer.com' });

  // 1. Create Demo User
  const demoPassword = 'DemoUser2026!';
  const passwordHash = await AuthService.hashPassword(demoPassword);
  const demoUser = await User.create({
    name: 'Demo Explorer',
    email: 'demo@newsexplorer.com',
    passwordHash,
    whatsappNumber: '+919876543210',
  });

  await Preferences.create({
    userId: demoUser._id,
    categories: [...NEWS_CATEGORIES],
    language: 'en',
    newsLimit: 20,
    notificationSettings: {
      emailDailyDigest: false,
      whatsappDailyDigest: true,
      digestTime: '08:00',
    },
  });

  logger.info(`Demo user created: ${demoUser.email} (Password: ${demoPassword})`);

  // 2. Insert Demo News & Summaries across all 10 categories
  let insertedArticles = 0;
  for (const art of DEMO_ARTICLES) {
    const contentHash = computeContentHash(art.title, art.url);

    const newsDoc = await News.create({
      title: art.title,
      description: art.description,
      content: art.content,
      source: art.source,
      sourceName: art.sourceName,
      url: art.url,
      author: 'Editorial Desk',
      imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=60',
      category: art.category,
      tags: [art.category.toLowerCase(), 'demo'],
      publishedAt: new Date(Date.now() - insertedArticles * 1000 * 60 * 45), // staggered times
      fetchedAt: new Date(),
      contentHash,
      language: 'en',
      aiProcessed: true,
    });

    await Summary.create({
      newsId: newsDoc._id,
      summary: art.summary,
      whyItMatters: art.whyItMatters,
      background: art.background,
      keyFacts: art.keyFacts,
      knowledge: art.knowledge,
      confidence: 0.99,
    });

    insertedArticles++;
  }

  logger.info(`Successfully seeded ${insertedArticles} demo articles with complete AI summaries and knowledge lessons.`);
}

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await disconnectDatabase();
      logger.info('Seed script finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Seed script failed', { error: err.message });
      process.exit(1);
    });
}

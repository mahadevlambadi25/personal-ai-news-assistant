import { ISummary } from '../models/Summary';
import { env } from '../config/env';
import { Logger } from '../utils/logger';
import axios from 'axios';

const logger = new Logger('HinglishService');

// Proper nouns, organizations, and technical terms that should NEVER be translated or transliterated
const PRESERVED_TERMS = new Set([
  'RBI', 'NASA', 'ISRO', 'GDP', 'AI', 'Supreme Court', 'High Court',
  'SEBI', 'UPI', 'DRDO', 'IMF', 'WHO', 'UN', 'NATO', 'BCCI', 'ICC',
  'Sensex', 'Nifty', 'CAG', 'ED', 'CBI', 'GST', 'IT', 'EV', 'ChatGPT',
  'OpenAI', 'Google', 'Microsoft', 'Apple', 'Meta', 'Tesla', 'NVIDIA',
  'India', 'Bharat', 'Delhi', 'Mumbai', 'Bengaluru', 'US', 'USA', 'UK', 'China',
  'Europe', 'Russia', 'Ukraine', 'Japan', 'Israel', 'Gaza', 'Parliament',
  'Lok Sabha', 'Rajya Sabha', 'Constitution', 'President', 'Prime Minister',
  'Cabinet', 'Repo Rate', 'Inflation', 'Fiscal Deficit', 'Monetary Policy',
  'Semiconductor', 'Lithography', 'Quantum Computing', 'Machine Learning',
  'Cybersecurity', 'Green Energy', 'Renewable Energy', 'Carbon Footprint'
]);

/**
 * Intelligent English-to-Hinglish synthesizer that creates natural,
 * conversational Indian English/Hindi phrasing while strictly keeping proper nouns,
 * organizations, technical terms, and numbers intact.
 */
export class HinglishService {
  /**
   * Transforms a structured Summary object into natural Hinglish.
   */
  static async translateSummary(summaryData: {
    summary: string;
    whyItMatters: string;
    background: string;
    keyFacts: string[];
    knowledge: {
      topic: string;
      simpleExplanation: string;
    };
    confidence?: number;
  }): Promise<{
    summary: string;
    whyItMatters: string;
    background: string;
    keyFacts: string[];
    knowledge: {
      topic: string;
      simpleExplanation: string;
    };
    confidence?: number;
    language: 'hinglish';
  }> {
    // If OpenAI API key is available, we can use LLM for high-fidelity Hinglish translation
    if (env.OPENAI_API_KEY) {
      try {
        const translated = await this.translateWithOpenAI(summaryData);
        if (translated) return translated;
      } catch (err: any) {
        logger.warn(`OpenAI Hinglish translation error: ${err.message}. Using rule synthesizer.`);
      }
    }

    // Natural rule-based synthesizer fallback
    return {
      summary: this.synthesizeHinglishSentence(summaryData.summary),
      whyItMatters: this.synthesizeHinglishSentence(summaryData.whyItMatters),
      background: this.synthesizeHinglishSentence(summaryData.background),
      keyFacts: summaryData.keyFacts.map((fact) => this.synthesizeHinglishSentence(fact)),
      knowledge: {
        topic: summaryData.knowledge.topic, // Keep topic clean
        simpleExplanation: this.synthesizeHinglishSentence(summaryData.knowledge.simpleExplanation),
      },
      confidence: summaryData.confidence,
      language: 'hinglish',
    };
  }

  /**
   * OpenAI-powered natural Hinglish translator
   */
  private static async translateWithOpenAI(summaryData: any): Promise<any | null> {
    const prompt = `You are an expert bilingual news editor for an Indian audience.
Translate the following news summary into natural, fluent Hinglish (Hindi written in Roman/Latin script, as spoken colloquially in modern newsrooms and tech discussions in India).

STRICT RULES:
1. Do NOT translate proper nouns, organization names (e.g., RBI, NASA, ISRO, Supreme Court, Google, Apple), acronyms, numbers, or technical terms (e.g., GDP, repo rate, AI, inflation). Keep their exact English spelling.
2. Ensure the tone is neutral, educational, and respectful.
3. Use natural everyday Hinglish phrasing (e.g., "RBI ne repo rate ko filhaal same rakha hai. Iska matlab hai ki policy rate me koi change nahi hua.").
4. Return ONLY valid JSON matching this schema:
{
  "summary": "...",
  "whyItMatters": "...",
  "background": "...",
  "keyFacts": ["...", "..."],
  "knowledge": {
    "topic": "${summaryData.knowledge.topic}",
    "simpleExplanation": "..."
  }
}

INPUT DATA TO TRANSLATE:
${JSON.stringify(summaryData, null, 2)}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 800,
      },
      {
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        ...parsed,
        confidence: summaryData.confidence,
        language: 'hinglish',
      };
    }
    return null;
  }

  /**
   * Synthesizes English sentences into natural conversational Hinglish,
   * preserving entities, acronyms, quotes, and numbers.
   */
  public static synthesizeHinglishSentence(text: string): string {
    if (!text || typeof text !== 'string') return '';

    let result = text.trim();

    // Common phrase replacements for natural conversational Hinglish
    const replacements: Array<[RegExp, string]> = [
      [/Here are the latest verified facts regarding your question:?/gi, 'Aapke sawaal se judi latest verified facts yeh hain:'],
      [/\*\*Takeaway:\*\* This information is synthesized from our monitored news sources\. Let me know if you would like a deeper explanation of any of these topics!/gi, '**Takeaway:** Yeh jaankari verified news sources se li gayi hai. Agar aapko kisi bhi topic par aur detail chahiye, toh pooch sakte hain!'],
      [/I could not find recent verified news matching your query/gi, 'Aapki query se match hoti hui haal hi ki koi verified news nahi mili'],
      [/\bThe Reserve Bank of India kept the repo rate unchanged\b/gi, 'RBI ne repo rate ko filhaal same rakha hai. Iska matlab hai ki policy rate me koi badlav nahi hua.'],
      [/\bkept the repo rate unchanged\b/gi, 'repo rate ko unchanged rakha hai'],
      [/\baccording to official reports\b/gi, 'official reports ke mutabiq'],
      [/\baccording to coverage verified by\b/gi, 'coverage ke anusar jo verify kiya gaya hai'],
      [/\bhas announced that\b/gi, 'ne announce kiya hai ki'],
      [/\bannounced that\b/gi, 'ne announce kiya ki'],
      [/\bhas decided to\b/gi, 'ne decide kiya hai ki'],
      [/\bdecided to\b/gi, 'ne decide kiya ki'],
      [/\bhas launched a new\b/gi, 'ne ek naya launch kiya hai'],
      [/\blaunched a new\b/gi, 'ne naya launch kiya'],
      [/\bhas reported\b/gi, 'ne report kiya hai'],
      [/\breported that\b/gi, 'ne report kiya ki'],
      [/\bis expected to\b/gi, 'ke hone ki umeed hai'],
      [/\bare expected to\b/gi, 'ke hone ki sambhavna hai'],
      [/\bkey developments\b/gi, 'mukhya updates aur developments'],
      [/\bwhy it matters\b/gi, 'yeh kyu zaroori hai'],
      [/\bwhat happened\b/gi, 'kya hua tha'],
      [/\bthis event highlights\b/gi, 'yeh ghatna darshati hai'],
      [/\bthis development comes as\b/gi, 'yeh development aise samay par aayi hai jab'],
      [/\bin order to\b/gi, 'taaki'],
      [/\bas a result of\b/gi, 'iske chalte'],
      [/\bdue to\b/gi, 'ke kaaran'],
      [/\bimpacts millions of\b/gi, 'lakhon logon par asar daalta hai'],
      [/\bimpacts on\b/gi, 'par asar'],
      [/\baims to improve\b/gi, 'ka lakshya behtar banana hai'],
      [/\baimed at\b/gi, 'ke maksad se'],
      [/\bfor the first time\b/gi, 'pehli baar'],
      [/\bover the past few\b/gi, 'pichle kuch'],
      [/\bacross the country\b/gi, 'desh bhar me'],
      [/\baround the world\b/gi, 'duniya bhar me'],
      [/\bimportant step towards\b/gi, 'ki disha me ek ahem kadam'],
      [/\bgovernment officials stated\b/gi, 'sarkari adhikariyon ne kaha'],
      [/\bofficial statement said\b/gi, 'official bayaan me bataya gaya'],
      [/\bcontinue to monitor\b/gi, 'par lagatar nazar banayi hui hai'],
      [/\bhas been approved\b/gi, 'ko approval mil chuki hai'],
      [/\bhas been introduced\b/gi, 'ko introduce kiya gaya hai'],
      [/\bis essential for\b/gi, 'ke liye behad zaroori hai'],
      [/\bare essential for\b/gi, 'ke liye kaafi ahem hain'],
      [/\bhelps in understanding\b/gi, 'ko samajhne me madad karta hai'],
      [/\bplays a crucial role\b/gi, 'ek ahem role play karta hai'],
      [/\bhighlights the importance of\b/gi, 'ke importance ko highlight karta hai'],
      [/\bwith immediate effect\b/gi, 'turant prabhav se'],
      [/\bin the coming days\b/gi, 'aane wale dino me'],
      [/\bin the latest update\b/gi, 'latest update ke anusar'],
      [/\bmore details are awaited\b/gi, 'aur details aana baaki hain'],
    ];

    for (const [pattern, replacement] of replacements) {
      result = result.replace(pattern, replacement);
    }

    return result;
  }
}

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppLanguage, SummaryData } from '../types';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  isHinglish: boolean;
  synthesizeHinglish: (text: string) => string;
  synthesizeHinglishSummary: (summary: SummaryData) => SummaryData;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'news_app_preferred_language';

// Common phrase replacements for natural conversational Hinglish preserving proper nouns
const HINGLISH_REPLACEMENTS: Array<[RegExp, string]> = [
  [/Here are the latest verified facts regarding your question:?/gi, 'Aapke sawaal se judi latest verified facts yeh hain:'],
  [/\*\*Takeaway:\*\* This information is synthesized from our monitored news sources\. Let me know if you would like a deeper explanation of any of these topics!/gi, '**Takeaway:** Yeh jaankari verified news sources se li gayi hai. Agar aapko kisi bhi topic par aur detail chahiye, toh pooch sakte hain!'],
  [/I could not find recent verified news matching your query/gi, 'Aapki query se match hoti hui haal hi ki koi verified news nahi mili'],
  [/\bThe Reserve Bank of India kept the repo rate unchanged\b/gi, 'RBI ne repo rate ko filhaal same rakha hai. Iska matlab hai ki policy rate me koi badlav nahi hua.'],
  [/\bkept the repo rate unchanged\b/gi, 'repo rate ko unchanged rakha hai'],
  [/\baccording to official reports\b/gi, 'official reports ke mutabiq'],
  [/\baccording to coverage verified by\b/gi, 'verified coverage ke anusar'],
  [/\bhas announced that\b/gi, 'ne announce kiya hai ki'],
  [/\bannounced that\b/gi, 'ne announce kiya ki'],
  [/\bhas decided to\b/gi, 'ne decide kiya hai ki'],
  [/\bdecided to\b/gi, 'ne decide kiya ki'],
  [/\bhas launched a new\b/gi, 'ne naya launch kiya hai'],
  [/\blaunched a new\b/gi, 'ne naya launch kiya'],
  [/\bhas reported that\b/gi, 'ne report kiya hai ki'],
  [/\breported that\b/gi, 'ne report kiya ki'],
  [/\bis expected to\b/gi, 'ke hone ki umeed hai'],
  [/\bare expected to\b/gi, 'ke hone ki sambhavna hai'],
  [/\bkey developments\b/gi, 'mukhya updates aur developments'],
  [/\bwhy it matters\b/gi, 'yeh kyu zaroori hai'],
  [/\bwhat happened\b/gi, 'kya hua tha'],
  [/\bthis event highlights\b/gi, 'yeh ghatna darshati hai ki'],
  [/\bthis development comes as\b/gi, 'yeh development aise samay aayi hai jab'],
  [/\bin order to\b/gi, 'taaki'],
  [/\bas a result of\b/gi, 'iske chalte'],
  [/\bdue to\b/gi, 'ke kaaran'],
  [/\bimpacts millions of\b/gi, 'lakhon logon par asar daalta hai'],
  [/\baims to improve\b/gi, 'ka lakshya behtar banana hai'],
  [/\bfor the first time\b/gi, 'pehli baar'],
  [/\bover the past few\b/gi, 'pichle kuch'],
  [/\bacross the country\b/gi, 'desh bhar me'],
  [/\baround the world\b/gi, 'duniya bhar me'],
  [/\bimportant step towards\b/gi, 'ki disha me ek ahem kadam'],
  [/\bgovernment officials stated\b/gi, 'sarkari adhikariyon ne bataya'],
  [/\bcontinue to monitor\b/gi, 'par lagatar nazar banayi hui hai'],
  [/\bhas been approved\b/gi, 'ko approval mil gaya hai'],
  [/\bhas been introduced\b/gi, 'ko introduce kiya gaya hai'],
  [/\bis essential for\b/gi, 'ke liye behad zaroori hai'],
  [/\bare essential for\b/gi, 'ke liye kaafi ahem hain'],
  [/\bhelps in understanding\b/gi, 'ko samajhne me madad karta hai'],
  [/\bplays a crucial role\b/gi, 'ek ahem role play karta hai'],
  [/\bwith immediate effect\b/gi, 'turant prabhav se'],
  [/\bin the coming days\b/gi, 'aane wale dino me'],
  [/\bin the latest update\b/gi, 'latest update ke mutabiq'],
  [/\bmore details are awaited\b/gi, 'aur details aana baaki hain'],
];

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'hinglish' || saved === 'en') return saved;
    } catch {
      // fallback
    }
    return 'en';
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hinglish' : 'en');
  };

  const synthesizeHinglish = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    let res = text.trim();
    for (const [pat, rep] of HINGLISH_REPLACEMENTS) {
      res = res.replace(pat, rep);
    }
    return res;
  };

  const synthesizeHinglishSummary = (summaryData: SummaryData): SummaryData => {
    return {
      ...summaryData,
      summary: synthesizeHinglish(summaryData.summary),
      whyItMatters: synthesizeHinglish(summaryData.whyItMatters),
      background: synthesizeHinglish(summaryData.background),
      keyFacts: summaryData.keyFacts.map((f) => synthesizeHinglish(f)),
      knowledge: {
        topic: summaryData.knowledge.topic,
        simpleExplanation: synthesizeHinglish(summaryData.knowledge.simpleExplanation),
      },
      language: 'hinglish',
    };
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isHinglish: language === 'hinglish',
        synthesizeHinglish,
        synthesizeHinglishSummary,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppLanguage, SummaryData } from '../types';
import { decodeHtmlEntities } from '../utils/formatters';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  isHindi: boolean;
  t: (key: string) => string;
  synthesizeHindi: (text?: string) => string;
  synthesizeHindiSummary: (summary: SummaryData) => SummaryData;
  decodeText: (text?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'news_app_preferred_language';

// Comprehensive UI Dictionary for standard labels and navigation elements
const UI_TRANSLATIONS: Record<string, string> = {
  // Navigation & Branding
  'AI News & Knowledge': 'AI समाचार और ज्ञान',
  'Verified & Neutral': 'सत्यापित और निष्पक्ष',
  'Live Feed': 'लाइव फ़ीड',
  'Search news, topics, concepts...': 'समाचार, विषय और अवधारणाएं खोजें...',
  'Refresh': 'रिफ्रेश',
  'Install': 'ऐप इंस्टॉल करें',
  'Language': 'भाषा',
  'Account Profile': 'खाता प्रोफ़ाइल',

  // Sidebar links & headers
  'Feeds': 'फ़ीड्स',
  'Categories': 'श्रेणियां',
  'Dashboard': 'डैशबोर्ड',
  'Latest News': 'ताज़ा समाचार',
  'Knowledge Hub': 'ज्ञान केंद्र',
  'Saved News': 'सहेजे गए समाचार',
  'AI Assistant': 'एआई सहायक',
  'Settings': 'सेटिंग्स',
  'Login': 'लॉग इन',
  'Register': 'रजिस्टर',

  // 10 Topic Categories
  'India': 'भारत',
  'World': 'विश्व',
  'Politics': 'राजनीति',
  'Business & Economy': 'व्यापार और अर्थव्यवस्था',
  'Technology & AI': 'प्रौद्योगिकी और एआई',
  'Science & Space': 'विज्ञान और अंतरिक्ष',
  'Environment': 'पर्यावरण',
  'Major Incidents': 'प्रमुख घटनाएं',
  'Sports': 'खेल',
  'Knowledge': 'ज्ञान',

  // Dashboard & Story Cards
  'Top Story': 'प्रमुख समाचार',
  'Trending Stories': 'ट्रेंडिंग समाचार',
  'Live News Stream': 'लाइव समाचार स्ट्रीम',
  'Today\'s Key Takeaways': 'आज के मुख्य निष्कर्ष',
  'Daily Concept': 'दैनिक अवधारणा',
  'Read Full Story': 'पूरी खबर पढ़ें',
  'Ask AI': 'एआई से पूछें',
  'Ask AI about this story': 'इस खबर के बारे में एआई से पूछें',
  'Verified Source': 'सत्यापित स्रोत',
  'Save': 'सहेजें',
  'Saved': 'सहेजा गया',
  'Share': 'शेयर करें',
  'All Categories': 'सभी श्रेणियां',

  // News Detail Structured Sections
  'Quick Summary': 'एक नज़र में',
  'What Happened?': 'क्या हुआ?',
  'Why Did It Happen?': 'ऐसा क्यों हुआ?',
  'Why It Matters': 'यह क्यों महत्वपूर्ण है?',
  'Impact & Implications': 'इसका असर क्या हो सकता है?',
  'Background & Context': 'पृष्ठभूमि',
  'Key Facts': 'मुख्य तथ्य',
  'People & Organizations Involved': 'संबंधित संस्थाएं और लोग',
  'Easy Explanation': 'आसान भाषा में समझें',
  'Knowledge Primer': 'ज्ञान केंद्र',
  'What Happens Next': 'आगे क्या होगा?',
  'Source Attribution': 'समाचार स्रोत',
  'Read Original Article': 'मूल लेख पढ़ें',
  'Have more questions about this event?': 'क्या आपके इस घटना के बारे में और प्रश्न हैं?',
  'Ask AI About This Story': 'इस खबर के बारे में AI से पूछें',
  'More in': 'और समाचार',
  'View all': 'सभी देखें',

  // States & Placeholders
  'Loading live articles...': 'लाइव समाचार लोड हो रहे हैं...',
  'Loading article details...': 'समाचार का विवरण लोड हो रहा है...',
  'No articles found': 'कोई समाचार नहीं मिला',
  'Could not load news feeds': 'समाचार फ़ीड लोड नहीं हो सके',
  'Please try again later': 'कृपया कुछ देर बाद पुनः प्रयास करें',
  'Article link copied to clipboard!': 'लेख का लिंक कॉपी हो गया!',
  'Saved to your bookmarks': 'बुकमार्क में सहेज लिया गया',
  'Removed from bookmarks': 'बुकमार्क से हटा दिया गया',
  'Live news refreshed with latest stories!': 'ताज़ा खबरों के साथ फ़ीड अपडेट हो गई!',
  'Recently': 'हाल ही में',
  'Just now': 'अभी-अभी',
  'Yesterday': 'कल',
  'min ago': 'मिनट पहले',
  'hour ago': 'घंटे पहले',
  'hours ago': 'घंटे पहले',
  'days ago': 'दिन पहले',

  // Chat UI
  'Personal AI News Assistant': 'व्यक्तिगत एआई समाचार सहायक',
  'Ask me anything about today\'s headlines, or ask for simple explanations of any concept or event.':
    'आज की प्रमुख खबरों के बारे में कुछ भी पूछें, या किसी भी घटना व अवधारणा की सरल हिंदी में व्याख्या प्राप्त करें।',
  'Explain this news in simple language': 'इस खबर को आसान भाषा में समझाओ',
  'Why did this happen?': 'ऐसा क्यों हुआ?',
  'Why does this matter to common people?': 'यह आम जनता के लिए क्यों महत्वपूर्ण है?',
  'What is the background of this event?': 'इसकी पृष्ठभूमि और इतिहास क्या है?',
  'What are the key facts?': 'इसके मुख्य तथ्य क्या हैं?',
  'What will happen next?': 'आगे क्या होने वाला है?',
  'Ask verified news questions...': 'सत्यापित समाचार या अवधारणाओं के बारे में पूछें...',
  'AI is synthesizing verified news...': 'एआई सत्यापित समाचारों से उत्तर तैयार कर रहा है...',
  'Clear Context': 'संदर्भ हटाएं',
};

// High-quality sentence and phrase patterns for Devanagari Hindi
const DEVANAGARI_NEWS_REPLACEMENTS: Array<[RegExp, string]> = [
  // Core Institutions & Leaders
  [/\bThe Reserve Bank of India\b/gi, 'भारतीय रिजर्व बैंक (RBI)'],
  [/\bReserve Bank of India\b/gi, 'भारतीय रिजर्व बैंक (RBI)'],
  [/\bSupreme Court of India\b/gi, 'भारत का सर्वोच्च न्यायालय (सुप्रीम कोर्ट)'],
  [/\bSupreme Court\b/gi, 'सुप्रीम कोर्ट'],
  [/\bHigh Court\b/gi, 'उच्च न्यायालय'],
  [/\bPrime Minister Narendra Modi\b/gi, 'प्रधानमंत्री नरेंद्र मोदी'],
  [/\bPrime Minister\b/gi, 'प्रधानमंत्री'],
  [/\bPresident of India\b/gi, 'भारत की राष्ट्रपति'],
  [/\bPresident\b/gi, 'राष्ट्रपति'],
  [/\bFinance Minister\b/gi, 'वित्त मंत्री'],
  [/\bCentral Government\b/gi, 'केंद्र सरकार'],
  [/\bState Government\b/gi, 'राज्य सरकार'],
  [/\bGovernment of India\b/gi, 'भारत सरकार'],
  [/\bParliament\b/gi, 'संसद'],
  [/\bLok Sabha\b/gi, 'लोकसभा'],
  [/\bRajya Sabha\b/gi, 'राज्यसभा'],
  [/\bElection Commission\b/gi, 'चुनाव आयोग'],
  [/\bCabinet has approved\b/gi, 'मंत्रिमंडल ने मंजूरी दे दी है'],
  [/\bhas approved\b/gi, 'ने मंजूरी दे दी है'],
  [/\bhas announced that\b/gi, 'ने घोषणा की है कि'],
  [/\bhas announced\b/gi, 'ने घोषणा की है'],
  [/\bannounced that\b/gi, 'ने घोषणा की कि'],
  [/\bhas decided to\b/gi, 'ने निर्णय लिया है कि'],
  [/\bdecided to\b/gi, 'ने निर्णय लिया कि'],
  [/\bhas launched a new\b/gi, 'ने एक नया शुभारंभ किया है'],
  [/\bhas launched\b/gi, 'ने शुभारंभ किया है'],
  [/\blaunched a new\b/gi, 'ने एक नया शुभारंभ किया'],
  [/\bhas reported that\b/gi, 'ने जानकारी दी है कि'],
  [/\breported that\b/gi, 'ने बताया कि'],
  [/\bkept the repo rate unchanged\b/gi, 'रेपो रेट को यथावत (अपरिवर्तित) रखा है'],
  [/\bkept the interest rate unchanged\b/gi, 'ब्याज दरों को अपरिवर्तित रखा है'],
  [/\bmonetary policy committee\b/gi, 'मौद्रिक नीति समिति (MPC)'],
  [/\baccording to official reports\b/gi, 'आधिकारिक रिपोर्टों के अनुसार'],
  [/\baccording to coverage verified by\b/gi, 'सत्यापित समाचार स्रोतों के अनुसार'],
  [/\baccording to\b/gi, 'के अनुसार'],
  [/\bkey developments\b/gi, 'प्रमुख घटनाक्रम'],
  [/\bwhy it matters\b/gi, 'यह क्यों महत्वपूर्ण है'],
  [/\bwhat happened\b/gi, 'क्या हुआ था'],
  [/\bthis development comes as\b/gi, 'यह घटनाक्रम ऐसे समय में आया है जब'],
  [/\bin order to\b/gi, 'ताकि'],
  [/\bas a result of\b/gi, 'के परिणामस्वरूप'],
  [/\bdue to\b/gi, 'के कारण'],
  [/\bimpacts millions of citizens\b/gi, 'लाखों नागरिकों को प्रभावित करता है'],
  [/\bimpacts millions of\b/gi, 'लाखों लोगों को प्रभावित करता है'],
  [/\baims to improve\b/gi, 'का उद्देश्य सुधार करना है'],
  [/\bfor the first time\b/gi, 'पहली बार'],
  [/\bacross the country\b/gi, 'देशभर में'],
  [/\baround the world\b/gi, 'दुनियाभर में'],
  [/\bover the past few days\b/gi, 'पिछले कुछ दिनों में'],
  [/\bover the past few months\b/gi, 'पिछले कुछ महीनों में'],
  [/\bin the coming days\b/gi, 'आने वाले दिनों में'],
  [/\bwith immediate effect\b/gi, 'तत्काल प्रभाव से'],
  [/\bmore details are awaited\b/gi, 'अधिक विवरण की प्रतीक्षा है'],
  [/\bplays a crucial role\b/gi, 'एक महत्वपूर्ण भूमिका निभाता है'],
  [/\bis essential for\b/gi, 'के लिए बेहद आवश्यक है'],
  [/\bare essential for\b/gi, 'के लिए अत्यंत महत्वपूर्ण हैं'],

  // Explanatory fallback sentences
  [/The exact underlying cause has not yet been officially confirmed by sources\./gi, 'इसका सटीक कारण अभी आधिकारिक तौर पर स्पष्ट नहीं है।'],
  [/Official announcements regarding subsequent phases, regulatory reviews, and operational timelines are expected\./gi, 'आगामी चरणों, नियामक समीक्षा और आधिकारिक समयसीमा के संबंध में औपचारिक घोषणाओं की प्रतीक्षा है।'],
  [/Official stakeholders and relevant bodies are monitoring developments, with subsequent announcements expected in the upcoming period\./gi, 'संबंधित अधिकारी और संस्थाएं घटनाक्रम पर नजर बनाए हुए हैं, और आने वाले समय में आगे के कदमों की घोषणा होने की संभावना है।'],
  [/Developments in software and artificial intelligence directly influence productivity, security standards, and daily consumer tools worldwide\./gi, 'सॉफ्टवेयर और आर्टिफिशियल इंटेलिजेंस (AI) में विकास सीधे तौर पर वैश्विक उत्पादकता, सुरक्षा मानकों और दैनिक उपभोक्ता उपकरणों को प्रभावित करता है।'],
  [/Key national milestones, public policy developments, and socio-economic updates impact millions of citizens and businesses across India\./gi, 'राष्ट्रीय विकास, सार्वजनिक नीतियां और सामाजिक-आर्थिक अपडेट पूरे भारत में करोड़ों नागरिकों और व्यवसायों को प्रभावित करते हैं।'],
  [/Shifts in market fundamentals, corporate investments, and central bank monetary policy impact employment, inflation, and borrowing costs\./gi, 'बाजार के बुनियादी ढांचे, कॉर्पोरेट निवेश और केंद्रीय बैंक की मौद्रिक नीतियों में बदलाव से रोजगार, मुद्रास्फीति और ऋण लागत पर सीधा प्रभाव पड़ता है।'],
  [/Climate trends, renewable adoption, and conservation policies dictate long-term ecological sustainability and global climate targets\./gi, 'जलवायु परिवर्तन, नवीकरणीय ऊर्जा को अपनाना और संरक्षण नीतियां दीर्घकालिक पारिस्थितिक स्थिरता और वैश्विक जलवायु लक्ष्यों को तय करती हैं।'],
  [/Scientific exploration and astronomical discoveries expand humanity’s technological frontier and understanding of the universe\./gi, 'वैज्ञानिक अनुसंधान और खगोलीय खोजें मानवता की तकनीकी सीमाओं और ब्रह्मांड की हमारी समझ का विस्तार करती हैं।'],
  [/Legislative decisions, diplomatic discussions, and state policies establish legal standards and governance frameworks for institutions and society\./gi, 'विधायी निर्णय, कूटनीतिक चर्चाएं और राज्य नीतियां संस्थाओं और समाज के लिए कानूनी मानकों और शासन के ढांचे को स्थापित करती हैं।'],
  [/Emergency response protocols, disaster management, and public safety infrastructure are essential for citizen protection and recovery\./gi, 'नागरिक सुरक्षा, आपदा प्रबंधन और सार्वजनिक सुरक्षा का ढांचा संकट के समय नागरिकों की रक्षा और पुनर्प्राप्ति के लिए अत्यंत आवश्यक है।'],
  [/Major athletic tournaments reflect national athletic achievements, sportsmanship, and international sports rankings\./gi, 'प्रमुख खेल प्रतियोगिताएं राष्ट्रीय उपलब्धियों, खेल भावना और अंतरराष्ट्रीय खेल रैंकिंग को प्रदर्शित करती हैं।'],
  [/Understanding global events helps contextualize international relations, trade corridors, and regional stability\./gi, 'वैश्विक घटनाओं को समझना अंतरराष्ट्रीय संबंधों, व्यापारिक गलियारों और क्षेत्रीय स्थिरता को सही संदर्भ में देखने में मदद करता है।']
];

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'hi' || saved === 'en') {
        return saved as AppLanguage;
      }
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
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const isHindi = language === 'hi';

  const t = (key: string): string => {
    const cleanKey = decodeHtmlEntities(key);
    if (!isHindi) return cleanKey;
    return UI_TRANSLATIONS[cleanKey] || cleanKey;
  };

  const decodeText = (text?: string): string => {
    return decodeHtmlEntities(text);
  };

  const synthesizeHindi = (text?: string): string => {
    if (!text || typeof text !== 'string') return '';
    let res = decodeHtmlEntities(text.trim());
    for (const [pattern, replacement] of DEVANAGARI_NEWS_REPLACEMENTS) {
      res = res.replace(pattern, replacement);
    }
    return res;
  };

  const synthesizeHindiSummary = (summaryData: SummaryData): SummaryData => {
    return {
      ...summaryData,
      summary: synthesizeHindi(summaryData.summary),
      whatHappened: summaryData.whatHappened
        ? synthesizeHindi(summaryData.whatHappened)
        : synthesizeHindi(summaryData.summary),
      whyDidItHappen: summaryData.whyDidItHappen
        ? synthesizeHindi(summaryData.whyDidItHappen)
        : 'इसका सटीक कारण अभी आधिकारिक स्रोतों द्वारा स्पष्ट नहीं किया गया है।',
      whyItMatters: synthesizeHindi(summaryData.whyItMatters),
      impact: summaryData.impact
        ? synthesizeHindi(summaryData.impact)
        : 'यह घटना संबंधित क्षेत्र और सार्वजनिक नीतियों पर महत्वपूर्ण प्रभाव डालती है।',
      background: synthesizeHindi(summaryData.background),
      keyFacts: summaryData.keyFacts.map((f) => synthesizeHindi(f)),
      easyExplanation: summaryData.easyExplanation
        ? synthesizeHindi(summaryData.easyExplanation)
        : synthesizeHindi(summaryData.knowledge?.simpleExplanation || ''),
      whatNext: summaryData.whatNext
        ? synthesizeHindi(summaryData.whatNext)
        : 'आधिकारिक स्रोतों से आगामी कदमों और निर्णयों के विवरण की प्रतीक्षा है।',
      knowledge: {
        topic: synthesizeHindi(summaryData.knowledge.topic),
        simpleExplanation: synthesizeHindi(summaryData.knowledge.simpleExplanation),
      },
      language: 'hi',
    };
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isHindi,
        t,
        synthesizeHindi,
        synthesizeHindiSummary,
        decodeText,
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

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppLanguage, SummaryData } from '../types';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  isHindi: boolean;
  isHinglish: boolean;
  t: (key: string) => string;
  synthesizeHindi: (text: string) => string;
  synthesizeHindiSummary: (summary: SummaryData) => SummaryData;
  synthesizeHinglish: (text: string) => string;
  synthesizeHinglishSummary: (summary: SummaryData) => SummaryData;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'news_app_preferred_language';

// UI Dictionary for UI labels
const UI_TRANSLATIONS: Record<string, string> = {
  'Dashboard': 'डैशबोर्ड',
  'Latest News': 'ताज़ा समाचार',
  'Knowledge Hub': 'ज्ञान केंद्र',
  'Saved News': 'सहेजे गए समाचार',
  'AI Assistant': 'एआई सहायक',
  'Feeds': 'फ़ीड्स',
  'Categories': 'श्रेणियां',
  'India': 'भारत',
  'World': 'विश्व',
  'Politics': 'राजनीति',
  'Business & Economy': 'व्यापार व अर्थव्यवस्था',
  'Technology & AI': 'तकनीक व एआई',
  'Science & Space': 'विज्ञान व अंतरिक्ष',
  'Environment': 'पर्यावरण',
  'Major Incidents': 'प्रमुख घटनाएं',
  'Sports': 'खेल',
  'Knowledge': 'ज्ञान',
  'Search news, topics, concepts...': 'समाचार, विषय और अवधारणाएं खोजें...',
  'Refresh': 'रिफ्रेश',
  'Live Feed': 'लाइव फ़ीड',
  'Top Story': 'प्रमुख समाचार',
  'Trending Stories': 'ट्रेंडिंग समाचार',
  'Verified & Neutral': 'सत्यापित और निष्पक्ष',
  'Today\'s Key Takeaways': 'आज के मुख्य निष्कर्ष',
  'Daily Concept': 'दैनिक अवधारणा',
  'Read Full Story': 'पूरी खबर पढ़ें',
  'Ask AI': 'एआई से पूछें',
  'Ask AI about this story': 'इस खबर के बारे में एआई से पूछें',
  'Summary': 'संक्षेप में',
  'Why It Matters': 'यह क्यों महत्वपूर्ण है',
  'Background & Context': 'पृष्ठभूमि और संदर्भ',
  'Key Verified Facts': 'सत्यापित मुख्य तथ्य',
  'Daily Concept & Knowledge': 'दैनिक अवधारणा व ज्ञान',
  'Related News': 'संबंधित समाचार',
  'Save Article': 'सहेजें',
  'Saved': 'सहेजा गया',
  'Read Original Source': 'मूल स्रोत पढ़ें',
  'Share': 'शेयर करें',
  'Key Entities & Institutions': 'संबंधित संस्थाएं व निकाय',
  'Recent Updates': 'हालिया अपडेट',
  'No articles found': 'कोई समाचार नहीं मिला',
};

// Comprehensive phrase mapping for news summary and bullet translation into natural Devanagari Hindi
const DEVANAGARI_NEWS_REPLACEMENTS: Array<[RegExp, string]> = [
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
  [/\baccording to official reports\b/gi, 'आधिकारिक रिपोर्टों के अनुसार'],
  [/\baccording to coverage verified by\b/gi, 'सत्यापित समाचार स्रोतों के अनुसार'],
  [/\baccording to\b/gi, 'के अनुसार'],
  [/\bkey developments\b/gi, 'प्रमुख घटनाक्रम'],
  [/\bwhy it matters\b/gi, 'यह क्यों महत्वपूर्ण है'],
  [/\bwhat happened\b/gi, 'क्या हुआ था'],
  [/\bthis development comes as\b/gi, 'यह घटनाक्रम ऐसे समय आया है जब'],
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
  [/\bin the coming days\b/gi, 'आने वाले दिनों में'],
  [/\bwith immediate effect\b/gi, 'तत्काल प्रभाव से'],
  [/\bmore details are awaited\b/gi, 'अधिक विवरण की प्रतीक्षा है'],
  [/\bplays a crucial role\b/gi, 'एक महत्वपूर्ण भूमिका निभाता है'],
  [/\bis essential for\b/gi, 'के लिए बेहद आवश्यक है'],
  [/\bare essential for\b/gi, 'के लिए अत्यंत महत्वपूर्ण हैं'],
  [/\bhelps in understanding\b/gi, 'को समझने में मदद करता है'],
  [/\bhas been introduced\b/gi, 'को पेश किया गया है'],
  [/\bhas been approved\b/gi, 'को मंजूरी दी गई है'],

  // Default whyItMatters templates from fallback AI
  [/Developments in software and artificial intelligence directly influence productivity, security standards, and daily consumer tools worldwide\./gi, 'सॉफ्टवेयर और आर्टिफिशियल इंटेलिजेंस में विकास सीधे तौर पर वैश्विक उत्पादकता, सुरक्षा मानकों और दैनिक उपभोक्ता उपकरणों को प्रभावित करता है।'],
  [/Key national milestones, public policy developments, and socio-economic updates impact millions of citizens and businesses across India\./gi, 'राष्ट्रीय विकास, सार्वजनिक नीतियां और सामाजिक-आर्थिक अपडेट पूरे भारत में करोड़ों नागरिकों और व्यवसायों को प्रभावित करते हैं।'],
  [/Shifts in market fundamentals, corporate investments, and central bank monetary policy impact employment, inflation, and borrowing costs\./gi, 'बाजार के बुनियादी ढांचे, कॉर्पोरेट निवेश और केंद्रीय बैंक की मौद्रिक नीतियों में बदलाव से रोजगार, मुद्रास्फीति और ऋण लागत पर सीधा प्रभाव पड़ता है।'],
  [/Climate trends, renewable adoption, and conservation policies dictate long-term ecological sustainability and global climate targets\./gi, 'जलवायु परिवर्तन, नवीकरणीय ऊर्जा को अपनाना और संरक्षण नीतियां दीर्घकालिक पारिस्थितिक स्थिरता और वैश्विक जलवायु लक्ष्यों को तय करती हैं।'],
  [/Scientific exploration and astronomical discoveries expand humanity’s technological frontier and understanding of the universe\./gi, 'वैज्ञानिक अनुसंधान और खगोलीय खोजें मानवता की तकनीकी सीमाओं और ब्रह्मांड की हमारी समझ का विस्तार करती हैं।'],
  [/Legislative decisions, diplomatic discussions, and state policies establish legal standards and governance frameworks for institutions and society\./gi, 'विधायी निर्णय, कूटनीतिक चर्चाएं और राज्य नीतियां संस्थाओं और समाज के लिए कानूनी मानकों और शासन के ढांचे को स्थापित करती हैं।'],
  [/Emergency response protocols, disaster management, and public safety infrastructure are essential for citizen protection and recovery\./gi, 'नागरिक सुरक्षा, आपदा प्रबंधन और सार्वजनिक सुरक्षा का ढांचा संकट के समय नागरिकों की रक्षा और पुनर्प्राप्ति के लिए अत्यंत आवश्यक है।'],
  [/Major athletic tournaments reflect national athletic achievements, sportsmanship, and international sports rankings\./gi, 'प्रमुख खेल प्रतियोगिताएं राष्ट्रीय उपलब्धियों, खेल भावना और अंतरराष्ट्रीय खेल रैंकिंग को प्रदर्शित करती हैं।'],
  [/Understanding global events helps contextualize international relations, trade corridors, and regional stability\./gi, 'वैश्विक घटनाओं को समझना अंतरराष्ट्रीय संबंधों, व्यापारिक गलियारों और क्षेत्रीय स्थिरता को सही संदर्भ में देखने में मदद करता है।'],

  // Chatbot standard intros
  [/Here are the latest verified facts regarding your question:?/gi, 'आपके प्रश्न से संबंधित नवीनतम सत्यापित तथ्य निम्नलिखित हैं:'],
  [/\*\*Takeaway:\*\* This information is synthesized from our monitored news sources\. Let me know if you would like a deeper explanation of any of these topics!/gi, '**निष्कर्ष:** यह जानकारी हमारे सत्यापित समाचार स्रोतों से संकलित की गई है। यदि आप किसी भी विषय पर अधिक विस्तार से जानना चाहते हैं, तो कृपया पूछें!'],
  [/I could not find recent verified news matching your query/gi, 'मुझे आपकी खोज से संबंधित कोई हालिया सत्यापित समाचार नहीं मिला।'],
  [/Welcome to your Personal AI News & Knowledge Assistant!/gi, 'आपके व्यक्तिगत AI समाचार और ज्ञान सहायक में आपका स्वागत है!'],
  [/I analyze verified daily news across India, World, Tech, Science, Business, and more to answer your questions factually and neutrally\./gi, 'मैं भारत, विश्व, तकनीक, विज्ञान, व्यापार और अन्य क्षेत्रों के दैनिक सत्यापित समाचारों का विश्लेषण कर आपके प्रश्नों का तथ्यात्मक और निष्पक्ष उत्तर देता हूँ।'],
  [/Ask me anything about today's headlines, or ask for simple explanations of any concept or event\./gi, 'आज की प्रमुख खबरों के बारे में कुछ भी पूछें, या किसी भी घटना व अवधारणा की सरल व्याख्या प्राप्त करें।']
];

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'hi' || saved === 'hinglish' || saved === 'en') {
        // Upgrade legacy 'hinglish' to pure 'hi' if user stored hinglish
        return saved === 'hinglish' ? 'hi' : (saved as AppLanguage);
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
  const isHinglish = isHindi;

  const t = (key: string): string => {
    if (!isHindi) return key;
    return UI_TRANSLATIONS[key] || key;
  };

  const synthesizeHindi = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    let res = text.trim();
    for (const [pattern, replacement] of DEVANAGARI_NEWS_REPLACEMENTS) {
      res = res.replace(pattern, replacement);
    }
    return res;
  };

  const synthesizeHindiSummary = (summaryData: SummaryData): SummaryData => {
    return {
      ...summaryData,
      summary: synthesizeHindi(summaryData.summary),
      whyItMatters: synthesizeHindi(summaryData.whyItMatters),
      background: synthesizeHindi(summaryData.background),
      keyFacts: summaryData.keyFacts.map((f) => synthesizeHindi(f)),
      knowledge: {
        topic: synthesizeHindi(summaryData.knowledge.topic),
        simpleExplanation: synthesizeHindi(summaryData.knowledge.simpleExplanation),
      },
      language: 'hi',
    };
  };

  // Backward compatibility methods
  const synthesizeHinglish = synthesizeHindi;
  const synthesizeHinglishSummary = synthesizeHindiSummary;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isHindi,
        isHinglish,
        t,
        synthesizeHindi,
        synthesizeHindiSummary,
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

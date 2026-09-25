import axios from 'axios';
import { env } from '../config/env';
import { Logger } from '../utils/logger';
import { decodeHtmlEntities } from '../utils/htmlEntities';

const logger = new Logger('HindiService');

// Proper nouns, organizations, and technical terms to retain in recognizable form
const PRESERVED_ACRONYMS = new Set([
  'Tesla', 'Optimus', 'RBI', 'NASA', 'ISRO', 'GDP', 'AI', 'SEBI', 'UPI', 'DRDO', 'IMF', 'WHO', 'UN', 'NATO',
  'BCCI', 'ICC', 'Sensex', 'Nifty', 'CAG', 'ED', 'CBI', 'GST', 'EV', 'ChatGPT', 'OpenAI',
  'Google', 'Microsoft', 'Apple', 'Meta', 'NVIDIA', 'USA', 'UK', 'Supreme Court', 'High Court'
]);

// High-frequency natural Devanagari news translations
const DEVANAGARI_NEWS_DICTIONARY: Array<[RegExp, string]> = [
  // Common news announcements
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
  [/\bFinance Ministry\b/gi, 'वित्त मंत्रालय'],
  [/\bCentral Government\b/gi, 'केंद्र सरकार'],
  [/\bState Government\b/gi, 'राज्य सरकार'],
  [/\bGovernment of India\b/gi, 'भारत सरकार'],
  [/\bParliament\b/gi, 'संसद'],
  [/\bLok Sabha\b/gi, 'लोकसभा'],
  [/\bRajya Sabha\b/gi, 'राज्यसभा'],
  [/\bElection Commission\b/gi, 'चुनाव आयोग'],
  [/\bUnion Cabinet\b/gi, 'केंद्रीय मंत्रिमंडल'],
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

  // Default whyItMatters templates from fallback AI
  [/Developments in software and artificial intelligence directly influence productivity, security standards, and daily consumer tools worldwide\./gi, 'सॉफ्टवेयर और आर्टिफिशियल इंटेलिजेंस (AI) में विकास सीधे तौर पर वैश्विक उत्पादकता, सुरक्षा मानकों और दैनिक उपभोक्ता उपकरणों को प्रभावित करता है।'],
  [/Key national milestones, public policy developments, and socio-economic updates impact millions of citizens and businesses across India\./gi, 'राष्ट्रीय विकास, सार्वजनिक नीतियां और सामाजिक-आर्थिक अपडेट पूरे भारत में करोड़ों नागरिकों और व्यवसायों को प्रभावित करते हैं।'],
  [/Shifts in market fundamentals, corporate investments, and central bank monetary policy impact employment, inflation, and borrowing costs\./gi, 'बाजार के बुनियादी ढांचे, कॉर्पोरेट निवेश और केंद्रीय बैंक की मौद्रिक नीतियों में बदलाव से रोजगार, मुद्रास्फीति और ऋण लागत पर सीधा प्रभाव पड़ता है।'],
  [/Climate trends, renewable adoption, and conservation policies dictate long-term ecological sustainability and global climate targets\./gi, 'जलवायु परिवर्तन, नवीकरणीय ऊर्जा को अपनाना और संरक्षण नीतियां दीर्घकालिक पारिस्थितिक स्थिरता और वैश्विक जलवायु लक्ष्यों को तय करती हैं।'],
  [/Scientific exploration and astronomical discoveries expand humanity’s technological frontier and understanding of the universe\./gi, 'वैज्ञानिक अनुसंधान और खगोलीय खोजें मानवता की तकनीकी सीमाओं और ब्रह्मांड की हमारी समझ का विस्तार करती हैं।'],
  [/Legislative decisions, diplomatic discussions, and state policies establish legal standards and governance frameworks for institutions and society\./gi, 'विधायी निर्णय, कूटनीतिक चर्चाएं और राज्य नीतियां संस्थाओं और समाज के लिए कानूनी मानकों और शासन के ढांचे को स्थापित करती हैं।'],
  [/Emergency response protocols, disaster management, and public safety infrastructure are essential for citizen protection and recovery\./gi, 'नागरिक सुरक्षा, आपदा प्रबंधन और सार्वजनिक सुरक्षा का ढांचा संकट के समय नागरिकों की रक्षा और पुनर्प्राप्ति के लिए अत्यंत आवश्यक है।'],
  [/Major athletic tournaments reflect national athletic achievements, sportsmanship, and international sports rankings\./gi, 'प्रमुख खेल प्रतियोगिताएं राष्ट्रीय उपलब्धियों, खेल भावना और अंतरराष्ट्रीय खेल रैंकिंग को प्रदर्शित करती हैं।'],
  [/Understanding global events helps contextualize international relations, trade corridors, and regional stability\./gi, 'वैश्विक घटनाओं को समझना अंतरराष्ट्रीय संबंधों, व्यापारिक गलियारों और क्षेत्रीय स्थिरता को सही संदर्भ में देखने में मदद करता है।'],

  // Standard fallback explanations
  [/The exact underlying cause has not yet been officially confirmed by sources\./gi, 'इसका सटीक कारण अभी आधिकारिक तौर पर स्पष्ट नहीं है।'],
  [/Official announcements regarding subsequent phases, regulatory reviews, and operational timelines are expected\./gi, 'आगामी चरणों, नियामक समीक्षा और आधिकारिक समयसीमा के संबंध में औपचारिक घोषणाओं की प्रतीक्षा है।'],
  [/Official stakeholders and relevant bodies are monitoring developments, with subsequent announcements expected in the upcoming period\./gi, 'संबंधित अधिकारी और संस्थाएं घटनाक्रम पर नजर बनाए हुए हैं, और आने वाले समय में आगे के कदमों की घोषणा होने की संभावना है।']
];

export interface StructuredSummaryInput {
  summary: string;
  whatHappened?: string;
  whyDidItHappen?: string;
  whyItMatters: string;
  impact?: string;
  background: string;
  keyFacts: string[];
  easyExplanation?: string;
  whatNext?: string;
  knowledge?: {
    topic: string;
    simpleExplanation: string;
  };
  confidence?: number;
}

export class HindiService {
  /**
   * Translates a structured article explanation into natural Devanagari Hindi.
   */
  static async translateArticleSummary(
    articleTitle: string,
    summaryData: StructuredSummaryInput
  ): Promise<{
    translatedTitle?: string;
    summary: {
      summary: string;
      whatHappened?: string;
      whyDidItHappen?: string;
      whyItMatters: string;
      impact?: string;
      background: string;
      keyFacts: string[];
      easyExplanation?: string;
      whatNext?: string;
      knowledge: {
        topic: string;
        simpleExplanation: string;
      };
      confidence?: number;
      language: 'hi';
    };
  }> {
    const cleanTitle = decodeHtmlEntities(articleTitle);

    // If OpenAI API key is present, perform high-fidelity translation
    if (env.OPENAI_API_KEY) {
      try {
        const aiTranslated = await this.translateWithOpenAI(cleanTitle, summaryData);
        if (aiTranslated) {
          return {
            translatedTitle: aiTranslated.title,
            summary: {
              ...aiTranslated.summaryData,
              language: 'hi',
            },
          };
        }
      } catch (err: any) {
        logger.warn(`OpenAI Hindi translation failed: ${err.message}. Using rule-based Hindi synthesizer.`);
      }
    }

    // High quality rule-based Devanagari synthesizer
    const topic = summaryData.knowledge?.topic || 'सामान्य ज्ञान';
    const simpleExplanation = summaryData.knowledge?.simpleExplanation || 'इस घटनाक्रम को समझना महत्वपूर्ण है।';

    return {
      translatedTitle: this.synthesizeDevanagari(cleanTitle),
      summary: {
        summary: this.synthesizeDevanagari(summaryData.summary),
        whatHappened: summaryData.whatHappened
          ? this.synthesizeDevanagari(summaryData.whatHappened)
          : this.synthesizeDevanagari(summaryData.summary),
        whyDidItHappen: summaryData.whyDidItHappen
          ? this.synthesizeDevanagari(summaryData.whyDidItHappen)
          : 'इसका सटीक कारण अभी आधिकारिक स्रोतों द्वारा स्पष्ट नहीं किया गया है।',
        whyItMatters: this.synthesizeDevanagari(summaryData.whyItMatters),
        impact: summaryData.impact
          ? this.synthesizeDevanagari(summaryData.impact)
          : 'यह घटना संबंधित क्षेत्र और सार्वजनिक नीतियों पर महत्वपूर्ण प्रभाव डालती है।',
        background: this.synthesizeDevanagari(summaryData.background),
        keyFacts: summaryData.keyFacts.map((fact) => this.synthesizeDevanagari(fact)),
        easyExplanation: summaryData.easyExplanation
          ? this.synthesizeDevanagari(summaryData.easyExplanation)
          : this.synthesizeDevanagari(simpleExplanation),
        whatNext: summaryData.whatNext
          ? this.synthesizeDevanagari(summaryData.whatNext)
          : 'आधिकारिक स्रोतों से आगामी कदमों और निर्णयों के विवरण की प्रतीक्षा है।',
        knowledge: {
          topic: this.synthesizeDevanagari(topic),
          simpleExplanation: this.synthesizeDevanagari(simpleExplanation),
        },
        confidence: summaryData.confidence || 0.95,
        language: 'hi',
      },
    };
  }

  /**
   * Translates arbitrary text or chat response into Devanagari Hindi.
   */
  static async translateTextToHindi(text: string): Promise<string> {
    if (!text || typeof text !== 'string') return '';
    const cleanText = decodeHtmlEntities(text);

    if (env.OPENAI_API_KEY) {
      try {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'You are a neutral news educator for an Indian audience. Translate the given text into fluent, natural Devanagari Hindi (हिंदी). Maintain factual accuracy and keep proper nouns (like Tesla, Optimus, ISRO, RBI, NASA, Supreme Court) recognizable.',
              },
              { role: 'user', content: cleanText },
            ],
            temperature: 0.2,
            max_tokens: 1200,
          },
          {
            headers: {
              Authorization: `Bearer ${env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );
        const translated = response.data?.choices?.[0]?.message?.content?.trim();
        if (translated) return decodeHtmlEntities(translated);
      } catch (err: any) {
        logger.warn(`OpenAI text Hindi translation failed: ${err.message}`);
      }
    }

    return this.synthesizeDevanagari(cleanText);
  }

  /**
   * Calls OpenAI for structured JSON Hindi translation
   */
  private static async translateWithOpenAI(
    title: string,
    summaryData: StructuredSummaryInput
  ): Promise<{ title: string; summaryData: any } | null> {
    const prompt = `You are an expert bilingual news editor for India.
Translate the following news story into fluent, grammatically accurate Devanagari Hindi (हिंदी) so normal readers can easily understand what happened, why it happened, and why it matters.

RULES:
1. Do NOT produce Roman Hinglish (e.g. "robot growing pains se guzar raha hai" is FORBIDDEN). Use natural Devanagari Hindi (e.g. "रोबोट को विकास के दौरान चुनौतियों का सामना करना पड़ रहा है").
2. Keep standard proper nouns and technical names recognizable (Tesla, Optimus, NASA, ISRO, RBI, OpenAI, Google, Microsoft, Supreme Court).
3. Translate all sections clearly and beginner-friendly.

NEWS TO TRANSLATE:
Title: ${title}
Quick Summary: ${summaryData.summary}
What Happened: ${summaryData.whatHappened || summaryData.summary}
Why Did It Happen: ${summaryData.whyDidItHappen || 'Not explicitly detailed in brief.'}
Why It Matters: ${summaryData.whyItMatters}
Impact: ${summaryData.impact || 'Sectoral impact.'}
Background: ${summaryData.background}
Key Facts: ${JSON.stringify(summaryData.keyFacts)}
Easy Explanation: ${summaryData.easyExplanation || summaryData.knowledge?.simpleExplanation || ''}
What Next: ${summaryData.whatNext || 'Follow-up actions awaited.'}
Knowledge Topic: ${summaryData.knowledge?.topic || ''}
Knowledge Explanation: ${summaryData.knowledge?.simpleExplanation || ''}

Respond ONLY in valid JSON matching this schema:
{
  "title": "हिंदी शीर्षक...",
  "summary": "एक नज़र में (2-3 वाक्य)...",
  "whatHappened": "क्या हुआ (स्पष्ट विवरण)...",
  "whyDidItHappen": "ऐसा क्यों हुआ (ज्ञात कारण या 'सटीक कारण अभी स्पष्ट नहीं है')...",
  "whyItMatters": "यह क्यों महत्वपूर्ण है...",
  "impact": "इसका असर क्या हो सकता है...",
  "background": "पृष्ठभूमि...",
  "keyFacts": ["तथ्य 1...", "तथ्य 2..."],
  "easyExplanation": "आसान भाषा में समझें...",
  "whatNext": "आगे क्या होगा...",
  "knowledge": {
    "topic": "अवधारणा...",
    "simpleExplanation": "सरल व्याख्या..."
  }
}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const parsed = JSON.parse(response.data?.choices?.[0]?.message?.content || '{}');
    if (!parsed.summary || !parsed.whyItMatters) return null;

    return {
      title: decodeHtmlEntities(parsed.title || title),
      summaryData: {
        summary: decodeHtmlEntities(parsed.summary),
        whatHappened: decodeHtmlEntities(parsed.whatHappened || parsed.summary),
        whyDidItHappen: decodeHtmlEntities(parsed.whyDidItHappen || ''),
        whyItMatters: decodeHtmlEntities(parsed.whyItMatters),
        impact: decodeHtmlEntities(parsed.impact || ''),
        background: decodeHtmlEntities(parsed.background || summaryData.background),
        keyFacts: Array.isArray(parsed.keyFacts) ? parsed.keyFacts.map(decodeHtmlEntities) : summaryData.keyFacts,
        easyExplanation: decodeHtmlEntities(parsed.easyExplanation || ''),
        whatNext: decodeHtmlEntities(parsed.whatNext || ''),
        knowledge: {
          topic: decodeHtmlEntities(parsed.knowledge?.topic || summaryData.knowledge?.topic || ''),
          simpleExplanation: decodeHtmlEntities(parsed.knowledge?.simpleExplanation || summaryData.knowledge?.simpleExplanation || ''),
        },
        confidence: summaryData.confidence || 0.95,
      },
    };
  }

  /**
   * Rule-based Devanagari synthesizer that converts English news phrasing to Devanagari Hindi
   */
  static synthesizeDevanagari(text: string): string {
    if (!text || typeof text !== 'string') return '';
    let result = decodeHtmlEntities(text.trim());

    for (const [pattern, replacement] of DEVANAGARI_NEWS_DICTIONARY) {
      result = result.replace(pattern, replacement);
    }

    return result;
  }
}

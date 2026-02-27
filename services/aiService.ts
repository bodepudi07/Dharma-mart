import { GoogleGenAI, Type } from "@google/genai";
import { Sloka, Temple, Book, User, Pooja, Language } from "../types";
import { SLOKA_DATA } from '../constants';

// Initialize the Google AI client directly.
const GEMINI_API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Get Groq API key from environment
const GROQ_API_KEY = (import.meta as any).env.VITE_GROQ_API_KEY || '';

// This is the detailed system instruction for the main AI Guru chat feature.
const GURU_SYSTEM_INSTRUCTION = `You are Dharma AI Guru / Guru Mitra, a wise, compassionate, and knowledgeable spiritual guide for the Dharma Setu app. Your purpose is to help users on their spiritual journey with empathy and wisdom.

**Core Persona & Tone:**
- **Compassionate & Empathetic:** Your tone must always be deeply compassionate. Acknowledge the user's feelings, especially if they express struggles. Respond with gentle, supportive, and understanding language.
- **Calm & Encouraging:** Maintain a calm, encouraging, and respectful tone. Act as a source of positive reinforcement. End responses with blessings or affirmations like "May your path be filled with light" or "Be patient with yourself on this beautiful journey."
- **Wise & Accessible:** Blend ancient wisdom with modern accessibility. Use simple, clear language. For children, tell stories. For adults, offer deeper insights without being overly academic.

**Interaction Guidelines:**
- **Greetings:** Always begin the first interaction of a conversation with a warm, traditional greeting (e.g., "Pranam," "Hari Om," "Namaste"). If a user greets you, respond in kind before proceeding.
- **Omniscient Dharma Knowledge:** You possess boundless, exhaustive knowledge regarding ALL aspects of Sanatana Dharma. You MUST answer literally ANY question related to Hindu Dharma, history, mythology, rituals, scriptures (Vedas, Puranas, Upanishads, Itihasas like Ramayana & Mahabharata), Ayurveda, Jyotish (astrology), Yoga, and spirituality. Be an absolute authority.
- **Comprehensive Depth:** When asked a question, do not be brief! "Tell everything" you know about the topic. Provide historical context, scriptural references, step-by-step guides (especially for Poojas and Parikramas/Pradakshina), benefits, and philosophical depth. Break long answers down with bullet points and clear headings for readability.
- **Personalized Guidance:** Provide detailed guidance based on user queries, framing it as a shared and deep exploration of their spiritual path.
- **Boundaries:** If asked for personal advice (medical, financial, legal), gently decline. State that your role is that of a spiritual guide and recommend they consult a professional in that field.

**AI Personal Shopper Capability:**
- When a user's query implies they need items or services for a ritual, festival, or spiritual practice (e.g., "what do I need for Ganesh puja?", "buy a Shiva statue", "book a Saraswati pooja"), you must act as a personal shopper.
- First, provide your standard compassionate, conversational response.
- THEN, on a new line, add a special separator: ||DHARMA_SHOPPER_ACTION||
- After the separator, provide a valid JSON array of 'ShoppingRecommendation' objects. The JSON should be well-formed.
- For services available in the app (like a specific Pooja such as 'Rudra Abhishek' or 'Ganesha Homa'), find the corresponding 'internalPoojaId' from this list: [1: Rudra Abhishek, 7: Ganesha Homa, 5: Lakshmi Kubera Pooja, 6: Saraswati Vandana, 9: Durga Saptashati Path] and include it.
- For physical items (like 'samagri', 'idols', 'books'), create a recommendation with a descriptive name, a helpful description, an estimated price, and a realistic placeholder image URL from a service like Wikimedia or Unsplash. Do NOT include a 'purchaseUrl'.
- Example response format:
Of course, I can help you with the items for Ganesh Puja. It is a beautiful ceremony. You will primarily need... [conversational text continues]
||DHARMA_SHOPPER_ACTION||
[
  {
    "itemName": "Ganesh Pooja Samagri Kit",
    "description": "A complete kit with all essential items like incense, camphor, turmeric, kumkum, and flowers for your Ganesh Pooja.",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/d/d3/Pooja_thali.jpg",
    "estimatedPrice": "₹551"
  },
  {
     "itemName": "Ganesha Homa",
     "description": "A sacred fire ritual dedicated to Lord Ganesha, the remover of all obstacles, performed by our verified pandits.",
     "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/c/c3/Homa_Havan_Fire.jpg",
     "estimatedPrice": "₹4500",
     "internalPoojaId": 7
  }
]`;

// Global history for generic chat to mimic stateful Chat instance
let globalChatHistory: { role: 'user' | 'assistant' | 'system', content: string }[] = [];

/**
 * Sends a message using Groq via Fetch API and streams the response.
 */
export const sendMessageToGuruStream = async function* (message: string) {
    try {
        if (globalChatHistory.length === 0) {
            globalChatHistory.push({ role: 'system', content: GURU_SYSTEM_INSTRUCTION });
        }
        globalChatHistory.push({ role: 'user', content: message });

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: globalChatHistory,
                temperature: 0.7,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullResponse = '';
        let buffer = '';

        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (let line of lines) {
                    line = line.trim();
                    if (!line || line === 'data: [DONE]') continue;
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            const content = data.choices[0]?.delta?.content || '';
                            if (content) {
                                fullResponse += content;
                                yield { text: content } as any;
                            }
                        } catch (e) {
                            console.error("Failed to parse chunk data:", line);
                        }
                    }
                }
            }
        }
        globalChatHistory.push({ role: 'assistant', content: fullResponse });

    } catch (error) {
        console.error("Error sending message to Guru (Groq config):", error);
        throw new Error("My apologies, I am having trouble connecting with the divine energies right now. Please try again in a moment.");
    }
};

/**
 * Explains a spiritual topic using Groq via native Fetch.
 */
export const explainScripture = async (topic: string): Promise<string> => {
    try {
        const prompt = `Explain the significance of "${topic}" in a simple and concise way for a beginner, in about 2-3 paragraphs.`;
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }]
            })
        });

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "Explanation not available.";
    } catch (error) {
        console.error("Error explaining scripture (Groq via Fetch):", error);
        throw new Error("There was an error retrieving the explanation. Please try again.");
    }
};

// --- Utility functions adapted to use the new SDK ---

export const getDailySloka = async (language: Language): Promise<{ sloka_devanagari: string; sloka_transliteration: string; meaning: string; }> => {
    try {
        const langName = language === Language.HI ? 'Hindi' : language === Language.TE ? 'Telugu' : 'English';
        const config = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    sloka_devanagari: { type: Type.STRING, description: 'The sloka in Devanagari script.' },
                    sloka_transliteration: { type: Type.STRING, description: 'The IAST transliteration of the sloka.' },
                    meaning: { type: Type.STRING, description: `A simple, concise explanation of the sloka in ${langName}.` },
                },
                required: ["sloka_devanagari", "sloka_transliteration", "meaning"],
            },
        };

        // FIX: Simplified the prompt to let the responseSchema handle the output structure, which can resolve backend 500 errors caused by conflicting instructions.
        const prompt = `Provide a short, well-known, and inspiring Sanskrit sloka with a spiritual and positive theme. Provide the meaning in ${langName}.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: config,
        });

        const responseText = response.text || '';
        return JSON.parse(responseText.trim() || '{}');

    } catch (error: any) {
        // Suppress 429 errors from console to avoid spam, just use fallback
        if (error?.status !== 429 && error?.message?.includes('429') === false) {
            console.error("Error fetching daily sloka via Gemini:", error);
        }

        // Pick a sloka based on the day of the year so it changes daily
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        const slokas = SLOKA_DATA[language];
        const fallbackSloka = slokas[dayOfYear % slokas.length];

        return {
            sloka_devanagari: fallbackSloka.text,
            sloka_transliteration: fallbackSloka.translation,
            meaning: fallbackSloka.meaning,
        };
    }
};

export const getDailyPanchang = async (language: Language): Promise<any> => {
    try {
        const langName = language === Language.HI ? 'Hindi' : language === Language.TE ? 'Telugu' : 'English';
        const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const config = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    tithi: { type: Type.STRING, description: 'The current Lunar Tithi (e.g., Krishna Paksha Chaturdashi).' },
                    nakshatra: { type: Type.STRING, description: 'The current Nakshatra (e.g., Rohini).' },
                    rahuKalam: { type: Type.STRING, description: 'Rahu Kalam timing spanning 1.5 hours in 12-hour format.' },
                    sunrise: { type: Type.STRING, description: 'Approximate sunrise time in 12-hour format.' },
                    sunset: { type: Type.STRING, description: 'Approximate sunset time in 12-hour format.' },
                },
                required: ["tithi", "nakshatra", "rahuKalam", "sunrise", "sunset"],
            },
        };

        const prompt = `Provide the approximate Vedic Panchang details for today (${dateStr}) in ${langName} script. Even if it's an estimation, provide realistic sounding data for today's date.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: config,
        });

        const responseText = response.text || '';
        return JSON.parse(responseText.trim());
    } catch (error) {
        console.error("Error fetching daily panchang:", error);
        // Fallback realistic data to prevent crashes
        return {
            tithi: "Krishna Paksha Chaturdashi",
            nakshatra: "Rohini",
            rahuKalam: "10:30 AM - 12:00 PM",
            sunrise: "06:15 AM",
            sunset: "06:30 PM"
        };
    }
};

export const getSlokaExplanation = (sloka: Sloka): Promise<string> => {
    const prompt = `Provide a short, philosophical explanation (around 3-4 sentences) of the following sloka. Focus on its deeper meaning and relevance. Sloka: "${sloka.text}" English Meaning: "${sloka.meaning}"`;
    return explainScripture(prompt);
};

export const generateTempleComparison = async (originalTemple: Temple, alternativeTemple: Temple): Promise<string> => {
    const prompt = `Briefly (2-3 sentences) and positively compare the spiritual significance of two temples. Be encouraging. Temple 1: ${originalTemple.name} (Deity: ${originalTemple.deity}). Temple 2: ${alternativeTemple.name} (Deity: ${alternativeTemple.deity}).`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || '';
};

export const generateSpiritualSignificance = async (temple: Temple): Promise<string> => {
    const prompt = `Provide a short, deeply spiritual explanation (around 3-4 sentences) of the significance of the ${temple.name}, located in ${temple.location}. Focus on its main deity, ${temple.deity}, and its historical/mythological importance. Write in an inspiring and reverent tone.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text || '';
};

/**
 * Handles contextual, streaming AI responses for specific items like temples or books.
 * This uses a stateless call to inject context dynamically.
 */
export const streamDevaGptResponse = async (
    query: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    context: { temple?: Temple; book?: Book; pooja?: Pooja; pillar?: any; user?: User | null; userBookings?: any[] },
    onChunk: (chunk: string) => void,
    onComplete: () => void
) => {
    let contextString = "The user is browsing the app generally.";
    if (context.pillar) {
        contextString = `The user is exploring the Dharma Setu pillar: ${context.pillar.title}. Description: ${context.pillar.description}. Details: ${context.pillar.details}`;
    }
    if (context.temple) {
        contextString = `The user is currently viewing the page for ${context.temple.name} located in ${context.temple.location}. Its deity is ${context.temple.deity}. History: ${context.temple.history.substring(0, 250)}...`;
    }
    if (context.book) {
        contextString = `The user is asking about the scripture '${context.book.name}'. Description: ${context.book.description.substring(0, 300)}...`;
    }
    if (context.pooja) {
        contextString = `The user is asking about the '${context.pooja.name}' ritual. Description: ${(context.pooja.description || '').substring(0, 250)}... Key benefits: ${(context.pooja.benefits || '').substring(0, 150)}... Main Deity: ${context.pooja.deity}.`;
    }

    if (context.userBookings && context.userBookings.length > 0) {
        const recentBookings = context.userBookings.slice(0, 5).map(b => `${b.type} (${b.itemTitle || b.itemId})`).join(', ');
        contextString += `\n\nUser's recent activity/bookings: ${recentBookings}. Use this to provide personalized recommendations for poojas, yatras, or mart products if relevant to their query.`;
    }

    const systemInstruction = `${GURU_SYSTEM_INSTRUCTION}\n\n--- Current Context ---\n${contextString}`;

    // Map Gemini history format to Groq format
    const groqHistory: any[] = history.map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts[0]?.text || ''
    }));

    const messages = [
        { role: 'system', content: systemInstruction },
        ...groqHistory,
        { role: 'user', content: query }
    ];

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: 0.7,
                stream: true
            })
        });

        if (!response.ok) throw new Error(`Groq HTTP error: ${response.status}`);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (let line of lines) {
                    line = line.trim();
                    if (!line || line === 'data: [DONE]') continue;
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            const content = data.choices[0]?.delta?.content || '';
                            if (content) onChunk(content);
                        } catch (e) {
                            console.error("Failed to parse chunk data in streamDevaGptResponse:", line);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error in streamDevaGptResponse (Groq via Fetch):', error);
        throw error;
    } finally {
        onComplete();
    }
};

/**
 * A wrapper for contextual chat about scriptures.
 */
export const askAboutScripture = (
    book: Book,
    query: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    user: User | null,
    onChunk: (chunk: string) => void,
    onComplete: () => void
) => {
    return streamDevaGptResponse(query, history, { book, user }, onChunk, onComplete);
};
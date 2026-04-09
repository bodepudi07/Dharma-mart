import { Sloka, Temple, Book, User, Pooja, Language } from "../types";
import { SLOKA_DATA } from '../constants';

// ============================================================================
// LOCAL KNOWLEDGE BASE — No external AI API dependency
// Uses bundled spiritual data (Vedas, Gita, Upanishads, 161 scripture files)
// ============================================================================

interface KnowledgeTopic {
    keywords: string[];
    responses: string[];
}

interface KnowledgeBase {
    greetings: string[];
    off_topic_response: string;
    topics: KnowledgeTopic[];
    panchang_data: { tithi: string; nakshatra: string; rahuKalam: string; sunrise: string; sunset: string }[];
    scripture_explanations: Record<string, string>;
    temple_significance: { default: string };
}

interface PoojaMatchResult {
    pooja: Pooja;
    score: number;
}

type ResponseLocale = 'en' | 'te' | 'hi';

let _knowledgeBase: KnowledgeBase | null = null;
let _knowledgeBasePromise: Promise<KnowledgeBase> | null = null;
let _poojaCatalog: Pooja[] | null = null;
let _poojaCatalogPromise: Promise<Pooja[]> | null = null;

const loadKnowledgeBase = async (): Promise<KnowledgeBase> => {
    if (_knowledgeBase) return _knowledgeBase;
    if (_knowledgeBasePromise) return _knowledgeBasePromise;

    _knowledgeBasePromise = fetch('/data/spiritual_knowledge.json')
        .then(res => res.json())
        .then((data: KnowledgeBase) => {
            _knowledgeBase = data;
            return data;
        });

    return _knowledgeBasePromise;
};

const loadPoojaCatalog = async (): Promise<Pooja[]> => {
    if (_poojaCatalog) return _poojaCatalog;
    if (_poojaCatalogPromise) return _poojaCatalogPromise;

    _poojaCatalogPromise = fetch('/data/poojas.json')
        .then(res => res.json())
        .then((data: Pooja[]) => {
            _poojaCatalog = data;
            return data;
        })
        .catch(() => []);

    return _poojaCatalogPromise;
};

const normalize = (text: string): string => text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const detectResponseLocale = (query: string): ResponseLocale => {
    if (/[\u0C00-\u0C7F]/.test(query)) return 'te';
    if (/[\u0900-\u097F]/.test(query)) return 'hi';

    const lower = query.toLowerCase();
    const teHints = ['telugu', 'దయచేసి', 'తెలుగు'];
    const hiHints = ['hindi', 'हिंदी', 'कृपया'];

    if (teHints.some(h => lower.includes(h))) return 'te';
    if (hiHints.some(h => lower.includes(h))) return 'hi';
    return 'en';
};

const localizedText = {
    en: {
        source: 'Source: Dharma Setu Local Ritual Dataset',
        mode: 'Mode: Spiritual Guidance + Structured Steps',
        snapshot: 'Ritual Snapshot',
        benefits: 'Purpose and Benefits',
        samagri: 'Samagri (Materials)',
        flow: 'Execution Flow',
        prep: 'Preparation Protocol',
        next: 'Next Smart Questions',
        book: 'You can book this ritual directly from the Pooja Services section. 🙏',
        listTitle: 'Ritual Intelligence Hub (Local Data)',
        listIntro: (count: number) => `I can guide you through **${count} rituals** in your Dharma Setu catalog.`,
        promptExamples: 'Ask me naturally like: "How is Ganesha Homa done?", "Which pooja for graha dosha?", or "Best ritual before entering new house?" 🙏',
    },
    te: {
        source: 'Source: Dharma Setu స్థానిక పూజా డేటా',
        mode: 'Mode: ఆధ్యాత్మిక మార్గదర్శకం + నిర్మిత దశలు',
        snapshot: 'పూజా సారాంశం',
        benefits: 'లక్ష్యం మరియు ఫలితాలు',
        samagri: 'సామగ్రి',
        flow: 'విధానం',
        prep: 'ముందస్తు సిద్ధత',
        next: 'తర్వాత అడగాల్సిన ప్రశ్నలు',
        book: 'ఈ పూజను మీరు పూజా సర్వీసెస్ విభాగం నుండే బుక్ చేసుకోవచ్చు. 🙏',
        listTitle: 'Ritual Intelligence Hub (స్థానిక డేటా)',
        listIntro: (count: number) => `మీ Dharma Setu కాటలాగ్‌లోని **${count} పూజల** గురించి నేను మార్గదర్శనం చేయగలను.`,
        promptExamples: 'ఇలా అడగండి: "గణేశ హోమం ఎలా చేస్తారు?", "గ్రహ దోషానికి ఏ పూజ?", లేదా "కొత్త ఇంటికి ముందు ఏ పూజ చేయాలి?" 🙏',
    },
    hi: {
        source: 'Source: Dharma Setu स्थानीय पूजा डेटा',
        mode: 'Mode: आध्यात्मिक मार्गदर्शन + संरचित चरण',
        snapshot: 'अनुष्ठान सारांश',
        benefits: 'उद्देश्य और लाभ',
        samagri: 'सामग्री',
        flow: 'विधि',
        prep: 'पूर्व तैयारी',
        next: 'आगे पूछने योग्य प्रश्न',
        book: 'आप इस पूजा को पूजा सर्विसेज सेक्शन से सीधे बुक कर सकते हैं। 🙏',
        listTitle: 'Ritual Intelligence Hub (स्थानीय डेटा)',
        listIntro: (count: number) => `मैं आपके Dharma Setu कैटलॉग में उपलब्ध **${count} अनुष्ठानों** पर मार्गदर्शन दे सकता हूँ।`,
        promptExamples: 'ऐसे पूछें: "गणेश होम कैसे किया जाता है?", "ग्रह दोष के लिए कौन-सी पूजा?", या "नए घर में प्रवेश से पहले कौन-सी पूजा करें?" 🙏',
    }
} as const;

const uniqueTokens = (text: string): string[] => {
    return Array.from(new Set(normalize(text).split(' ').filter(t => t.length > 2)));
};

// Greeting detection
const isGreeting = (text: string): boolean => {
    const greetings = ['hello', 'hi', 'hey', 'namaste', 'pranam', 'namaskar', 'hari om', 'om', 'greetings', 'good morning', 'good evening', 'howdy', 'hare krishna', 'jai', 'नमस्ते', 'प्रणाम', 'నమస్తే'];
    const lower = text.toLowerCase().trim();
    return greetings.some(g => lower === g || lower.startsWith(g + ' ') || lower.startsWith(g + ',') || lower.startsWith(g + '!'));
};

// Off-topic detection
const isDharmaRelated = (text: string): boolean => {
    const dharmaKeywords = [
        'god', 'temple', 'mandir', 'pooja', 'puja', 'prayer', 'meditat', 'yoga', 'chakra', 'mantra',
        'karma', 'dharma', 'moksha', 'veda', 'gita', 'upanishad', 'purana', 'rama', 'krishna', 'shiva',
        'vishnu', 'hanuman', 'ganesh', 'durga', 'lakshmi', 'saraswati', 'devi', 'shakti', 'brahman',
        'atman', 'soul', 'spirit', 'sacred', 'holy', 'divine', 'ritual', 'worship', 'bhakti', 'jnana',
        'festival', 'diwali', 'navratri', 'holi', 'guru', 'saint', 'ashram', 'shloka', 'sloka',
        'sanskrit', 'chant', 'om', 'aum', 'havan', 'homa', 'yajna', 'yagna', 'ayurveda', 'pandit',
        'priest', 'pilgrimage', 'yatra', 'darshan', 'prasad', 'aarti', 'kirtan', 'bhajan', 'seva',
        'dharmic', 'sattvic', 'samskara', 'death', 'rebirth', 'reincarnation', 'afterlife',
        'marriage', 'vivah', 'food', 'fasting', 'vrat', 'ekadashi', 'panchang', 'tithi',
        'nakshatra', 'science', 'ancient', 'vedic', 'stress', 'anxiety', 'peace', 'calm',
        'suffering', 'pain', 'fear', 'anger', 'child', 'parent', 'family', 'blessing',
        'meaning', 'purpose', 'life', 'kundalini', 'tantra', 'liberation', 'enlighten',
        'book', 'scripture', 'text', 'teaching', 'wisdom', 'knowledge',
        'मंदिर', 'पूजा', 'ध्यान', 'कर्म', 'धर्म', 'गीता', 'वेद', 'कृष्ण', 'शिव', 'राम',
        'దేవాలయం', 'పూజ', 'ధ్యానం', 'కర్మ', 'ధర్మం', 'గీత', 'వేదం', 'కృష్ణ', 'శివ', 'రామ'
    ];
    const lower = text.toLowerCase();
    return dharmaKeywords.some(k => lower.includes(k));
};

const findTopTopicsMatch = (query: string, topics: KnowledgeTopic[], limit: number = 2): KnowledgeTopic[] => {
    const lower = normalize(query);
    const scoredTopics = topics.map(topic => {
        let score = 0;
        for (const keyword of topic.keywords) {
            if (lower.includes(keyword.toLowerCase())) {
                score += keyword.length;
            } else if (levenshteinDistance(lower, keyword.toLowerCase()) <= 1) { // Fuzzy matching for typos
                score += keyword.length - 1;
            }
        }
        return { topic, score };
    }).filter(item => item.score > 0);

    return scoredTopics.sort((a, b) => b.score - a.score).slice(0, limit).map(item => item.topic);
};

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const isRitualQuery = (query: string): boolean => {
    const q = normalize(query);
    const ritualWords = [
        'pooja', 'puja', 'homa', 'havan', 'yajna', 'yagna', 'abhishek', 'path', 'parayan',
        'shanti', 'dosh', 'vrat', 'samskara', 'ceremony', 'ritual', 'ganesh', 'ganesha',
        'shiva', 'durga', 'hanuman', 'satyanarayan', 'lakshmi', 'navagraha', 'rudra', 'gayatri'
    ];
    return ritualWords.some(word => q.includes(word));
};

const isRitualCatalogQuery = (query: string): boolean => {
    const q = normalize(query);
    return (
        (q.includes('all') || q.includes('list') || q.includes('available')) &&
        (q.includes('pooja') || q.includes('puja') || q.includes('homa') || q.includes('yajna') || q.includes('ritual'))
    );
};

const isTaskPlannerQuery = (query: string): boolean => {
    const q = normalize(query);
    const taskWords = [
        'task', 'plan', 'routine', 'schedule', 'daily', 'sadhana', 'practice', 'tracker',
        'meditate', 'meditation', 'minutes', 'sloka', 'shloka', 'padyam', 'padya', 'chant',
        'learn', 'study', 'goal', 'habit', 'progress', 'reminder',
        'ధ్యానం', 'శ్లోకం', 'పద్యం', 'పూజ', 'साधना', 'ध्यान', 'श्लोक', 'पद्य'
    ];
    return taskWords.some(word => q.includes(word));
};

const isSpellingHelpQuery = (query: string): boolean => {
    const q = normalize(query);
    const words = ['spell', 'spelling', 'pronounce', 'pronunciation', 'correct word', 'how to say', 'ఉచ్చారణ', 'स्पेल', 'उच्चारण'];
    return words.some(word => q.includes(word));
};

const SPIRITUAL_TERMS: Array<{ canonical: string; variants: string[]; pronunciation: string; meaning: string }> = [
    { canonical: 'Ganesha Puja', variants: ['ganesh pooja', 'ganesha pooja', 'ganesh puja', 'ganesha puja'], pronunciation: 'Ga-NE-sha Poo-ja', meaning: 'Worship of Lord Ganesha for obstacle removal.' },
    { canonical: 'Rudra Abhisheka', variants: ['rudrabhishek', 'rudra abhishek', 'rudra abhishekam'], pronunciation: 'Rood-ra Ab-hi-SHE-ka', meaning: 'Sacred Shiva ritual with abhisheka offerings.' },
    { canonical: 'Maha Mrityunjaya Japa', variants: ['maha mrityunjaya jap', 'mrityunjaya jaap', 'mrutyunjaya'], pronunciation: 'Ma-haa Mri-tyoon-ja-ya Ja-pa', meaning: 'Powerful Shiva mantra chanting for healing and protection.' },
    { canonical: 'Satyanarayana Puja', variants: ['satyanarayan pooja', 'satyanarayana pooja', 'satyanarayan puja'], pronunciation: 'Sat-ya-na-RA-ya-na Poo-ja', meaning: 'Vishnu worship for prosperity and harmony.' },
    { canonical: 'Navagraha Shanti Puja', variants: ['navgraha pooja', 'navagraha pooja', 'navagraha shanti'], pronunciation: 'Na-va-gra-ha Shaan-ti Poo-ja', meaning: 'Ritual for balancing planetary influences.' },
    { canonical: 'Gayatri Havan', variants: ['gayathri homam', 'gayatri homa', 'gayatri havan'], pronunciation: 'Gaa-ya-tree Ha-van', meaning: 'Fire ritual centered on the Gayatri mantra.' },
    { canonical: 'Sudarshana Homa', variants: ['sudarshan homam', 'sudarshana homam', 'sudarshan homa'], pronunciation: 'Su-dar-sha-na Ho-ma', meaning: 'Vishnu fire ritual for protection and negativity removal.' },
    { canonical: 'Dhyana', variants: ['dhyan', 'dyaan', 'dhyanam', 'meditation'], pronunciation: 'Dhyaa-na', meaning: 'Meditative absorption and inner stillness.' },
    { canonical: 'Shloka', variants: ['sloka', 'shlok', 'slokam'], pronunciation: 'Shlo-ka', meaning: 'Sacred verse from scripture.' },
    { canonical: 'Padya', variants: ['padyam', 'padyam', 'padhya'], pronunciation: 'Pa-dya', meaning: 'Poetic devotional verse form.' },
    { canonical: 'Pranayama', variants: ['pranayam', 'pranayaam', 'pranayama'], pronunciation: 'Pra-na-yaa-ma', meaning: 'Yogic breath discipline.' },
    { canonical: 'Sankalpa', variants: ['sankalp', 'sankalpam', 'sankalpa'], pronunciation: 'San-kal-pa', meaning: 'Sacred intention before ritual/practice.' },
];

const levenshteinDistance = (a: string, b: string): number => {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;

    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            );
        }
    }
    return dp[m][n];
};

const bestSpiritualTermMatch = (query: string): { term: (typeof SPIRITUAL_TERMS)[number]; score: number } | null => {
    const q = normalize(query);
    let best: { term: (typeof SPIRITUAL_TERMS)[number]; score: number } | null = null;

    for (const term of SPIRITUAL_TERMS) {
        const candidates = [term.canonical, ...term.variants].map(normalize);
        let termScore = 0;

        for (const candidate of candidates) {
            if (q.includes(candidate) || candidate.includes(q)) {
                termScore = Math.max(termScore, 100);
            } else {
                const distance = levenshteinDistance(q, candidate);
                const maxLen = Math.max(q.length, candidate.length) || 1;
                const similarity = Math.round((1 - distance / maxLen) * 100);
                termScore = Math.max(termScore, similarity);
            }
        }

        if (!best || termScore > best.score) {
            best = { term, score: termScore };
        }
    }

    if (!best || best.score < 45) return null;
    return best;
};

const buildSpellingCoachResponse = (query: string, locale: ResponseLocale): string => {
    const match = bestSpiritualTermMatch(query);
    if (!match) {
        return locale === 'te'
            ? 'నేను సరిగా గుర్తించలేకపోయాను. మీరు spell చేయాలనుకుంటున్న పదాన్ని మళ్ళీ పంపండి. ఉదాహరణ: "spell ganesh pooja" లేదా "pronounce rudrabhishek".'
            : locale === 'hi'
                ? 'मैं शब्द सही पहचान नहीं पाया। कृपया शब्द दोबारा लिखें। उदाहरण: "spell ganesh pooja" या "pronounce rudrabhishek"।'
                : 'I could not identify the exact term. Please send the word again, like: "spell ganesh pooja" or "pronounce rudrabhishek".';
    }

    const { term } = match;
    if (locale === 'te') {
        return [
            `**Spelling Coach: ${term.canonical}**`,
            '',
            `- Correct Spelling: **${term.canonical}**`,
            `- Pronunciation: **${term.pronunciation}**`,
            `- Meaning: ${term.meaning}`,
            '',
            'Practice tip: 5 సార్లు నెమ్మదిగా చదవండి, తరువాత 5 సార్లు సహజ వేగంతో పలకండి.',
            'మీకు కావాలంటే నేను syllable-by-syllable breakdown కూడా ఇస్తాను. 🙏'
        ].join('\n');
    }

    if (locale === 'hi') {
        return [
            `**Spelling Coach: ${term.canonical}**`,
            '',
            `- Correct Spelling: **${term.canonical}**`,
            `- Pronunciation: **${term.pronunciation}**`,
            `- Meaning: ${term.meaning}`,
            '',
            'Practice tip: पहले 5 बार धीरे बोलें, फिर 5 बार सामान्य गति से बोलें।',
            'चाहें तो मैं syllable-by-syllable breakdown भी दे सकता हूँ। 🙏'
        ].join('\n');
    }

    return [
        `**Spelling Coach: ${term.canonical}**`,
        '',
        `- Correct Spelling: **${term.canonical}**`,
        `- Pronunciation: **${term.pronunciation}**`,
        `- Meaning: ${term.meaning}`,
        '',
        'Practice tip: say it slowly 5 times, then in natural pace 5 times.',
        'If you want, I can also give letter-by-letter chanting style pronunciation. 🙏'
    ].join('\n');
};

const extractMeditationMinutes = (query: string): number | null => {
    const lower = query.toLowerCase();
    const minuteMatch = lower.match(/(\d{1,3})\s*(min|mins|minute|minutes)/i);
    if (minuteMatch) return parseInt(minuteMatch[1], 10);

    const directNumber = lower.match(/\b(5|10|15|20|25|30|40|45|60)\b/);
    if (directNumber) return parseInt(directNumber[1], 10);

    return null;
};

const hasSlokaLearningIntent = (query: string): boolean => {
    const q = normalize(query);
    const words = ['sloka', 'shloka', 'padya', 'padyam', 'padya', 'chant', 'memorize', 'learn verse', 'శ్లోకం', 'పద్యం', 'श्लोक', 'पद्य'];
    return words.some(word => q.includes(word));
};

const buildTaskIntakeResponse = (locale: ResponseLocale): string => {
    if (locale === 'te') {
        return [
            '**Spiritual Task Coach ప్రారంభం**',
            '',
            'మీ ఆధ్యాత్మిక టాస్క్ ప్లాన్‌ను సెట్ చేద్దాం. దయచేసి ఈ వివరాలు చెప్పండి:',
            '1. రోజుకు ఎన్ని నిమిషాలు ధ్యానం చేయగలరు? (ఉదా: 10, 20, 30)',
            '2. మీరు శ్లోకాలు/పద్యాలు నేర్చుకోవాలనుకుంటున్నారా? (అవును/కాదు)',
            '3. ఉదయం లేదా సాయంత్రం ఏ టైమ్ మీకు బెస్ట్?',
            '4. మీరు రోజువారీ, వారానికి, లేదా వీకెండ్ ప్లాన్ కావాలా?',
            '',
            'మీ సమాధానం ఇచ్చిన వెంటనే నేను వ్యక్తిగత సాదన ప్లాన్ ఇస్తాను. 🙏'
        ].join('\n');
    }

    if (locale === 'hi') {
        return [
            '**Spiritual Task Coach शुरू**',
            '',
            'आपका व्यक्तिगत आध्यात्मिक टास्क प्लान सेट करते हैं। कृपया बताइए:',
            '1. आप रोज कितने मिनट ध्यान कर सकते हैं? (उदा: 10, 20, 30)',
            '2. क्या आप श्लोक/पद्य सीखना चाहते हैं? (हाँ/नहीं)',
            '3. सुबह या शाम कौन-सा समय आपके लिए बेहतर है?',
            '4. आपको daily, weekly, या weekend plan चाहिए?',
            '',
            'आपके उत्तर मिलते ही मैं आपकी personalized sadhana plan दूंगा। 🙏'
        ].join('\n');
    }

    return [
        '**Spiritual Task Coach Started**',
        '',
        'Let us set your personal spiritual task plan. Please share:',
        '1. How many minutes can you meditate daily? (e.g., 10, 20, 30)',
        '2. Do you want to learn slokas/padyas? (yes/no)',
        '3. Which is better for you: morning or evening?',
        '4. Do you want a daily, weekly, or weekend plan?',
        '',
        'Once you reply, I will generate your personalized sadhana routine. 🙏'
    ].join('\n');
};

const buildPersonalTaskPlan = (query: string, locale: ResponseLocale): string => {
    const minutes = extractMeditationMinutes(query) ?? 15;
    const wantsSloka = hasSlokaLearningIntent(query);

    const pranayama = Math.max(2, Math.round(minutes * 0.2));
    const dhyana = Math.max(5, Math.round(minutes * 0.6));
    const reflection = Math.max(2, minutes - pranayama - dhyana);

    const slokaBlock = wantsSloka
        ? [
            '',
            '**Sloka/Padya Learning Track**',
            '- Pick 1 short sloka for 7 days (repeat daily).',
            '- Day 1-2: Listen and repeat 11 times.',
            '- Day 3-4: Split by lines and memorize with meaning.',
            '- Day 5-6: Recite without seeing text (3 rounds).',
            '- Day 7: Recite to family/friend and note confidence score (1-10).'
        ]
        : [];

    if (locale === 'te') {
        return [
            '**మీ వ్యక్తిగత Spiritual Task Plan**',
            '',
            `మీ సమయానికి అనుగుణంగా రోజుకు **${minutes} నిమిషాల** ప్లాన్:`,
            `- ప్రాణాయామం: ${pranayama} నిమిషాలు`,
            `- ధ్యానం: ${dhyana} నిమిషాలు`,
            `- జర్నలింగ్/ఆత్మపరిశీలన: ${reflection} నిమిషాలు`,
            ...slokaBlock,
            '',
            '**Weekly Discipline**',
            '- 6 రోజులు సాధన + 1 రోజు రివ్యూ.',
            '- ప్రతి వారాంతంలో మీ స్ట్రీక్ మరియు మూడ్ ట్రాక్ చేయండి.',
            '',
            'మరింత కస్టమైజ్ చేయాలంటే: మీ టైమ్ (మార్నింగ్/ఈవెనింగ్) మరియు లెవల్ (బిగినర్/ఇంటర్మీడియట్) చెప్పండి. 🙏'
        ].join('\n');
    }

    if (locale === 'hi') {
        return [
            '**आपका Personalized Spiritual Task Plan**',
            '',
            `आपके समय के अनुसार रोज़ का **${minutes} मिनट** प्लान:`,
            `- प्राणायाम: ${pranayama} मिनट`,
            `- ध्यान: ${dhyana} मिनट`,
            `- जर्नलिंग/चिंतन: ${reflection} मिनट`,
            ...slokaBlock,
            '',
            '**Weekly Discipline**',
            '- 6 दिन साधना + 1 दिन समीक्षा।',
            '- हर सप्ताह के अंत में streak और mood track करें।',
            '',
            'और customize करने के लिए अपना समय (morning/evening) और level (beginner/intermediate) बताइए। 🙏'
        ].join('\n');
    }

    return [
        '**Your Personalized Spiritual Task Plan**',
        '',
        `Based on your input, here is your **${minutes}-minute daily** routine:`,
        `- Pranayama: ${pranayama} min`,
        `- Meditation: ${dhyana} min`,
        `- Reflection/Journaling: ${reflection} min`,
        ...slokaBlock,
        '',
        '**Weekly Discipline**',
        '- 6 practice days + 1 review day.',
        '- Track your streak and peace score weekly.',
        '',
        'If you want, I can now generate a strict morning-only or evening-only task schedule for you. 🙏'
    ].join('\n');
};

const scorePoojaMatch = (query: string, pooja: Pooja): number => {
    const q = normalize(query);
    const name = normalize(pooja.name || '');
    const deity = normalize(pooja.deity || '');
    const benefits = normalize(pooja.benefits || '');
    const serviceType = normalize(pooja.serviceType || '');

    let score = 0;

    if (q.includes(name)) score += 50;
    if (name.includes(q)) score += 35;
    if (deity && q.includes(deity)) score += 30;

    const qTokens = uniqueTokens(q);
    const pTokens = new Set([...uniqueTokens(name), ...uniqueTokens(deity), ...uniqueTokens(benefits), ...uniqueTokens(serviceType)]);
    qTokens.forEach(token => {
        if (pTokens.has(token)) score += 6;
    });

    if ((q.includes('ganesh') || q.includes('ganesha')) && deity.includes('ganesha')) score += 30;
    if (q.includes('shiva') && deity.includes('shiva')) score += 20;
    if (q.includes('durga') && deity.includes('durga')) score += 20;
    if (q.includes('hanuman') && deity.includes('hanuman')) score += 20;

    if ((q.includes('homa') || q.includes('havan')) && (name.includes('homa') || name.includes('havan'))) score += 15;
    if (q.includes('pooja') && name.includes('pooja')) score += 10;

    return score;
};

const findBestPoojaMatch = (query: string, poojas: Pooja[]): PoojaMatchResult | null => {
    if (!poojas.length) return null;

    let best: PoojaMatchResult | null = null;
    for (const pooja of poojas) {
        const score = scorePoojaMatch(query, pooja);
        if (!best || score > best.score) {
            best = { pooja, score };
        }
    }

    if (!best || best.score < 18) return null;
    return best;
};

const findTopPoojaMatches = (query: string, poojas: Pooja[], limit: number = 3): PoojaMatchResult[] => {
    return poojas
        .map(pooja => ({ pooja, score: scorePoojaMatch(query, pooja) }))
        .filter(item => item.score >= 10)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
};

const scoreToConfidence = (score: number): { label: string; percent: number } => {
    const normalized = Math.max(35, Math.min(98, 35 + score));
    if (normalized >= 85) return { label: 'High', percent: normalized };
    if (normalized >= 70) return { label: 'Medium', percent: normalized };
    return { label: 'Low', percent: normalized };
};

const buildRitualCatalogResponse = (poojas: Pooja[], locale: ResponseLocale): string => {
    const l = localizedText[locale];
    const grouped = {
        poojas: poojas.filter(p => /pooja|puja/i.test(p.name)).slice(0, 8),
        homas: poojas.filter(p => /homa|havan/i.test(p.name)).slice(0, 8),
        samskaras: poojas.filter(p => /samskara|ceremony|namakarana|annaprashana|vivah/i.test(p.name)).slice(0, 8),
    };

    const line = (p: Pooja) => `- **${p.name}** (${p.duration || 'Varies'}, ₹${p.cost || 'N/A'})`;

    return [
        `**${l.listTitle}**`,
        '',
        l.listIntro(poojas.length),
        '',
        '**Popular Poojas:**',
        ...grouped.poojas.map(line),
        '',
        '**Homas / Havans:**',
        ...grouped.homas.map(line),
        '',
        '**Samskaras / Life Ceremonies:**',
        ...grouped.samskaras.map(line),
        '',
        l.promptExamples
    ].join('\n');
};

const buildDetailedPoojaAnswer = (
    pooja: Pooja,
    locale: ResponseLocale,
    matchScore: number,
    related: Pooja[]
): string => {
    const l = localizedText[locale];
    const confidence = scoreToConfidence(matchScore);
    const sections: string[] = [];
    sections.push(`**Ritual Intelligence: ${pooja.name}**`);
    sections.push('');
    sections.push(`\`${l.source}\``);
    sections.push(`\`${l.mode}\``);
    sections.push(`\`Confidence: ${confidence.label} (${confidence.percent}%)\``);
    sections.push('');
    sections.push(pooja.description || 'A sacred ritual performed with devotion in the Vedic tradition.');
    sections.push('');

    sections.push(`**${l.snapshot}**`);
    if (pooja.deity) sections.push(`- Presiding Deity: ${pooja.deity}`);
    if (pooja.duration) sections.push(`- Typical Duration: ${pooja.duration}`);
    if (pooja.cost) sections.push(`- Suggested Dakshina in App: ₹${pooja.cost}`);
    if (pooja.serviceType) sections.push(`- Service Type: ${pooja.serviceType}`);

    sections.push('');
    sections.push(`**${l.benefits}**`);
    sections.push(pooja.benefits || 'Purification of mind, removal of obstacles, and divine grace through sincere sankalpa.');

    if (pooja.samagri) {
        sections.push('');
        sections.push(`**${l.samagri}**`);
        sections.push(pooja.samagri);
    }

    if (pooja.procedure) {
        sections.push('');
        sections.push(`**${l.flow}**`);
        sections.push(pooja.procedure);
    }

    sections.push('');
    sections.push(`**${l.prep}**`);
    sections.push('- Take a clean bath and wear fresh traditional clothes.');
    sections.push('- Keep sankalpa clear: what blessing or shanti you are praying for.');
    sections.push('- Maintain sattvic food and calm mind before the ritual when possible.');

    sections.push('');
    sections.push(`**${l.next}**`);
    sections.push('- Ask: "Give me home version steps for this ritual."');
    sections.push('- Ask: "Tell me ideal time and day for this pooja."');
    sections.push('- Ask: "Explain this ritual in simple Telugu/Hindi."');

    sections.push('');
    sections.push(l.book);

    if (related.length > 0) {
        sections.push('');
        sections.push('**Related Rituals You May Ask Next**');
        related.slice(0, 3).forEach((r) => {
            sections.push(`- ${r.name} (${r.deity || 'Sacred Ritual'})`);
        });
    }

    sections.push(`\n||DHARMA_SHOPPER_ACTION||\n[{"itemName":"${pooja.name}","description":"${(pooja.description || '').substring(0, 100)}","estimatedPrice":"₹${pooja.cost || 500}","internalPoojaId":${pooja.id}}]`);

    return sections.join('\n');
};

const buildRitualClarificationResponse = (query: string, suggestions: PoojaMatchResult[], locale: ResponseLocale): string => {
    const l = localizedText[locale];
    const lines = suggestions.map((s, i) => `${i + 1}. **${s.pooja.name}** (${s.pooja.deity || 'Sacred Ritual'})`);
    return [
        `I found multiple close ritual matches for: "${query}".`,
        '',
        `\`${l.source}\``,
        '',
        '**Did you mean:**',
        ...lines,
        '',
        'Reply with the exact ritual name, and I will provide full details: purpose, samagri, procedure, timing, and benefits. 🙏'
    ].join('\n');
};

// Build contextual response for temples
const buildTempleResponse = (temple: Temple): string => {
    return `**${temple.name}** — ${temple.location}\n\n${temple.history.substring(0, 500)}\n\n**Main Deity:** ${temple.deity}\n\nThis sacred temple is a living center of divine energy, built according to ancient Agama Shastra principles. Every visit is an opportunity for spiritual upliftment. You can book darshan or explore nearby temples in the app. 🙏`;
};

// Build contextual response for books
const buildBookResponse = (book: Book): string => {
    return `**${book.name}**\n\n${book.description}\n\nThis is part of our extensive collection of sacred texts. You can read the full content in our Knowledge section. The study of scriptures is considered one of the highest forms of spiritual practice. As the Taittiriya Upanishad says: *"Svadhyayan ma pramadah"* — Do not neglect the study of sacred texts. 🙏`;
};

// Build contextual response for poojas
const buildPoojaResponse = (pooja: Pooja): string => {
    let response = `**${pooja.name}**\n\n${pooja.description || 'A sacred ritual performed with devotion.'}\n\n`;
    if (pooja.deity) response += `**Deity:** ${pooja.deity}\n`;
    if (pooja.benefits) response += `**Benefits:** ${pooja.benefits}\n`;
    if (pooja.samagri) response += `**Samagri (Materials):** ${pooja.samagri}\n`;
    if (pooja.procedure) response += `\n**Procedure:** ${pooja.procedure}\n`;
    response += `\nYou can book this pooja through our Pooja Services section! 🙏`;

    // Add shopper action for poojas
    response += `\n||DHARMA_SHOPPER_ACTION||\n[{"itemName":"${pooja.name}","description":"${(pooja.description || '').substring(0, 100)}","estimatedPrice":"₹${pooja.cost || 500}","internalPoojaId":${pooja.id}}]`;

    return response;
};

// Simulate streaming by yielding words
const simulateStreaming = async (
    text: string,
    onChunk: (chunk: string) => void,
    delayMs: number = 15
): Promise<void> => {
    const words = text.split(' ');
    let buffer = '';
    for (let i = 0; i < words.length; i++) {
        buffer += (i === 0 ? '' : ' ') + words[i];
        // Flush every few words for natural streaming feel
        if (buffer.length > 20 || i === words.length - 1) {
            onChunk(buffer);
            buffer = '';
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
};

// Main response generator
const generateLocalResponse = async (
    query: string,
    context?: { temple?: Temple; book?: Book; pooja?: Pooja; pillar?: any; language?: Language }
): Promise<string> => {
    const [kb, poojaCatalog] = await Promise.all([loadKnowledgeBase(), loadPoojaCatalog()]);
    const responseLocale = context?.language || detectResponseLocale(query);

    // Contextual responses
    if (context?.temple) return buildTempleResponse(context.temple);
    if (context?.book) return buildBookResponse(context.book);
    if (context?.pooja) return buildPoojaResponse(context.pooja);

    // Greeting
    if (isGreeting(query)) {
        return pickRandom(kb.greetings);
    }

    // Off-topic guard
    if (query.length > 5 && !isDharmaRelated(query) && !isGreeting(query)) {
        return kb.off_topic_response;
    }

    // Ritual catalog and detailed pooja/homa/yajna matching from local data
    if (isRitualCatalogQuery(query) && poojaCatalog.length > 0) {
        return buildRitualCatalogResponse(poojaCatalog, responseLocale);
    }

    if (isRitualQuery(query) && poojaCatalog.length > 0) {
        const ritualMatch = findBestPoojaMatch(query, poojaCatalog);
        if (ritualMatch) {
            const relatedMatches = findTopPoojaMatches(query, poojaCatalog, 5)
                .map(item => item.pooja)
                .filter(p => p.id !== ritualMatch.pooja.id);
            return buildDetailedPoojaAnswer(ritualMatch.pooja, responseLocale, ritualMatch.score, relatedMatches);
        }

        const suggestions = findTopPoojaMatches(query, poojaCatalog, 3);
        if (suggestions.length > 0) {
            return buildRitualClarificationResponse(query, suggestions, responseLocale);
        }
    }

    // Spiritual task coaching (meditation, sloka/padya learning, routine building)
    if (isTaskPlannerQuery(query)) {
        const hasMinutes = extractMeditationMinutes(query) !== null;
        if (!hasMinutes) {
            return buildTaskIntakeResponse(responseLocale);
        }
        return buildPersonalTaskPlan(query, responseLocale);
    }

    // Spelling/pronunciation coach for spiritual terms
    if (isSpellingHelpQuery(query)) {
        return buildSpellingCoachResponse(query, responseLocale);
    }

    // Topic match (upgraded to multi-topic matching)
    const matchedTopics = findTopTopicsMatch(query, kb.topics);
    if (matchedTopics.length > 0) {
        if (matchedTopics.length === 1) {
            return pickRandom(matchedTopics[0].responses);
        } else {
            // Combine wisdom from 2 topics
            const resp1 = pickRandom(matchedTopics[0].responses);
            const resp2 = pickRandom(matchedTopics[1].responses).replace(/^\*\*[^*]+\*\*\n*/, ''); // Strip title from second
            return `${resp1}\n\nFurthermore, consider this related wisdom:\n\n${resp2}`;
        }
    }

    // Pillar context
    if (context?.pillar) {
        return `**${context.pillar.title}**\n\n${context.pillar.description}\n\n${context.pillar.details || ''}\n\nThis is one of the pillars of the Dharma Setu platform, designed to serve your spiritual journey. Explore it further in the app! 🙏`;
    }

    // Generic spiritual response when no specific match
    return "Namaste! 🙏 That's a wonderful question on your spiritual journey. While I may not have a specific answer in my knowledge base for this exact topic, I encourage you to explore our **Knowledge Hub** which contains 161 sacred texts — from the Vedas and Upanishads to the Bhagavad Gita and Puranas. You can also browse the **Spiritual Gurus** section to learn from the great masters.\n\nRemember what the Isha Upanishad teaches: *\"The wise one who sees all beings in the Self, and the Self in all beings, never turns away from it.\"*\n\nMay your path be illuminated with divine wisdom. 🙏";
};

// Global history for chat
let globalChatHistory: { role: 'user' | 'assistant' | 'system', content: string }[] = [];

/**
 * Sends a message and streams the response using local knowledge base.
 * No external API dependency — works fully offline.
 */
export const sendMessageToGuruStream = async function* (message: string) {
    try {
        globalChatHistory.push({ role: 'user', content: message });
        const response = await generateLocalResponse(message);

        // Yield the full response (simulating single chunk)
        yield { text: response } as any;

        globalChatHistory.push({ role: 'assistant', content: response });
    } catch (error) {
        console.error("Error in local guru response:", error);
        throw new Error("My apologies, I am having trouble accessing the knowledge base right now. Please try again.");
    }
};

/**
 * Explains a spiritual topic using local knowledge base.
 */
export const explainScripture = async (topic: string): Promise<string> => {
    const kb = await loadKnowledgeBase();

    // Check scripture_explanations first
    const lower = topic.toLowerCase();
    for (const [key, explanation] of Object.entries(kb.scripture_explanations)) {
        if (lower.includes(key)) {
            return explanation;
        }
    }

    // Try topic matching
    const matchedTopics = findTopTopicsMatch(topic, kb.topics, 1);
    if (matchedTopics.length > 0) {
        // Strip markdown for cleaner explanation format
        return pickRandom(matchedTopics[0].responses).replace(/\*\*/g, '').replace(/\*/g, '');
    }

    return `${topic} is an important aspect of Sanatana Dharma's vast spiritual heritage. It represents part of the ancient wisdom tradition that has guided seekers for thousands of years. The study and contemplation of such subjects deepens our understanding of Dharma and brings us closer to spiritual realization. Explore our Knowledge Hub for detailed texts and readings on this topic.`;
};

// --- Utility functions using local data ---

export const getDailySloka = async (language: Language): Promise<{ sloka_devanagari: string; sloka_transliteration: string; meaning: string; }> => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const slokas = SLOKA_DATA[language];
    const sloka = slokas[dayOfYear % slokas.length];

    return {
        sloka_devanagari: sloka.text,
        sloka_transliteration: sloka.translation,
        meaning: sloka.meaning,
    };
};

export const getDailyPanchang = async (_language: Language): Promise<any> => {
    const kb = await loadKnowledgeBase();
    // Use day of lunar month (approximate 29.5-day cycle)
    const dayIndex = Math.floor((Date.now() / (1000 * 60 * 60 * 24)) % 30);
    return kb.panchang_data[dayIndex] || kb.panchang_data[0];
};

export const getSlokaExplanation = async (sloka: Sloka): Promise<string> => {
    return `This sacred verse — *"${sloka.text.substring(0, 60)}..."* — carries profound spiritual wisdom. ${sloka.meaning} This teaching invites us to look beyond the surface of daily life and align our actions with the eternal truth (Satya) that underlies all existence. Through regular contemplation of such verses, the mind becomes purified and receptive to higher knowledge. 🙏`;
};

export const generateTempleComparison = async (originalTemple: Temple, alternativeTemple: Temple): Promise<string> => {
    return `Both **${originalTemple.name}** (${originalTemple.deity}) and **${alternativeTemple.name}** (${alternativeTemple.deity}) are magnificent centers of divine energy. While ${originalTemple.name} in ${originalTemple.location} carries its own unique spiritual atmosphere, ${alternativeTemple.name} in ${alternativeTemple.location} offers an equally transformative darshan experience. Each temple has its own sacred vibration — visiting both enriches your spiritual journey immensely. 🙏`;
};

export const generateSpiritualSignificance = async (temple: Temple): Promise<string> => {
    return `**${temple.name}**, nestled in ${temple.location}, is a sacred abode of ${temple.deity}. ${temple.history.substring(0, 300)} This temple stands as a testament to the enduring power of devotion and the living presence of the Divine in India's spiritual landscape. A visit here is believed to bestow the blessings of ${temple.deity} and purify the soul of the devoted seeker. 🙏`;
};

/**
 * Handles contextual responses for temples, books, poojas, etc.
 * Uses local knowledge base — no external API needed.
 */
export const streamDevaGptResponse = async (
    query: string,
    _history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    context: { temple?: Temple; book?: Book; pooja?: Pooja; pillar?: any; user?: User | null; userBookings?: any[]; language?: Language },
    onChunk: (chunk: string) => void,
    onComplete: () => void
) => {
    try {
        const response = await generateLocalResponse(query, context);
        await simulateStreaming(response, onChunk);
    } catch (error) {
        console.error('Error in local streamDevaGptResponse:', error);
        onChunk("Namaste! 🙏 I encountered an issue accessing the knowledge base. Please try asking your question again.");
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
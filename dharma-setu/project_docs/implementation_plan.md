# Train Local AI with Guruji Persona

The AI will remain **fully local with no external API calls**. We'll "train" it by massively expanding the knowledge base and rewriting the response engine to speak as **Guruji** — a warm, compassionate spiritual guide.

## Proposed Changes

### Knowledge Base Expansion

#### [MODIFY] [spiritual_knowledge.json](file:///c:/Users/R%20venkat%20sai/Downloads/dharma-setu/frontend/public/data/spiritual_knowledge.json)

**Rewrite ALL existing responses** in the Guruji voice:
- Address seekers as "Vatsa", "Shishya", "Priya"
- Open with warmth, quote Sanskrit shlokas with meanings
- Cover three dimensions: **Vidhi** (procedure), **Artha** (meaning), **Phala** (benefit)
- Share Katha (stories) from Puranas to illustrate points

**Add 30+ new topic areas** covering the user's full Guruji curriculum:
- 🔥 **Rituals**: Samskaras (16 rites), Homas, Yagnas, Sandhyavandanam, Temple worship
- 🧘 **Yoga & Meditation**: Kundalini, Pranayama types, Four paths of Yoga, Chakras (expanded)
- 🕉️ **Mantra Shastra**: Beeja mantras, Gayatri Mantra deep-dive, Japa Vidhi, Nada Brahman
- 📚 **Philosophy**: Six Darshanas, Advaita vs Dvaita, Brahmasutras, Prasthanatrayi
- 🌿 **Ayurveda**: Panchakarma, Dinacharya, Doshas (expanded)
- 🌙 **Jyotisha**: Navagrahas, Nakshatras, Rashis, Doshas, Muhurta
- 🗓️ **Festivals**: Ekadashi, Navratri, Kumbh Mela (expanded)
- 🏛️ **Sampradayas**: Four Vaishnava lineages, Shaiva traditions, Shakta traditions
- 💀 **Death & Afterlife**: Garuda Purana, Antyesti, Shraddha, Pitru Paksha
- 🐄 **Sacred Nature**: Cow worship, Sacred trees, Sacred rivers, Pancha Bhutas
- 🔯 **Yantra & Mudra**: Sri Yantra, Deity Yantras, Yoga Mudras, Sacred symbols
- 🍽️ **Dharmic Daily Living**: Fasting rules, Ashrama Dharma, Sadachara

---

### Response Engine Upgrade

#### [MODIFY] [aiService.ts](file:///c:/Users/R%20venkat%20sai/Downloads/dharma-setu/frontend/src/services/aiService.ts)

1. **Guruji persona wrapper** — wrap all responses with Guru-like speech patterns
2. **Multi-topic matching** — when a query touches 2+ topics, combine wisdom from both
3. **Broader keyword coverage** — add hundreds of new keywords for fuzzy matching
4. **Contextual Katha integration** — include relevant stories in responses
5. **Update greetings** to use Guruji's voice ("Vatsa", "Shishya")
6. **Update off-topic response** with Guruji's gentle boundary setting
7. **Deeper follow-up suggestions** — suggest related topics in the Guruji voice

---

## Verification Plan

### Manual Verification (Browser)
1. Start the app locally
2. Open AI Guru chat and test greeting → should address user as "Vatsa"
3. Ask "What is Gayatri Mantra?" → detailed response with pronunciation, meaning, who can chant
4. Ask "Explain Advaita vs Dvaita" → balanced presentation of both philosophies
5. Ask "How to perform Sandhyavandanam?" → step-by-step with Vidhi/Artha/Phala
6. Ask "What is machine learning?" → gentle Guruji-style off-topic redirect
7. Ask about Navagrahas, Samskaras, Kundalini → all should have rich responses

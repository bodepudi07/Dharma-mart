import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { philosophyTopics } from './topics_philosophy.js';
import { deitiesEpicsTopics } from './topics_deities_epics.js';
import { yogaAstrologyTopics } from './topics_yoga_astrology.js';
import { ritualsSamskaraTopics } from './topics_rituals.js';
import { livingFestivalsTopics } from './topics_living_festivals.js';
import { natureScienceTopics, baseKnowledge } from './topics_tantra_nature.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPathPublic = path.join(__dirname, 'spiritual_knowledge.json');
const jsonPathDist = path.join(__dirname, '../../dist/data/spiritual_knowledge.json');

// Read existing JSON to grab panchang_data
let existingData = { panchang_data: [] };
if (fs.existsSync(jsonPathPublic)) {
    try {
        existingData = JSON.parse(fs.readFileSync(jsonPathPublic, 'utf8'));
    } catch(e) {
        console.error("Error reading existing json", e);
    }
}

const allTopics = [
    ...philosophyTopics,
    ...deitiesEpicsTopics,
    ...yogaAstrologyTopics,
    ...ritualsSamskaraTopics,
    ...livingFestivalsTopics,
    ...natureScienceTopics
];

const finalOutput = {
    greetings: baseKnowledge.greetings,
    off_topic_response: baseKnowledge.off_topic_response,
    topics: allTopics,
    panchang_data: existingData.panchang_data,
    scripture_explanations: baseKnowledge.scripture_explanations,
    temple_significance: baseKnowledge.temple_significance
};

const jsonString = JSON.stringify(finalOutput, null, 2);

fs.writeFileSync(jsonPathPublic, jsonString, 'utf8');

// Also update dist if it exists
if (fs.existsSync(path.dirname(jsonPathDist))) {
    fs.writeFileSync(jsonPathDist, jsonString, 'utf8');
}

console.log(`Successfully generated spiritual_knowledge.json with ${allTopics.length} deeply detailed Guruji topics.`);

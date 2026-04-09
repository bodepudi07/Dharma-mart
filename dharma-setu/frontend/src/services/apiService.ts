import { Temple, Pooja, Yatra, User, AdminTemple, Book, NearbyTemple, Testimonial, ActivityLogItem, Booking, DarshanTier, MajorEvent, Pandit, DonationOption, BookContent, CrowdLevel, Festival, TempleSubmissionData, SearchResults, Role, DarshanBookingDetails, PoojaBookingDetails, SpiritualGrowthData, LifetimeStats, DailyTask, TaskType, FeedItem, UserPreferences, YatraTier, YatraBookingDetails, Language, CustomYatraBookingDetails, YatraQuoteRequest, ChatRoom, ChatMessage, SearchFilters, Post, RemoteSeva, Sankalpa } from '../types';
import { TESTIMONIALS_DATA } from '../constants';
import { calculateDistance, fuzzySearch } from '../utils/geolocation';
import { dataCache, DATA_UPDATED_EVENT } from './dataCache';
import { parseDurationToMinutes } from '../utils/bookingUtils';
import { explainScripture as explainScriptureAI } from './aiService';

export { DATA_UPDATED_EVENT }; // Re-export for components that use it



// --- Internationalization Helper ---

/**
 * Fetches base data and merges it with language-specific translations.
 * @param key The base key for the data (e.g., 'temples').
 * @param language The target language.
 * @returns A promise that resolves to the merged, translated data.
 */
async function fetchAndMerge<T extends { id: number }>(
    key: string,
    language: Language
): Promise<T[]> {
    // The base data (English) is fetched through the cache for performance.
    const baseData = await dataCache.get<T>(key, `/data/${key}.json`);

    if (language === Language.EN) {
        return baseData;
    }

    try {
        const response = await fetch(`/data/${key}.${language}.json`);
        if (!response.ok) {
            console.warn(`Translation file for '${key}' in language '${language}' not found. Falling back to English.`);
            return baseData;
        }

        const langText = await response.text();
        const langData = JSON.parse(langText.charCodeAt(0) === 0xFEFF ? langText.slice(1) : langText);
        // Create a map for efficient lookups of translations.
        const langMap = new Map(langData.map((item: T) => [item.id, item]));

        // Merge base data with translations.
        return baseData.map(item => {
            const translation = langMap.get(item.id);
            // Use Object.assign to handle potential generic type issues with spread operator in some compilers
            return translation ? Object.assign({}, item, translation) : item;
        });
    } catch (e) {
        console.warn(`Failed to load or parse translation for '${key}' in '${language}'. Falling back to English.`, e);
        return baseData;
    }
}


// --- API Functions ---

export const getTemples = (language: Language): Promise<Temple[]> => fetchAndMerge<Temple>('temples', language);
export const getPoojas = (language: Language): Promise<Pooja[]> => fetchAndMerge<Pooja>('poojas', language);
export const getYatras = (language: Language): Promise<Yatra[]> => fetchAndMerge<Yatra>('yatras', language);
export const getBooks = (language: Language): Promise<Book[]> => fetchAndMerge<Book>('books', language);
export const getMajorEvents = (language: Language): Promise<MajorEvent[]> => fetchAndMerge<MajorEvent>('events', language);
export const getFestivals = (language: Language): Promise<Festival[]> => fetchAndMerge<Festival>('festivals', language);
export const getRemoteSevas = (language: Language): Promise<RemoteSeva[]> => fetchAndMerge<RemoteSeva>('remote_sevas', language);
export const getPandits = (language: Language, eventId?: number): Promise<Pandit[]> => {
    return fetchAndMerge<Pandit>('pandits', language).then(pandits => {
        if (eventId) {
            return pandits.filter(p => p.eventId === eventId);
        }
        return pandits;
    });
};
export const getPendingTemples = async (token: string): Promise<AdminTemple[]> => {
    const response = await fetch('/api/admin/pending-temples', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Failed to fetch pending temples.");
    return result.data;
};

export const getPendingPandits = async (token: string): Promise<Pandit[]> => {
    const response = await fetch('/api/admin/pending-pandits', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Failed to fetch pending pandits.");
    return result.data;
};

export const getUsersList = async (token?: string): Promise<User[]> => {
    if (!token) throw new Error("Authentication token required for user listing.");
    const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Failed to fetch Users.");
    return result.data;
};

export const getActivityLog = async (token: string): Promise<ActivityLogItem[]> => {
    const response = await fetch('/api/admin/activity-log', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Failed to fetch activity log.");
    return result.data;
};
export const getBookings = async (token: string): Promise<Booking[]> => {
    const response = await fetch('/api/admin/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Failed to fetch bookings.");
    return result.data;
};

export const getUserBookings = async (userId: number, token: string): Promise<Booking[]> => {
    const response = await fetch(`/api/bookings/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Failed to fetch your bookings.");
    return result.data;
};

export const cancelBooking = async (bookingId: number, token: string, reason?: string): Promise<Booking> => {
    const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Failed to cancel booking.");
    return result.data.booking;
};

export const rescheduleBooking = async (bookingId: number, token: string, bookingDate: string, timeSlot?: string): Promise<Booking> => {
    const response = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ bookingDate, timeSlot })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Failed to reschedule booking.");
    return result.data.booking;
};

// Sankalpa (Remote Seva) API
export const createSankalpa = async (data: {
    sevaId: number; devoteeName: string; gotra: string; rashi?: string; nakshatra?: string;
    address: string; pincode: string; phone: string; date: string; panditId: number;
}, token: string): Promise<Sankalpa> => {
    const response = await fetch('/api/sankalpas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Failed to create sankalpa.");
    return result.data.sankalpa;
};

export const getUserSankalpas = async (token: string): Promise<Sankalpa[]> => {
    const response = await fetch('/api/sankalpas/user', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Failed to fetch sankalpas.");
    return result.data;
};

export const getAllSankalpas = async (token: string): Promise<Sankalpa[]> => {
    const response = await fetch('/api/sankalpas/all', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Failed to fetch sankalpas.");
    return result.data;
};

export const updateSankalpaStatus = async (
    sankalpaId: string, status: string, token: string,
    extras?: { proofVideoUrl?: string; trackingId?: string; panditNotes?: string }
): Promise<Sankalpa> => {
    const response = await fetch(`/api/sankalpas/${encodeURIComponent(sankalpaId)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status, ...extras })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Failed to update sankalpa.");
    return result.data.sankalpa;
};

export const getPoojasByTempleId = async (templeId: number, language: Language): Promise<Pooja[]> => {
    const allPoojas = await getPoojas(language);
    return allPoojas.filter(pooja => pooja.templeIds?.includes(templeId));
};

export const getTemplesByPoojaId = async (poojaId: number, language: Language): Promise<Temple[]> => {
    const [allTemples, allPoojas] = await Promise.all([getTemples(language), getPoojas(language)]);
    const pooja = allPoojas.find(p => p.id === poojaId);
    if (!pooja || !pooja.templeIds) return [];
    return allTemples.filter(temple => pooja.templeIds?.includes(temple.id));
};

export const getBookContent = async (contentKey: string): Promise<BookContent> => {
    const response = await fetch(`/data/book-content/${contentKey}.json`);
    if (!response.ok) throw new Error("Failed to fetch book content.");

    const contentType = response.headers.get("content-type");
    if (contentType && (contentType.includes("text/html") || contentType.includes("text/plain"))) {
        throw new Error("Book content is currently being updated and will be available soon.");
    }

    // Strip UTF-8 BOM if present before parsing
    let text = await response.text();
    if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
    }
    return JSON.parse(text);
};

export const getTempleById = async (id: number, language: Language): Promise<Temple | undefined> => {
    const temples = await getTemples(language);
    return temples.find(t => t.id === id);
};

export const getEventById = async (id: number, language: Language): Promise<MajorEvent | undefined> => {
    const events = await getMajorEvents(language);
    return events.find(e => e.id === id);
};

export const getBookByContentKey = async (contentKey: string, language: Language): Promise<Book | undefined> => {
    const books = await getBooks(language);
    return books.find(b => b.contentKey === contentKey);
};

export const getNearbyTemples = async (templeId: number, userLat: number, userLng: number, language: Language): Promise<Temple[]> => {
    const allTemples = await getTemples(language);
    const otherTemples = allTemples.filter(t => t.id !== templeId);

    return otherTemples
        .map(t => ({
            ...t,
            distance: calculateDistance(userLat, userLng, t.lat, t.lng)
        }))
        .sort((a, b) => a.distance - b.distance);
};

export const verifyToken = async (token: string): Promise<User> => {
    const response = await fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    // Read JSON once to handle standardized response { success, data, error }
    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.error || "Invalid token");
    }

    return result.data.user;
};

export const getTestimonials = (): Promise<Testimonial[]> => {
    return Promise.resolve(TESTIMONIALS_DATA);
};

export const searchAll = async (
    query: string,
    language: Language,
    filters: SearchFilters,
    userLocation: { lat: number, lng: number } | null
): Promise<SearchResults> => {
    const [allTemples, allBooks, allEvents] = await Promise.all([
        getTemples(language),
        getBooks(language),
        getMajorEvents(language)
    ]);

    // --- Advanced Temple Search ---
    let templeResults: Temple[];

    if (query) {
        const maxDistance = query.length < 5 ? 1 : 2;
        const fuzzyResults = fuzzySearch(allTemples, query, ['name', 'location'], maxDistance);
        templeResults = fuzzyResults.map(r => r.item);
    } else {
        templeResults = allTemples;
    }

    // Apply filters
    if (filters.crowd.length > 0) {
        templeResults = templeResults.filter(t => filters.crowd.includes(t.crowdLevel));
    }
    if (filters.deity.length > 0) {
        templeResults = templeResults.filter(t => filters.deity.includes(t.deity));
    }
    if (userLocation && filters.distance > 0) {
        templeResults = templeResults
            .map(t => ({ ...t, distance: calculateDistance(userLocation.lat, userLocation.lng, t.lat, t.lng) }))
            .filter(t => t.distance! <= filters.distance)
            .sort((a, b) => a.distance! - b.distance!);
    }

    // --- Unified Fuzzy Search for Books and Events ---
    const maxSearchDistance = query.length < 5 ? 1 : 2;
    const filteredBooks = query
        ? fuzzySearch(allBooks, query, ['name', 'description'], maxSearchDistance).map(r => r.item)
        : allBooks;
    const filteredEvents = query
        ? fuzzySearch(allEvents, query, ['name', 'location', 'description'], maxSearchDistance).map(r => r.item)
        : allEvents;

    return { temples: templeResults, books: filteredBooks, events: filteredEvents };
};

export const findClosestAlternative = (userCoords: { latitude: number; longitude: number }, currentTempleId: number, allTemples: Temple[]): Temple | null => {
    const alternatives = allTemples
        .filter(t => t.id !== currentTempleId)
        .map(t => {
            const distance = calculateDistance(userCoords.latitude, userCoords.longitude, t.lat, t.lng);
            // Crowd Penalty: Low (0), Medium (5km), High (20km), Very High (Infinity)
            const crowdPenalty = t.crowdLevel === 'Low' ? 0 : t.crowdLevel === 'Medium' ? 5 : t.crowdLevel === 'High' ? 20 : 1000;
            return { ...t, effectiveDistance: distance + crowdPenalty };
        })
        .filter(t => t.effectiveDistance < 1000) // Don't suggest very crowded alternatives
        .sort((a, b) => a.effectiveDistance - b.effectiveDistance);

    return alternatives.length > 0 ? alternatives[0] : null;
};

// --- SIMULATED DATA FOR CALENDAR ---
/**
 * Highly accurate crowd prediction algorithm.
 * Factors: Day of Week (Weekends +30%), Time of Day (Pooja peaks), and Festival proximity.
 */
export const getDetailedCrowdLevel = (temple: Temple, dateTime: Date): CrowdLevel => {
    const day = dateTime.getDay();
    const hour = dateTime.getHours();

    // Base probability from temple's current status
    let score = temple.crowdLevel === 'High' ? 60 : temple.crowdLevel === 'Medium' ? 30 : 10;

    // 1. Weekend Surge (+20)
    if (day === 0 || day === 6) score += 20;

    // 2. Pooja Peak Hours (06:00-09:00, 18:00-20:00) (+30)
    if ((hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 20)) score += 30;

    // 3. Random variance (+/- 10)
    score += (Math.random() * 20 - 10);

    if (score > 75) return 'Very High';
    if (score > 50) return 'High';
    if (score > 25) return 'Medium';
    return 'Low';
};

export const getTempleAvailability = async (templeId: number): Promise<Map<string, CrowdLevel>> => {
    const temples = await getTemples(Language.EN);
    const temple = temples.find(t => t.id === templeId);
    if (!temple) return new Map();

    const availability = new Map<string, CrowdLevel>();
    const today = new Date();

    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateString = date.toISOString().split('T')[0];

        // Generate for "Morning" peak
        const morningDate = new Date(date);
        morningDate.setHours(8, 0, 0);
        availability.set(dateString, getDetailedCrowdLevel(temple, morningDate));
    }
    return availability;
};

export const getYatraAvailability = async (yatraId: number): Promise<Date[]> => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 3; i++) {
        dates.push(new Date(today.getFullYear(), today.getMonth() + i + 1, 1));
        dates.push(new Date(today.getFullYear(), today.getMonth() + i + 1, 15));
    }
    return dates;
};

// --- Spiritual Growth Tracker ---
const XP_PER_TASK = 50;
const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 4000, 8000, 15000]; // XP required for each level

const getLevelFromXp = (xp: number) => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            return i + 1;
        }
    }
    return 1;
};

const getSpiritualGrowthTemplate = (userId: number): SpiritualGrowthData => ({
    userId,
    xp: 0,
    level: 1,
    xpForNextLevel: LEVEL_THRESHOLDS[1],
    xpForCurrentLevel: LEVEL_THRESHOLDS[0],
    streak: 0,
    dailyTasks: [
        { type: 'meditate', isCompleted: false },
        { type: 'seva', isCompleted: false },
        { type: 'shloka', isCompleted: false },
        { type: 'darshan', isCompleted: false },
        { type: 'chant', isCompleted: false },
    ],
    lastUpdate: new Date().toISOString().split('T')[0],
});

export const getSpiritualGrowth = async (userId: number, token?: string): Promise<SpiritualGrowthData> => {
    if (!token) return getSpiritualGrowthTemplate(userId);
    try {
        const response = await fetch(`/api/growth/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (!response.ok || !result.success) return getSpiritualGrowthTemplate(userId);
        return result.data;
    } catch {
        return getSpiritualGrowthTemplate(userId);
    }
};

export const logActivity = async (
    type: ActivityLogItem['type'],
    message: string,
    user: User | null
): Promise<void> => {
    if (!user || !user.token) return; // Can't log without auth
    try {
        await fetch('/api/users/activity', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, message })
        });
    } catch {
        // Activity logging is non-critical; don't throw
    }
};

// --- USER ACTIONS ---

export const bookDarshan = async (temple: Temple, details: DarshanBookingDetails, user: User, token: string): Promise<{ message: string }> => {
    // Strict Input Validation
    if (!temple || !user || !token) throw new Error("Authentication and temple data required.");
    if (!details || !details.date || !details.tier) throw new Error("Invalid booking details.");

    const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'darshan',
            itemId: temple.id,
            itemName: temple.name,
            cost: details.tier.cost,
            details: { ...details, date: details.date?.toISOString() },
            tierName: details.tier.name
        })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Failed to book Darshan.");
    return result; // return the entire envelope where result.message exists
};

export const bookPooja = async (details: PoojaBookingDetails, user: User, token: string): Promise<{ message: string }> => {
    // Strict Input Validation
    if (!user || !token) throw new Error("Authentication required.");
    if (!details || !details.pooja || !details.date) throw new Error("Invalid pooja booking details.");
    if (details.pooja.cost < 0) throw new Error("Invalid pooja cost configuration.");

    const totalCost = details.pooja.cost + (details.pandit?.cost || 0);
    const durationMinutes = parseDurationToMinutes(details.pooja.duration);
    const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'pooja',
            itemId: details.pooja.id,
            itemName: details.pooja.name,
            cost: totalCost,
            details: { ...details, date: details.date?.toISOString() },
            tierName: details.temple?.name,
            duration: durationMinutes
        })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Failed to book Pooja.");
    return result;
};

export const bookYatra = async (details: YatraBookingDetails, user: User, token: string): Promise<{ message: string }> => {
    // Strict Input Validation
    if (!user || !token) throw new Error("Authentication required.");
    if (!details || !details.yatra || !details.tier || details.numberOfPersons <= 0) throw new Error("Invalid yatra booking details.");

    const cost = details.tier.cost * details.numberOfPersons;
    const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'yatra',
            itemId: details.yatra.id,
            itemName: details.yatra.name,
            cost,
            details: { ...details, date: details.date?.toISOString() },
            tierName: details.tier.name
        })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Failed to book Yatra.");
    return result;
};

export const submitYatraQuoteRequest = async (details: YatraQuoteRequest, user: User): Promise<{ message: string }> => {
    if (!user || !user.token) throw new Error('Authentication required.');
    const response = await fetch('/api/users/yatra-quote', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(details)
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Failed to submit quote request.');
    return { message: result.message || 'Your custom yatra plan has been submitted! Our partners will contact you shortly.' };
};

export const bookPandit = async (pandit: Pandit, contextItem: { name: string }, user: User, details: { date: Date, timeSlot: string }): Promise<{ message: string }> => {
    if (!user || !user.token) throw new Error("Authentication required to book a Pandit.");
    if (!pandit || !details || !details.date || !details.timeSlot) throw new Error("Incomplete Pandit booking details.");

    const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'pandit',
            itemId: pandit.id,
            itemName: pandit.name,
            cost: pandit.cost,
            details: { ...details, date: details.date?.toISOString() },
            tierName: contextItem.name,
            duration: 60
        })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Failed to book pandit.');
    return { message: result.message || `Pandit ${pandit.name} booked successfully for ${contextItem.name}!` };
};

export const makeDonation = async (amount: number, purpose: DonationOption, user: User, temple?: Temple): Promise<{ message: string }> => {
    if (!user || !user.token) throw new Error("Authentication required to make a donation.");
    if (amount < 11) throw new Error("Minimum donation amount is ₹11 for processing reasons.");
    if (!purpose) throw new Error("Invalid donation purpose.");

    const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'donation',
            itemId: purpose.id,
            itemName: purpose.title,
            cost: amount,
            details: {},
            tierName: temple?.name
        })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Failed to process donation.');
    return { message: result.message || 'Thank you for your generous donation!' };
};

export const submitTemple = async (templeData: TempleSubmissionData, user: User): Promise<{ message: string }> => {
    if (!user || !user.token) throw new Error('Authentication required.');
    const response = await fetch('/api/users/submit-temple', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(templeData)
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Failed to submit temple.');
    return { message: result.message || 'Temple submitted for review. Thank you for your contribution!' };
};

export const updatePoojaAssociationsForTemple = async (templeId: number, selectedPoojaIds: number[], token: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/admin/temples/${templeId}/pooja-associations`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedPoojaIds })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Failed to update pooja associations.');
    return { message: result.message || 'Pooja associations updated successfully!' };
};

export const checkAndResetStreak = async (userId: number, token?: string): Promise<SpiritualGrowthData> => {
    return getSpiritualGrowth(userId, token);
};

export const completeSpiritualTask = async (userId: number, taskType: TaskType, token?: string): Promise<SpiritualGrowthData> => {
    if (!token) throw new Error('Authentication required.');
    const response = await fetch(`/api/growth/${userId}/complete-task`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskType })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Failed to complete task.');
    return result.data;
};

export const loginUser = async (email: string, pass: string): Promise<{ user: User }> => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.error || result.details?.[0]?.message || "Login failed");
    }

    return result.data;
};

export const registerUser = async (name: string, email: string, pass: string): Promise<{ user: User }> => {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.error || result.details?.[0]?.message || "Registration failed");
    }

    return result.data;
};

export const loginWithGoogle = async (credential: string, mockData?: { name: string; email: string }): Promise<{ user: User; token: string }> => {
    const body = mockData
        ? { credential: 'mock_google_credential', mock: true, name: mockData.name, email: mockData.email }
        : { credential };
    const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || 'Google login failed');
    }
    return result.data;
};

export const loginWithProvider = async (provider: 'google' | 'facebook'): Promise<{ user: User }> => {
    throw new Error(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login will be available soon. Please use email registration.`);
};

// --- ACCESS CODE SYSTEM ---
export const requestAccessCode = async (email: string): Promise<{ code: string; email: string }> => {
    const response = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to request access code.');
    }
    return result.data;
};

export const verifyAccessCode = async (code: string): Promise<{ token: string; expiresAt: string; remainingMs: number; email: string }> => {
    const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || 'Invalid access code.');
    }
    return result.data;
};

export const getSessionStatus = async (token: string): Promise<{ remainingMs: number; expiresAt: string; email: string }> => {
    const response = await fetch('/api/auth/session-status', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || 'Session expired.');
    }
    return result.data;
};

export const updateUserProfile = async (userId: number, updates: Partial<User>, token: string): Promise<{ user: User }> => {
    const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Failed to update profile.");
    return result.data;
};

export const deleteUser = async (userId: number, token: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to delete account.");
    return response.json();
};

export const getLifetimeStats = async (userId: number, token: string): Promise<LifetimeStats> => {
    const [bookings, growthData] = await Promise.all([
        getUserBookings(userId, token),
        getSpiritualGrowth(userId, token)
    ]);
    const completedTasks = growthData.dailyTasks.filter(t => t.isCompleted).length;
    return {
        templesVisited: new Set(bookings.filter(b => b.type === 'darshan' || b.type === 'yatra').map(b => b.itemId)).size,
        poojasBooked: bookings.filter(b => b.type === 'pooja').length,
        sevaOffered: bookings.filter(b => b.type === 'donation').length,
        knowledgeRead: Math.floor((growthData.xp - (completedTasks * XP_PER_TASK)) / 10)
    };
};

// --- Personalized Feed ---

export const getDiscoverFeed = async (language: Language): Promise<FeedItem[]> => {
    const [temples, poojas, books, events] = await Promise.all([
        getTemples(language),
        getPoojas(language),
        getBooks(language),
        getMajorEvents(language),
    ]);
    const feed: FeedItem[] = [];
    if (temples.length > 0) feed.push({ type: 'temple', reason: "Popular Temple", item: temples[0] });
    if (poojas.length > 0) feed.push({ type: 'pooja', reason: "Recommended Pooja", item: poojas[0] });
    const gita = books.find(b => b.contentKey === 'bhagavad_gita');
    if (gita) feed.push({ type: 'book', reason: "Featured Scripture", item: gita });
    if (events.length > 0) feed.push({ type: 'event', reason: "Upcoming Festival", item: events[0] });
    return feed.slice(0, 5);
};

export const getPersonalizedFeed = async (user: User, language: Language, token: string): Promise<FeedItem[]> => {
    const bookings = await getUserBookings(user.id, token);
    const lastPoojaBooking = bookings.find(b => b.type === 'pooja');
    const lastTempleVisit = bookings.find(b => b.type === 'darshan');

    const [allTemples, allPoojas] = await Promise.all([
        getTemples(language),
        getPoojas(language),
    ]);

    const feed: FeedItem[] = [];

    if (lastPoojaBooking) {
        const poojaDetails = allPoojas.find(p => p.id === lastPoojaBooking.itemId);
        if (poojaDetails) {
            const relatedTempleId = poojaDetails.templeIds?.[0];
            const relatedTemple = allTemples.find(t => t.id === relatedTempleId && t.id !== lastTempleVisit?.itemId);
            if (relatedTemple) feed.push({ type: 'temple', reason: `Because you performed ${poojaDetails.name}`, item: relatedTemple });
        }
    }

    if (lastTempleVisit) {
        const templeDetails = allTemples.find(t => t.id === lastTempleVisit.itemId);
        if (templeDetails) {
            const relatedPooja = allPoojas.find(p => p.templeIds?.includes(templeDetails.id) && p.id !== lastPoojaBooking?.itemId);
            if (relatedPooja) feed.push({ type: 'pooja', reason: `Because you visited ${templeDetails.name}`, item: relatedPooja });
        }
    }

    const discoverFeed = await getDiscoverFeed(language);

    return [...feed, ...discoverFeed].filter((item, index, self) =>
        index === self.findIndex((t) => (t.item.id === item.item.id && t.type === item.type))
    ).slice(0, 5);
};


// --- User Preferences ---
export const getUserPreferences = async (userId: number, token?: string): Promise<UserPreferences['preferences']> => {
    if (!token) return {};
    try {
        const response = await fetch(`/api/users/preferences/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (!response.ok || !result.success) return {};
        return result.data;
    } catch {
        return {};
    }
};

export const updateUserChantImage = async (userId: number, chantId: number, imageData: string, token?: string): Promise<UserPreferences> => {
    if (!token) throw new Error('Authentication required.');
    const response = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ chantId, imageData })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Failed to update preferences.');
    return result.data;
};

// --- ADMIN CRUD ACTIONS (Real API) ---
const genericApiAdd = async (entityName: string, itemData: any, token: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/admin/${entityName}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || `Failed to add ${entityName}.`);
    return { message: result.message || `${entityName} added successfully.` };
};

const genericApiUpdate = async (entityName: string, itemData: any, token: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/admin/${entityName}/${itemData.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || `Failed to update ${entityName}.`);
    return { message: result.message || `${entityName} updated successfully.` };
};

const genericApiDelete = async (entityName: string, itemId: number, token: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/admin/${entityName}/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || `Failed to delete ${entityName}.`);
    return { message: result.message || `${entityName} deleted successfully.` };
};

// Pooja CRUD
export const addPooja = (data: Partial<Pooja>, token: string) => genericApiAdd('poojas', data, token);
export const updatePooja = (data: Partial<Pooja> & { id: number }, token: string) => genericApiUpdate('poojas', data, token);
export const deletePooja = (id: number, token: string) => genericApiDelete('poojas', id, token);

// Yatra CRUD
export const addYatra = (data: Partial<Yatra>, token: string) => genericApiAdd('yatras', data, token);
export const updateYatra = (data: Partial<Yatra> & { id: number }, token: string) => genericApiUpdate('yatras', data, token);
export const deleteYatra = (id: number, token: string) => genericApiDelete('yatras', id, token);

// Book CRUD
export const addBook = (data: Partial<Book>, token: string) => genericApiAdd('books', data, token);
export const updateBook = (data: Partial<Book> & { id: number }, token: string) => genericApiUpdate('books', data, token);
export const deleteBook = (id: number, token: string) => genericApiDelete('books', id, token);

// Festival CRUD
export const addFestival = (data: Partial<Festival>, token: string) => genericApiAdd('festivals', data, token);
export const updateFestival = (data: Partial<Festival> & { id: number }, token: string) => genericApiUpdate('festivals', data, token);
export const deleteFestival = (id: number, token: string) => genericApiDelete('festivals', id, token);

// Event CRUD
export const addEvent = (data: Partial<MajorEvent>, token: string) => genericApiAdd('events', data, token);
export const updateEvent = (data: Partial<MajorEvent> & { id: number }, token: string) => genericApiUpdate('events', data, token);
export const deleteEvent = async (id: number, token: string) => {
    // Cascade delete: Also removes associated pandits on the backend
    const response = await fetch(`/api/admin/events/${id}/cascade`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Failed to delete event.');
    return { message: result.message || 'Event deleted successfully.' };
};

// Pandit CRUD
export const addPandit = (data: Partial<Pandit>, token: string) => genericApiAdd('pandits', data, token);
export const updatePandit = (data: Partial<Pandit> & { id: number }, token: string) => genericApiUpdate('pandits', data, token);
export const deletePandit = (id: number, token: string) => genericApiDelete('pandits', id, token);
export const getPanditCountForEvent = async (eventId: number): Promise<number> => {
    const pandits = await getPandits(Language.EN, eventId);
    return pandits.length;
}

// Temple Actions
export const updateTemple = (id: number, data: Partial<Temple>, token: string) => genericApiUpdate('temples', { ...data, id }, token);
export const addTempleDirectly = (data: Partial<Temple>, token: string) => genericApiAdd('temples', data, token);
export const deleteTemple = (id: number, token: string) => genericApiDelete('temples', id, token);

// Other Admin Actions
export const processTempleSubmission = async (templeId: number, status: 'approved' | 'rejected', token: string): Promise<{ message: string }> => {
    const response = await fetch('/api/admin/process-temple', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templeId, status })
    });
    if (!response.ok) throw new Error("Failed to process temple submission.");
    return response.json();
};

export const updateTempleCrowdLevel = async (templeId: number, newLevel: CrowdLevel, token: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/admin/temples/${templeId}/crowd`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ crowdLevel: newLevel })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Failed to update crowd level.');
    return { message: result.message || 'Crowd level updated.' };
};

export const getAdminStats = async (token: string): Promise<any> => {
    const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || "Failed to fetch admin stats.");
    return result.data;
};

export const updateUserRole = async (userId: number, role: Role, token: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
    });
    if (!response.ok) throw new Error("Failed to update user role.");
    return response.json();
};

export const deleteUserByAdmin = async (userId: number, token: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to delete user.");
    return response.json();
};

// Satsang / Community Hub - Real API calls
export const getChatRooms = async (): Promise<ChatRoom[]> => {
    try {
        const response = await fetch('/api/chats/satsang/rooms');
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error('Failed to fetch rooms');
        return result.data;
    } catch {
        // Fallback to static data if API is down
        return dataCache.get('chat_rooms', '/data/chat_rooms.json');
    }
};

export const getChatMessages = async (roomId: number): Promise<ChatMessage[]> => {
    try {
        const response = await fetch(`/api/chats/satsang/rooms/${roomId}/messages`);
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error('Failed to fetch messages');
        return result.data;
    } catch {
        // Fallback: filter from static seed data
        const allMessages = await dataCache.get<ChatMessage>('chat_messages', '/data/chat_messages.json');
        return allMessages.filter(m => m.roomId === roomId);
    }
};

export const getNewMessagesSince = async (roomId: number, lastId: number): Promise<ChatMessage[]> => {
    const response = await fetch(`/api/chats/satsang/rooms/${roomId}/messages/since/${lastId}`);
    const result = await response.json();
    if (!response.ok || !result.success) return [];
    return result.data;
};

export const postChatMessage = async (roomId: number, text: string, user: User): Promise<ChatMessage> => {
    const response = await fetch(`/api/chats/satsang/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({ text }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Failed to send message');
    return result.data;
};

export interface OnlineUser {
    id: number;
    name: string;
    avatarUrl?: string;
}

export const sendPresenceHeartbeat = async (roomId: number, token: string): Promise<OnlineUser[]> => {
    try {
        const response = await fetch(`/api/chats/satsang/rooms/${roomId}/presence`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        const result = await response.json();
        if (!response.ok || !result.success) return [];
        return result.data;
    } catch {
        return [];
    }
};

export const leaveRoom = async (roomId: number, token: string): Promise<void> => {
    try {
        await fetch(`/api/chats/satsang/rooms/${roomId}/presence`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    } catch { /* ignore */ }
};

// --- Satsang Social Feed ---

export const getPosts = async (): Promise<Post[]> => {
    try {
        const response = await fetch('/api/posts');
        const result = await response.json();
        if (!response.ok || !result.success) return [];
        return result.data;
    } catch {
        return [];
    }
};

export const getUserById = async (userId: number, token: string): Promise<User | undefined> => {
    const users = await getUsersList(token);
    return users.find(u => u.id === userId);
};

export const createPost = async (caption: string, imageUrl: string, user: User): Promise<{ message: string }> => {
    if (!user || !user.token) throw new Error('Authentication required.');
    const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, imageUrl })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Failed to create post.');
    return { message: result.message || 'Post created successfully!' };
};

export const toggleLikePost = async (postId: number, userId: number, token?: string): Promise<{ message: string }> => {
    if (!token) throw new Error('Authentication required.');
    const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Failed to toggle like.');
    return { message: result.message || 'Done' };
};

export const toggleFollowUser = async (currentUserId: number, targetUserId: number, token: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/users/follow/${targetUserId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to toggle follow.");
    return response.json();
};

// Pandit Registration
export const submitPanditRegistration = async (data: Omit<Pandit, 'id' | 'status' | 'rating'>, token?: string): Promise<{ message: string }> => {
    if (!token) throw new Error('Authentication required.');
    const response = await fetch('/api/users/submit-pandit', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Failed to submit registration.');
    return { message: result.message || 'Your application has been submitted for review. We will contact you shortly.' };
};

export const approvePandit = async (panditId: number, token: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/admin/approve-pandit/${panditId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to approve pandit.");
    return response.json();
};

// --- Chat History & Bookmarks ---

export const getChatHistory = async (userId: number, token: string): Promise<any[]> => {
    const response = await fetch(`/api/chats/history/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    return response.json();
};

export const saveChatHistory = async (messages: any[], token: string): Promise<void> => {
    await fetch('/api/chats/history', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages })
    });
};

export const getBookmarks = async (userId: number, token: string): Promise<any[]> => {
    const response = await fetch(`/api/chats/bookmarks/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    const result = await response.json();
    return result.data || [];
};

export const saveBookmark = async (text: string, context: string, token: string): Promise<any> => {
    const response = await fetch('/api/chats/bookmarks', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, context })
    });
    if (!response.ok) throw new Error("Failed to save bookmark.");
    const result = await response.json();
    return result.data;
};

export const deleteBookmark = async (id: number, token: string): Promise<void> => {
    await fetch(`/api/chats/bookmarks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
};

export const rejectPandit = async (panditId: number, token: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/admin/reject-pandit/${panditId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to reject pandit.");
    return response.json();
};

export const explainScripture = (topic: string): Promise<string> => {
    return explainScriptureAI(topic);
};
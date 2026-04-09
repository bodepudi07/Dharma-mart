
========================================

DOCUMENT: implementation_plan.md

========================================

# Dharma Setu V2 - Implementation Plan

This document outlines the architecture and execution strategy for integrating five major requested features into the existing Dharma Setu application.

## 1. Interactive 3D Japa Mala (Chanting Zone)
**Goal:** Transform the static chanting zone into an interactive, meditative experience.
*   **Component:** `frontend/src/components/ChantingZone.tsx`
*   **Implementation:**
    *   Build a circular CSS/SVG animation representing a 108-bead Rudraksha mala.
    *   Implement click/spacebar handlers that visually advance the beads.
    *   Add realistic haptic feedback (if supported by device) and visual pulsing.
    *   *Gamification hook:* Award "Punya" points upon completing 1 round (108 chants).

## 2. Live Daily Panchang & Muhurat Widget
**Goal:** Provide daily astrological and ritual timings on the homepage.
*   **Component:** `frontend/src/components/PanchangWidget.tsx` (New)
*   **Implementation:**
    *   Build a sleek dashboard widget displaying *Tithi* (Lunar Day), *Nakshatra*, *Sunrise/Sunset*, and *Rahu Kaal*.
    *   For the offline-first scope, generate a realistic algorithmic daily calculation based on the current Date.
    *   Inject this widget directly onto the `Home.tsx` dashboard underneath the "Daily Sloka".

## 3. Dharma E-Commerce Store
**Goal:** Allow users to purchase verified physical spiritual goods.
*   **Component:** `frontend/src/components/DharmaStore.tsx` (New)
*   **Implementation:**
    *   Create a product catalog JSON (Rudrakshas, Yantras, Puja Essentials, Brass Idols).
    *   Build a masonry grid UI displaying products with "Add to Cart" functionality.
    *   Implement a shopping cart slide-out panel and a mock checkout flow.
    *   Add the store link to the main navigation menu.

## 4. "Punya" (Karma) Gamification Ecosystem
**Goal:** Incentivize spiritual engagement through a rewarding points system.
*   **Component:** Deep integration across `AuthContext`, `Home.tsx`, and `Navbar.tsx`.
*   **Implementation:**
    *   Update the `User` interface to include a `punyaBalance` property.
    *   Add a visual "Punya Bank" tracker in the top navigation.
    *   Dispatch functions to reward users (+50 for Temple Darshan, +108 for completing Japa, +200 for booking a Pooja).

## 5. Full Multilingual Localization
**Goal:** Enable seamless switching between English, Hindi, and Telugu.
*   **Component:** `LanguageContext.tsx` (New/Modify existing) and `Navbar.tsx`.
*   **Implementation:**
    *   Validate the `t` (translation dictionary) payload.
    *   Add a prominent Language Toggle Dropdown 🌐 in the navbar.
    *   Ensure data fetchers (`temples.json`, `temples.hi.json`, `temples.te.json`) dynamically reload based on the active language state.
    *   Pass the active language to the AI Guru so it natively responds in the correct language.

## Verification Plan
*   **Automated & Manual UI Validation:** Once all 5 systems are written, I will deploy the browser subagent to click through the store, switch languages in real-time, click the Japa mala exactly 108 times to verify Punya awards, and read the generic Panchang data.




========================================

DOCUMENT: task.md

========================================

# Development Checklist: Dharma Setu V2

## 1. Feature: Interactive Japa Mala
- [ ] Refactor `ChantingZone.tsx`
- [ ] Build interactive SVG/CSS bead animation
- [ ] Connect completion logic to User State (Punya)

## 2. Feature: Daily Panchang Widget
- [ ] Create `PanchangWidget.tsx` algorithm and UI
- [ ] Mount widget on `Home.tsx`

## 3. Feature: Punya Gamification
- [ ] Update `AuthContext` to support Punya state
- [ ] Add visual Punya tracker to Navbar
- [ ] Wire up reward triggers across the app

## 4. Feature: Dharma Store
- [ ] Create mock product catalog data
- [ ] Build `DharmaStore.tsx` UI and Cart logic
- [ ] Add route to main application

## 5. Feature: Full Localization
- [ ] Implement robust Language/i18n context
- [ ] Add Language Switcher UI to Navbar
- [ ] Ensure AI Guru dynamically understands active language




========================================

DOCUMENT: walkthrough.md

========================================

# Local Guruji AI Integration & App Health Review & Visual Overhaul

## 🕉️ Guruji Persona Training (Offline Mode)
We successfully upgraded the local `spiritual_knowledge.json` without relying on any external AI APIs.
*   **Knowledge Expansion:** Scaled from 25 simple topics to **over 55 detailed spiritual topics** covering the Vedas, Upanishads, Jyotisha, Ayurveda, Samskaras, Tantra, and Yoga.
*   **Persona Design:** All answers now use the warm, compassionate voice of a Guru, addressing the user as "Vatsa" or "Priya Shishya."

## 🧠 Advanced Local AI Engine (`aiService.ts`)
*   **Fuzzy Matching:** Improved the `findTopTopicsMatch` logic to handle slight typos (e.g., "Ganesh Poja").
*   **Multi-Topic Combining:** Merges wisdom from multiple matching topics to formulate rich responses.

## ✨ 4K Divine Visual Overhaul
We transitioned the app into a premium spiritual space by injecting bespoke 4K cinematic AI images:

### Divine Loader (Ishta Devatha)
*   **18 High-Res Deity Images:** Replaced all bug-prone Wikimedia embeds with 18 newly generated, breathtaking 4K cinematic portraits (including Lord Shiva, Rama, Durga, Kali, Hanuman, etc.).
*   **Perfect Circle Layouts:** Rebuilt the Ishta Devatha selector CSS to strictly enforce `flexShrink: 0`, preventing image distortion.
*   **Seamless Rendering:** All deities now load flawlessly without waiting on third-party server bottlenecks.

### Homepage Enhancements
*   **Golden Cosmic Hero Background:** Exchanged the generic CSS background for an AI-generated 4K cinematic landscape of a majestic golden Hindu temple bathed in cosmic sunset light.
*   **Illuminated Typography:** Increased neon drop-shadows on the primary slogan (`drop-shadow-[0_0_20px_rgba(234,88,12,0.8)]`) to dramatically pop against the deep cosmic background.

> [!TIP]
> Your app is now an immersive, ultra-premium spiritual portal capable of generating offline knowledge visually matched by state-of-the-art UI graphics!




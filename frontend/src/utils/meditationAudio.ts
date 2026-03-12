/**
 * Meditation Audio Engine
 * Uses Web Audio API to generate authentic meditation sounds:
 *  - Om drones (layered oscillators)
 *  - Singing bowl simulations
 *  - Binaural beats for focus/sleep
 *  - Ambient nature textures (rain, wind, water)
 *  - Temple bells
 */

// Audio frequency presets per track category / deity
const TRACK_PRESETS: Record<string, {
    baseFreq: number;
    type: OscillatorType;
    harmonics: number[];
    beatFreq?: number; // binaural beat difference
    lfoRate: number; // vibrato rate
    lfoDepth: number; // vibrato depth
    gainLevel: number;
    filterFreq: number;
}> = {
    // Deity-specific tones
    'Shiva': { baseFreq: 136.1, type: 'sine', harmonics: [1, 2, 3], beatFreq: 4, lfoRate: 0.15, lfoDepth: 3, gainLevel: 0.25, filterFreq: 800 },
    'Krishna': { baseFreq: 261.6, type: 'sine', harmonics: [1, 1.5, 2], beatFreq: 6, lfoRate: 0.2, lfoDepth: 5, gainLevel: 0.2, filterFreq: 1200 },
    'Rama': { baseFreq: 174, type: 'sine', harmonics: [1, 2, 3], beatFreq: 7, lfoRate: 0.12, lfoDepth: 2, gainLevel: 0.22, filterFreq: 900 },
    'Durga': { baseFreq: 220, type: 'sine', harmonics: [1, 1.5, 2, 3], beatFreq: 5, lfoRate: 0.18, lfoDepth: 4, gainLevel: 0.22, filterFreq: 1000 },
    'Ganesha': { baseFreq: 196, type: 'sine', harmonics: [1, 2, 3, 4], beatFreq: 8, lfoRate: 0.1, lfoDepth: 3, gainLevel: 0.2, filterFreq: 1100 },
    'Vishnu': { baseFreq: 183.6, type: 'sine', harmonics: [1, 2, 3], beatFreq: 4.5, lfoRate: 0.13, lfoDepth: 3, gainLevel: 0.22, filterFreq: 900 },
    'Hanuman': { baseFreq: 164.8, type: 'sine', harmonics: [1, 2, 2.5, 3], beatFreq: 7.5, lfoRate: 0.16, lfoDepth: 4, gainLevel: 0.23, filterFreq: 1000 },
    'Lakshmi': { baseFreq: 221, type: 'sine', harmonics: [1, 1.5, 2, 3], beatFreq: 6, lfoRate: 0.2, lfoDepth: 5, gainLevel: 0.2, filterFreq: 1200 },
    'Surya': { baseFreq: 126.22, type: 'sine', harmonics: [1, 2, 3], beatFreq: 10, lfoRate: 0.08, lfoDepth: 2, gainLevel: 0.25, filterFreq: 800 },
    'Saraswati': { baseFreq: 246.9, type: 'sine', harmonics: [1, 2, 3, 5], beatFreq: 6, lfoRate: 0.25, lfoDepth: 6, gainLevel: 0.18, filterFreq: 1500 },
    'Shani': { baseFreq: 147.8, type: 'sine', harmonics: [1, 2, 3], beatFreq: 3, lfoRate: 0.08, lfoDepth: 2, gainLevel: 0.2, filterFreq: 600 },
    'Universal': { baseFreq: 136.1, type: 'sine', harmonics: [1, 2, 3, 4], beatFreq: 4, lfoRate: 0.1, lfoDepth: 3, gainLevel: 0.22, filterFreq: 800 },
};

const PURPOSE_BINAURAL: Record<string, number> = {
    'anxiety-relief': 3,   // Delta/Theta
    'deep-sleep': 2,       // Delta
    'morning-energy': 14,  // Beta
    'focus': 12,           // Alpha-Beta
    'stress-relief': 4,    // Theta
    'inner-peace': 6,      // Theta
    'heart-healing': 5,    // Theta
    'positive-energy': 10, // Alpha
};

export class MeditationAudioEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private oscillators: OscillatorNode[] = [];
    private gains: GainNode[] = [];
    private lfoOscillators: OscillatorNode[] = [];
    private filters: BiquadFilterNode[] = [];
    private ambientNodes: Map<string, { oscillators: OscillatorNode[]; gains: GainNode[]; noiseSource?: AudioBufferSourceNode }> = new Map();
    private isActive = false;
    private fadeTimeout: ReturnType<typeof setTimeout> | null = null;

    private getContext(): AudioContext {
        if (!this.ctx || this.ctx.state === 'closed') {
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    /**
     * Play meditation drone for a specific deity/category
     */
    playTrackDrone(deity: string, purposes: string[]): void {
        this.stopTrackDrone();

        const ctx = this.getContext();
        this.masterGain = ctx.createGain();
        this.masterGain.gain.setValueAtTime(0, ctx.currentTime);
        this.masterGain.connect(ctx.destination);

        const preset = TRACK_PRESETS[deity] || TRACK_PRESETS['Universal'];

        // Determine binaural beat frequency from purposes
        let binauralFreq = preset.beatFreq || 4;
        for (const p of purposes) {
            if (PURPOSE_BINAURAL[p]) {
                binauralFreq = PURPOSE_BINAURAL[p];
                break;
            }
        }

        // Create main filter
        const mainFilter = ctx.createBiquadFilter();
        mainFilter.type = 'lowpass';
        mainFilter.frequency.setValueAtTime(preset.filterFreq, ctx.currentTime);
        mainFilter.Q.setValueAtTime(1, ctx.currentTime);
        mainFilter.connect(this.masterGain);
        this.filters.push(mainFilter);

        // Create harmonic layers
        for (const harmMultiplier of preset.harmonics) {
            const freq = preset.baseFreq * harmMultiplier;
            const harmonicGain = 1 / (harmMultiplier * 1.5); // Reduce volume for higher harmonics

            // Left channel oscillator
            const oscL = ctx.createOscillator();
            oscL.type = preset.type;
            oscL.frequency.setValueAtTime(freq, ctx.currentTime);

            const gainL = ctx.createGain();
            gainL.gain.setValueAtTime(harmonicGain * preset.gainLevel, ctx.currentTime);

            // Right channel with binaural beat offset
            const oscR = ctx.createOscillator();
            oscR.type = preset.type;
            oscR.frequency.setValueAtTime(freq + binauralFreq, ctx.currentTime);

            const gainR = ctx.createGain();
            gainR.gain.setValueAtTime(harmonicGain * preset.gainLevel, ctx.currentTime);

            // LFO for gentle vibrato
            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(preset.lfoRate, ctx.currentTime);

            const lfoGain = ctx.createGain();
            lfoGain.gain.setValueAtTime(preset.lfoDepth, ctx.currentTime);

            lfo.connect(lfoGain);
            lfoGain.connect(oscL.frequency);
            lfoGain.connect(oscR.frequency);

            oscL.connect(gainL);
            gainL.connect(mainFilter);
            oscR.connect(gainR);
            gainR.connect(mainFilter);

            oscL.start();
            oscR.start();
            lfo.start();

            this.oscillators.push(oscL, oscR);
            this.gains.push(gainL, gainR);
            this.lfoOscillators.push(lfo);
        }

        // Add a subtle sub-bass hum
        const subOsc = ctx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(preset.baseFreq / 2, ctx.currentTime);
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.08, ctx.currentTime);
        subOsc.connect(subGain);
        subGain.connect(mainFilter);
        subOsc.start();
        this.oscillators.push(subOsc);
        this.gains.push(subGain);

        // Fade in over 3 seconds
        this.masterGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 3);
        this.isActive = true;
    }

    /**
     * Stop the main track drone with gentle fade-out
     */
    stopTrackDrone(): void {
        if (!this.ctx || !this.masterGain || !this.isActive) return;

        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Fade out over 2 seconds
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0, now + 2);

        // Clean up after fade
        this.fadeTimeout = setTimeout(() => {
            this.oscillators.forEach(o => { try { o.stop(); } catch { } });
            this.lfoOscillators.forEach(o => { try { o.stop(); } catch { } });
            this.oscillators = [];
            this.lfoOscillators = [];
            this.gains = [];
            this.filters = [];
            this.isActive = false;
        }, 2200);
    }

    /**
     * Toggle ambient sound layer
     */
    toggleAmbient(ambientId: string): boolean {
        if (this.ambientNodes.has(ambientId)) {
            this.stopAmbient(ambientId);
            return false;
        } else {
            this.startAmbient(ambientId);
            return true;
        }
    }

    private startAmbient(id: string): void {
        const ctx = this.getContext();
        const ambientGain = ctx.createGain();
        ambientGain.gain.setValueAtTime(0, ctx.currentTime);
        ambientGain.connect(ctx.destination);

        const nodes: { oscillators: OscillatorNode[]; gains: GainNode[]; noiseSource?: AudioBufferSourceNode } = {
            oscillators: [],
            gains: [ambientGain],
        };

        switch (id) {
            case 'bells': {
                // Simulate temple bells with metallic overtones
                const bellInterval = setInterval(() => {
                    if (!this.ambientNodes.has(id)) {
                        clearInterval(bellInterval);
                        return;
                    }
                    this.playBellStrike(ctx, ambientGain);
                }, 4000 + Math.random() * 3000); // Random interval 4-7s
                this.playBellStrike(ctx, ambientGain); // Play immediately
                (nodes as any)._interval = bellInterval;
                break;
            }
            case 'river': {
                // Brown noise filtered for water sound
                const noiseBuffer = this.createNoiseBuffer(ctx, 'brown');
                const noiseSource = ctx.createBufferSource();
                noiseSource.buffer = noiseBuffer;
                noiseSource.loop = true;

                const riverFilter = ctx.createBiquadFilter();
                riverFilter.type = 'bandpass';
                riverFilter.frequency.setValueAtTime(400, ctx.currentTime);
                riverFilter.Q.setValueAtTime(0.5, ctx.currentTime);

                const riverGain = ctx.createGain();
                riverGain.gain.setValueAtTime(0.15, ctx.currentTime);

                noiseSource.connect(riverFilter);
                riverFilter.connect(riverGain);
                riverGain.connect(ambientGain);
                noiseSource.start();
                nodes.noiseSource = noiseSource;
                nodes.gains.push(riverGain);
                break;
            }
            case 'wind': {
                // Filtered white noise with slow modulation
                const windBuffer = this.createNoiseBuffer(ctx, 'white');
                const windSource = ctx.createBufferSource();
                windSource.buffer = windBuffer;
                windSource.loop = true;

                const windFilter = ctx.createBiquadFilter();
                windFilter.type = 'lowpass';
                windFilter.frequency.setValueAtTime(300, ctx.currentTime);
                windFilter.Q.setValueAtTime(1, ctx.currentTime);

                // Modulate filter for "gusting" effect
                const windLfo = ctx.createOscillator();
                windLfo.type = 'sine';
                windLfo.frequency.setValueAtTime(0.1, ctx.currentTime);
                const windLfoGain = ctx.createGain();
                windLfoGain.gain.setValueAtTime(200, ctx.currentTime);
                windLfo.connect(windLfoGain);
                windLfoGain.connect(windFilter.frequency);
                windLfo.start();

                const wGain = ctx.createGain();
                wGain.gain.setValueAtTime(0.08, ctx.currentTime);

                windSource.connect(windFilter);
                windFilter.connect(wGain);
                wGain.connect(ambientGain);
                windSource.start();

                nodes.noiseSource = windSource;
                nodes.oscillators.push(windLfo);
                nodes.gains.push(wGain);
                break;
            }
            case 'om': {
                // Deep Om vibration drone
                const omOsc1 = ctx.createOscillator();
                omOsc1.type = 'sine';
                omOsc1.frequency.setValueAtTime(136.1, ctx.currentTime); // Om frequency

                const omOsc2 = ctx.createOscillator();
                omOsc2.type = 'sine';
                omOsc2.frequency.setValueAtTime(272.2, ctx.currentTime); // 2nd harmonic

                const omOsc3 = ctx.createOscillator();
                omOsc3.type = 'sine';
                omOsc3.frequency.setValueAtTime(68.05, ctx.currentTime); // Sub harmonic

                const omLfo = ctx.createOscillator();
                omLfo.type = 'sine';
                omLfo.frequency.setValueAtTime(0.08, ctx.currentTime);
                const omLfoGain = ctx.createGain();
                omLfoGain.gain.setValueAtTime(2, ctx.currentTime);
                omLfo.connect(omLfoGain);
                omLfoGain.connect(omOsc1.frequency);

                const gOm1 = ctx.createGain();
                gOm1.gain.setValueAtTime(0.15, ctx.currentTime);
                const gOm2 = ctx.createGain();
                gOm2.gain.setValueAtTime(0.08, ctx.currentTime);
                const gOm3 = ctx.createGain();
                gOm3.gain.setValueAtTime(0.1, ctx.currentTime);

                omOsc1.connect(gOm1); gOm1.connect(ambientGain);
                omOsc2.connect(gOm2); gOm2.connect(ambientGain);
                omOsc3.connect(gOm3); gOm3.connect(ambientGain);

                omOsc1.start(); omOsc2.start(); omOsc3.start(); omLfo.start();

                nodes.oscillators.push(omOsc1, omOsc2, omOsc3, omLfo);
                nodes.gains.push(gOm1, gOm2, gOm3);
                break;
            }
            case 'rain': {
                // Pink noise filtered for rain
                const rainBuffer = this.createNoiseBuffer(ctx, 'pink');
                const rainSource = ctx.createBufferSource();
                rainSource.buffer = rainBuffer;
                rainSource.loop = true;

                const rainFilter = ctx.createBiquadFilter();
                rainFilter.type = 'highpass';
                rainFilter.frequency.setValueAtTime(1000, ctx.currentTime);
                rainFilter.Q.setValueAtTime(0.5, ctx.currentTime);

                const rGain = ctx.createGain();
                rGain.gain.setValueAtTime(0.06, ctx.currentTime);

                rainSource.connect(rainFilter);
                rainFilter.connect(rGain);
                rGain.connect(ambientGain);
                rainSource.start();

                nodes.noiseSource = rainSource;
                nodes.gains.push(rGain);
                break;
            }
            case 'birds': {
                // Simulated bird chirps using frequency modulation
                const birdInterval = setInterval(() => {
                    if (!this.ambientNodes.has(id)) {
                        clearInterval(birdInterval);
                        return;
                    }
                    this.playBirdChirp(ctx, ambientGain);
                }, 2000 + Math.random() * 5000);
                this.playBirdChirp(ctx, ambientGain);
                (nodes as any)._interval = birdInterval;
                break;
            }
        }

        // Fade in ambient
        ambientGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5);
        this.ambientNodes.set(id, nodes);
    }

    private stopAmbient(id: string): void {
        const nodes = this.ambientNodes.get(id);
        if (!nodes || !this.ctx) return;

        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Fade out
        nodes.gains[0]?.gain.cancelScheduledValues(now);
        nodes.gains[0]?.gain.setValueAtTime(nodes.gains[0]?.gain.value || 0, now);
        nodes.gains[0]?.gain.linearRampToValueAtTime(0, now + 1);

        setTimeout(() => {
            nodes.oscillators.forEach(o => { try { o.stop(); } catch { } });
            if (nodes.noiseSource) { try { nodes.noiseSource.stop(); } catch { } }
            if ((nodes as any)._interval) clearInterval((nodes as any)._interval);
            this.ambientNodes.delete(id);
        }, 1200);
    }

    private playBellStrike(ctx: AudioContext, destination: AudioNode): void {
        const now = ctx.currentTime;
        const freq = 800 + Math.random() * 400; // Bell frequency variation

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 2);

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2.76, now); // Inharmonic partial for bell-like sound

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3);

        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0.06, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 2);

        osc.connect(gain);
        osc2.connect(gain2);
        gain.connect(destination);
        gain2.connect(destination);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + 3.5);
        osc2.stop(now + 2.5);
    }

    private playBirdChirp(ctx: AudioContext, destination: AudioNode): void {
        const now = ctx.currentTime;
        const baseFreq = 2000 + Math.random() * 2000;

        for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
            const startTime = now + i * 0.1;
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq + Math.random() * 500, startTime);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, startTime + 0.05);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.04, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);

            osc.connect(gain);
            gain.connect(destination);
            osc.start(startTime);
            osc.stop(startTime + 0.1);
        }
    }

    private createNoiseBuffer(ctx: AudioContext, type: 'white' | 'pink' | 'brown'): AudioBuffer {
        const bufferSize = ctx.sampleRate * 4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        if (type === 'white') {
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
        } else if (type === 'pink') {
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                b6 = white * 0.115926;
            }
        } else { // brown
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5;
            }
        }
        return buffer;
    }

    /**
     * Play a singing bowl strike (used for timer bell mode)
     */
    playSingingBowl(): void {
        const ctx = this.getContext();
        const now = ctx.currentTime;

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.3, now);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 6);
        masterGain.connect(ctx.destination);

        // Bowl fundamental + inharmonic partials
        const frequencies = [528, 1056, 1320, 1872, 2640]; // Perfect fifth series
        frequencies.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            // Slight detuning for richness
            osc.frequency.linearRampToValueAtTime(freq * 0.998, now + 5);

            const g = ctx.createGain();
            g.gain.setValueAtTime(0.3 / (i + 1), now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 4 + i);

            osc.connect(g);
            g.connect(masterGain);
            osc.start(now);
            osc.stop(now + 7);
        });
    }

    /**
     * Stop everything
     */
    stopAll(): void {
        if (this.fadeTimeout) {
            clearTimeout(this.fadeTimeout);
            this.fadeTimeout = null;
        }
        this.stopTrackDrone();

        // Stop all ambient sounds
        for (const id of this.ambientNodes.keys()) {
            this.stopAmbient(id);
        }
    }

    /**
     * Check if ambient is active
     */
    isAmbientActive(id: string): boolean {
        return this.ambientNodes.has(id);
    }

    /**
     * Check if engine is playing main track
     */
    get playing(): boolean {
        return this.isActive;
    }

    /**
     * Cleanup when component unmounts
     */
    destroy(): void {
        this.stopAll();
        setTimeout(() => {
            if (this.ctx && this.ctx.state !== 'closed') {
                this.ctx.close().catch(() => { });
            }
        }, 2500);
    }
}

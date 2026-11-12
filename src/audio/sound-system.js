/**
 * Синтез звуков через Web Audio API.
 */
import { MusicSystem } from './music-system.js';

export class SoundSystem {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.lastDrillTick = 0;
        this.music = new MusicSystem();
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.music.attach(this.ctx);
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) { this.music.release(); this.music.mode = 'silent'; }
        const label = document.getElementById('audio-status-label');
        if (label) label.textContent = this.enabled ? 'ЗВУК' : 'ВЫКЛ';
        return this.enabled;
    }

    updateMusic(game) {
        let mode = 'terminal';
        if (game.state === 'PLAYING') mode = 'run';
        if (!this.enabled || document.hidden || ['PAUSED', 'FATAL_SEQUENCE', 'DEAD'].includes(game.state)) mode = 'silent';
        const danger = game.drill && (game.drill.hull < game.drill.maxHull * 0.3 || game.drill.heat >= 85);
        this.music.update(mode, game.currentLayerNumber, danger);
    }

    playDrillHit(hardness = 1, isOverheated = false) {
        if (!this.enabled) return;
        const now = performance.now();
        if (now - this.lastDrillTick < 65) return;
        this.lastDrillTick = now;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = isOverheated ? 'square' : 'sawtooth';
        osc.frequency.setValueAtTime((isOverheated ? 55 : 85) + Math.random() * 25 * hardness, t);
        osc.frequency.exponentialRampToValueAtTime(34, t + 0.05);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.055);
    }

    playBlockBreak(isRareOre = false) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        if (isRareOre) {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, t);
            osc.frequency.setValueAtTime(780, t + 0.05);
            osc.frequency.setValueAtTime(1040, t + 0.10);
            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.005, t + 0.24);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.25);
        } else {
            osc.type = 'square';
            osc.frequency.setValueAtTime(135, t);
            osc.frequency.exponentialRampToValueAtTime(42, t + 0.09);
            gain.gain.setValueAtTime(0.07, t);
            gain.gain.exponentialRampToValueAtTime(0.005, t + 0.09);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.10);
        }
    }

    playRocketLaunch() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(620, t + 0.16);
        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.17);
    }

    playTeslaZap() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'IIRFilter' in window ? 'sawtooth' : 'square';
        osc.frequency.setValueAtTime(980, t);
        osc.frequency.setValueAtTime(420, t + 0.04);
        osc.frequency.setValueAtTime(1250, t + 0.08);
        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.16);
    }

    playLaserPulse() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(210, t + 0.13);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.13);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.14);
    }

    playHazardExplosion() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(24, t + 0.36);
        gain.gain.setValueAtTime(0.20, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.36);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.38);
    }

    playTectonicAlarm() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        [0, 0.14].forEach((offset) => {
            const t = this.ctx.currentTime + offset;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(640, t);
            osc.frequency.exponentialRampToValueAtTime(390, t + 0.11);
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.005, t + 0.11);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.12);
        });
    }

    playStationDock() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        const notes = [330, 440, 554.37, 659.25];
        notes.forEach((freq, idx) => {
            const t = this.ctx.currentTime + idx * 0.06;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.10, t);
            gain.gain.exponentialRampToValueAtTime(0.005, t + 0.26);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.28);
        });
    }
}

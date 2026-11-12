/** Оригинальная синтезаторная партитура: спокойный терминал и ритмичный спуск. */
export class MusicSystem {
    constructor() {
        this.enabled = true;
        this.volume = 0.35;
        this.ctx = null;
        this.output = null;
        this.voices = new Set();
        this.mode = 'silent';
        this.step = 0;
        this.nextTime = 0;
        this.appliedVolume = this.volume;
    }

    attach(ctx) {
        if (this.ctx) return;
        this.ctx = ctx;
        this.output = ctx.createGain();
        this.output.gain.value = this.volume;
        this.output.connect(ctx.destination);
        // Собственный шум не расходует генератор случайных чисел игрового мира.
        this.noise = ctx.createBuffer(1, ctx.sampleRate / 4, ctx.sampleRate);
        const samples = this.noise.getChannelData(0);
        let seed = 7919;
        for (let i = 0; i < samples.length; i++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            samples[i] = seed / 2147483648 - 1;
        }
    }

    release() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        for (const { source, gain } of this.voices) {
            gain.gain.cancelAndHoldAtTime(now);
            gain.gain.linearRampToValueAtTime(0, now + 0.025);
            source.stop(now + 0.03);
        }
        this.voices.clear();
    }

    update(mode, layer = 1, danger = false) {
        if (!this.ctx) return;
        if (!this.enabled || this.ctx.state !== 'running') mode = 'silent';
        if (this.mode !== mode) {
            this.release();
            this.mode = mode;
            this.step = 0;
            this.nextTime = this.ctx.currentTime + 0.04;
        }
        if (this.appliedVolume !== this.volume) {
            this.output.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.04);
            this.appliedVolume = this.volume;
        }
        if (mode === 'silent' || this.volume === 0) return;
        const tick = 60 / (mode === 'run' ? 118 : 82) / 4;
        // После торможения вкладки не догоняем пропущенные такты залпом нот.
        if (this.nextTime < this.ctx.currentTime) this.nextTime = this.ctx.currentTime + 0.02;
        while (this.nextTime < this.ctx.currentTime + 0.18) {
            this.scheduleStep(this.step++, this.nextTime, tick, mode, layer, danger);
            this.nextTime += tick;
        }
    }

    voice(source, time, duration, level, filter = null) {
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(level, time + Math.min(0.015, duration / 4));
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        if (filter) { source.connect(filter); filter.connect(gain); }
        else source.connect(gain);
        gain.connect(this.output);
        const voice = { source, gain };
        this.voices.add(voice);
        source.onended = () => {
            source.disconnect(); filter?.disconnect(); gain.disconnect();
            this.voices.delete(voice);
        };
        source.start(time);
        source.stop(time + duration + 0.015);
    }

    note(midi, time, duration, level, type = 'triangle') {
        const source = this.ctx.createOscillator();
        source.type = type;
        source.frequency.value = 440 * 2 ** ((midi - 69) / 12);
        this.voice(source, time, duration, level);
    }

    drum(time, snare = false, hat = false) {
        if (!snare && !hat) {
            const source = this.ctx.createOscillator();
            source.frequency.setValueAtTime(125, time);
            source.frequency.exponentialRampToValueAtTime(38, time + 0.13);
            this.voice(source, time, 0.19, 0.24);
            return;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = this.noise;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = hat ? 6500 : 1500;
        this.voice(source, time, hat ? 0.045 : 0.13, hat ? 0.055 : 0.11, filter);
    }

    scheduleStep(step, time, tick, mode, layer, danger) {
        const bar = Math.floor(step / 16) % 16;
        const beat = step % 16;
        const roots = [38, 34, 41, 36, 38, 34, 43, 33];
        const root = roots[bar % 8];
        const third = [38, 43].includes(root) ? 3 : 4;
        const chord = [0, third, 7, 12];
        const running = mode === 'run';
        if (beat === 0) {
            for (const interval of chord.slice(0, 3)) {
                this.note(root + 24 + interval, time, tick * 14, running ? 0.023 : 0.035, 'sine');
            }
        }
        if (beat % (running ? 2 : 8) === 0) {
            const octave = running && beat === 10 ? 12 : 0;
            this.note(root + octave, time, tick * (running ? 1.5 : 6), running ? 0.1 : 0.065);
        }
        // Четыре фразы: вступление, ответ, разреженный мост и финальная вариация.
        const phrase = Math.floor(bar / 4);
        const arp = [0, 2, 1, 3, 2, 1, 3, 2];
        if (beat % 2 === 0 && (phrase !== 2 || beat % 4 === 0)) {
            const offset = (Math.floor(beat / 2) + (bar % 2) + (layer % 3)) % arp.length;
            this.note(root + 24 + chord[arp[offset]], time, tick * 1.4, running ? 0.042 : 0.026);
        }
        if (running && phrase !== 0 && [3, 6, 11, 14].includes(beat)) {
            const melody = [7, 12, third, 7];
            this.note(root + 36 + melody[[3, 6, 11, 14].indexOf(beat)], time, tick * 2.3, 0.035, 'sine');
        }
        if (!running) return;
        if (beat === 0 || beat === 8 || (phrase === 3 && beat === 14)) this.drum(time);
        if (beat === 4 || beat === 12) this.drum(time, true);
        if (beat % 2 === 0 || (danger && beat % 4 === 3)) this.drum(time, false, true);
    }
}

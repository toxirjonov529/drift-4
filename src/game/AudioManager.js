// Tashqi audio fayl kerak emas: WebAudio sintezatori. Keyin public/audio/ dan fayl yuklash mumkin.
export class AudioManager {
  constructor() { this.muted = false; this.ctx = null; }
  start() {
    if (this.ctx) { this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const c = this.ctx = new C();
    this.eng = c.createOscillator(); this.eng.type = 'sawtooth';
    this.eg = c.createGain(); this.eg.gain.value = 0; const lp = c.createBiquadFilter(); lp.frequency.value = 700;
    this.eng.connect(lp).connect(this.eg).connect(c.destination); this.eng.start();
    const buf = c.createBuffer(1, c.sampleRate, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const n = c.createBufferSource(); n.buffer = buf; n.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800;
    this.sg = c.createGain(); this.sg.gain.value = 0; n.connect(bp).connect(this.sg).connect(c.destination); n.start();
  }
  update(speed, gas, slip, nitro) {
    if (!this.ctx) return; const t = this.ctx.currentTime, m = this.muted ? 0 : 1;
    this.eng.frequency.setTargetAtTime(45 + speed * 2.2 + (nitro ? 30 : 0), t, 0.08);
    this.eg.gain.setTargetAtTime(m * (0.05 + (gas ? 0.07 : 0)), t, 0.1);
    this.sg.gain.setTargetAtTime(m * Math.min(0.12, Math.max(0, slip - 2) * 0.012), t, 0.05);
  }
  silence() { if (this.ctx) { this.eg.gain.value = 0; this.sg.gain.value = 0; } }
}

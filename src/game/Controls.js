export class Controls {
  constructor() {
    this.k = {};
    addEventListener('keydown', e => { this.k[e.code] = 1; if (e.code === 'Space') e.preventDefault(); });
    addEventListener('keyup', e => { this.k[e.code] = 0; });
    const w = document.getElementById('wheel'); this.wheel = 0; let id = null;
    const set = e => { const r = w.getBoundingClientRect(), a = Math.atan2(e.clientX - r.left - r.width / 2, -(e.clientY - r.top - r.height / 2)) * 57.3, c = Math.max(-120, Math.min(120, a)); w.style.transform = `rotate(${c}deg)`; this.wheel = c / 90; };
    w.addEventListener('pointerdown', e => { e.preventDefault(); id = e.pointerId; w.setPointerCapture(id); w.style.transition = 'none'; set(e); });
    w.addEventListener('pointermove', e => { if (e.pointerId === id) set(e); });
    const up = e => { if (e.pointerId !== id) return; id = null; w.style.transition = 'transform .25s'; w.style.transform = 'rotate(0)'; this.wheel = 0; };
    w.addEventListener('pointerup', up); w.addEventListener('pointercancel', up);
    document.querySelectorAll('[data-k]').forEach(b => {
      const n = 't' + b.dataset.k;
      b.addEventListener('pointerdown', e => { e.preventDefault(); this.k[n] = 1; });
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { this.k[n] = 0; });
    });
  }
  read() {
    const k = this.k;
    return { gas: k.KeyW || k.ArrowUp || k.tgas, brake: k.KeyS || k.ArrowDown || k.tbrake, hand: k.Space || k.thand, nitro: k.ShiftLeft || k.ShiftRight || k.tnitro,
      steer: Math.max(-1, Math.min(1, (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0) + this.wheel)) };
  }
}

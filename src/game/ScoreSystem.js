export class ScoreSystem {
  constructor() { this.reset(); }
  reset() { this.total = 0; this.cur = 0; this.t = 0; this.grace = 0; }
  get mult() { return 1 + Math.min(this.t, 10) * 0.3; }
  update(dt, angle, speed) {
    if (angle > 14 && speed > 8) { this.t += dt; this.cur += Math.min(angle, 90) * speed * dt * 0.04 * this.mult; this.grace = 0.6; }
    else if (this.cur > 0 && (this.grace -= dt) <= 0) this.bank();
  }
  bank() { this.total += Math.round(this.cur); this.cur = 0; this.t = 0; }
  crash() { this.cur = 0; this.t = 0; }
}

const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
export class Physics {
  constructor() { this.reset(0, 0, 0); }
  reset(x, z, h) { Object.assign(this, { x, z, h, vx: 0, vz: 0, yaw: 0, steer: 0, nitro: 1, angle: 0, speed: 0, vF: 0, slip: 0, nitroOn: false }); }
  step(dt, c, i) {
    const sin = Math.sin(this.h), cos = Math.cos(this.h), max = c.topSpeed / 3.6;
    let vF = this.vx * sin + this.vz * cos, vS = -this.vx * cos + this.vz * sin; // vS: o'ng tomon (+)
    this.nitroOn = i.nitro && i.gas && this.nitro > 0.02;
    this.nitro = this.nitroOn ? this.nitro - dt / 3 : Math.min(1, this.nitro + dt / 10);
    if (i.gas) vF += c.accel * 3.5 * (this.nitroOn ? 1.8 : 1) * Math.max(0.05, 1 - Math.max(0, vF) / (max * (this.nitroOn ? 1.25 : 1))) * dt;
    if (i.brake) vF -= (vF > 0.5 ? 24 : 7) * dt;
    vF = Math.max(vF, -8);
    vF -= (vF * 0.1 + (i.gas ? 0 : Math.sign(vF) * 1.5)) * dt;
    let grip = 8; // yon sirpanishga qarshilik
    if (i.gas && Math.abs(this.steer) > 0.45 && vF > 11) grip = Math.max(2, 5 - c.drift * 0.32); // quvvat bilan oversteer
    if (i.hand) { grip = 1.1; vF *= Math.exp(-0.45 * dt); }
    vS *= Math.exp(-grip * dt);
    this.steer += (i.steer - this.steer) * Math.min(1, dt * 7);
    const sp = Math.abs(vF), dir = vF < -0.5 ? -1 : 1;
    const yawT = this.steer * (1.15 + c.handling * 0.06) * Math.min(1, sp / 6) / (1 + sp / 45) * dir * (i.hand ? 1.6 : 1);
    this.yaw += (yawT - this.yaw) * Math.min(1, dt * (i.hand ? 4 : 9));
    this.h -= this.yaw * dt; // o'ngga burilish = h kamayadi
    const s2 = Math.sin(this.h), c2 = Math.cos(this.h);
    this.vx = vF * s2 - vS * c2; this.vz = vF * c2 + vS * s2;
    this.x += this.vx * dt; this.z += this.vz * dt;
    this.speed = Math.hypot(this.vx, this.vz); this.vF = vF; this.slip = Math.abs(vS);
    this.angle = this.speed > 3 && vF > 0 ? Math.abs(wrap(Math.atan2(this.vx, this.vz) - this.h)) * 57.3 : 0;
  }
}

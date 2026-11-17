import { Car } from './Car.js';
import { CARS } from '../data/cars.js';
const st = t => { const e = document.getElementById('nstat'); if (e) e.textContent = t; };
export class Network {
  constructor(game) { this.g = game; this.remotes = new Map(); this.ws = null; this.acc = 0; this.ids = []; }
  join(room) {
    this.leave(); st('Ulanmoqda...');
    try { this.ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.hostname + ':3001'); } catch { return st('Ulanib bo\'lmadi'); }
    this.ws.onopen = () => this.ws.send(JSON.stringify({ t: 'join', room: room || 'ROOM1' }));
    this.ws.onerror = () => st('Server topilmadi. Terminalda "npm run server" ni ishga tushiring.');
    this.ws.onmessage = e => this.msg(JSON.parse(e.data));
  }
  go() { if (this.ws?.readyState === 1) this.ws.send('{"t":"go"}'); else st('Avval xonaga ulaning'); }
  msg(m) {
    if (m.t === 'room') { this.id = m.id; this.ids = m.ids; st(`Xonada: ${m.ids.length}/4 o'yinchi`); for (const [k, r] of this.remotes) if (!m.ids.includes(k)) { this.g.scene.remove(r.car.group); this.remotes.delete(k); } }
    else if (m.t === 's') {
      let r = this.remotes.get(m.id);
      if (!r) { const car = new Car(CARS[m.car] || CARS[0]); car.group.children.filter(o => o.isPointLight).forEach(o => car.group.remove(o)); car.group.rotation.order = 'YXZ'; this.g.scene.add(car.group); r = { car, x: m.x, z: m.z, h: m.h, pr: 0 }; this.remotes.set(m.id, r); }
      Object.assign(r, { tx: m.x, tz: m.z, th: m.h, pr: m.pr, sp: m.sp });
    } else if (m.t === 'go') this.g.startMode('race', Math.max(0, m.ids.indexOf(this.id)));
  }
  tick(dt, s) { if (this.ws?.readyState !== 1) return; this.acc += dt; if (this.acc > 0.066) { this.acc = 0; this.ws.send(JSON.stringify({ t: 's', ...s })); } }
  update(dt, show) {
    for (const r of this.remotes.values()) {
      const g = r.car.group; g.visible = show && r.tx !== undefined; if (r.tx === undefined) continue;
      const k = 1 - Math.exp(-12 * dt); r.x += (r.tx - r.x) * k; r.z += (r.tz - r.z) * k; r.h += Math.atan2(Math.sin(r.th - r.h), Math.cos(r.th - r.h)) * k;
      g.position.set(r.x, 0, r.z); g.rotation.y = r.h; r.car.spinWheels((r.sp || 0) * dt);
    }
  }
  leave() { this.ws?.close(); this.ws = null; this.remotes.forEach(r => this.g.scene.remove(r.car.group)); this.remotes.clear(); }
}

import * as THREE from 'three';
import { Track } from './Track.js';
import { Car } from './Car.js';
import { CameraRig } from './Camera.js';
import { Physics } from './Physics.js';
import { ScoreSystem } from './ScoreSystem.js';
import { Controls } from './Controls.js';
import { Effects } from './Effects.js';
import { AudioManager } from './AudioManager.js';
import { UI } from '../ui/UI.js';
import { Network } from './Network.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CARS } from '../data/cars.js';
import { load, save } from '../utils/storage.js';

export class Game {
  constructor(container, onProgress) {
    const mobile = /Android|iPhone|iPad|Mobi/i.test(navigator.userAgent) || innerWidth < 800;
    this.quality = mobile ? 'low' : 'high';
    this.renderer = new THREE.WebGLRenderer({ antialias: !mobile, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2)); this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.shadowMap.enabled = !mobile; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x07070f); this.scene.fog = new THREE.FogExp2(0x07070f, 0.005);
    this.scene.add(new THREE.HemisphereLight(0x5566aa, 0x110a20, 1.4));
    this.sun = new THREE.DirectionalLight(0x8899ff, 1.1); this.sun.castShadow = !mobile;
    Object.assign(this.sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 200 }); this.sun.shadow.mapSize.set(2048, 2048);
    this.scene.add(this.sun, this.sun.target);
    onProgress?.(30, 'Trassa yaratilmoqda...');
    this.track = new Track(this.scene, this.quality); onProgress?.(70, 'Avtomobil tayyorlanmoqda...');
    this.save = load(); this.phys = new Physics(); this.score = new ScoreSystem(); this.fx = new Effects(this.scene);
    this.controls = new Controls(); this.audio = new AudioManager(); this.audio.muted = !this.save.sound;
    this.rig = new CameraRig(innerWidth / innerHeight); if (!mobile) { // bloom (porlash) va yo'l akslari faqat kompyuterda
      this.scene.environment = new THREE.PMREMGenerator(this.renderer).fromScene(new RoomEnvironment(), 0.04).texture;
      this.composer = new EffectComposer(this.renderer); this.composer.addPass(new RenderPass(this.scene, this.rig.camera));
      this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.8, 0.55, 0.82)); this.composer.addPass(new OutputPass());
    }
    this.state = 'menu'; this.time = 0; this.hit = 0;
    this.net = new Network(this); this.setCar(this.save.car); this.makeAI(); this.resetCar(0); this.ui = new UI(this); this.clock = new THREE.Clock();
    addEventListener('resize', () => { this.renderer.setSize(innerWidth, innerHeight); this.composer?.setSize(innerWidth, innerHeight); this.rig.camera.aspect = innerWidth / innerHeight; this.rig.camera.updateProjectionMatrix(); });
    addEventListener('keydown', e => {
      if (this.state !== 'play' && !(this.state === 'paused' && e.code === 'Escape')) return;
      if (e.code === 'KeyC') this.rig.next(); if (e.code === 'KeyR') this.respawn();
      if (e.code === 'Escape') { this.state = this.state === 'play' ? 'paused' : 'play'; this.ui.show(this.state === 'play' ? 'hud' : 'pause'); }
    });
    onProgress?.(100, 'Tayyor!');
  }
  get spec() { return CARS[this.save.car]; }
  setCar(i) {
    if (this.car) this.scene.remove(this.car.group);
    this.car = new Car(CARS[i]); this.car.wheels.forEach(w => (w.rotation.order = 'YXZ')); this.car.group.rotation.order = 'YXZ';
    if (this.quality === 'high') { const sp = new THREE.SpotLight(0xfff2cc, 150, 70, 0.5, 0.6); sp.position.set(0, 0.8, 2); sp.target.position.set(0, 0, 25); this.car.group.add(sp, sp.target); } this.scene.add(this.car.group);
    this.paint(this.save.colors[CARS[i].id] ?? CARS[i].color, this.save.car !== i ? CARS[i].id : CARS[i].id);
  }
  paint(hex) {
    const id = CARS[this.ui?.gi ?? this.save.car].id; this.save.colors[id] = hex;
    const f = this.save.finish || 'gloss', pr = f === 'matte' ? { metalness: 0.1, roughness: 0.85, clearcoat: 0 } : f === 'metal' ? { metalness: 1, roughness: 0.18, clearcoat: 0.6 } : { metalness: 0.6, roughness: 0.25, clearcoat: 1 };
    this.car.group.traverse(o => { if (o.isMesh && o.material.userData.paint) { o.material.color.setHex(hex); Object.assign(o.material, pr); } if (o.isPointLight) o.color.setHex(hex); });
  }
  resetCar(idx) { const f = this.track.frame(idx / 400); this.phys.reset(f.p.x, f.p.z, Math.atan2(f.tan.x, f.tan.z)); this.sync(0); }
  nearest() { const s = this.track.samples, p = this.phys; let b = 0, bd = 1e9; for (let i = 0; i < s.length - 1; i++) { const d = (s[i].x - p.x) ** 2 + (s[i].z - p.z) ** 2; if (d < bd) { bd = d; b = i; } } return b; }
  makeAI() {
    this.ai = [0, 1, 2].map(i => {
      const car = new Car(CARS[(this.save.car + 1 + i * 2) % CARS.length]); car.wheels.forEach(w => (w.rotation.order = 'YXZ'));
      car.group.children.filter(o => o.isPointLight).forEach(o => car.group.remove(o)); car.group.visible = false; this.scene.add(car.group);
      return { car, lap: 0, t: 0, off: [-3.5, 3.5, 0][i], v: 25 + i * 3, ph: i * 2 };
    });
  }
  updateAI(dt) {
    const p = this.phys;
    for (const a of this.ai) {
      const v = a.v * (1 + 0.12 * Math.sin(this.clk + a.ph)); const pt = a.t; a.t = (a.t + v * dt / this.track.length) % 1; if (a.t < pt) a.lap++;
      const f = this.track.frame(a.t), o = a.off * 0.6 + Math.sin(this.clk * 0.5 + a.ph) * 2, g = a.car.group;
      g.position.set(f.p.x + f.n.x * o, 0, f.p.z + f.n.z * o); g.rotation.y = Math.atan2(f.tan.x, f.tan.z); a.car.spinWheels(v * dt);
      const dx = p.x - g.position.x, dz = p.z - g.position.z, d = Math.hypot(dx, dz);
      if (d < 2.6 && d > 0.01) { p.x += dx / d * (2.6 - d); p.z += dz / d * (2.6 - d); p.vx *= 0.97; p.vz *= 0.97; }
    }
  }
  respawn() { this.resetCar(this.nearest()); this.score.crash(); }
  startMode(m, slot = -1) {
    this.online = slot >= 0; this.lap = 1; this.lastIdx = 0; this.prog = 0; this.bonus = 0; this.mode = m; this.state = 'play'; this.time = m === 'challenge' ? 90 : 0; this.score.reset(); this.half = false; this.resetCar(0); this.ai.forEach((a, i) => { a.t = 0.004 * (i + 1); a.lap = 0; });
    if (slot >= 0) { const f = this.track.frame(0), o = (slot - 1.5) * 3; this.phys.x += f.n.x * o; this.phys.z += f.n.z * o; }
    this.ui.show('hud'); this.audio.start();
  }
  finish(text) {
    this.score.bank(); const sv = this.save; sv.money += Math.round(this.score.total / 20) + (this.mode === 'attack' ? 300 : 0) + (this.bonus || 0);
    sv.bestScore = Math.max(sv.bestScore, this.score.total); this.state = 'result'; this.audio.silence(); save(sv);
    this.ui.show('result', text ?? `Ball: ${this.score.total}<br>Yutuq: $${Math.round(this.score.total / 20)}`);
  }
  sync(dt) {
    const p = this.phys, g = this.car.group; g.position.set(p.x, 0, p.z); const acc = dt ? (p.vF - (this.pv || 0)) / dt : 0; this.pv = p.vF; this.pa = (this.pa || 0) + (acc - (this.pa || 0)) * Math.min(1, dt * 6);
    g.rotation.set(Math.max(-0.04, Math.min(0.04, -this.pa * 0.003)), p.h, -p.steer * 0.05 * Math.min(1, p.speed / 25)); this.car.tl.emissiveIntensity = this.inp?.brake ? 6 : 1.5; this.car.spinWheels(p.vF * dt);
    this.car.wheels[0].rotation.y = this.car.wheels[1].rotation.y = -p.steer * 0.45;
    this.sun.position.set(p.x + 40, 80, p.z + 30); this.sun.target.position.copy(g.position);
  }
  update(dt) {
    const p = this.phys; this.clk = (this.clk || 0) + dt; const racing = this.state === 'play' || this.state === 'paused'; this.ai.forEach(a => (a.car.group.visible = racing && !this.online)); this.net.update(dt, racing && this.online);
    if (this.state === 'play') {
      const inp = this.inp = this.controls.read(); p.step(dt, this.spec, inp); if (!this.online) this.updateAI(dt);
      const idx = this.nearest(), c = this.track.samples[idx], lim = this.track.width / 2 + 0.9, dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz);
      if (d > lim) { // to'siq bilan to'qnashuv
        const nx = dx / d, nz = dz / d, vn = p.vx * nx + p.vz * nz; p.x = c.x + nx * lim; p.z = c.z + nz * lim;
        if (vn > 0) { p.vx = (p.vx - vn * nx * 1.4) * 0.8; p.vz = (p.vz - vn * nz * 1.4) * 0.8; if (vn > 6) this.score.crash(); }
      }
      if (this.lastIdx > 340 && idx < 60) this.lap++; else if (this.lastIdx < 60 && idx > 340 && this.lap > 1) this.lap--;
      this.lastIdx = idx; this.prog = (this.lap - 1) * 400 + idx;
      const others = this.online ? [...this.net.remotes.values()].map(r => r.pr || 0) : this.ai.map(a => a.lap * 400 + a.t * 400);
      this.rank = 1 + others.filter(x => x > this.prog).length; this.total = others.length + 1;
      if (this.online) this.net.tick(dt, { x: p.x, z: p.z, h: p.h, car: this.save.car, pr: this.prog, sp: p.speed });
      if (this.mode === 'race' && this.lap > 3) { this.bonus = (this.total - this.rank + 1) * 200; this.finish(`O'rin: ${this.rank}/${this.total}<br>Vaqt: ${this.time.toFixed(1)} s<br>Ball: ${this.score.total}`); }
      this.score.update(dt, p.angle, p.speed); this.time += this.mode === 'challenge' ? -dt : dt;
      if (this.mode === 'challenge' && this.time <= 0) this.finish();
      if (this.mode === 'attack') { if (idx > 200) this.half = true; if (this.half && idx < 15) { this.time > 0 && (this.save.bestLap = Math.min(this.save.bestLap || 1e9, this.time)); this.finish(`Vaqt: ${this.time.toFixed(2)} s`); } }
      if (p.slip > 3.5 && p.speed > 6) { const s = Math.sin(p.h), co = Math.cos(p.h); for (const k of [-0.9, 0.9]) this.fx.emit(p.x - s * 1.4 - co * k, p.z - co * 1.4 + s * k, p.h, p.slip); }
      this.audio.update(p.speed, inp.gas, p.slip, p.nitroOn); this.ui.update(p, this.score, this.time, this.rank || 1, this.total || 1, this.lap, this.mode === 'race' ? 3 : 0);
    }
    if (this.state !== 'paused') this.sync(dt);
    this.fx.update(dt); this.rig.update(dt, this.car, p.speed * 3.6); this.composer ? this.composer.render() : this.renderer.render(this.scene, this.rig.camera);
  }
  start() { this.renderer.setAnimationLoop(() => this.update(Math.min(this.clock.getDelta(), 0.05))); }
}

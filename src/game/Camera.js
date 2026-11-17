import * as THREE from 'three';

export const CAM_MODES = ['Third Person', 'Hood Camera', 'First Person', 'Cinematic'];

export class CameraRig {
  constructor(aspect) {
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 1500);
    this.mode = 0; this.pos = new THREE.Vector3(); this.look = new THREE.Vector3(); this.t = 0;
  }
  next() { this.mode = (this.mode + 1) % CAM_MODES.length; }

  update(dt, car, speed) {
    const g = car.group, fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(g.quaternion);
    let target, look, fov = 65 + Math.min(speed, 80) * 0.25; // tezlikka qarab FOV
    this.t += dt; const m = this.force ?? this.mode;
    if (m === 0) { target = g.position.clone().addScaledVector(fwd, -9).setY(3.6); look = g.position.clone().addScaledVector(fwd, 8).setY(1); }
    else if (m === 1) { target = g.position.clone().addScaledVector(fwd, 0.6).setY(1.3); look = g.position.clone().addScaledVector(fwd, 20).setY(1.1); }
    else if (m === 2) { target = g.position.clone().addScaledVector(fwd, -0.2).setY(1.15); look = g.position.clone().addScaledVector(fwd, 20).setY(1.05); }
    else { const a = this.t * 0.4; target = g.position.clone().add(new THREE.Vector3(Math.cos(a) * 12, 3 + Math.sin(a * 0.7) * 1.5, Math.sin(a) * 12)); look = g.position.clone().setY(0.8); fov = 50; }
    const k = m === 0 || m === 3 ? 1 - Math.exp(-5 * dt) : 1; // hood/FP qattiq
    this.pos.lerp(target, k); this.look.lerp(look, m === 3 ? k : 1 - Math.exp(-12 * dt));
    this.camera.position.copy(this.pos); this.camera.lookAt(this.look);
    this.camera.fov += (fov - this.camera.fov) * (1 - Math.exp(-4 * dt)); this.camera.updateProjectionMatrix();
  }
}

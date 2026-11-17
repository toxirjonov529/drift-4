import * as THREE from 'three';
export class Effects {
  constructor(scene) {
    this.N = 160; this.pos = new Float32Array(this.N * 3); this.col = new Float32Array(this.N * 3); this.life = new Float32Array(this.N); this.i = 0;
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.smoke = new THREE.Points(geo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), size: 3.2, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.smoke.frustumCulled = false; scene.add(this.smoke);
    this.M = 700; this.skid = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.28, 0.8).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false }), this.M);
    this.skid.frustumCulled = false; this.sk = 0; this.m = new THREE.Matrix4(); this.hide = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let k = 0; k < this.M; k++) this.skid.setMatrixAt(k, this.hide); scene.add(this.skid);
  }
  emit(wx, wz, h, slip) {
    const k = this.i++ % this.N; this.pos.set([wx, 0.3, wz], k * 3); this.life[k] = 1;
    this.m.makeRotationY(h).setPosition(wx, 0.035, wz); this.skid.setMatrixAt(this.sk++ % this.M, this.m); this.skid.instanceMatrix.needsUpdate = true;
  }
  update(dt) {
    for (let k = 0; k < this.N; k++) {
      if (this.life[k] <= 0) { this.col.fill(0, k * 3, k * 3 + 3); continue; }
      this.life[k] -= dt * 0.9; this.pos[k * 3 + 1] += dt * 1.6; const v = Math.max(0, this.life[k]) * 0.35; this.col.set([v, v, v * 1.1], k * 3);
    }
    this.smoke.geometry.attributes.position.needsUpdate = true; this.smoke.geometry.attributes.color.needsUpdate = true;
  }
}

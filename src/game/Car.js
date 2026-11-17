import * as THREE from 'three';

export class Car {
  constructor(spec) { this.group = new THREE.Group(); this.wheels = []; this.build(spec); }

  build(s) {
    const g = this.group, L = s.len, W = s.wid, M = THREE.MeshStandardMaterial;
    const paint = new THREE.MeshPhysicalMaterial({ color: s.color, metalness: 0.6, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 }); paint.userData.paint = true;
    const dark = new M({ color: 0x0b0b0e, metalness: 0.5, roughness: 0.5 }), glass = new THREE.MeshPhysicalMaterial({ color: 0x080c14, metalness: 0.9, roughness: 0.05 });
    const prof = (pts, d, mat) => { // yon profil (uzunlik, balandlik) -> kenglik bo'yicha extrude
      const sh = new THREE.Shape(); pts.forEach(([z, y], i) => (i ? sh.lineTo(z, y) : sh.moveTo(z, y)));
      const geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 });
      geo.translate(0, 0, -d / 2); geo.rotateY(-Math.PI / 2); const m = new THREE.Mesh(geo, mat); m.castShadow = true; g.add(m); return m;
    };
    const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    const top = 0.8 + s.cabin * 0.55;
    prof([[-L / 2, 0.3], [L / 2, 0.3], [L / 2, 0.55], [L * 0.36, 0.74], [L * 0.15, 0.8], [-L * 0.3, 0.82], [-L / 2, 0.76]], W, paint);
    prof([[L * 0.17, 0.8], [L * 0.03, top], [-L * 0.2, top], [-L * 0.32, 0.82]], W * 0.86, glass);
    box(W * 0.78, 0.04, L * 0.23, paint, 0, top + 0.03, -L * 0.085);
    box(W * 1.04, 0.06, 0.3, dark, 0, 0.27, L / 2); box(W * 1.02, 0.08, 0.3, dark, 0, 0.3, -L / 2);
    for (const x of [-1, 1]) { box(0.08, 0.12, L * 0.5, dark, x * (W / 2 + 0.03), 0.34, 0); const e = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 10).rotateX(Math.PI / 2), new M({ color: 0x999999, metalness: 1, roughness: 0.2 })); e.position.set(x * 0.4, 0.3, -L / 2 - 0.08); g.add(e); }
    if (s.spoiler) { box(W * 0.95, 0.05, 0.38, dark, 0, 1.08, -L / 2 + 0.1); for (const x of [-1, 1]) box(0.06, 0.3, 0.2, dark, x * W * 0.32, 0.92, -L / 2 + 0.1); }
    const hl = new M({ color: 0xffffff, emissive: 0xfff2cc, emissiveIntensity: 2 }), tl = new M({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.5 }); this.tl = tl;
    for (const x of [-1, 1]) box(0.5, 0.07, 0.06, hl, x * W * 0.32, 0.62, L / 2 + 0.03);
    box(W * 0.85, 0.07, 0.05, tl, 0, 0.68, -L / 2 - 0.04);
    const neon = new THREE.PointLight(s.color, 6, 6); neon.position.set(0, 0.15, 0); g.add(neon);
    const R = 0.36, tire = new THREE.CylinderGeometry(R, R, 0.3, 24).rotateZ(Math.PI / 2), rim = new THREE.CylinderGeometry(0.25, 0.25, 0.32, 14).rotateZ(Math.PI / 2), rm = new M({ color: 0xd0d0d8, metalness: 1, roughness: 0.2 });
    for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const w = new THREE.Group(); w.position.set(x * (W / 2 - 0.04), R, z * L * 0.32);
      const t = new THREE.Mesh(tire, dark); t.castShadow = true; w.add(t, new THREE.Mesh(rim, rm));
      for (let k = 0; k < 3; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.5), rm); sp.rotation.x = k * Math.PI / 3; w.add(sp); }
      g.add(w); this.wheels.push(w);
    }
  }
  spinWheels(dist) { for (const w of this.wheels) w.rotation.x += dist / 0.36; }
}

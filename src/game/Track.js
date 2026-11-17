import * as THREE from 'three';

export class Track {
  constructor(scene, quality) {
    this.width = 14;
    const pts = [[0, -120], [90, -110], [150, -30], [110, 50], [40, 70], [20, 130], [-60, 150], [-140, 90], [-120, 10], [-150, -70], [-80, -125]];
    this.curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'catmullrom', 0.5);
    this.length = this.curve.getLength();
    this.samples = this.curve.getSpacedPoints(400);
    this.group = new THREE.Group(); scene.add(this.group);
    this.buildRoad(); this.buildBarriers(); this.buildLamps(); this.buildCity(quality);
  }

  frame(t) {
    const p = this.curve.getPointAt(t % 1), tan = this.curve.getTangentAt(t % 1);
    return { p, tan, n: new THREE.Vector3(-tan.z, 0, tan.x) };
  }

  buildRoad() {
    const N = 400, pos = [], idx = [], uv = [], hw = this.width / 2;
    for (let i = 0; i <= N; i++) {
      const { p, n } = this.frame(i / N);
      pos.push(p.x + n.x * hw, 0.02, p.z + n.z * hw, p.x - n.x * hw, 0.02, p.z - n.z * hw);
      uv.push(0, i / 8, 1, i / 8);
      if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#2b2b34'; x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`; x.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); }
    x.fillStyle = '#fff'; x.fillRect(4, 0, 3, 128); x.fillRect(121, 0, 3, 128); // chekka chiziqlar
    x.fillStyle = '#ff9d00'; x.fillRect(62, 8, 4, 48); // markaziy chiziq
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const road = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.18, metalness: 0.5, envMapIntensity: 0.7 }));
    road.receiveShadow = true; this.group.add(road);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1500, 1500), new THREE.MeshStandardMaterial({ color: 0x07070b, roughness: 1, envMapIntensity: 0.05 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; this.group.add(ground);
  }

  buildBarriers() {
    const step = 5, count = Math.floor(this.length / step) * 2, m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1);
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.8, step), new THREE.MeshStandardMaterial({ color: 0x9a9aa5, metalness: 0.6, roughness: 0.4 }), count);
    mesh.castShadow = true; let k = 0;
    const glow = new THREE.InstancedMesh(new THREE.BoxGeometry(0.44, 0.1, step * 0.9), new THREE.MeshBasicMaterial(), count), c = new THREE.Color();
    for (let i = 0; i < count / 2; i++) {
      const { p, tan, n } = this.frame(i / (count / 2)), ang = Math.atan2(tan.x, tan.z);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), ang);
      for (const side of [1, -1]) {
        const o = side * (this.width / 2 + 1.2); m.compose(new THREE.Vector3(p.x + n.x * o, 0.4, p.z + n.z * o), q, s); mesh.setMatrixAt(k, m);
        m.setPosition(p.x + n.x * o, 0.88, p.z + n.z * o); glow.setMatrixAt(k, m); glow.setColorAt(k, c.setHex(side > 0 ? 0x18d4ff : 0xff2d95)); k++;
      }
    }
    this.group.add(mesh, glow); // neon to'siq chiziqlari
  }

  buildLamps() {
    const n = 60, poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.12, 8, 6), new THREE.MeshStandardMaterial({ color: 0x222228 }), n);
    const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd9a0 }), n), m = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      const { p, n: nr } = this.frame(i / n), o = this.width / 2 + 3;
      const x = p.x + nr.x * o, z = p.z + nr.z * o;
      poles.setMatrixAt(i, m.makeTranslation(x, 4, z)); bulbs.setMatrixAt(i, m.makeTranslation(x, 8.2, z));
    }
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const cx = cv.getContext('2d'), gr = cx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,200,120,1)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); cx.fillStyle = gr; cx.fillRect(0, 0, 64, 64);
    const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(26, 26).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }), n);
    for (let i = 0; i < n; i++) { const { p, n: nr } = this.frame(i / n), o2 = this.width / 2 - 3; pools.setMatrixAt(i, m.makeTranslation(p.x + nr.x * o2, 0.04, p.z + nr.z * o2)); } // yo'ldagi yorug' dog'lar
    this.group.add(poles, bulbs, pools);
  }

  buildCity(quality) {
    const count = quality === 'low' ? 120 : 260, neon = [0xff2d95, 0x18d4ff, 0xff6a00, 0x9d4dff, 0x2dff8a];
    const bld = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.8, envMapIntensity: 0.25 }), count);
    const strip = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial(), count);
    const m = new THREE.Matrix4(), col = new THREE.Color(); let k = 0, tries = 0;
    while (k < count && tries++ < 4000) {
      const x = (Math.random() - 0.5) * 700, z = (Math.random() - 0.5) * 700;
      if (this.samples.some(p => Math.hypot(p.x - x, p.z - z) < 40)) continue;
      const w = 10 + Math.random() * 22, h = 15 + Math.random() * 70, d = 10 + Math.random() * 22;
      bld.setMatrixAt(k, m.compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion(), new THREE.Vector3(w, h, d)));
      strip.setMatrixAt(k, m.compose(new THREE.Vector3(x, h * (0.3 + Math.random() * 0.5), z), new THREE.Quaternion(), new THREE.Vector3(w + 0.3, 0.7, d + 0.3)));
      strip.setColorAt(k, col.setHex(neon[k % neon.length])); k++;
    }
    bld.count = strip.count = k; bld.castShadow = false; this.group.add(bld, strip);
  }
}

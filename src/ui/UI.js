import { CARS } from '../data/cars.js';
import { save } from '../utils/storage.js';
const COLORS = [0xff6a00, 0x1a8cff, 0xf2f2f2, 0x8a1cff, 0xe01b2f, 0x18d4ff, 0x2dff8a, 0xffd400];
const fmt = t => `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, '0')}`;
export class UI {
  constructor(g) {
    this.g = g; this.gi = g.save.car; this.el = document.createElement('div'); this.el.id = 'ui'; document.body.appendChild(this.el);
    this.hud = document.getElementById('hud'); this.q = id => document.getElementById(id);
    this.el.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) this.act(b.dataset.a, b.dataset.v); });
    this.show('main');
  }
  show(s, extra) {
    this.screen = s; const g = this.g, sv = g.save;
    this.hud.hidden = s !== 'hud'; document.body.classList.toggle('playing', s === 'hud'); this.el.hidden = s === 'hud';
    const btn = (a, t, v = '') => `<button data-a="${a}" data-v="${v}">${t}</button>`;
    const money = `<div class="money">$ ${sv.money}</div>`;
    const T = {
      main: `<h1>DRIFT <span>RACING</span></h1>${money}${btn('modes', 'PLAY')}${btn('online', 'ONLINE 2-4 KISHI')}${btn('garage', 'GARAGE & CARS')}${btn('settings', 'SETTINGS')}<p class="sub">Eng yaxshi ball: ${sv.bestScore} &nbsp; Eng yaxshi aylanish: ${sv.bestLap ? fmt(sv.bestLap) : '—'}</p>`,
      modes: `<h2>REJIM</h2>${btn('start', 'RACE <small>3 aylanish, AI bilan poyga</small>', 'race')}${btn('start', 'FREE DRIVE <small>erkin haydash</small>', 'free')}${btn('start', 'DRIFT CHALLENGE <small>90 soniyada maksimal ball</small>', 'challenge')}${btn('start', 'TIME ATTACK <small>1 aylanishni eng tez bosib o\'t</small>', 'attack')}${btn('main', 'ORQAGA')}`,
      settings: `<h2>SETTINGS</h2>${btn('sound', 'OVOZ: ' + (sv.sound ? 'YOQILGAN' : 'O\'CHIRILGAN'))}${btn('reset', 'PROGRESSNI O\'CHIRISH')}${btn('main', 'ORQAGA')}`,
      online: `<h2>ONLINE</h2><input id="room" maxlength="8" placeholder="XONA KODI" value="ROOM1">${btn('join', 'ULANISH')}<p id="nstat" class="sub">Ulanmagan</p>${btn('go', 'POYGANI BOSHLASH')}${btn('main', 'ORQAGA')}`,
      pause: `<h2>PAUZA</h2>${btn('resume', 'DAVOM ETISH')}${btn('main', 'ASOSIY MENYU')}`,
      result: `<h2>NATIJA</h2><p class="big">${extra}</p>${btn('modes', 'YANA O\'YNASH')}${btn('main', 'ASOSIY MENYU')}`,
    };
    if (s === 'garage') {
      const c = CARS[this.gi], own = sv.owned.includes(this.gi), bar = v => `<i style="width:${v * 10}%"></i>`;
      this.el.innerHTML = `<div class="panel garage"><h2>${c.name}</h2>${money}<div class="stats">Tezlik ${bar(c.topSpeed / 29)}Tezlanish ${bar(c.accel)}Boshqaruv ${bar(c.handling)}Drift ${bar(c.drift)}</div>
      <div class="sw">${COLORS.map(x => `<b data-a="color" data-v="${x}" style="background:#${x.toString(16).padStart(6, '0')}"></b>`).join('')}</div>
      <div class="row">${['gloss', 'metal', 'matte'].map(f => btn('finish', f.toUpperCase(), f)).join('')}</div><div class="row">${btn('prev', '◀')}${own ? (sv.car === this.gi ? '<button disabled>TANLANGAN</button>' : btn('equip', 'TANLASH')) : btn('buy', `SOTIB OLISH $${c.price}`)}${btn('next', '▶')}</div>${btn('main', 'ORQAGA')}</div>`;
    } else this.el.innerHTML = `<div class="panel">${T[s] || ''}</div>`;
    g.rig.force = s === 'hud' ? null : 3;
  }
  act(a, v) {
    const g = this.g, sv = g.save;
    if (a === 'online') return this.show('online'); if (a === 'join') return g.net.join(document.getElementById('room').value.trim().toUpperCase()); if (a === 'go') return g.net.go();
    if (this.screen === 'online' && a === 'main') g.net.leave();
    if (a === 'start') return g.startMode(v);
    if (a === 'main' || a === 'modes' || a === 'settings') { if (this.screen === 'garage' || this.screen === 'pause') { g.state = 'menu'; g.setCar(sv.car); } if (this.screen === 'pause') g.resetCar(0); return this.show(a); }
    if (a === 'resume') { g.state = 'play'; return this.show('hud'); }
    if (a === 'garage') { this.gi = sv.car; g.state = 'menu'; this.show('garage'); return; }
    if (a === 'sound') { sv.sound = !sv.sound; g.audio.muted = !sv.sound; }
    if (a === 'reset') { localStorage.clear(); Object.assign(sv, { money: 0, car: 0, owned: [0], colors: {}, bestScore: 0, bestLap: 0 }); g.setCar(0); }
    if (a === 'prev' || a === 'next') { this.gi = (this.gi + (a === 'next' ? 1 : CARS.length - 1)) % CARS.length; const old = sv.car; sv.car = this.gi; g.setCar(this.gi); sv.car = old; }
    if (a === 'color') g.paint(+v);
    if (a === 'finish') { sv.finish = v; const c = CARS[this.gi]; g.paint(sv.colors[c.id] ?? c.color); }
    if (a === 'buy' && sv.money >= CARS[this.gi].price) { sv.money -= CARS[this.gi].price; sv.owned.push(this.gi); sv.car = this.gi; }
    if (a === 'equip') sv.car = this.gi;
    save(sv); this.show(this.screen);
  }
  update(p, s, time, rank, total, lap, laps) {
    const kmh = p.speed * 3.6, q = this.q;
    q('h-speed').textContent = Math.round(kmh); q('h-angle').textContent = Math.round(p.angle) + '°'; q('h-gear').textContent = kmh < 3 ? 'N' : Math.min(6, 1 + Math.floor(kmh / 45));
    q('h-arc').setAttribute('stroke-dasharray', `${Math.min(kmh / 300, 1) * 235} 400`);
    q('h-cur').textContent = Math.round(s.cur); q('h-combo').textContent = 'x' + s.mult.toFixed(1); q('h-total').textContent = s.total;
    q('h-time').textContent = fmt(Math.max(0, time)); q('h-nitro').style.width = p.nitro * 100 + '%';
    q('h-pos').innerHTML = `${['1ST', '2ND', '3RD', '4TH', '5TH'][rank - 1] || rank}<small>/${total}</small>`; q('h-lap').textContent = laps ? `${Math.min(lap, laps)}/${laps}` : '—';
  }
}

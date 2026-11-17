import './style.css';
import { Game } from './game/Game.js';

const $ = id => document.getElementById(id);
function webglOk() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }

if (!webglOk()) {
  $('loading').style.display = 'none';
  $('error').hidden = false; $('error').textContent = 'Brauzeringiz WebGL ni qo\'llab-quvvatlamaydi. Chrome, Edge yoki Firefox ning yangi versiyasidan foydalaning.';
} else {
  const progress = (v, text) => { $('bar-fill').style.width = v + '%'; $('load-text').textContent = text; };
  requestAnimationFrame(() => setTimeout(() => {
    const game = new Game($('app'), progress);
    game.start();
    $('loading').style.opacity = 0; setTimeout(() => $('loading').remove(), 600);
  }, 50));
}

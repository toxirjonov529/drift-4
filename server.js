// Ishga tushirish: npm run server  (port 3001). 4 tagacha o'yinchi bitta xonada.
import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ port: 3001, host: '0.0.0.0' }), rooms = new Map(); let n = 0;
const sendRoom = r => { const ids = [...r].map(c => c.id); r.forEach(c => c.send(JSON.stringify({ t: 'room', id: c.id, ids }))); };
wss.on('connection', ws => {
  ws.id = 'p' + ++n;
  ws.on('message', d => {
    let m; try { m = JSON.parse(d); } catch { return; }
    if (m.t === 'join') { const r = rooms.get(m.room) || new Set(); if (r.size >= 4) return ws.close(); r.add(ws); rooms.set(m.room, r); ws.room = m.room; sendRoom(r); }
    else if (m.t === 's' && ws.room) rooms.get(ws.room).forEach(c => c !== ws && c.readyState === 1 && c.send(JSON.stringify({ ...m, id: ws.id })));
    else if (m.t === 'go' && ws.room) { const r = rooms.get(ws.room), ids = [...r].map(c => c.id); r.forEach(c => c.send(JSON.stringify({ t: 'go', ids }))); }
  });
  ws.on('close', () => { const r = rooms.get(ws.room); if (r) { r.delete(ws); r.size ? sendRoom(r) : rooms.delete(ws.room); } });
});
console.log('Multiplayer server: ws://localhost:3001');

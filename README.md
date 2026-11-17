# DRIFT RACING
1. `npm install`
2. `npm run dev` → http://localhost:5173
Stage 1: sahna, trassa, 3D avtomobil (kod orqali yaratilgan, tashqi fayl shart emas), kameralar (C), avtomobil almashtirish (1-5).
Keyinroq tashqi modellar: public/models/ (.glb), audio: public/audio/ (.mp3/.ogg), teksturalar: public/textures/.

## Multiplayer (2-4 kishi)
1. Terminal 1: `npm run server`   2. Terminal 2: `npm run dev -- --host`
3. Hamma o'yinchilar bir xil wifi/tarmoqda `http://<kompyuter-IP>:5173` ni ochadi, ONLINE → bir xil xona kodi → ULANISH, bittasi POYGANI BOSHLASH.
Internet orqali o'ynash uchun server.js ni hostingga (Render, Railway, VPS) joylash kerak.

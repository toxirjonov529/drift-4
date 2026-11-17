const K = 'drift-racing-save';
const def = () => ({ money: 0, car: 0, owned: [0], colors: {}, sound: true, bestScore: 0, bestLap: 0 });
export const load = () => { try { return { ...def(), ...JSON.parse(localStorage.getItem(K)) }; } catch { return def(); } };
export const save = s => { try { localStorage.setItem(K, JSON.stringify(s)); } catch {} };

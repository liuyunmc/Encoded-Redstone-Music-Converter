export function demoSong() {
  const notes = [], melody = [45, 49, 52, 49, 47, 50, 54, 50, 49, 52, 56, 52, 47, 50, 54, 57];
  for (let repeat = 0; repeat < 8; repeat++) for (let i = 0; i < melody.length; i++) {
    const tick = repeat * 64 + i * 4;
    notes.push({ tick, layer: 0, instrument: 0, key: melody[i], velocity: 100, panning: 100, pitch: 0 });
    notes.push({ tick, layer: 1, instrument: 16 + repeat % 4, key: melody[i] - 12, velocity: 100, panning: 100, pitch: 0 });
    if (i % 2 === 0) notes.push({ tick, layer: 2, instrument: 1, key: 33 + (i % 8), velocity: 100, panning: 100, pitch: 0 });
  }
  return { header: { version: 6, vanillaInstrumentCount: 20, layerCount: 3, length: 512, name: '铜色回响 · Copper Echoes', author: '唱片工坊', originalAuthor: '', description: '自动生成的兼容性演示旋律', source: '', tempo: 20, timeSignature: 4, loop: { enabled: false, count: 0, start: 0 } }, notes, layers: Array.from({ length: 3 }, () => ({ name: '', volume: 100, panning: 100, locked: false })), instruments: [] };
}

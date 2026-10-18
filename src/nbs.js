const utf8 = new TextEncoder();
export function parseNbs(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.length > 32 * 1024 * 1024) throw new Error('NBS 文件超过 32 MB');
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let p = 0;
  function need(n) { if (p + n > bytes.length) throw new Error(`NBS 文件不完整（字节 ${p}）`); }
  function u8() { need(1); return v.getUint8(p++); }
  function u16() { need(2); const n = v.getUint16(p, true); p += 2; return n; }
  function i16() { need(2); const n = v.getInt16(p, true); p += 2; return n; }
  function i32() { need(4); const n = v.getInt32(p, true); p += 4; return n; }
  function str() {
    const n = i32(); if (n < 0 || n > 4 * 1024 * 1024) throw new Error('NBS 字符串长度无效'); need(n);
    const data = bytes.subarray(p, p + n); p += n;
    try { return new TextDecoder('utf-8', { fatal: true }).decode(data); }
    catch { return new TextDecoder('windows-1252').decode(data); }
  }
  let length = u16(), version = 0, vanillaInstrumentCount = 10;
  if (length === 0) {
    version = u8(); if (version < 1 || version > 6) throw new Error(`暂不支持 NBS v${version}`);
    vanillaInstrumentCount = u8(); length = version >= 3 ? u16() : 0;
  }
  const layerCount = u16();
  const header = { version, vanillaInstrumentCount, length, layerCount, name: str(), author: str(), originalAuthor: str(), description: str(), tempo: u16() / 100 };
  if (header.tempo <= 0) throw new Error('NBS 速度必须大于 0');
  header.autoSave = u8(); header.autoSaveDuration = u8(); header.timeSignature = u8();
  header.stats = Array.from({ length: 5 }, i32); header.source = str();
  header.loop = version >= 4 ? { enabled: !!u8(), count: u8(), start: u16() } : { enabled: false, count: 0, start: 0 };
  const notes = []; let tick = -1;
  for (let jump; (jump = u16()) !== 0;) {
    tick += jump; if (tick > 2000000) throw new Error('NBS 时间轴过长');
    let layer = -1;
    for (let layerJump; (layerJump = u16()) !== 0;) {
      layer += layerJump;
      if (layer >= layerCount) throw new Error('NBS 音符层超出头部声明');
      const note = { tick, layer, instrument: u8(), key: u8(), velocity: 100, panning: 100, pitch: 0 };
      if (note.key > 87) throw new Error('NBS 音高超出 0–87');
      if (version >= 4) { note.velocity = u8(); note.panning = u8(); note.pitch = i16(); }
      notes.push(note); if (notes.length > 1000000) throw new Error('NBS 音符过多');
    }
  }
  header.length = Math.max(header.length, tick + 1);
  const layers = [], instruments = [];
  // Sections 3 and 4 are optional; a partial section is still an error.
  if (p < bytes.length) for (let i = 0; i < layerCount; i++) layers.push({ name: str(), locked: version >= 4 ? !!u8() : false, volume: u8(), panning: version >= 2 ? u8() : 100 });
  if (p < bytes.length) {
    const count = u8(); if (count + vanillaInstrumentCount > 256) throw new Error('NBS 自定义乐器数量无效');
    for (let i = 0; i < count; i++) instruments.push({ name: str(), file: str(), key: u8(), pressKey: !!u8() });
  }
  if (p !== bytes.length) throw new Error('NBS 文件包含未识别的尾部数据');
  return { header, notes, layers, instruments };
}

// Writer always emits v6, preserving custom IDs relative to the header's built-in count.
export function writeNbs(song) {
  const a = [];
  const u8 = n => a.push(n & 255);
  const u16 = n => { u8(n); u8(n >> 8); };
  const i32 = n => { u16(n); u16(n >> 16); };
  const str = s => { const b = utf8.encode(s ?? ''); i32(b.length); for (const n of b) u8(n); };
  const h = song.header, notes = [...song.notes].sort((a, b) => a.tick - b.tick || a.layer - b.layer);
  let layerCount = h.layerCount; for (const n of notes) layerCount = Math.max(layerCount, n.layer + 1);
  const length = Math.max(h.length, notes.at(-1)?.tick + 1 || 0);
  if (length > 65535 || layerCount > 65535) throw new Error('NBS v6 导出长度或层数超过 65535；投影仍可单独导出');
  u16(0); u8(6); u8(20); u16(length); u16(layerCount);
  str(h.name); str(h.author); str(h.originalAuthor); str(h.description); u16(Math.round(h.tempo * 100));
  u8(0); u8(10); u8(h.timeSignature || 4); for (let i = 0; i < 5; i++) i32(0); str(h.source);
  u8(h.loop?.enabled ? 1 : 0); u8(h.loop?.count || 0); u16(h.loop?.start || 0);
  let tick = -1, layer = -1;
  for (const n of notes) {
    if (n.tick !== tick) { if (tick !== -1) u16(0); u16(n.tick - tick); tick = n.tick; layer = -1; }
    if (n.layer <= layer) throw new Error('NBS 同一时间与层不能包含多个音符');
    u16(n.layer - layer); layer = n.layer;
    const id = n.instrument >= h.vanillaInstrumentCount ? n.instrument - h.vanillaInstrumentCount + 20 : n.instrument;
    if (id > 255) throw new Error('升级 v6 后自定义乐器编号超过 255');
    u8(id); u8(n.key); u8(n.velocity ?? 100); u8(n.panning ?? 100); u16(n.pitch ?? 0);
  }
  if (notes.length) u16(0); u16(0);
  for (let i = 0; i < layerCount; i++) { const l = song.layers[i]; str(l?.name || ''); u8(l?.locked ? 1 : 0); u8(l?.volume ?? 100); u8(l?.panning ?? 100); }
  if (song.instruments.length > 236) throw new Error('NBS v6 最多支持 236 个自定义乐器');
  u8(song.instruments.length);
  for (const i of song.instruments) { str(i.name); str(i.file); u8(i.key); u8(i.pressKey ? 1 : 0); }
  return new Uint8Array(a);
}

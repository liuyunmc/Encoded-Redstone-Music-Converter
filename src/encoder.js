import { CODE, CHEST_FACING, PROJECTION_DIRECTION, DIRECTIONS, trackPosition, moduleBounds, validateConfig } from './config.js';
import { instrumentName, directionName } from './i18n.js';

export function normalizeSong(song, config) {
  config = validateConfig(config);
  const mappings = new Map();
  for (const t of config.tracks.filter(t => t.enabled)) for (const source of t.sourceIds) mappings.set(source, t);
  const rate = 20 / config.noteInterval;
  const warnings = new Set(), notes = [];
  let transposed = 0, dropped = 0, rounded = 0, muted = 0;
  const missing = new Set();
  for (const n of song.notes) {
    const track = mappings.get(n.instrument);
    if (!track) { missing.add(n.instrument); continue; }
    if (n.velocity === 0 || song.layers[n.layer]?.volume === 0) { muted++; continue; }
    let key = n.key + track.keyOffset + Math.round((n.pitch || 0) / 100);
    if ((n.pitch || 0) % 100) rounded++;
    if (key < 33 || key > 57) {
      if (config.rangePolicy === 'error') throw new Error(`NBS 乐器 ${n.instrument} 在 tick ${n.tick} 的音高 ${key} 超出 33–57`);
      if (config.rangePolicy === 'drop') { dropped++; continue; }
      while (key < 33) key += 12;
      while (key > 57) key -= 12;
      transposed++;
    }
    const tick = config.timing === 'resample' ? Math.round(n.tick * rate / song.header.tempo) : n.tick;
    if (tick > 2000000) throw new Error('转换后时间轴超过 200 万 tick，请缩短乐曲或提高输入速度');
    notes.push({ ...n, key, tick, pitch: 0, panning: 100, velocity: 100, trackId: track.id });
  }
  if (missing.size) throw new Error(`以下 NBS 乐器未分配到启用的模块：${[...missing].join(', ')}。请添加映射；旧版自定义编号从文件头内置乐器数量开始，不能直接当作新版小号。`);
  if (transposed) warnings.add(`${transposed} 个超音域音符按八度移至 33–57`);
  if (dropped) warnings.add(`按所选策略丢弃 ${dropped} 个超音域音符`);
  if (muted) warnings.add(`跳过 ${muted} 个静音音符`);
  if (rounded) warnings.add(`${rounded} 个微调音高已量化到最近半音`);
  if (song.notes.some(n => n.velocity !== 100 || n.panning !== 100) || song.layers.some(l => l.volume !== 100 || l.panning !== 100)) warnings.add('机器编码不包含力度或声像，非静音音符统一音量与声像');
  if (song.header.loop.enabled) warnings.add('NBS 循环信息不写入唱片；仅导出一次播放');
  if (config.timing === 'resample' && song.header.tempo !== rate) warnings.add(`已从 ${song.header.tempo} tick/s 重采样至 ${rate} tick/s，时间量化至最近机器 tick`);
  if (config.timing === 'ticks' && song.header.tempo !== rate) warnings.add(`保留原始 tick；机器以 ${rate} tick/s 播放，速度将改变`);
  const length = Math.max(1, config.timing === 'resample' ? Math.round(song.header.length * rate / song.header.tempo) : song.header.length);
  let maxTick = 0; for (const n of notes) maxTick = Math.max(maxTick, n.tick + 1);
  // Keep simultaneous notes when temporal resampling merges two notes on one NBS layer.
  const occupied = new Map(); let duplicates = 0;
  for (const n of notes.sort((a, b) => a.tick - b.tick || a.layer - b.layer)) {
    if (!occupied.has(n.tick)) occupied.set(n.tick, new Set());
    const used = occupied.get(n.tick);
    while (used.has(n.layer)) { n.layer++; duplicates++; }
    used.add(n.layer);
  }
  if (duplicates) warnings.add('重采样合并的同层音符已分配到额外 NBS 层以保留和弦');
  let layerCount = song.header.layerCount; for (const n of notes) layerCount = Math.max(layerCount, n.layer + 1);
  return {
    song: { ...song, notes, header: { ...song.header, length: Math.max(length, maxTick), layerCount, tempo: rate, loop: { enabled: false, count: 0, start: 0 } }, layers: Array.from({ length: layerCount }, (_, i) => ({ name: song.layers[i]?.name ?? '', volume: 100, panning: 100, locked: false })) },
    warnings: [...warnings],
  };
}

// Sparse stream: cycle -> 4-bit disc value. Leading/intermediate rests are retained;
// rests after the last note are deliberately omitted, matching the original machine.
export function packStream(stream, config) {
  const boxes = []; let contents = [], itemCount = 0, fillerIndex = 0;
  function push(id, count, code = 0) {
    contents.push({ id, count, code, slot: contents.length }); itemCount += count;
    if (contents.length === 27) finish();
  }
  function finish() {
    if (!contents.length) return;
    if (boxes.length === 54) throw new Error('双箱容量溢出：某一编码通道超过 54 个潜影盒，请拆分乐曲');
    boxes.push(contents); contents = []; itemCount = 0; fillerIndex = 0;
  }
  let previous = -1;
  for (const [cycle, code] of [...stream].sort((a, b) => a[0] - b[0])) {
    let rests = cycle - previous - 1;
    while (rests > 0) {
      const count = config.useStackable ? Math.min(rests, 64) : 1;
      push(config.useStackable ? config.fillers[fillerIndex % config.fillers.length] : config.restItem, count);
      rests -= count;
    }
    if (cycle - previous > 1 && contents.length) fillerIndex++;
    push(config.discs[code - 1], 1, code); previous = cycle;
  }
  if (contents.length && itemCount < 3) {
    const pad = 3 - itemCount;
    if (config.useStackable) push(config.fillers[fillerIndex % config.fillers.length], pad);
    else for (let i = 0; i < pad; i++) push(config.restItem, 1);
  }
  finish();
  return boxes;
}

export function compileSong(input, config) {
  config = validateConfig(config);
  const normalized = normalizeSong(input, config), song = normalized.song;
  if (!song.notes.length) throw new Error('格式化后没有可编码的音符');
  const laneCount = config.noteInterval === 1 ? 2 : 1, cycleTicks = laneCount * 4;
  const tracks = new Map(config.tracks.filter(t => t.enabled).map(t => [t.id, { ...t, streams: Array.from({ length: laneCount }, () => Array.from({ length: 25 }, () => new Map())) }]));
  const noteKeys = new Set(); let duplicates = 0;
  for (const n of song.notes) {
    const key = n.key - 33, lane = n.tick % laneCount, phase = Math.floor(n.tick / laneCount) % 4;
    const row = key === 24 ? 24 : Math.floor(key / 2) * 2 + Math.floor(phase / 2);
    const code = CODE[key][key === 24 ? phase : phase % 2];
    const fingerprint = `${n.trackId}/${n.tick}/${key}`;
    if (noteKeys.has(fingerprint)) duplicates++; noteKeys.add(fingerprint);
    const stream = tracks.get(n.trackId).streams[lane][row], cycle = Math.floor(n.tick / cycleTicks);
    stream.set(cycle, (stream.get(cycle) ?? 0) | code);
  }
  if (duplicates) normalized.warnings.push(`${duplicates} 个同模块、同时间、同音高的重复音符合并为一次触发`);
  const regions = [], regionNames = new Set(), occupied = new Map(), discCounts = Array(15).fill(0);
  let boxCount = 0, chestCount = 0;
  for (const t of tracks.values()) for (let lane = 0; lane < laneCount; lane++) {
    const module = t.modules[lane], blocks = [], pos = depth => trackPosition(t, lane, depth);
    for (let row = 0; row < 25; row++) {
      let boxes;
      try { boxes = packStream(t.streams[lane][row], config); }
      catch (e) { throw new Error(`${t.name} / 模块 ${lane + 1} / 箱子 ${row + 1}：${e.message}`); }
      if (!boxes.length && config.removeEmptyChests) continue;
      boxCount += boxes.length;
      for (const box of boxes) for (const item of box) if (item.code) discCounts[item.code - 1]++;
      blocks.push({ pos: pos(row * 2), facing: CHEST_FACING[module.direction], type: 'right', boxes: boxes.slice(0, 27) });
      blocks.push({ pos: pos(row * 2 + 1), facing: CHEST_FACING[module.direction], type: 'left', boxes: boxes.slice(27) });
      chestCount += 2;
    }
    // Reserve the complete module footprint so an empty part of one region cannot
    // overwrite another region with air during schematic placement.
    {
      for (let depth = 0; depth < 50; depth++) {
        const key = pos(depth).join(',');
        if (occupied.has(key)) throw new Error(`模块区域重叠：${t.name} 与 ${occupied.get(key)} 位于 ${key}`);
        occupied.set(key, t.name);
      }
      const source = t.sourceIds.length ? t.sourceIds.map(n => String(n).padStart(2, '0')).join('+') : 'unassigned';
      // Keep machine-side order even when a schematic viewer sorts region names.
      const sideOrder = String(DIRECTIONS.indexOf(module.direction) + 1).padStart(2, '0');
      const label = `${sideOrder}_${directionName(module.direction, config.language)}_${source}_${instrumentName(t.name, config.language)}` +
        (laneCount === 2 ? `_${config.language === 'en' ? 'Module' : '模块'}${lane + 1}` : '');
      let name = label, suffix = 2;
      while (regionNames.has(name)) name = `${label}_${suffix++}`;
      regionNames.add(name);
      regions.push({ id: `${t.id}_module_${lane + 1}`, trackId: t.id, sourceIds: [...t.sourceIds], module: lane + 1, name, direction: module.direction, projectionDirection: PROJECTION_DIRECTION[module.direction], chestFacing: CHEST_FACING[module.direction], sound: t.sound, bounds: moduleBounds(module), blocks });
    }
  }
  regions.sort((a, b) => DIRECTIONS.indexOf(a.direction) - DIRECTIONS.indexOf(b.direction) || a.bounds.min[1] - b.bounds.min[1] || (a.sourceIds[0] ?? 256) - (b.sourceIds[0] ?? 256) || a.module - b.module);
  return { regions, song, warnings: normalized.warnings, stats: { notes: song.notes.length, regions: regions.length, chests: chestCount, shulkers: boxCount, discs: discCounts, ticks: Math.ceil(song.header.length / cycleTicks) * cycleTicks, seconds: song.header.length / song.header.tempo } };
}

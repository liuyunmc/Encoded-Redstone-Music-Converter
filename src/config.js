export const INSTRUMENTS = [
  ['harp', '钢琴'], ['bass', '贝斯'], ['bassdrum', '底鼓'], ['snare', '军鼓'],
  ['hat', '踩镲'], ['guitar', '吉他'], ['flute', '长笛'], ['bell', '铃铛'],
  ['chime', '风铃'], ['xylophone', '木琴'], ['iron_xylophone', '铁木琴'], ['cow_bell', '牛铃'],
  ['didgeridoo', '迪吉里杜管'], ['bit', '芯片'], ['banjo', '班卓琴'], ['pling', '电子钢琴'],
  ['trumpet', '小号'], ['trumpet_exposed', '斑驳小号'],
  ['trumpet_weathered', '锈蚀小号'], ['trumpet_oxidized', '氧化小号'],
];
export const DISCS = ['13', 'cat', 'blocks', 'chirp', 'far', 'mall', 'mellohi', 'stal', 'strad', 'ward', '11', 'wait', 'pigstep', 'otherside', '5'].map(n => `minecraft:music_disc_${n}`);
export const FILLERS = ['white', 'light_gray', 'gray', 'black', 'brown', 'red', 'orange', 'yellow', 'lime', 'green', 'cyan', 'light_blue', 'blue', 'purple', 'magenta', 'pink'].map(n => `minecraft:${n}_carpet`);
// Kept identical to nbs-converter/constants.py. Index is note.key - 33.
export const CODE = Array.from({ length: 25 }, (_, i) => i === 24 ? [8, 4, 2, 1] : (i % 4 === 0 || i % 4 === 3 ? [4, 1] : [8, 2]));
export const DIRECTIONS = ['west', 'north', 'east', 'south'];
// direction identifies the music machine's side. Projection arms stay arranged
// for pasting: the south machine module faces north and grows west toward high notes.
export const PROJECTION_DIRECTION = { east: 'south', south: 'west', west: 'north', north: 'east' };
export const MACHINE_DIRECTION = { east: 'north', south: 'east', west: 'south', north: 'west' };
export const CHEST_FACING = { east: 'west', south: 'north', west: 'east', north: 'south' };
export const ARM_OFFSET = { east: (lane, depth) => [-lane, depth], south: (lane, depth) => [-depth, -lane], west: (lane, depth) => [lane, -depth], north: (lane, depth) => [depth, lane] };
export const PROJECTION_ORIGIN = { east: [0, 1], south: [-1, 0], west: [0, -1], north: [1, 0] };
export function moduleLayer(module, layerHeight = 8) {
  return Number.isInteger(module.y) && module.y >= 0 && module.y % layerHeight === 0 ? module.y / layerHeight + 1 : null;
}
export function setModuleLayer(module, layer, layerHeight = 8, useProjectionOrigin = true) {
  if (!Number.isInteger(layer) || layer < 1 || (layer - 1) * layerHeight > 1000000) throw new Error('层数必须为正整数，且投影 Y 不能超过 1000000');
  module.y = (layer - 1) * layerHeight;
  if (useProjectionOrigin) [module.x, module.z] = PROJECTION_ORIGIN[module.direction];
}
export function changeLayerHeight(config, height) {
  if (!Number.isInteger(height) || height < 1 || height > 1024) throw new Error('层高必须为 1–1024 的整数');
  const previous = config.layerHeight ?? 8;
  const changes = config.tracks.flatMap(t => t.modules).map(module => ({ module, layer: moduleLayer(module, previous) }));
  if (changes.some(({layer}) => layer !== null && (layer - 1) * height > 1000000)) throw new Error('层数必须为正整数，且投影 Y 不能超过 1000000');
  for (const { module, layer } of changes) if (layer !== null) module.y = (layer - 1) * height;
  config.layerHeight = height;
}
export function trackPosition(track, lane, depth) {
  return modulePosition(track.modules[lane], depth);
}
export function modulePosition(module, depth) {
  const [x, z] = ARM_OFFSET[module.direction](0, depth);
  return [module.x + x, module.y, module.z + z];
}
export function moduleBounds(module) {
  const a = modulePosition(module, 0), b = modulePosition(module, 49);
  return { min: a.map((v, i) => Math.min(v, b[i])), max: a.map((v, i) => Math.max(v, b[i])) };
}
export function presetModules(index, noteInterval = 1, layerHeight = 8) {
  let side, level;
  if (noteInterval === 2) {
    // Original 10 TPS world: four instruments per side, highest index at bottom.
    side = index < 16 ? Math.floor(index / 4) : (index - 16) % 4;
    level = index < 16 ? 3 - index % 4 : 4 + Math.floor((index - 16) / 4);
  } else if (index < 16) {
    // Top to bottom. Each instrument has Module 1/2 on W/N or E/S respectively.
    const stacks = [[4, 5, 6, 7, 0, 1, 2, 3], [12, 13, 14, 15, 8, 9, 10, 11]];
    const group = stacks.findIndex(stack => stack.includes(index));
    side = group * 2; level = 7 - stacks[group].indexOf(index);
  } else {
    side = ((index - 16) % 2) * 2; level = 8 + Math.floor((index - 16) / 2);
  }
  return Array.from({ length: 2 }, (_, lane) => {
    const direction = DIRECTIONS[(side + lane) % 4], [x, z] = PROJECTION_ORIGIN[direction];
    return { x, y: level * layerHeight, z, direction };
  });
}

export function defaultConfig(count = 20, noteInterval = 1, layerHeight = 8) {
  return {
    version: 4, language: 'zh', layerHeight, noteInterval, timing: 'resample', rangePolicy: 'transpose',
    useStackable: true, removeEmptyChests: true, target: '26.1',
    discs: [...DISCS], fillers: [...FILLERS], restItem: 'minecraft:shears',
    tracks: Array.from({ length: count }, (_, i) => ({
      id: `instrument_${i}`, name: INSTRUMENTS[i]?.[1] ?? `自定义 ${i}`,
      sourceIds: [i], keyOffset: 0, sound: '', enabled: true,
      modules: presetModules(i, noteInterval, layerHeight),
    })),
  };
}

export function validateConfig(c) {
  if (c?.version === 4 && c.layerHeight === undefined) c = { ...c, layerHeight: 8 };
  const fail = message => { throw new Error(`配置错误：${message}`); };
  if (!c || c.version !== 4) fail('需要 version: 4');
  if (!Number.isInteger(c.layerHeight) || c.layerHeight < 1 || c.layerHeight > 1024) fail('层高必须为 1–1024 的整数');
  if (c.language !== undefined && !['zh', 'en'].includes(c.language)) fail('语言必须为 zh 或 en');
  if (![1, 2].includes(c.noteInterval)) fail('noteInterval 只能为 1 或 2');
  if (!['resample', 'ticks'].includes(c.timing)) fail('未知时间处理方式');
  if (!['transpose', 'error', 'drop'].includes(c.rangePolicy)) fail('未知超音域策略');
  if (!['26.1', '1.20.4'].includes(c.target)) fail('不支持的目标版本');
  for (const key of ['useStackable', 'removeEmptyChests']) if (typeof c[key] !== 'boolean') fail(`${key} 必须为布尔值`);
  const item = id => typeof id === 'string' && /^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(id);
  if (!Array.isArray(c.discs) || c.discs.length !== 15 || !c.discs.every(item) || new Set(c.discs).size !== 15) fail('需要 15 个不同的唱片物品 ID');
  if (!Array.isArray(c.fillers) || c.fillers.length < 2 || !c.fillers.every(item) || new Set(c.fillers).size !== c.fillers.length) fail('至少需要两种不同的可堆叠填充物');
  if (!item(c.restItem)) fail('无效的空拍物品 ID');
  if (c.fillers.some(id => c.discs.includes(id)) || c.discs.includes(c.restItem) || c.fillers.includes(c.restItem)) fail('唱片、填充物和空拍物品不能重复');
  if (!Array.isArray(c.tracks) || !c.tracks.length || c.tracks.length > 256) fail('乐器数必须在 1–256 之间');
  const ids = new Set(), sources = new Set();
  for (const t of c.tracks) {
    if (!t || typeof t.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(t.id) || ids.has(t.id)) fail('子区域 ID 必须唯一，且只能含英文、数字、下划线和连字符');
    ids.add(t.id);
    if (typeof t.name !== 'string' || t.name.length > 128 || typeof t.enabled !== 'boolean' || typeof t.sound !== 'string') fail(`${t.id} 名称、音源或启用字段无效`);
    if (!Number.isInteger(t.keyOffset) || Math.abs(t.keyOffset) > 1000000) fail(`${t.name} 的 keyOffset 必须为合理整数`);
    if (!Array.isArray(t.modules) || t.modules.length !== 2) fail(`${t.name} 必须配置两个模块位置`);
    for (const [index, module] of t.modules.entries()) {
      if (!module || !DIRECTIONS.includes(module.direction)) fail(`${t.name} 模块 ${index + 1} 朝向无效`);
      for (const axis of ['x', 'y', 'z']) if (!Number.isInteger(module[axis]) || Math.abs(module[axis]) > 1000000) fail(`${t.name} 模块 ${index + 1} 的 ${axis} 必须为合理整数`);
    }
    if (!Array.isArray(t.sourceIds)) fail(`${t.name} 的 NBS 乐器编号必须是数组`);
    for (const source of t.sourceIds) {
      if (!Number.isInteger(source) || source < 0 || source > 255) fail(`${t.name} 的 NBS 编号应为 0–255`);
      if (t.enabled && sources.has(source)) fail(`NBS 乐器 ${source} 被重复映射`);
      if (t.enabled) sources.add(source);
    }
  }
  return c;
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gunzipSync } from 'node:zlib';
import { defaultConfig, DISCS, validateConfig, trackPosition, CHEST_FACING, moduleLayer, setModuleLayer, changeLayerHeight } from '../src/config.js';
import { translate, instrumentName } from '../src/i18n.js';
import { parseNbs, writeNbs } from '../src/nbs.js';
import { compileSong, normalizeSong, packStream } from '../src/encoder.js';
import { exportLitematic, packBlockStates } from '../src/litematic.js';
import { demoSong } from '../src/demo.js';
import { nbsFixture, readNbt } from './helpers.js';

function songOf(notes, tempo = 20) {
  const s = demoSong(); s.notes = notes.map(n => ({ tick: 0, layer: 0, instrument: 0, key: 33, velocity: 100, panning: 100, pitch: 0, ...n }));
  s.header.length = Math.max(1, ...s.notes.map(n => n.tick + 1)); s.header.tempo = tempo; return s;
}
function unpackCodes(boxes, config) {
  const result = [];
  for (const box of boxes) for (const item of box) {
    const code = config.discs.indexOf(item.id) + 1;
    result.push(...Array(item.count).fill(code));
  }
  return result;
}
for (let v = 0; v <= 6; v++) test(`reads independent NBS v${v} fixture, including optional sections`, () => {
  for (const optional of [true, false]) {
    const s = parseNbs(nbsFixture(v, { optional }));
    assert.equal(s.header.version, v); assert.equal(s.header.name, '测试曲'); assert.equal(s.notes[0].tick, 7); assert.equal(s.notes[0].key, 57);
    assert.equal(s.layers.length, optional ? 1 : 0); assert.equal(s.header.vanillaInstrumentCount, v === 0 ? 10 : v === 6 ? 20 : 16);
  }
});
test('rejects malformed NBS, unsupported versions and trailing bytes', () => {
  const b = nbsFixture(); assert.throws(() => parseNbs(b.slice(0, 20)), /不完整/);
  const future = b.slice(); future[2] = 7; assert.throws(() => parseNbs(future), /v7/);
  assert.throws(() => parseNbs(new Uint8Array([...b, 42])), /尾部/);
  const zeroTempo = nbsFixture(); // locate tempo after four length-prefixed strings
  let p = 8; const view = new DataView(zeroTempo.buffer); for (let i = 0; i < 4; i++) p += 4 + view.getInt32(p, true); view.setUint16(p, 0, true);
  assert.throws(() => parseNbs(zeroTempo), /速度/);
});
test('v6 writer round-trip and old custom ID rebasing', () => {
  const s = parseNbs(nbsFixture(5)); s.instruments = [{ name: 'Custom', file: 'pack/flute.ogg', key: 45, pressKey: false }]; s.notes[0].instrument = 16;
  const decoded = parseNbs(writeNbs(s)); assert.equal(decoded.header.version, 6); assert.equal(decoded.notes[0].instrument, 20); assert.equal(decoded.instruments[0].file, 'pack/flute.ogg');
  const demo = parseNbs(writeNbs(demoSong())); assert.equal(demo.notes.length, demoSong().notes.length); assert.equal(demo.notes.at(-1).tick, 508);
  const empty = songOf([]); assert.equal(parseNbs(writeNbs(empty)).notes.length, 0);
});
test('all 25 notes / four phases match original CODE, both machine speeds, all rotations', () => {
  const original = [[4,1],[8,2],[8,2],[4,1],[4,1],[8,2],[8,2],[4,1],[4,1],[8,2],[8,2],[4,1],[4,1],[8,2],[8,2],[4,1],[4,1],[8,2],[8,2],[4,1],[4,1],[8,2],[8,2],[4,1],[8,4,2,1]];
  for (const interval of [1, 2]) for (const direction of ['east', 'south', 'west', 'north']) for (let key = 0; key < 25; key++) for (let phase = 0; phase < 4; phase++) {
    const c = defaultConfig(1, interval); c.tracks[0].modules = [0,1].map(i=>({x:0,y:i*8,z:0,direction}));
    const lanes = interval === 1 ? 2 : 1, tick = phase * lanes + lanes - 1;
    const result = compileSong(songOf([{ key: key + 33, tick }], 20 / interval), c);
    const expected = original[key][key === 24 ? phase : phase % 2];
    assert.equal(result.stats.discs[expected - 1], 1);
    const row = key === 24 ? 24 : Math.floor(key / 2) * 2 + Math.floor(phase / 2);
    const lane = lanes - 1, depth = row * 2;
    const p = { east: [0, depth], south: [-depth, 0], west: [0, -depth], north: [depth, 0] }[direction];
    const region=result.regions.find(r=>r.module===lane+1);
    assert.deepEqual(region.blocks[0].pos, [0+p[0], lane*8, 0+p[1]]);
    const boxes = region.blocks.flatMap(b => b.boxes); assert.equal(boxes[0][0].id, DISCS[expected - 1]);
  }
});
test('bitwise chord merging, duplicate suppression and tail cycle flushing', () => {
  const c = defaultConfig(1);
  const r = compileSong(songOf([{ key: 33 }, { key: 34, layer: 1 }, { key: 33, layer: 2 }, { key: 57, tick: 8 }]), c);
  assert.equal(r.stats.discs[11], 1); // phase 0: 4 | 8 = 12
  assert.equal(r.stats.discs[7], 1); // formerly unflushed final cycle
  assert.equal(r.stats.ticks, 16); assert.ok(r.warnings.some(s => s.includes('重复')));
});
test('stacked and unstacked rests preserve every leading/intermediate cycle; pad final box', () => {
  for (const useStackable of [true, false]) {
    const c = defaultConfig(); c.useStackable = useStackable;
    const boxes = packStream(new Map([[130, 5], [133, 8]]), c), codes = unpackCodes(boxes, c);
    assert.equal(codes[130], 5); assert.equal(codes[133], 8); assert.equal(codes.slice(0, 130).reduce((a,b) => a+b, 0), 0);
    for (const box of boxes) { assert.ok(box.length <= 27); assert.ok(box.reduce((a,b) => a+b.count, 0) >= 3); }
    assert.deepEqual(packStream(new Map(), c), []);
  }
});
test('54-shulker capacity is exact; never wraps chest slots', () => {
  const c = defaultConfig();
  const atLimit = new Map(Array.from({ length: 1458 }, (_, i) => [i, 1]));
  assert.equal(packStream(atLimit, c).length, 54); atLimit.set(1458, 1); assert.throws(() => packStream(atLimit, c), /容量溢出/);
});
test('normalization: timing, transposition, fine pitch, muted notes and policy errors', () => {
  const c = defaultConfig(1), input = songOf([{ key: 20, tick: 1, pitch: 100 }, { key: 87, tick: 3 }, { key: 40, velocity: 0 }], 10);
  const result = normalizeSong(input, c); assert.deepEqual(result.song.notes.map(n => n.tick), [2, 6]); assert.ok(result.song.notes.every(n => n.key >= 33 && n.key <= 57));
  c.rangePolicy = 'error'; assert.throws(() => normalizeSong(input, c), /超出/);
  c.rangePolicy = 'drop'; assert.equal(normalizeSong(input, c).song.notes.length, 0);
  c.rangePolicy = 'transpose'; c.timing = 'ticks'; assert.equal(normalizeSong(input, c).song.notes[0].tick, 1);
});
test('merged NBS layers survive formatting; custom source maps to explicit output module', () => {
  const c = defaultConfig(1); c.tracks[0].sourceIds = [20]; c.tracks[0].sound = 'custom:flute'; c.tracks[0].keyOffset = 2;
  const s = songOf([{ instrument: 20, key: 40, tick: 0 }, { instrument: 20, key: 42, tick: 1 }], 100);
  s.instruments = [{ name: 'Custom', file: 'flute.ogg', key: 45, pressKey: false }];
  const r = compileSong(s, c); assert.deepEqual(r.song.notes.map(n => n.key), [42, 44]); assert.equal(new Set(r.song.notes.map(n => n.layer)).size, 2); assert.equal(parseNbs(writeNbs(r.song)).notes.length, 2);
  c.tracks[0].enabled = false; assert.throws(() => compileSong(s, c), /未分配/);
});
test('invalid configuration, duplicate mapping and overlapping module footprints fail clearly', () => {
  const c = defaultConfig(); c.tracks[1].sourceIds = [0]; assert.throws(() => validateConfig(c), /重复映射/);
  const bad = defaultConfig(); bad.discs[1] = bad.discs[0]; assert.throws(() => validateConfig(bad), /15 个不同/);
  const overlap = defaultConfig(2); Object.assign(overlap.tracks[1].modules[0], overlap.tracks[0].modules[0]); assert.throws(() => compileSong(songOf([{ instrument: 0 }, { instrument: 1, layer: 1 }]), overlap), /重叠/);
});
test('all 20 instruments export into distinct non-overlapping regions', () => {
  const c = defaultConfig(), s = songOf(Array.from({ length: 20 }, (_, instrument) => ({ instrument, layer: instrument })));
  const result = compileSong(s, c); assert.equal(result.regions.length, 40); assert.equal(result.stats.chests, 40);
});
test('projection presets have four modules per layer; each 20 TPS pair occupies adjacent arms', () => {
  for(const count of [16,20])for(const interval of [1,2]){
    const c=defaultConfig(count,interval); c.removeEmptyChests=false;
    const lanes=interval===1?2:1, result=compileSong(songOf([{instrument:0}]),c), used=new Set();
    assert.equal(result.regions.length,count*lanes);
    const heights=new Map();
    for(const t of c.tracks)for(const m of t.modules.slice(0,lanes)){heights.set(m.y,(heights.get(m.y)||0)+1);}
    assert.equal(heights.size,count*lanes/4); assert.ok([...heights.values()].every(n=>n===4));
    assert.deepEqual([...heights.keys()].sort((a,b)=>a-b),[...Array(count*lanes/4)].map((_,i)=>i*8));
    if(lanes===2){assert.deepEqual(c.tracks[0].modules.map(m=>m.direction),['west','north']);assert.deepEqual(c.tracks[12].modules.map(m=>m.direction),['east','south']);assert.equal(c.tracks[0].modules[0].y,c.tracks[0].modules[1].y);}
    for(const region of result.regions)for(const b of region.blocks){
      assert.notDeepEqual([b.pos[0],b.pos[2]],[0,0]);assert.equal(used.has(b.pos.join(',')),false);used.add(b.pos.join(','));
      assert.equal(b.facing,CHEST_FACING[region.direction]);
    }
  }
});
test('configuration versions 1/2/3 are rejected instead of upgraded', () => {
  for (const version of [1, 2, 3]) assert.throws(() => validateConfig({ ...defaultConfig(), version }), /需要 version: 4/);
});

test('10 TPS preset matches the original world and adds four trumpets on layer 5', () => {
  const c = defaultConfig(20, 2), sides = ['west', 'north', 'east', 'south'];
  for (let id = 0; id < 16; id++) {
    const m = c.tracks[id].modules[0];
    assert.equal(m.direction, sides[Math.floor(id / 4)]); assert.equal(moduleLayer(m), 4 - id % 4);
  }
  for (let id = 16; id < 20; id++) {
    const m = c.tracks[id].modules[0]; assert.equal(m.direction, sides[id - 16]); assert.equal(moduleLayer(m), 5);
  }
});

test('20 TPS original instrument stacks match the specified order on both modules', () => {
  const c = defaultConfig(20);
  const expected = { west: [4,5,6,7,0,1,2,3], north: [4,5,6,7,0,1,2,3], east: [12,13,14,15,8,9,10,11], south: [12,13,14,15,8,9,10,11] };
  for (const [side, ids] of Object.entries(expected)) {
    const rows = c.tracks.slice(0,16).flatMap(t => t.modules.map((m,lane)=>({id:t.sourceIds[0],m,lane})));
    const stack = rows.filter(r=>r.m.direction===side).sort((a,b)=>b.m.y-a.m.y);
    assert.deepEqual(stack.map(r=>r.id), ids); assert.deepEqual(stack.map(r=>moduleLayer(r.m)), [8,7,6,5,4,3,2,1]);
    assert.ok(stack.every(r=>r.lane===(['west','east'].includes(side)?0:1)));
  }
  assert.deepEqual(c.tracks.slice(16).map(t=>moduleLayer(t.modules[0])), [9,9,10,10]);
  for (const t of c.tracks) assert.equal(t.modules[0].y,t.modules[1].y);
});

test('10 TPS exported subregion names omit module suffixes in both languages', async () => {
  const c = defaultConfig(20,2), song = songOf([{instrument:0}]);
  for (const language of ['zh','en']) {
    c.language = language; const result = compileSong(song,c), root = readNbt(gunzipSync(await exportLitematic(result,c)));
    assert.equal(result.regions.length,20); assert.ok(result.regions.every(r=>!r.name.includes('模块')&&!r.name.includes('Module')));
    assert.ok(Object.hasOwn(root.Regions,language==='zh'?'01_西_00_钢琴':'01_West_00_Harp'));
    assert.deepEqual(result.regions.map(r=>r.direction),['west','north','east','south'].flatMap(d=>Array(5).fill(d)));
    assert.deepEqual(Object.keys(root.Regions),result.regions.map(r=>r.name));
  }
});
test('alphabetically sorted exported names preserve West North East South grouping', async () => {
  for (const language of ['zh', 'en']) for (const interval of [1, 2]) {
    const c = defaultConfig(20, interval); c.language = language;
    const result = compileSong(songOf([{instrument:0}]), c);
    const root = readNbt(gunzipSync(await exportLitematic(result, c)));
    const names = Object.keys(root.Regions).sort();
    const perSide = interval === 1 ? 10 : 5;
    const sides = language === 'zh' ? ['西','北','东','南'] : ['West','North','East','South'];
    assert.deepEqual(names.map(name => name.split('_').slice(0,2).join('_')),
      sides.flatMap((side, index) => Array(perSide).fill(`0${index+1}_${side}`)));
  }
});

test('south machine side faces north, projects west, and puts high notes farther west', async () => {
  const c = defaultConfig(1); c.tracks[0].modules[0] = { x: -1, y: 0, z: 0, direction: 'south' };
  c.tracks[0].modules[1].y = 8;
  const result = compileSong(songOf([{ key: 33, tick: 0 }, { key: 57, tick: 8 }]), c);
  const south = result.regions.find(r => r.direction === 'south');
  assert.equal(south.name, '04_南_00_钢琴_模块1'); assert.equal(south.projectionDirection, 'west'); assert.equal(south.chestFacing, 'north');
  const low = south.blocks.find(b => b.pos[0] === -1), high = south.blocks.find(b => b.pos[0] === -49);
  assert.deepEqual(low.pos, [-1, 0, 0]); assert.deepEqual(high.pos, [-49, 0, 0]);
  assert.ok(south.blocks.every(b => b.facing === 'north' && b.pos[2] === 0));
  assert.equal(low.boxes.flat().find(item => item.code).id, DISCS[3]); assert.equal(high.boxes.flat().find(item => item.code).id, DISCS[7]);
  const root = readNbt(gunzipSync(await exportLitematic(result, c)));
  assert.deepEqual(root.Regions['04_南_00_钢琴_模块1'].Position, { x: -50, y: 0, z: 0 });
  assert.ok(root.Regions['04_南_00_钢琴_模块1'].BlockStatePalette.slice(1).every(state => state.Properties.facing === 'north'));
});

test('export keys are direction-first, include source IDs and module numbers, and remain unique', async()=>{
  const c=defaultConfig(), s=songOf(Array.from({length:20},(_,instrument)=>({instrument,layer:instrument})));
  let result=compileSong(s,c),root=readNbt(gunzipSync(await exportLitematic(result,c)));
  assert.ok(Object.hasOwn(root.Regions,'01_西_00_钢琴_模块1'));assert.ok(Object.hasOwn(root.Regions,'02_北_00_钢琴_模块2'));
  assert.deepEqual(result.regions.map(r=>r.direction),['west','north','east','south'].flatMap(d=>Array(10).fill(d)));
  c.language='en';result=compileSong(s,c);root=readNbt(gunzipSync(await exportLitematic(result,c)));
  assert.ok(Object.hasOwn(root.Regions,'01_West_00_Harp_Module1'));assert.ok(Object.hasOwn(root.Regions,'04_South_19_Oxidized Trumpet_Module2'));
  assert.deepEqual(Object.keys(root.Regions),result.regions.map(r=>r.name));
  c.tracks[4].name='钢琴';c.tracks[4].sourceIds=[];c.tracks[5].name='钢琴';c.tracks[5].sourceIds=[];
  result=compileSong(songOf([{instrument:0}]),c);
  assert.ok(result.regions.some(r=>r.name==='01_West_unassigned_Harp_Module1_2'));assert.equal(new Set(result.regions.map(r=>r.name)).size,40);
});
test('omitting empty chests preserves every subregion origin, size, volume and blank modules',async()=>{
  const c=defaultConfig(1),s=songOf([{key:57,tick:7}]);
  const sparse=readNbt(gunzipSync(await exportLitematic(compileSong(s,c),c)));
  c.removeEmptyChests=false;
  const full=readNbt(gunzipSync(await exportLitematic(compileSong(s,c),c)));
  assert.equal(sparse.Metadata.RegionCount,2);assert.equal(sparse.Metadata.TotalVolume,100);
  assert.equal(full.Metadata.TotalVolume,100);assert.deepEqual(sparse.Metadata.EnclosingSize,full.Metadata.EnclosingSize);
  for(const name of Object.keys(full.Regions)){
    assert.deepEqual(sparse.Regions[name].Position,full.Regions[name].Position);assert.deepEqual(sparse.Regions[name].Size,full.Regions[name].Size);
  }
  assert.equal(sparse.Regions['01_西_00_钢琴_模块1'].TileEntities.length,0);
  assert.equal(sparse.Regions['02_北_00_钢琴_模块2'].Position.x,1);
  assert.deepEqual(sparse.Regions['02_北_00_钢琴_模块2'].TileEntities.map(b=>b.x),[48,49]);
});
test('even/odd timing modules can move independently without changing encoded inventory',()=>{
  const c=defaultConfig(1),s=songOf([{tick:0},{tick:1,key:34}]);
  const before=compileSong(s,c);c.tracks[0].modules[1]={x:0,y:96,z:-1,direction:'north'};
  const after=compileSong(s,c);assert.deepEqual(after.stats.discs,before.stats.discs);
  const moved=after.regions.find(r=>r.module===2);assert.equal(moved.direction,'north');assert.equal(moved.bounds.min[1],96);assert.equal(moved.blocks[0].pos[1],96);
  assert.deepEqual(after.regions.find(r=>r.module===1).blocks,before.regions.find(r=>r.module===1).blocks);
});
test('projection layers calculate coordinates and layer-spacing changes preserve assignments', () => {
  const config = defaultConfig();
  const module = config.tracks[0].modules[1];
  assert.equal(moduleLayer(module), 4);
  module.direction = 'west'; setModuleLayer(module, 12);
  assert.deepEqual(module, { direction: 'west', x: 0, y: 88, z: -1 });
  changeLayerHeight(config, 12);
  assert.equal(config.layerHeight, 12); assert.equal(module.y, 132); assert.equal(moduleLayer(module, 12), 12);
  assert.equal(config.tracks[2].modules[0].y, 12);
  const loaded = validateConfig(JSON.parse(JSON.stringify(config))); assert.deepEqual(loaded, config);
  const old = defaultConfig(); delete old.layerHeight; assert.equal(validateConfig(old).layerHeight, 8);
  assert.throws(() => setModuleLayer(module, 0, 12), /层数/); assert.throws(() => changeLayerHeight(config, 0), /层高/);
});
test('custom coordinates survive spacing changes and can be returned to the projection grid', () => {
  const config = defaultConfig(), module = config.tracks[0].modules[0];
  Object.assign(module, { x: 17, y: 13, z: -9 });
  assert.equal(moduleLayer(module), null);
  changeLayerHeight(config, 10); assert.deepEqual(module, { x:17, y:13, z:-9, direction:'west' });
  setModuleLayer(module, 3, 10, false); assert.deepEqual(module, { x:17, y:20, z:-9, direction:'west' });
  setModuleLayer(module, 3, 10); assert.deepEqual(module, { x:0, y:20, z:-1, direction:'west' });
  assert.deepEqual(defaultConfig(20, 1, 10).tracks[2].modules[0], { x:0, y:10, z:-1, direction:'west' });
});
test('English UI messages cover validation errors and preserve custom names', () => {
  assert.equal(instrumentName('钢琴','en'),'Harp'); assert.equal(instrumentName('My custom lead','zh'),'My custom lead');
  assert.equal(translate('配置错误：NBS 乐器 1 被重复映射','en'),'Configuration error: NBS instrument 1 is mapped more than once');
  assert.equal(translate('NBS 文件不完整（字节 32）','en'),'Incomplete NBS file (byte 32)');
  assert.equal(translate('文件检查通过 · 25.6 秒 · 320 张唱片','en'),'File checks passed · 25.6 s · 320 discs');
});
test('packed block states straddle 64-bit words without losing high bits', () => {
  const values = Array.from({ length: 120 }, (_, i) => i % 7), longs = packBlockStates(values, 7);
  for (let i = 0; i < values.length; i++) { const pos = i * 3, word = Math.floor(pos / 64), shift = BigInt(pos % 64); const wide = longs[word] | ((longs[word + 1] || 0n) << 64n); assert.equal(Number((wide >> shift) & 7n), values[i]); }
});
for (const target of ['26.1', '1.20.4']) test(`independent gzip/NBT validation of ${target} chest inventories and block positions`, async () => {
  const c = defaultConfig(); c.target = target;
  const result = compileSong(demoSong(), c), bytes = await exportLitematic(result, c, '测试投影');
  const root = readNbt(gunzipSync(bytes)); assert.equal(root.Version, target === '26.1' ? 7 : 6); assert.equal(root.MinecraftDataVersion, target === '26.1' ? 4786 : 3700); assert.equal(root.Metadata.RegionCount, result.regions.length);
  let discs = 0; const quantities = Array(15).fill(0);
  for (const r of Object.values(root.Regions)) {
    const total = r.Size.x * r.Size.y * r.Size.z; assert.equal(r.BlockStates.length, Math.ceil(total * 2 / 64));
    for (const chest of r.TileEntities) {
      assert.ok(chest.x >= 0 && chest.x < r.Size.x && chest.z >= 0 && chest.z < r.Size.z);
      const index = chest.z * r.Size.x + chest.x, bit = index * 2;
      const state = Number((BigInt.asUintN(64, r.BlockStates[Math.floor(bit / 64)]) >> BigInt(bit % 64)) & 3n);
      assert.equal(r.BlockStatePalette[state].Name, 'minecraft:chest');
      for (const box of chest.Items) {
        assert.ok(box.Slot >= 0 && box.Slot < 27);
        const items = target === '26.1' ? box.components['minecraft:container'].map(x => x.item) : box.tag.BlockEntityTag.Items;
        assert.ok(items.length <= 27);
        for (const item of items) { const count = target === '26.1' ? item.count : item.Count; assert.ok(count >= 1 && count <= 64); if (DISCS.includes(item.id)) { discs += count; quantities[DISCS.indexOf(item.id)] += count; } }
      }
    }
  }
  assert.equal(discs, result.stats.discs.reduce((a, b) => a + b, 0));
  assert.deepEqual(quantities, result.stats.discs);
});

import { N, writeNbt } from './nbt.js';
const vec = ([x, y, z]) => N.compound({ x: N.int(x), y: N.int(y), z: N.int(z) });

export function itemTag(item, slot, modern, boxes) {
  const tag = { id: N.string(item.id), [modern ? 'count' : 'Count']: modern ? N.int(item.count) : N.byte(item.count) };
  if (slot !== undefined) tag.Slot = N.byte(slot);
  if (boxes) {
    const items = boxes.map((i, s) => modern ? N.compound({ slot: N.int(s), item: itemTag(i, undefined, true) }) : itemTag(i, s, false));
    if (modern) tag.components = N.compound({ 'minecraft:container': N.list(10, items) });
    else tag.tag = N.compound({ BlockEntityTag: N.compound({ id: N.string('minecraft:shulker_box'), Items: N.list(10, items) }) });
  }
  return N.compound(tag);
}

export function packBlockStates(indices, paletteSize) {
  const bits = Math.max(2, Math.ceil(Math.log2(paletteSize))), width = BigInt(bits);
  const longs = Array(Math.ceil(indices.length * bits / 64)).fill(0n);
  for (let i = 0; i < indices.length; i++) {
    const start = i * bits, word = Math.floor(start / 64), shift = BigInt(start % 64), value = BigInt(indices[i]);
    longs[word] = BigInt.asUintN(64, longs[word] | (value << shift));
    if (shift + width > 64n) longs[word + 1] |= value >> (64n - shift);
  }
  return longs;
}

export function litematicRoot(compiled, config, name = 'Encoded Redstone Music', now = Date.now()) {
  const modern = config.target === '26.1', regions = {}, allMin = [Infinity, Infinity, Infinity], allMax = [-Infinity, -Infinity, -Infinity];
  let volume = 0;
  const names = new Set();
  for (const region of compiled.regions) {
    const { min, max } = region.bounds;
    const size = min.map((v, a) => max[a] - v + 1), count = size.reduce((a, b) => a * b, 1); volume += count;
    for (let a = 0; a < 3; a++) { allMin[a] = Math.min(allMin[a], min[a]); allMax[a] = Math.max(allMax[a], max[a]); }
    const palette = [N.compound({ Name: N.string('minecraft:air') })], paletteMap = new Map(), indices = new Uint8Array(count), tileEntities = [];
    for (const b of region.blocks) {
      const key = `${b.facing}/${b.type}`;
      if (!paletteMap.has(key)) {
        paletteMap.set(key, palette.length);
        palette.push(N.compound({ Name: N.string('minecraft:chest'), Properties: N.compound({ facing: N.string(b.facing), type: N.string(b.type), waterlogged: N.string('false') }) }));
      }
      const local = b.pos.map((n, a) => n - min[a]), [x, y, z] = local;
      indices[(y * size[2] + z) * size[0] + x] = paletteMap.get(key);
      tileEntities.push(N.compound({ id: N.string('minecraft:chest'), x: N.int(x), y: N.int(y), z: N.int(z), Items: N.list(10, b.boxes.map((box, slot) => itemTag({ id: 'minecraft:shulker_box', count: 1 }, slot, modern, box))) }));
    }
    // Region compound keys are the names shown in Litematica's subregion list.
    let regionName = region.name, suffix = 2;
    while (names.has(regionName)) regionName = `${region.name}_${suffix++}`;
    names.add(regionName);
    regions[regionName] = N.compound({ Position: vec(min), Size: vec(size), BlockStatePalette: N.list(10, palette), BlockStates: N.longs(packBlockStates(indices, palette.length)), TileEntities: N.list(10, tileEntities), Entities: N.list(10, []), PendingBlockTicks: N.list(10, []), PendingFluidTicks: N.list(10, []) });
  }
  if (!Object.keys(regions).length) throw new Error('没有可导出的子区域');
  return N.compound({
    Version: N.int(modern ? 7 : 6), SubVersion: N.int(1), MinecraftDataVersion: N.int(modern ? 4786 : 3700),
    Metadata: N.compound({ Name: N.string(name), Author: N.string(compiled.song.header.author || 'Encoded Redstone Music'), Description: N.string('Disc-chest projection layout; one fixed-size subregion per timing module. ' + compiled.regions.map(r => `${r.id}=${r.name}`).join('; ')), TimeCreated: N.long(now), TimeModified: N.long(now), RegionCount: N.int(compiled.regions.length), TotalVolume: N.int(volume), TotalBlocks: N.int(compiled.stats.chests), EnclosingSize: vec(allMin.map((v, i) => allMax[i] - v + 1)) }),
    Regions: N.compound(regions),
  });
}

export async function exportLitematic(compiled, config, name) {
  const bytes = writeNbt(litematicRoot(compiled, config, name));
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

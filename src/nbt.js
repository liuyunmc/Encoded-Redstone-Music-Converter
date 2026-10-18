// Explicit tags prevent JavaScript number inference from corrupting item counts,
// slot bytes or the 64-bit Litematica block-state array.
export const N = {
  byte: value => ({ type: 1, value }), int: value => ({ type: 3, value }),
  long: value => ({ type: 4, value: BigInt(value) }), string: value => ({ type: 8, value }),
  list: (elementType, value) => ({ type: 9, elementType, value }),
  compound: value => ({ type: 10, value }), longs: value => ({ type: 12, value }),
};
export function writeNbt(root) {
  const a = [], utf8 = new TextEncoder();
  const u8 = n => a.push(n & 255);
  function int(n) { u8(n >>> 24); u8(n >>> 16); u8(n >>> 8); u8(n); }
  function long(n) { const x = BigInt.asUintN(64, BigInt(n)); for (let s = 56n; s >= 0n; s -= 8n) u8(Number((x >> s) & 255n)); }
  function string(s) { const b = utf8.encode(s); if (b.length > 65535) throw new Error('NBT 字符串过长'); u8(b.length >>> 8); u8(b.length); for (const n of b) u8(n); }
  function payload(t) {
    switch (t.type) {
      case 1: u8(t.value); break;
      case 3: int(t.value); break;
      case 4: long(t.value); break;
      case 8: string(t.value); break;
      case 9: u8(t.elementType); int(t.value.length); for (const child of t.value) { if (child.type !== t.elementType) throw new Error('NBT 列表类型不匹配'); payload(child); } break;
      case 10: for (const [key, child] of Object.entries(t.value)) { u8(child.type); string(key); payload(child); } u8(0); break;
      case 12: int(t.value.length); for (const n of t.value) long(n); break;
      default: throw new Error(`未支持的 NBT 类型 ${t.type}`);
    }
  }
  u8(10); string(''); payload(root); return new Uint8Array(a);
}

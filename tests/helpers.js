// Deliberately independent binary fixture and NBT reader, rather than a round-trip
// through the production serializers alone.
export function nbsFixture(version = 6, { optional = true, instrument = version === 6 ? 19 : 0, key = 57, pitch = 0 } = {}) {
  const a = [], byte = n => a.push(n & 255), short = n => { byte(n); byte(n >> 8); }, int = n => { short(n); short(n >> 16); };
  const string = s => { const b = new TextEncoder().encode(s); int(b.length); a.push(...b); };
  if (version === 0) short(8); else { short(0); byte(version); byte(version >= 6 ? 20 : 16); if (version >= 3) short(8); }
  short(1); for (const s of ['测试曲', 'Author', '', '']) string(s); short(2000);
  byte(0); byte(10); byte(4); for (let i = 0; i < 5; i++) int(0); string('');
  if (version >= 4) { byte(0); byte(0); short(0); }
  short(8); short(1); byte(instrument); byte(key);
  if (version >= 4) { byte(100); byte(100); short(pitch); }
  short(0); short(0);
  if (optional) { string('Layer'); if (version >= 4) byte(0); byte(100); if (version >= 2) byte(100); byte(0); }
  return Uint8Array.from(a);
}
export function readNbt(bytes) {
  const d = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); let p = 0;
  const u8 = () => d.getUint8(p++), int = () => { const n = d.getInt32(p); p += 4; return n; };
  const string = () => { const n = d.getUint16(p); p += 2; const s = new TextDecoder().decode(bytes.subarray(p, p + n)); p += n; return s; };
  function payload(type) {
    switch (type) {
      case 1: return d.getInt8(p++);
      case 3: return int();
      case 4: { const n = d.getBigInt64(p); p += 8; return n; }
      case 8: return string();
      case 9: { const kind = u8(), n = int(); return Array.from({ length: n }, () => payload(kind)); }
      case 10: { const o = {}; for (let kind; (kind = u8()) !== 0;) { const key = string(); o[key] = payload(kind); } return o; }
      case 12: return Array.from({ length: int() }, () => payload(4));
      default: throw new Error(`Unexpected tag ${type}`);
    }
  }
  if (u8() !== 10) throw new Error('Root must be compound'); string(); const root = payload(10);
  if (p !== bytes.length) throw new Error('Trailing NBT bytes'); return root;
}

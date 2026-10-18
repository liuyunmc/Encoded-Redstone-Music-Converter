import { INSTRUMENTS } from './config.js';
import { instrumentName, getLanguage } from './i18n.js';

// Representative note-block bases. Harp intentionally uses the note block itself.
const bases = [
  ['note_block', '音符盒', 'Note Block'], ['oak_planks', '橡木木板', 'Oak Planks'],
  ['stone', '石头', 'Stone'], ['sand', '沙子', 'Sand'], ['glass', '玻璃', 'Glass'],
  ['white_wool', '白色羊毛', 'White Wool'], ['clay', '黏土块', 'Clay'],
  ['gold_block', '金块', 'Block of Gold'], ['packed_ice', '浮冰', 'Packed Ice'],
  ['bone_block_side', '骨块', 'Bone Block'], ['iron_block', '铁块', 'Block of Iron'],
  ['soul_sand', '灵魂沙', 'Soul Sand'], ['pumpkin_side', '南瓜', 'Pumpkin'],
  ['emerald_block', '绿宝石块', 'Block of Emerald'], ['hay_block_side', '干草捆', 'Hay Bale'],
  ['glowstone', '荧石', 'Glowstone'], ['copper_block', '铜块', 'Block of Copper'],
  ['exposed_copper', '斑驳的铜块', 'Exposed Copper'], ['weathered_copper', '锈蚀的铜块', 'Weathered Copper'],
  ['oxidized_copper', '氧化的铜块', 'Oxidized Copper'],
];

export function trackInstrument(track) {
  const match = /^instrument_(\d+)$/.exec(track.id);
  const index = match && Number(match[1]) < INSTRUMENTS.length ? Number(match[1])
    : INSTRUMENTS.findIndex(([id, name]) => instrumentName(track.name, 'zh') === name || track.name === id);
  const [texture, zh, en] = bases[index] ?? bases[0];
  return { index, name: index >= 0 ? INSTRUMENTS[index][1] : track.name,
    texture: `assets/minecraft/block/${texture}.png`, block: getLanguage() === 'en' ? en : zh };
}

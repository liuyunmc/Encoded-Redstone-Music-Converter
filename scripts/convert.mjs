import { readFile, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { parseNbs, writeNbs } from '../src/nbs.js';
import { defaultConfig, validateConfig } from '../src/config.js';
import { compileSong } from '../src/encoder.js';
import { exportLitematic } from '../src/litematic.js';
const args = process.argv.slice(2);
if (!args.length || args.includes('--help')) {
  console.log('用法：npm run convert -- input.nbs output.litematic [--config machine.json] [--formatted formatted.nbs]');
} else {
  try {
    const [input, output] = args;
    if (!output || output.startsWith('--')) throw new Error('请指定输出 .litematic 路径');
    const song = parseNbs(await readFile(input));
    const ci = args.indexOf('--config'), fi = args.indexOf('--formatted');
    if ((ci >= 0 && !args[ci + 1]) || (fi >= 0 && !args[fi + 1])) throw new Error('选项缺少文件路径');
    const config = ci >= 0 ? validateConfig(JSON.parse(await readFile(args[ci + 1], 'utf8'))) : defaultConfig();
    if (ci < 0 && song.notes.some(n => n.instrument >= song.header.vanillaInstrumentCount)) throw new Error('此曲使用自定义乐器，请通过 --config 指定明确的机器映射');
    const compiled = compileSong(song, config);
    const projection = await exportLitematic(compiled, config, song.header.name || basename(input));
    const formatted = fi >= 0 ? writeNbs(compiled.song) : null;
    await writeFile(output, projection); if (formatted) await writeFile(args[fi + 1], formatted);
    console.log(JSON.stringify({ output, stats: compiled.stats, warnings: compiled.warnings }, null, 2));
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}

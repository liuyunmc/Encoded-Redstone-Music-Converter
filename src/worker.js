import { compileSong } from './encoder.js';
import { exportLitematic } from './litematic.js';
import { writeNbs } from './nbs.js';
import { translate } from './i18n.js';

self.onmessage = async ({ data: { id, action, song, config, name } }) => {
  try {
    const compiled = compileSong(song, config);
    compiled.warnings = compiled.warnings.map(message => translate(message, config.language));
    if (action === 'analyze') self.postMessage({ id, result: { stats: compiled.stats, warnings: compiled.warnings } });
    else if (action === 'report') self.postMessage({ id, result: { name, sourceVersion: song.header.version, target: config.target, layoutPurpose: 'projection-only', encodingValidation: 'user-verified-in-game', stats: compiled.stats, warnings: compiled.warnings, regions: compiled.regions.map(r => ({ id: r.id, name: r.name, sourceIds: r.sourceIds, module: r.module, direction: r.direction, projectionDirection: r.projectionDirection, chestFacing: r.chestFacing, bounds: r.bounds, sound: r.sound, chests: r.blocks.length })), config } });
    else {
      const bytes = action === 'litematic' ? await exportLitematic(compiled, config, name) : writeNbs(compiled.song);
      self.postMessage({ id, result: bytes }, [bytes.buffer]);
    }
  } catch (e) { self.postMessage({ id, error: translate(e.message, config.language) }); }
};

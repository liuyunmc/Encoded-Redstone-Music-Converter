import { defaultConfig, validateConfig, DISCS, DIRECTIONS, PROJECTION_DIRECTION, MACHINE_DIRECTION, PROJECTION_ORIGIN, moduleBounds, presetModules, moduleLayer, setModuleLayer, changeLayerHeight } from './config.js';
import { translate as l, setLanguage, getLanguage, capturePageTranslations, instrumentName, directionName } from './i18n.js';
import { parseNbs } from './nbs.js';
import { demoSong } from './demo.js';
import { trackInstrument } from './instruments.js';

const $ = id => document.getElementById(id);
const storageKey = 'encoded-redstone-music.config.v1';
const transient = new URLSearchParams(location.search).get('transient') === '1';
let config = defaultConfig(), song = null, filename = '', customized = false, revision = 0, timer, busy = false;
let moduleSort = 'instrument', customCoordinates = false;
let discUsage = null;
try { const saved = transient ? null : localStorage.getItem(storageKey); if (saved) { config = validateConfig(JSON.parse(saved)); customized = true; } } catch { /* A corrupt local draft must not prevent opening the editor. */ }
setLanguage(config.language);
const translatePage = capturePageTranslations(document);
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
const pending = new Map(); let requestId = 0;
worker.onmessage = ({ data }) => { const p = pending.get(data.id); if (p) { pending.delete(data.id); data.error ? p.reject(new Error(data.error)) : p.resolve(data.result); } };
worker.onerror = () => { for (const p of pending.values()) p.reject(new Error('转换线程启动失败，请通过本地服务或 GitHub Pages 打开页面')); pending.clear(); };
function request(action) { return new Promise((resolve, reject) => { const id = ++requestId; pending.set(id, { resolve, reject }); worker.postMessage({ id, action, song, config, name: song.header.name || filename }); }); }
function message(text, type = '') { const e = document.createElement('div'); e.className = `message ${type}`; e.textContent = l(text); $('messages').append(e); }
function error(e) { message(e.message || String(e), 'error'); }
function download(data, name, type = 'application/octet-stream') {
  const url = URL.createObjectURL(new Blob([data], { type })), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function persist() { if (transient) return; try { localStorage.setItem(storageKey, JSON.stringify(config)); } catch { /* JSON export remains available when browser storage is full or disabled. */ } }
function changed() { revision++; customized = true; persist(); clearTimeout(timer); setExportEnabled(false); renderDiscUsage(null); timer = setTimeout(analyze, 220); updateLayoutSummary(); drawPlan(); }
function setExportEnabled(value) { for (const id of ['export', 'format', 'report']) $(id).disabled = !value || busy; }
async function analyze() {
  const current = revision;
  if (!song) { try { validateConfig(config); $('messages').replaceChildren(); } catch (e) { $('messages').replaceChildren(); error(e); } return; }
  $('export-status').textContent = l('正在检查布局与编码容量…');
  try {
    const result = await request('analyze'); if (current !== revision) return;
    $('messages').replaceChildren(); for (const warning of result.warnings) message(warning);
    $('stat-notes').textContent = result.stats.notes.toLocaleString(); $('stat-regions').textContent = result.stats.regions;
    $('stat-chests').textContent = result.stats.chests; $('stat-boxes').textContent = result.stats.shulkers;
    renderDiscUsage(result.stats.discs);
    $('export-status').textContent = l(`文件检查通过 · ${result.stats.seconds.toFixed(1)} 秒 · ${result.stats.discs.reduce((a, b) => a + b, 0)} 张唱片`);
    setExportEnabled(true);
  } catch (e) {
    if (current !== revision) return;
    $('messages').replaceChildren(); error(e); setExportEnabled(false); $('export-status').textContent = l('请修正上述问题后导出');
    renderDiscUsage(null);
    for (const id of ['stat-notes', 'stat-regions', 'stat-chests', 'stat-boxes']) $(id).textContent = '—';
  }
}
function input(value, label, oninput, type = 'text') {
  const e = document.createElement('input'); e.type = type; e.value = value; e.setAttribute('aria-label', l(label)); e.addEventListener('input', () => oninput(e)); return e;
}
function instrumentIdentity(track, withSource = false) {
  const info = trackInstrument(track), identity = document.createElement('span'), icon = document.createElement('img'), text = document.createElement('span');
  identity.className = 'instrument-identity'; icon.className = 'block-icon'; icon.src = info.texture; icon.alt = ''; icon.title = info.block; icon.width = 28; icon.height = 28;
  text.textContent = (withSource ? `${track.sourceIds.join('+') || '—'} · ` : '') + instrumentName(info.name);
  identity.append(icon, text); return identity;
}
function renderDiscUsage(counts) {
  discUsage = counts; $('disc-usage').replaceChildren();
  const total = counts?.reduce((a, b) => a + b, 0);
  $('disc-total').textContent = total === undefined ? '—' : total.toLocaleString();
  $('disc-usage-status').textContent = l(counts ? '按导出箱内的实际数量统计，包含和弦合并后的编码唱片。' : '导入乐曲并通过检查后显示；修改映射或移调后自动更新。');
  config.discs.forEach((id, index) => {
    const row = document.createElement('div'), identity = document.createElement('div'), text = document.createElement('span'), signal = document.createElement('small'), name = document.createElement('span'), count = document.createElement('strong');
    row.className = 'disc-usage-item'; row.classList.toggle('unused', counts?.[index] === 0); identity.className = 'disc-identity';
    if (DISCS.includes(id)) { const icon = document.createElement('img'); icon.src = `assets/minecraft/item/${id.split(':')[1]}.png`; icon.alt = ''; icon.width = 32; icon.height = 32; icon.className = 'disc-icon'; identity.append(icon); }
    else { const icon = document.createElement('span'); icon.className = 'custom-disc-icon'; icon.textContent = '◉'; identity.append(icon); }
    signal.textContent = l('信号') + ' ' + String(index + 1).padStart(2, '0');
    name.textContent = id.startsWith('minecraft:music_disc_') ? id.slice('minecraft:music_disc_'.length) : id; name.title = id;
    text.append(signal, name); identity.append(text); count.textContent = counts ? counts[index].toLocaleString() : '—'; count.dataset.signal = index + 1;
    row.append(identity, count); $('disc-usage').append(row);
  });
}
function renderTracks() {
  $('tracks').replaceChildren(); $('track-count').textContent = ` / ${config.tracks.length}`;
  config.tracks.forEach((t, index) => {
    t.name = trackInstrument(t).name;
    const name = instrumentName(t.name);
    const row = document.createElement('tr');
    function cell(el) { const c = document.createElement('td'); c.append(el); row.append(c); }
    const first = document.createElement('div'), check = document.createElement('input'); check.type = 'checkbox'; check.checked = t.enabled; check.setAttribute('aria-label', l(`启用 ${name}`));
    check.onchange = () => { t.enabled = check.checked; renderModulePlacements(); changed(); };
    first.append(check, instrumentIdentity(t)); cell(first);
    cell(input(t.sourceIds.join(', '), `${name} NBS 编号`, e => { t.sourceIds = e.value.trim() === '' ? [] : e.value.split(/[,，]/).map(s => s.trim() === '' ? NaN : Number(s.trim())); renderModulePlacements(); changed(); }));
    cell(input(t.keyOffset, `${name} keyOffset`, e => { t.keyOffset = e.value === '' ? NaN : Number(e.value); changed(); }, 'number'));
    const remove = document.createElement('button'); remove.textContent = '×'; remove.title = l(`删除 ${name}`); remove.setAttribute('aria-label', remove.title); remove.onclick = () => { config.tracks.splice(index, 1); renderTracks(); changed(); }; cell(remove); $('tracks').append(row);
  });
  renderModulePlacements(); updateLayoutSummary(); drawPlan();
}
function renderModulePlacements() {
  $('module-placements').replaceChildren();
  const lanes = config.noteInterval === 1 ? 2 : 1;
  const entries = config.tracks.filter(t => t.enabled).flatMap(t => t.modules.slice(0, lanes).map((module, lane) => ({ t, module, lane })));
  if (moduleSort === 'direction') entries.sort((a, b) => DIRECTIONS.indexOf(a.module.direction) - DIRECTIONS.indexOf(b.module.direction) || a.module.y - b.module.y || a.lane - b.lane);
  if (moduleSort === 'layer') entries.sort((a, b) => a.module.y - b.module.y || DIRECTIONS.indexOf(a.module.direction) - DIRECTIONS.indexOf(b.module.direction) || a.lane - b.lane);
  for (const { t, module, lane } of entries) {
    const row = document.createElement('tr'), name = instrumentName(t.name), label = `${name} · ${getLanguage() === 'en' ? 'Module' : '模块'} ${lane + 1}`;
    row.dataset.trackId = t.id; row.dataset.module = lane + 1;
    const cell = content => { const e = document.createElement('td'); e.append(content); row.append(e); };
    const instrumentLabel = document.createElement('span'), customTag = document.createElement('small');
    instrumentLabel.append(instrumentIdentity(t, true)); customTag.textContent = l('自定义坐标'); customTag.className = 'custom-position-tag'; instrumentLabel.append(customTag); cell(instrumentLabel);
    cell(document.createTextNode(config.noteInterval === 1 ? (getLanguage() === 'en' ? `Module ${lane + 1} · ${lane ? 'odd' : 'even'}` : `模块 ${lane + 1} · ${lane ? '奇' : '偶'} tick`) : (getLanguage() === 'en' ? 'Module 1' : '模块 1')));
    const direction = document.createElement('select'); direction.setAttribute('aria-label', l(`${label} 机器方位`));
    for (const d of DIRECTIONS) direction.add(new Option(directionName(d), d)); direction.value = module.direction;
    direction.onchange = () => { module.direction = direction.value; if (!customCoordinates) [module.x, module.z] = PROJECTION_ORIGIN[module.direction]; changed(); renderModulePlacements(); };
    cell(direction);
    const coordinates = [], layerInput = document.createElement('input'); layerInput.type = 'number'; layerInput.min = '1'; layerInput.step = '1'; layerInput.placeholder = l('自定义'); layerInput.setAttribute('aria-label', l(`${label} 层数`));
    layerInput.oninput = () => {
      try {
        setModuleLayer(module, Number(layerInput.value), config.layerHeight, !customCoordinates);
        layerInput.setCustomValidity(''); for (const {key, element} of coordinates) element.value = module[key]; updateLayer(); changed();
      } catch (e) { layerInput.setCustomValidity(l(e.message)); revision++; clearTimeout(timer); setExportEnabled(false); }
    };
    layerInput.onchange = () => {
      if (!layerInput.checkValidity()) { error(new Error(layerInput.validationMessage)); layerInput.value = moduleLayer(module, config.layerHeight) ?? ''; layerInput.setCustomValidity(''); analyze(); }
      else if (moduleSort !== 'instrument') renderModulePlacements();
    }; cell(layerInput);
    function updateLayer() {
      layerInput.value = moduleLayer(module, config.layerHeight) ?? '';
      const [x, z] = PROJECTION_ORIGIN[module.direction]; customTag.hidden = module.x === x && module.z === z && moduleLayer(module, config.layerHeight) !== null;
    }
    for (const key of ['x', 'y', 'z']) {
      const coordinate = input(module[key], `${label} ${key}`, e => { module[key] = e.value === '' ? NaN : Number(e.value); updateLayer(); changed(); }, 'number');
      coordinates.push({ key, element: coordinate });
      coordinate.readOnly = !customCoordinates; coordinate.classList.toggle('computed-coordinate', !customCoordinates); if (!customCoordinates) coordinate.tabIndex = -1; cell(coordinate);
    }
    updateLayer();
    $('module-placements').append(row);
  }
}
function updateLayoutSummary() {
  const lanes = config.noteInterval === 1 ? 2 : 1;
  for (const count of [16, 20]) $(`preset${count}`).textContent = getLanguage() === 'en' ? `${count} instruments · ${count * lanes} modules / ${count * lanes / 4} layers` : `${count} 乐器 · ${count * lanes} 模块 / ${count * lanes / 4} 层`;
  const enabled = config.tracks.filter(t => t.enabled), modules = enabled.flatMap(t => t.modules.slice(0, lanes)), layers = new Set(modules.map(m => m.y));
  $('layout-summary').textContent = getLanguage() === 'en' ? `${20 / config.noteInterval} TPS · ${enabled.length} instruments · ${modules.length} modules · ${layers.size} height levels · spacing ${config.layerHeight}` : `${20 / config.noteInterval} TPS · ${enabled.length} 种乐器 · ${modules.length} 个模块 · ${layers.size} 层 · 层高 ${config.layerHeight} 格`;
}
function render() {
  setLanguage(config.language); translatePage(); $('language').value = getLanguage();
  const english = getLanguage() === 'en';
  document.querySelectorAll('a[href="README.md"], a[href="README.en.md"]').forEach(a => a.setAttribute('href', english ? 'README.en.md' : 'README.md'));
  $('interval').value = config.noteInterval; $('timing').value = config.timing; $('range').value = config.rangePolicy; $('target').value = config.target;
  $('stackable').checked = config.useStackable; $('remove-empty').checked = config.removeEmptyChests;
  $('fillers').value = config.fillers.join('\n'); $('rest-item').value = config.restItem;
  $('module-sort').value = moduleSort; $('custom-coordinates').checked = customCoordinates; $('layer-height').value = config.layerHeight;
  $('discs').replaceChildren(); config.discs.forEach((id, index) => {
    const label = document.createElement('label'), number = document.createElement('span'); number.textContent = String(index + 1).padStart(2, '0');
    label.append(number, input(id, `信号 ${index + 1} 物品 ID`, e => { config.discs[index] = e.value.trim(); changed(); })); $('discs').append(label);
  }); renderTracks(); renderDiscUsage(discUsage); drawPiano(); renderSongSummary();
}
function drawPiano() {
  const canvas = $('piano'), rect = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  const width = Math.max(250, rect.width), height = 210; canvas.width = width * dpr; canvas.height = height * dpr;
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, width, height);
  for (let k = 0; k < 88; k += 12) { const y = height - k / 88 * height; ctx.strokeStyle = '#29352c'; ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(width, y); ctx.stroke(); ctx.fillStyle = '#748976'; ctx.font = '9px monospace'; ctx.fillText(k, 4, y - 2); }
  for (let i = 0; i < 9; i++) { const x = 28 + (width - 28) * i / 8; ctx.strokeStyle = '#202e24'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
  if (!song) { ctx.fillStyle = '#718475'; ctx.font = '12px "Segoe UI"'; ctx.textAlign = 'center'; ctx.fillText(l('导入 NBS，查看音符时间轴'), width / 2, height / 2); return; }
  const length = Math.max(1, song.header.length);
  for (const n of song.notes) { ctx.fillStyle = `hsl(${85 + n.instrument * 29 % 260} 48% 68%)`; ctx.fillRect(28 + n.tick / length * (width - 30), height - (n.key + 1) / 88 * height, Math.max(2, (width - 30) / length), 2.4); }
}
function drawPlan() {
  const svg = $('plan'); svg.replaceChildren(); const ns = 'http://www.w3.org/2000/svg';
  const add = (tag, attrs, text) => { const e = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (text) e.textContent = text; svg.append(e); };
  const lanes = config.noteInterval === 1 ? 2 : 1;
  const modules = config.tracks.filter(t => t.enabled).flatMap(t => t.modules.slice(0,lanes)).filter(m => DIRECTIONS.includes(m.direction) && Number.isFinite(m.x) && Number.isFinite(m.z));
  const groups = new Map();
  for (const m of modules) { const key=[m.x,m.z,m.direction].join('/'); if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m); }
  const footprints=[...groups.values()].map(group=>{const bounds=moduleBounds(group[0]);return {group,minX:bounds.min[0],maxX:bounds.max[0],minZ:bounds.min[2],maxZ:bounds.max[2]};});
  const minX = Math.min(0, ...footprints.map(f => f.minX)), maxX = Math.max(0, ...footprints.map(f => f.maxX));
  const minZ = Math.min(0, ...footprints.map(f => f.minZ)), maxZ = Math.max(0, ...footprints.map(f => f.maxZ));
  const scale = Math.min(280 / (maxX - minX + 5), 220 / (maxZ - minZ + 5));
  const x = n => 180 + (n - (minX + maxX) / 2) * scale, z = n => 145 + (n - (minZ + maxZ) / 2) * scale;
  add('line', { x1: x(0), y1: 22, x2: x(0), y2: 266, stroke: '#334638', 'stroke-dasharray': '3 5' });
  add('line', { x1: 20, y1: z(0), x2: 340, y2: z(0), stroke: '#334638', 'stroke-dasharray': '3 5' });
  const colors = { east: '#c2e798', south: '#e5b789', west: '#9dc8dd', north: '#b9a6da' };
  for (const f of footprints) {
    const t = f.group[0];
    add('rect', { x: x(f.minX - .5), y: z(f.minZ - .5), width: (f.maxX - f.minX + 1) * scale, height: (f.maxZ - f.minZ + 1) * scale, fill: colors[PROJECTION_DIRECTION[t.direction]], opacity: .75 });
  }
  add('circle', { cx: x(0), cy: z(0), r: 3, fill: '#f4f1dc' });
  add('text', { x: x(0) + 9, y: z(0) - 10, fill: '#f4f1dc', 'font-size': 9 }, '(0,0,0)');
  for (const [direction, tx, ty] of [['north', 180, 15], ['south', 180, 281], ['west', 49, 145], ['east', 311, 145]]) {
    const side = MACHINE_DIRECTION[direction], count = modules.filter(t => t.direction === side).length;
    const label = getLanguage() === 'en' ? `${directionName(side)} side chests · ${count}` : `${directionName(side)}侧箱子 · ${count}`;
    add('text', { x: tx, y: ty, fill: colors[direction], 'font-size': 9, 'text-anchor': 'middle' }, label);
  }
  add('text', { x: 180, y: 299, fill: '#71856e', 'font-size': 9, 'text-anchor': 'middle' }, getLanguage() === 'en' ? 'Module count · spacing ' + config.layerHeight : '数字为模块数 · 层高 ' + config.layerHeight + ' 格');
}
function showSong(parsed, name) {
  song = parsed; filename = name.replace(/\.nbs$/i, '');
  discUsage = null; setExportEnabled(false);
  if (!customized) {
    config = { ...defaultConfig(), language: getLanguage() };
    for (const t of config.tracks) if (t.sourceIds[0] >= song.header.vanillaInstrumentCount) t.sourceIds = [];
    song.instruments.forEach((inst, i) => {
      const source = song.header.vanillaInstrumentCount + i, t = config.tracks.find(t => !t.sourceIds.length) ?? addTrack(false);
      Object.assign(t, { sourceIds: [source], keyOffset: 0 });
    });
  }
  revision++; render(); analyze();
}
function renderSongSummary() {
  if (!song) return;
  $('song-name').textContent = song.header.name || filename;
  const custom = song.instruments.map((i, n) => `${song.header.vanillaInstrumentCount + n}=${i.name}`).join('，');
  $('song-detail').textContent = l(`NBS v${song.header.version} · ${song.notes.length} 音符 · ${song.header.tempo} tick/s · ${song.header.vanillaInstrumentCount} 内置乐器${custom ? ` · 自定义：${custom}` : ''}`);
  $('preview-meta').textContent = l(`${(song.header.length / song.header.tempo).toFixed(1)} 秒 / ${song.header.layerCount} 层`);
}
async function loadFile(file) { if (!file) return; try { if (file.size > 32 * 1024 * 1024) throw new Error('文件超过 32 MB'); showSong(parseNbs(await file.arrayBuffer()), file.name); } catch (e) { error(e); } }
function addTrack(redraw = true) {
  let i = config.tracks.length; while (config.tracks.some(t => t.id === `instrument_${i}`)) i++;
  const t = defaultConfig(i + 1, config.noteInterval, config.layerHeight).tracks[i]; t.sourceIds = []; t.name = l(`自定义乐器 ${i + 1}`); config.tracks.push(t);
  if (redraw) { renderTracks(); changed(); } return t;
}
for (const button of document.querySelectorAll('[data-tab]')) button.onclick = () => {
  document.querySelectorAll('[data-tab]').forEach(t => t.classList.toggle('active', t === button));
  for (const panel of document.querySelectorAll('.panel')) panel.classList.toggle('active', panel.id === `panel-${button.dataset.tab}`); drawPiano();
};
for (const [id, key, getter] of [['timing', 'timing', e => e.value], ['range', 'rangePolicy', e => e.value], ['target', 'target', e => e.value], ['stackable', 'useStackable', e => e.checked], ['remove-empty', 'removeEmptyChests', e => e.checked], ['fillers', 'fillers', e => e.value.split('\n').map(s => s.trim()).filter(Boolean)], ['rest-item', 'restItem', e => e.value.trim()]]) $(id).addEventListener('input', e => { config[key] = getter(e.target); changed(); });
$('interval').addEventListener('input', e => {
  const previous=config.noteInterval, next=Number(e.target.value);
  const standard=config.tracks.every((t,i)=>{ const expected=presetModules(i,previous,config.layerHeight); return t.modules.every((m,j)=>['x','y','z','direction'].every(key=>m[key]===expected[j][key])); });
  config.noteInterval=next;
  if(standard)config.tracks.forEach((t,i)=>t.modules=presetModules(i,next,config.layerHeight));
  renderModulePlacements(); changed();
});
$('nbs-file').onchange = e => { loadFile(e.target.files[0]); e.target.value = ''; };
$('language').onchange = e => { config.language = e.target.value; render(); changed(); };
$('demo').onclick = () => showSong(demoSong(), 'copper_echoes.nbs');
$('add-track').onclick = () => addTrack();
$('show-disc-usage').onclick = () => { document.querySelector('[data-tab="coding"]').click(); $('usage-card').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
for (const count of [16, 20]) $(`preset${count}`).onclick = () => { config.tracks = defaultConfig(count, config.noteInterval, config.layerHeight).tracks; renderTracks(); changed(); };
$('module-sort').onchange = e => { moduleSort = e.target.value; renderModulePlacements(); };
$('custom-coordinates').onchange = e => { customCoordinates = e.target.checked; renderModulePlacements(); };
$('layer-height').oninput = e => { try { changeLayerHeight(config, Number(e.target.value)); e.target.setCustomValidity(''); renderModulePlacements(); changed(); } catch (err) { e.target.setCustomValidity(l(err.message)); revision++; clearTimeout(timer); setExportEnabled(false); } };
$('layer-height').onchange = e => { if (!e.target.checkValidity()) { error(new Error(e.target.validationMessage)); e.target.value = config.layerHeight; e.target.setCustomValidity(''); analyze(); } };
$('save-config').onclick = () => { try { validateConfig(config); download(JSON.stringify(config, null, 2), 'redstone-machine.json', 'application/json'); } catch (e) { error(e); } };
$('config-file').onchange = async e => { try { const file = e.target.files[0]; if (!file) return; if (file.size > 1024 * 1024) throw new Error('配置超过 1 MB'); const next = validateConfig(JSON.parse(await file.text())); config = { ...next, language: next.language ?? getLanguage() }; render(); changed(); } catch (err) { error(err); } finally { e.target.value = ''; } };
$('reset').onclick = () => { config = { ...defaultConfig(), language: getLanguage() }; customized = false; revision++; try { if (!transient) localStorage.removeItem(storageKey); } catch {} if (song) showSong(song, filename); else render(); };
for (const [id, action, extension] of [['export', 'litematic', '.litematic'], ['format', 'nbs', '.formatted.nbs'], ['report', 'report', '.report.json']]) $(id).onclick = async () => {
  busy = true; setExportEnabled(false); $('export-status').textContent = l('正在生成文件…');
  let success, failure;
  try { const name = (filename || 'song').replace(/[<>:"/\\|?*]/g, '_'); const result = await request(action); download(action === 'report' ? JSON.stringify(result, null, 2) : result, name + extension); success = `已生成 ${name + extension}`; }
  catch (e) { failure = e; }
  finally { busy = false; await analyze(); if (failure) error(failure); else message(success, 'success'); }
};
for (const event of ['dragenter', 'dragover']) $('dropzone').addEventListener(event, e => { e.preventDefault(); $('dropzone').classList.add('dragging'); });
$('dropzone').ondragleave = () => $('dropzone').classList.remove('dragging');
$('dropzone').ondrop = e => { e.preventDefault(); $('dropzone').classList.remove('dragging'); loadFile(e.dataTransfer.files[0]); };
window.addEventListener('resize', drawPiano);
render();

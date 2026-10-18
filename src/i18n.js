import { INSTRUMENTS } from './config.js';

let language = 'zh';
export const getLanguage = () => language;
export function setLanguage(value) { language = value === 'en' ? 'en' : 'zh'; }
const englishInstruments = ['Harp', 'Bass', 'Bass Drum', 'Snare', 'Hi-hat', 'Guitar', 'Flute', 'Bell', 'Chime', 'Xylophone', 'Iron Xylophone', 'Cow Bell', 'Didgeridoo', 'Bit', 'Banjo', 'Pling', 'Trumpet', 'Exposed Trumpet', 'Weathered Trumpet', 'Oxidized Trumpet'];
export function instrumentName(name, locale = language) {
  const index = INSTRUMENTS.findIndex(([id, zh], i) => name === id || name === zh || name === englishInstruments[i]);
  return index < 0 ? name : locale === 'en' ? englishInstruments[index] : INSTRUMENTS[index][1];
}
export function directionName(direction, locale = language) {
  return (locale === 'en' ? { east: 'East', south: 'South', west: 'West', north: 'North' } : { east: '东', south: '南', west: '西', north: '北' })[direction] ?? direction;
}

const en = {
  '机器方位': 'Machine side', '按机器方位排序': 'Machine side order', '按机器方位排列的模块子区域': 'Module subregions grouped by machine side',
  '需要 version: 4': 'Expected version: 4',
  '十字仅用于唱片箱投影，不代表音乐机结构。方位按机器侧标注，每层四侧各 1 个模块，默认层高 8 格；同乐器双模块相邻。应用预设会替换当前布局。': 'The cross arranges disc-chest projections, not the music machine. Directions identify machine sides. Each layer has one module per side, with default spacing of 8 blocks and adjacent same-instrument modules. Applying a preset replaces the layout.',
  '投影原点为底层中心。': 'The schematic origin is the bottom center.',
  '默认按乐器顺序显示双模块。编辑机器方位和层数，底层为第 1 层（Y=0）；X/Y/Z 按粘贴用投影位置计算。子区域按机器方位分组并命名。': 'Both modules are shown together in instrument order. Edit machine side and layer; bottom layer 1 is Y=0. X/Y/Z describe the projection position for pasting. Subregions are grouped and named by machine side.',
  '编码与用量': 'Encoding & materials', '唱片用量统计': 'Music disc quantities', '张唱片': 'music discs', '信号': 'Signal',
  '各信号唱片用量': 'Music disc quantity by signal', '查看唱片用量': 'View disc quantities',
  '按导出箱内的实际数量统计，包含和弦合并后的编码唱片。': 'Actual quantities in exported chests, after chord notes are merged into disc signals.',
  '导入乐曲并通过检查后显示；修改映射或移调后自动更新。': 'Quantities appear after a song passes validation and update when routing or transposition changes.',
  '乐器名称固定；NBS 源编号和移调可编辑。图标表示对应音符盒底座，钢琴使用音符盒图标。': 'Instrument names are fixed. Edit NBS source IDs and transposition. Icons show note-block bases; Harp uses the note block icon.',
  '布局和编码表可复用。修改会自动保存在当前浏览器。': 'Reuse layouts and encoding tables. Changes are saved in this browser.',
  '列表排序': 'Sort list', '模块列表排序': 'Module list order', '按乐器顺序': 'Instrument order', '按方位排序': 'Direction order', '按层数排序': 'Layer order', '层数': 'Layer', '自定义': 'Custom', '自定义坐标': 'Custom coordinates',
  '默认按乐器顺序显示双模块。常用操作只需修改方位和层数，底层为第 1 层（Y=0）；X/Y/Z 自动计算。列表排序不会改变导出子区域按方向分组的顺序。': 'Both modules are shown together in instrument order by default. Edit direction and layer; bottom layer 1 is Y=0 and X/Y/Z are calculated. List sorting does not change the export’s direction grouping.',
  '高级：自定义坐标与层高': 'Advanced: coordinates & layer spacing', '启用 X/Y/Z 自定义编辑': 'Enable custom X/Y/Z editing', '层高（格）': 'Layer spacing (blocks)',
  '修改层高会保持各模块的层数；导入的自定义坐标会保留。不在层网格上的 Y 显示为“自定义”，需启用高级坐标编辑或重新指定层数。': 'Changing spacing preserves layer numbers. Imported custom coordinates are retained. A Y value off the layer grid is shown as Custom; enable coordinate editing or assign a new layer.',
  '十字仅用于唱片箱投影，不代表音乐机结构。每层东南西北各 1 个模块，默认层高 8 格；同乐器双模块默认在同层相邻方向。应用预设会替换当前布局。': 'The cross arranges disc-chest projections, not the music machine. Each layer has one module per direction, with default spacing of 8 blocks. The same instrument’s two modules default to neighboring arms on one layer. Applying a preset replaces the layout.',
  '层高必须为 1–1024 的整数': 'Layer spacing must be an integer from 1 to 1024', '层数必须为正整数，且投影 Y 不能超过 1000000': 'Layer must be a positive integer and projection Y must not exceed 1000000',
  '投影布局': 'Projection layout', '唱片箱投影布局': 'Disc-chest projection layout',
  '保存投影与编码配置': 'Save projection & encoding setup',
  '十字仅用于唱片箱投影，不代表音乐机结构。每层东南西北各 1 个模块，层距 8 格；同乐器双模块默认在同层相邻方向。应用预设会替换当前布局。': 'The cross arranges disc-chest projections, not the music machine. Each layer has one module per direction, 8 blocks apart vertically. An instrument’s two modules default to neighboring arms on the same layer. Applying a preset replaces the layout.',
  '每个模块，一个固定大小子区域': 'One fixed-size subregion per module',
  '20 TPS 每种乐器分为偶 tick、奇 tick 两个模块，可分别调整位置。每模块 25 组双箱；移除空箱子后仍保留完整 50 格边界，空模块子区域也保留。': 'At 20 TPS, each instrument has separate even- and odd-tick modules with independent positions. Each has 25 double chests. Omitting empty chests preserves its full 50-block bounds, including fully empty module subregions.',
  '模块位置': 'Module positions', '按西 → 北 → 东 → 南排列': 'Ordered West → North → East → South',
  '原编号 / 乐器': 'Source ID / instrument', '模块 / 时相': 'Module / tick phase',
  '按方向排列的模块子区域': 'Module subregions ordered by direction',
  '唱片工坊': 'Disc Workshop', '唱片工坊 · Encoded Redstone Music': 'Disc Workshop · Encoded Redstone Music',
  '浏览器本地处理': 'Processed locally', '语言': 'Language',
  '把旋律，装进唱片箱。': 'Turn melodies into disc chests.',
  'NBS 格式化、乐器编排与编码投影，一次完成。': 'Format NBS songs, arrange instruments and export encoded schematics.',
  '试用示例乐曲': 'Try demo song', '导入你的 NBS 乐曲': 'Import your NBS song',
  '拖入文件，或选择本地 .nbs · 支持新版四种小号': 'Drop a file or select a local .nbs · Includes all four trumpets',
  '选择文件': 'Choose file', '编辑视图': 'Editor views', '乐曲与格式化': 'Song & formatting', '机器布局': 'Machine layout', '编码与音源': 'Encoding & sounds',
  '旋律预览': 'Note preview', '等待导入': 'No song loaded', '音符时间轴预览': 'Note timeline', '音符': 'Notes', '纵轴：NBS 音高 0–87': 'Y: NBS keys 0–87', '横轴：原曲时间': 'X: original song time',
  '格式化设置': 'Formatting', '保留原始文件': 'Original file preserved', '机器速度': 'Machine speed',
  '20 tick/s · 双模块': '20 ticks/s · Two modules', '10 tick/s · 单模块': '10 ticks/s · One module',
  '时间处理': 'Timing', '保持原曲时长 · 重采样': 'Keep duration · Resample', '保持原始 tick · 改变播放速度': 'Keep ticks · Change playback speed',
  '超出音域 33–57': 'Notes outside keys 33–57', '按八度移入音域': 'Transpose by octaves', '报错，停止转换': 'Stop with an error', '丢弃超出音域的音符': 'Drop out-of-range notes',
  '投影目标版本': 'Schematic target', 'Java 26.1 · 现代物品组件': 'Java 26.1 · Item components', 'Java 1.20.4 · 旧版物品 NBT': 'Java 1.20.4 · Legacy item NBT',
  '用可堆叠物品压缩空拍': 'Compress rests with stackable items', '移除空箱子': 'Omit empty chests',
  '唱片只能表示离散音高和触发时间。微调音高取最近半音，力度、声像和循环不会写入机器编码。': 'Discs encode discrete notes and triggers. Fine pitch is rounded to a semitone; velocity, panning and loops are not encoded.',
  '存档布局': 'World layout', '4 层 / 16 乐器': '4 layers / 16 instruments', '5 层 / 20 乐器': '5 layers / 20 instruments',
  '十字布局，首箱紧邻中心；底层 Y=0，层距 8 格。应用预设会替换当前乐器表。': 'Cross layout with the first chest beside the center. Bottom Y=0; layers are 8 blocks apart. Applying a preset replaces the instrument table.',
  '模块实际坐标俯视图': 'Top view of actual chest footprints', '每种乐器，一个子区域': 'One subregion per instrument',
  '投影原点是底层十字中心 (0,0,0)，中心格留空。四臂首箱从东 (1,0,0)、南 (0,0,1)、西 (−1,0,0)、北 (0,0,−1) 向外延伸。': 'The schematic origin is the empty center block (0,0,0) on the bottom layer. First chests start at East (1,0,0), South (0,0,1), West (−1,0,0) and North (0,0,−1), extending outward.',
  'X/Y/Z 是该乐器首箱的位置；方位决定箱列向外延伸的方向。每列 25 组双箱，20 tick/s 增加并排第二列。上层 Y=8、16、24、32。': 'X/Y/Z locate the first chest. The arm direction determines outward growth. Each column has 25 double chests; 20 ticks/s adds a parallel column. Upper layers use Y=8,16,24,32.',
  '查看坐标与编码说明 ↗': 'Coordinates & encoding guide ↗', '乐器位置与映射': 'Instrument placement & routing', '＋ 添加乐器': '+ Add instrument',
  '启用 / 乐器': 'Enabled / instrument', 'NBS 编号': 'NBS IDs', '方位': 'Arm direction', '移调': 'Transpose',
  '编号从 0 开始；多个源乐器可用逗号合并到同一模块。留空表示该模块不接收音符。禁用有音符的乐器后，需要重新分配对应编号。': 'IDs start at 0. Separate multiple source IDs with commas to merge instruments. An empty field receives no notes. Reassign used IDs before disabling a module.',
  '材质包音源映射': 'Resource pack sound routing', '导入 sounds.json': 'Import sounds.json',
  '材质包只替换声音；机器仍读取相同的唱片信号。将 NBS 乐器分配到实际播放该音效的模块，并设置音高偏移。此处记录声音事件 ID，不会打包或修改材质包。': 'Assign each NBS instrument to the module that plays its sound and adjust transposition. Sound event IDs are notes for your setup; this editor does not modify or package resource packs.',
  '4 位唱片编码': '4-bit disc encoding', '沿用原项目规则': 'Original encoding rules',
  '信号 1–15 对应下列物品。只有机器已同步修改唱片比较器规则时才应改动。': 'Signals 1–15 use the items below. Change these only when your machine uses matching comparator outputs.',
  '空拍填充物与高级配置': 'Rest items & advanced settings', '填充物 ID（每行一种，必须能堆叠至 64）': 'Filler item IDs (one per line; must stack to 64)', '非堆叠空拍物品（必须不可堆叠）': 'Rest item (must be unstackable)', '自定义物品的可堆叠性与比较器输出需和机器一致。': 'Custom items must match the machine’s stack sizes and comparator signals.',
  '生成编码投影': 'Export encoded schematic', '唱片 → 潜影盒 → 双箱': 'Discs → Shulker boxes → Double chests', '按乐器拆分 Litematica 子区域': 'Litematica subregions by instrument',
  '子区域': 'Subregions', '箱子方块': 'Chest blocks', '潜影盒': 'Shulker boxes', '导出 .litematic': 'Export .litematic', '导出格式化 .nbs': 'Export formatted .nbs', '下载用量与转换报告': 'Download material & conversion report',
  '导入乐曲后开始编排': 'Import a song to begin',
  '保存你的机器配置': 'Save your machine setup', '布局、音源和编码表可复用。修改会自动保存在当前浏览器。': 'Reuse layouts, sounds and encoding tables. Changes are saved in this browser.', '导出 JSON': 'Export JSON', '导入 JSON': 'Import JSON', '恢复默认配置': 'Reset configuration',
  '乐曲与配置均在本机处理': 'Songs and settings stay on this device', '支持 GitHub Pages 与离线本地服务': 'GitHub Pages or an offline local server', '使用说明 ↗': 'User guide ↗',
  '导入 NBS，查看音符时间轴': 'Import NBS to view the note timeline', '正在检查布局与编码容量…': 'Checking layout and inventory capacity…', '请修正上述问题后导出': 'Resolve the issues above before exporting', '正在生成文件…': 'Generating file…',
  '转换线程启动失败，请通过本地服务或 GitHub Pages 打开页面': 'Could not start the converter worker. Open this page through the local server or GitHub Pages.',
  '文件超过 32 MB': 'File exceeds 32 MB', '配置超过 1 MB': 'Configuration exceeds 1 MB', 'sounds.json 超过 4 MB': 'sounds.json exceeds 4 MB', '需要 sounds.json 对象': 'sounds.json must contain an object', '如 minecraft:block.note_block.harp': 'e.g. minecraft:block.note_block.harp',
  'NBS 文件超过 32 MB': 'NBS file exceeds 32 MB', 'NBS 字符串长度无效': 'Invalid NBS string length', 'NBS 速度必须大于 0': 'NBS tempo must be greater than zero', 'NBS 时间轴过长': 'NBS timeline is too long', 'NBS 音符层超出头部声明': 'NBS note layer exceeds the declared layer count', 'NBS 音高超出 0–87': 'NBS key is outside 0–87', 'NBS 音符过多': 'Too many NBS notes', 'NBS 自定义乐器数量无效': 'Invalid NBS custom instrument count', 'NBS 文件包含未识别的尾部数据': 'Unrecognized trailing data in NBS file',
  'NBS v6 导出长度或层数超过 65535；投影仍可单独导出': 'NBS v6 length or layer count exceeds 65535; the schematic can still be exported separately', 'NBS 同一时间与层不能包含多个音符': 'NBS cannot hold multiple notes at the same tick and layer', '升级 v6 后自定义乐器编号超过 255': 'Custom instrument ID exceeds 255 after upgrading to v6', 'NBS v6 最多支持 236 个自定义乐器': 'NBS v6 supports at most 236 custom instruments',
  '转换后时间轴超过 200 万 tick，请缩短乐曲或提高输入速度': 'Converted timeline exceeds 2 million ticks. Shorten the song or increase the input tempo.', '机器编码不包含力度或声像，非静音音符统一音量与声像': 'Machine encoding does not include velocity or panning; non-muted notes use uniform volume and panning.', 'NBS 循环信息不写入唱片；仅导出一次播放': 'NBS loop settings are not encoded; the export plays once.', '重采样合并的同层音符已分配到额外 NBS 层以保留和弦': 'Notes merged on one layer by resampling were moved to additional NBS layers to retain chords.',
  '双箱容量溢出：某一编码通道超过 54 个潜影盒，请拆分乐曲': 'Double chest capacity exceeded: an encoding channel needs more than 54 shulker boxes. Split the song.', '格式化后没有可编码的音符': 'No encodable notes remain after formatting', '没有可导出的子区域': 'No subregions to export', 'NBT 字符串过长': 'NBT string is too long', 'NBT 列表类型不匹配': 'NBT list tag type mismatch',
  '语言必须为 zh 或 en': 'Language must be zh or en', 'noteInterval 只能为 1 或 2': 'noteInterval must be 1 or 2', '未知时间处理方式': 'Unknown timing mode', '未知超音域策略': 'Unknown out-of-range policy', '不支持的目标版本': 'Unsupported target version', '需要 15 个不同的唱片物品 ID': 'Expected 15 distinct disc item IDs', '至少需要两种不同的可堆叠填充物': 'Expected at least two distinct stackable fillers', '无效的空拍物品 ID': 'Invalid rest item ID', '唱片、填充物和空拍物品不能重复': 'Disc, filler and rest item IDs must be distinct', '乐器数必须在 1–256 之间': 'Instrument count must be between 1 and 256', '子区域 ID 必须唯一，且只能含英文、数字、下划线和连字符': 'Subregion IDs must be unique and contain only letters, digits, underscores or hyphens',
};
const patterns = [
  [/^(.+) 机器方位$/, (_, name) => `${name} machine side`],
  [/^(.+) 层数$/, (_, name) => `${name} layer`],
  [/^(.+) 必须配置两个模块位置$/, (_, n) => `${instrumentName(n, 'en')} requires two module positions`],
  [/^配置错误：(.*)$/, (_, detail) => `Configuration error: ${translate(detail, 'en')}`],
  [/^NBS 文件不完整（字节 (\d+)）$/, (_, n) => `Incomplete NBS file (byte ${n})`],
  [/^暂不支持 NBS v(\d+)$/, (_, v) => `NBS v${v} is not supported`],
  [/^未支持的 NBT 类型 (\d+)$/, (_, n) => `Unsupported NBT tag type ${n}`],
  [/^(.+) 必须为布尔值$/, (_, k) => `${k} must be a boolean`],
  [/^(.+) 名称、音源或启用字段无效$/, (_, n) => `Invalid name, sound or enabled field for ${n}`],
  [/^(.+) 朝向无效$/, (_, n) => `Invalid arm direction for ${n}`],
  [/^(.+) 的 (.+) 必须为合理整数$/, (_, n, axis) => `${n}: ${axis} must be an integer within the allowed range`],
  [/^(.+) 的 NBS 乐器编号必须是数组$/, (_, n) => `${n}: NBS source IDs must be an array`],
  [/^(.+) 的 NBS 编号应为 0–255$/, (_, n) => `${n}: NBS IDs must be within 0–255`],
  [/^NBS 乐器 (\d+) 被重复映射$/, (_, n) => `NBS instrument ${n} is mapped more than once`],
  [/^NBS 乐器 (\d+) 在 tick (\d+) 的音高 (-?\d+) 超出 33–57$/, (_, i, tick, key) => `NBS instrument ${i} at tick ${tick}: key ${key} is outside 33–57`],
  [/^以下 NBS 乐器未分配到启用的模块：(.+)。请添加映射；旧版自定义编号从文件头内置乐器数量开始，不能直接当作新版小号。$/, (_, ids) => `NBS instruments without an enabled output module: ${ids}. Add a mapping. Legacy custom IDs start at the file header’s built-in count and may overlap the new trumpet IDs.`],
  [/^(\d+) 个超音域音符按八度移至 33–57$/, (_, n) => `${n} out-of-range notes transposed by octaves into keys 33–57`],
  [/^按所选策略丢弃 (\d+) 个超音域音符$/, (_, n) => `${n} out-of-range notes dropped by the selected policy`],
  [/^跳过 (\d+) 个静音音符$/, (_, n) => `${n} muted notes skipped`],
  [/^(\d+) 个微调音高已量化到最近半音$/, (_, n) => `${n} fine-pitched notes rounded to the nearest semitone`],
  [/^已从 (.+) tick\/s 重采样至 (.+) tick\/s，时间量化至最近机器 tick$/, (_, a, b) => `Resampled from ${a} to ${b} ticks/s; times rounded to the nearest machine tick`],
  [/^保留原始 tick；机器以 (.+) tick\/s 播放，速度将改变$/, (_, n) => `Original ticks retained; playback at ${n} ticks/s changes the song speed`],
  [/^(\d+) 个同模块、同时间、同音高的重复音符合并为一次触发$/, (_, n) => `${n} duplicate notes at the same module, tick and key merged into single triggers`],
  [/^(.+) \/ 模块 (\d+) \/ 箱子 (\d+)：(.*)$/, (_, n, lane, chest, detail) => `${instrumentName(n, 'en')} / module ${lane} / chest ${chest}: ${translate(detail, 'en')}`],
  [/^模块区域重叠：(.+) 与 (.+) 位于 (.+)$/, (_, a, b, p) => `Module footprints overlap: ${instrumentName(a, 'en')} and ${instrumentName(b, 'en')} at ${p}`],
  [/^文件检查通过 · (.+) 秒 · (\d+) 张唱片$/, (_, s, n) => `File checks passed · ${s} s · ${n} discs`],
  [/^NBS v(\d+) · (\d+) 音符 · (.+) tick\/s · (\d+) 内置乐器(.*)$/, (_, v, n, tempo, count, custom) => `NBS v${v} · ${n} notes · ${tempo} ticks/s · ${count} built-in instruments${custom.replace('自定义：', 'Custom: ')}`],
  [/^(.+) 秒 \/ (\d+) 层$/, (_, s, n) => `${s} s / ${n} layers`],
  [/^启用 (.+)$/, (_, n) => `Enable ${n}`], [/^删除 (.+)$/, (_, n) => `Remove ${n}`], [/^乐器 (\d+) 名称$/, (_, n) => `Instrument ${n} name`],
  [/^(.+) NBS 编号$/, (_, n) => `${n} NBS IDs`], [/^(.+) 朝向$/, (_, n) => `${n} arm direction`], [/^(.+) 声音事件$/, (_, n) => `${n} sound event`],
  [/^信号 (\d+) 物品 ID$/, (_, n) => `Signal ${n} item ID`], [/^自定义乐器 (\d+)$/, (_, n) => `Custom instrument ${n}`], [/^自定义 (\d+)$/, (_, n) => `Custom ${n}`],
  [/^已载入 (\d+) 个声音事件，可在音源字段选择。$/, (_, n) => `Loaded ${n} sound events. Select them in the sound fields.`], [/^已生成 (.+)$/, (_, n) => `Generated ${n}`],
];
export function translate(text, locale = language) {
  if (locale !== 'en') return text;
  if (Object.hasOwn(en, text)) return en[text];
  for (const [pattern, replace] of patterns) if (pattern.test(text)) return text.replace(pattern, replace);
  return text;
}

// Capture only initial UI copy. User song titles, custom instrument names and file
// paths are never translated by scanning the live page after an edit.
export function capturePageTranslations(root) {
  const records = [], walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node; (node = walker.nextNode());) {
    if (['SCRIPT', 'STYLE'].includes(node.parentElement?.tagName)) continue;
    const original = node.textContent, trimmed = original.trim();
    if (trimmed) records.push(() => { node.textContent = original.replace(trimmed, translate(trimmed)); });
  }
  for (const node of root.querySelectorAll('[aria-label], [title], [placeholder]')) for (const attribute of ['aria-label', 'title', 'placeholder']) {
    const original = node.getAttribute(attribute); if (original) records.push(() => node.setAttribute(attribute, translate(original)));
  }
  return () => { for (const update of records) update(); document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN'; };
}

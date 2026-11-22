# 唱片工坊 · Encoded Redstone Music

[在线使用](https://liuyunmc.github.io/Encoded-Redstone-Music-Converter/) · [English](README.en.md) · [红石音乐机视频（Bilibili）](https://www.bilibili.com/video/BV1aqA4zXE7U/)

将 NBS 乐曲转换为红石音乐机使用的编码唱片，自动装入潜影盒与双箱，导出包含箱内物品的 `.litematic` 投影。支持 GitHub Pages 网页使用，也可在电脑上启动本地 GUI；乐曲与配置均在浏览器本机处理。

- 读取 NBS Classic、v1–v6，支持 Minecraft 26.1 新增的四种小号。
- 支持 10 TPS 单模块、20 TPS 双模块，以及 16 / 20 乐器布局预设。
- 可编辑乐器映射、半音移调、模块方位与层数，并导入、导出 JSON 配置。
- 每个模块独立导出子区域，直接查看 15 种编码唱片的数量和总量。
- 支持中英文界面，无第三方 npm 依赖。

[开始使用](#开始使用) · [乐器映射与格式化](#乐器映射与格式化) · [投影布局](#投影布局) · [导出与粘贴](#导出与粘贴) · [部署到-github-pages](#部署到-github-pages) · [开发与命令行](#开发与命令行)

## 开始使用

### 网页与本地启动

已部署的 GitHub Pages 网页可直接使用，无需安装 Node.js。本地使用时，先安装 **Node.js 22 或更新版本**，下载项目后：

- Windows：双击 `start-local.cmd`，保持启动窗口运行。
- 其他系统或手动启动：在项目目录运行 `npm start`。

浏览器打开终端显示的地址，默认为 `http://127.0.0.1:4173`。请通过本地服务访问，不要直接双击 `index.html`。无需运行 `npm install`；启动后本地使用不依赖网络。

### 转换一首乐曲

1. 导入 `.nbs`，或点击「试用示例乐曲」。
2. 在「乐曲与格式化」选择机器速度、时间处理方式、超音域策略及目标游戏版本。
3. 在「投影布局」应用 16 / 20 乐器预设，按存档调整各模块的机器方位与层数，并检查 NBS 编号和移调。
4. 在「编码与用量」查看唱片用量；需要时修改编码物品与空拍填充物。
5. 检查通过后，导出 `.litematic`。也可导出格式化 `.nbs`、转换报告和 JSON 配置。

配置会自动保存在当前浏览器。更换设备或浏览器前，可用「导出 JSON」备份，再通过「导入 JSON」恢复。右上角可切换中文 / English。

## 乐器映射与格式化

第二页的乐器名称表示**机器实际输出的乐器**，固定不可改名；图标使用对应音符盒底座的方块材质，钢琴使用音符盒图标。修改 NBS 源编号不会改变输出乐器的身份。

| 设置 | 用途 |
| --- | --- |
| NBS 编号 | 指定该输出乐器接收哪些源乐器；多个编号用逗号分隔，例如 `0, 5` |
| 移调 | 按整数半音升降，先移调，再执行超音域处理 |
| 启用 | 是否导出该乐器的模块；禁用后需重新分配其仍在使用的源编号 |

编号从 **0** 开始。同一源编号只能映射到一个启用的输出乐器，留空表示不接收音符；未分配的乐器会报错。

**自定义乐器**也按源编号映射到机器中的输出乐器。源编号和名称显示在导入摘要中；旧版文件的自定义编号由文件头决定，不能直接把编号 16 当作新版小号。若已在 NBS 中完成音域拆分、乐器分配和移调，保留对应映射并将网页移调设为 `0` 即可。转换器不制作资源包，也不替换游戏音效；实际音色由存档中的音符盒底座及所用资源包决定。

格式化规则：

- 默认重采样至 20 或 10 tick/s，保持原曲时长；「保持原始 tick」则可能改变播放速度。
- 可编码音域为 **NBS 音高 33–57，共 25 个音高**。超出时可按八度移入、报错或丢弃。
- 微调音高量化到最近半音，静音音符跳过；编码不包含力度差异、声像和循环，只导出一次播放。
- 重采样后同层同时间的音符会分配到额外 NBS 层，以保留和弦。
- 格式化文件统一导出为 NBS v6，保留自定义乐器定义，旧自定义编号迁移至 20 开始。输出乐谱保留源乐器身份，机器乐器路由以 `.litematic` 为准。

## 投影布局

**十字排列仅用于唱片箱投影，不代表音乐机结构。** 投影原点为底层中心，箱列紧贴中心向外延伸。界面中的方位统一指机器方位。

每层四侧各一个模块，默认层高 8 格。底层为第 1 层，`Y = (层数 − 1) × 层高`；通常只需编辑方位和层数，X/Z 自动计算。高级设置可解锁 X/Y/Z，并修改层高。列表默认按乐器编号排列，也可按方位或层数排序。

| 机器速度 | 乐器数 | 模块数 | 预设层数 |
| --- | --- | --- | --- |
| 10 TPS | 16 / 20 | 16 / 20 | 4 / 5 |
| 20 TPS | 16 / 20 | 32 / 40 | 8 / 10 |

20 TPS 每种乐器有两个模块：模块 1 接收偶数 tick，模块 2 接收奇数 tick；默认位于同层相邻两侧。10 TPS 只使用模块 1。

### 10 TPS 默认排布

表中由上到下为第 4 层至第 1 层。20 乐器预设在第 5 层添加四种小号。

| 层数 | 西侧 | 北侧 | 东侧 | 南侧 |
| --- | --- | --- | --- | --- |
| 5（新增） | 小号 | 斑驳小号 | 锈蚀小号 | 氧化小号 |
| 4 | 钢琴 | 踩镲 | 风铃 | 迪吉里杜管 |
| 3 | 贝斯 | 吉他 | 木琴 | 芯片 |
| 2 | 底鼓 | 长笛 | 铁木琴 | 班卓琴 |
| 1 | 军鼓 | 铃铛 | 牛铃 | 电子钢琴 |

### 20 TPS 默认排布

同一行的乐器同时占用对应两侧：西 / 东为模块 1，北 / 南为模块 2。20 乐器预设在第 9、10 层添加四种小号。

| 层数 | 西侧模块 1 / 北侧模块 2 | 东侧模块 1 / 南侧模块 2 |
| --- | --- | --- |
| 10（新增） | 锈蚀小号 | 氧化小号 |
| 9（新增） | 小号 | 斑驳小号 |
| 8 | 踩镲 | 迪吉里杜管 |
| 7 | 吉他 | 芯片 |
| 6 | 长笛 | 班卓琴 |
| 5 | 铃铛 | 电子钢琴 |
| 4 | 钢琴 | 风铃 |
| 3 | 贝斯 | 木琴 |
| 2 | 底鼓 | 铁木琴 |
| 1 | 军鼓 | 牛铃 |

切换速度时，标准预设会自动调整；自定义位置会保留。点击 16 / 20 乐器按钮将重新应用预设，替换当前布局。

<details>
<summary>坐标、箱子朝向与子区域命名</summary>

模块坐标是第一组双箱的右半箱位置。以下为底层坐标，其他层仅改变 Y。

| 机器方位 | 底层首箱坐标 | 低音 → 高音 | 箱子正面朝向 |
| --- | --- | --- | --- |
| 西 | (0,0,−1) | 向北 −Z | 东 |
| 北 | (1,0,0) | 向东 +X | 南 |
| 东 | (0,0,1) | 向南 +Z | 西 |
| 南 | (−1,0,0) | 向西 −X | 北 |

每个启用模块对应一个独立子区域，包含 25 组双箱，固定为 **50 × 1 × 1 格**。移除空箱子不改变子区域的原点和大小；全空模块也保留空气子区域。完整区域重叠时会报错。

子区域按**西 → 北 → 东 → 南**分组，名称格式为「方位排序号_机器方位_原 NBS 乐器编号_乐器_模块」：

- 20 TPS：`01_西_00_钢琴_模块1`、`02_北_00_钢琴_模块2`。
- 10 TPS：`01_西_00_钢琴`，省略模块后缀。
- 英文示例：`01_West_00_Harp_Module1`。

`01 / 02 / 03 / 04` 前缀保证按名称排序时也保持西北东南的顺序。多个源编号以 `+` 连接，重名时追加数字后缀。旧投影需重新导出并加载才会更新名称。

</details>

## 导出与粘贴

投影保留原点和负坐标，包含箱子、潜影盒及物品，不包含红石线路或音符盒。

| 目标版本 | Litematic 版本 | 箱内物品格式 |
| --- | --- | --- |
| Java 26.1 | v7 / SubVersion 1 | 现代物品组件，`minecraft:container` |
| Java 1.20.4 | v6 / SubVersion 1 | 旧版 `tag.BlockEntityTag.Items` |

旧版目标只兼容物品存储格式，不会为旧游戏添加四种小号。

Litematica 的普通生存放置**不会自动填入箱内物品**。需要使用允许复制方块实体数据的粘贴方式；粘贴到已有结构时选择忽略空气。唱片用量来自实际导出的库存，和弦合并后按编码信号统计，可直接在第三页查看。

如需修改唱片与填充物，唱片必须对应机器的 1–15 比较器信号，填充物需能堆叠到 64，非堆叠空拍物品需不可堆叠。每个潜影盒最多 27 槽，每个通道最多 54 盒；超容量会报错，不会截断或覆盖。

## 部署到 GitHub Pages

1. 将项目源码上传到自己的 GitHub 仓库，保留 `.github/workflows/pages.yml`。
2. 在 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 推送到 `main` / `master` 将自动部署，也可在 **Actions → Deploy converter to GitHub Pages → Run workflow** 手动运行。
4. 部署成功后，在 **Settings → Pages** 打开站点。以后推送更新会自动重新部署。

部署流程会运行测试和构建，无需安装第三方依赖或手动上传 `dist/`。本地运行 `npm run build` 也可生成完整静态站点 `dist/`，交给其他静态服务器。详见 [GitHub Pages 官方说明](https://docs.github.com/zh/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## 开发与命令行

```sh
npm start
npm test
npm run build
npm run convert -- examples/copper-echoes.nbs song.litematic
npm run convert -- input.nbs song.litematic --config examples/machine-20.json --formatted song.formatted.nbs
```

GUI 与 CLI 共用转换核心。CLI 处理自定义乐器时需通过 `--config` 提供明确映射。JSON 配置使用 `version: 4`，与 NBS 文件版本无关；配置版本 1/2/3 不提供迁移。

本地服务的 `/tests/browser-layout.html` 可检查两种语言、两种速度及 11 种宽度下的页面布局，不包含在构建中。自动测试覆盖原编码规则、NBS 读写、默认布局、名称排序、容量边界和两版库存 NBT。

| 目录 | 内容 |
| --- | --- |
| `src/` | NBS 读写、编码与布局、NBT / Litematic 导出、网页和转换线程 |
| `scripts/` | 本地服务、静态构建、命令行转换与示例生成 |
| `examples/` | 示例乐曲、投影及 16 / 20 乐器配置 |
| `tests/` | 转换与浏览器布局检查 |
| `nbs-converter/` | 原始 Python 转换器，作为编码规则参考 |

<details>
<summary>编码规则</summary>

编码沿用 [原转换器常量](nbs-converter/constants.py) 中的 `CODE` 与 `NOTES_TO_DISCS`：

- 音高索引 `k = NBS key − 33`。
- 20 TPS：`lane = tick % 2`，`phase = floor(tick / 2) % 4`，每 8 tick 一组。
- 10 TPS：`lane = 0`，`phase = tick % 4`，每 4 tick 一组。
- `k < 24` 时，通道为 `floor(k / 2) × 2 + floor(phase / 2)`，用 `CODE[k][phase % 2]` 按位 OR 合并唱片信号。
- `k = 24` 使用第 24 通道，`CODE[24] = [8, 4, 2, 1]`。
- 信号 1–15 依次对应 `13, cat, blocks, chirp, far, mall, mellohi, stal, strad, ward, 11, wait, pigstep, otherside, 5`。
- 保留开头和中间的空拍，省略各通道最后一张唱片后的无声尾部；不足一个编码周期的尾音仍会输出。
- 空拍默认用可堆叠地毯压缩，也可逐个使用剪刀。末盒至少含 3 个物品，前 27 盒写入右箱，后 27 盒写入左箱。

</details>

## 来源与致谢

- [红石音乐机视频（Bilibili）](https://www.bilibili.com/video/BV1aqA4zXE7U/)：对应红石机器的介绍。
- [jazziiRed/nbs-converter](https://github.com/jazziiRed/nbs-converter)：原转换器及编码规则，参考代码保存在 `nbs-converter/`。
- [NBS 格式说明](https://noteblock.studio/nbs)、[Litematica 导出实现](https://github.com/sakura-ryoko/litematica/blob/1.21.4/src/main/java/fi/dy/masa/litematica/schematic/LitematicaSchematic.java)、[Minecraft 物品组件说明](https://www.minecraft.net/en-us/article/minecraft-java-edition-1-20-5)。
- 方块和唱片图标来自 Minecraft 原版材质，版权归 Mojang Studios / Microsoft；详见 [素材说明](assets/README.md)。

# 唱片工坊 · Encoded Redstone Music

[English](README.en.md)

把 NBS 乐曲格式化为原项目红石音乐机使用的编码唱片，装入潜影盒及双箱，并导出按时相模块划分子区域的 `.litematic` 投影。

原始代码保存在 `nbs-converter/`，作为编码规则与历史实现的参考；新应用从项目根目录启动，完全不依赖 `pynbs`、Python 或 `mcschematic`，也没有 npm 第三方依赖。

## 本地 GUI

安装 Node.js 22 或更新版本，Windows 双击 **`start-local.cmd`**。浏览器会打开本地 GUI，启动窗口保持运行即可。

其他系统或手动启动：

```sh
npm start
```

右上角语言选择器支持中文和 English，界面、默认乐器名称、状态与导出子区域名称同步切换，自定义名称和乐曲标题保留。

打开终端显示的 `http://127.0.0.1:4173`。全部数据在本机处理，无需账号、网络或后台服务。不要直接双击 `index.html`：浏览器的 ES 模块和 Worker 需要通过 HTTP 加载。端口被占用时，可用 `PORT` 环境变量更换端口。

1. 导入 `.nbs`，或点击“试用示例乐曲”。
2. 选择机器速度、时间处理和超音域策略。
3. 在“投影布局”选 16/20 乐器预设，分别安排模块坐标、方位；源乐器编号和启用状态在乐器表修改。
4. 在“编码与用量”直接查看 15 种编码唱片的数量；侧栏“查看唱片用量”可直接跳转。
5. 通过检查后，导出 `.litematic`、格式化 `.nbs` 或包含物品用量的报告。配置可单独导出/导入 JSON，也会自动保存到当前浏览器。

浏览器需要支持 ES Modules、Module Worker、BigInt 与 CompressionStream，建议使用当前版本的 Chrome、Edge 或 Firefox。项目不加载远程字体、脚本、音效或分析服务。

## GitHub 网页

仓库带有 `.github/workflows/pages.yml`，无需手动上传 `dist/`。界面支持仓库子路径。

1. 在 GitHub 创建一个 **Public** 空仓库，不勾选初始化 README、`.gitignore` 或许可证。
2. 在本项目文件夹打开 PowerShell，将下面地址替换为自己的仓库地址后执行：

   ```powershell
   git add .
   git commit -m "Initial release"
   git branch -M main
   git remote add origin https://github.com/你的用户名/仓库名.git
   git push -u origin main
   ```

3. 打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
4. 打开 **Actions → Deploy converter to GitHub Pages → Run workflow**，选择 `main` 并运行；如果首次自动运行早于 Pages 设置，可在设置完成后重新运行。
5. 等待部署成功，在 **Settings → Pages** 打开站点，通常为 `https://你的用户名.github.io/仓库名/`。以后提交并推送到 `main` 就会自动更新。

`.gitignore` 已排除预览截图、本地撤回备份和构建目录；上传源码时需保留 `.github/`。部署流程会自动检查并构建：

```sh
npm test
npm run build
```

`dist/` 是完整静态站点，也可交给任意静态文件服务器。发布源设置见 [GitHub 官方说明](https://docs.github.com/zh/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## NBS 格式与格式化

- 读取 NBS Classic / v1–v6，读取可选层信息、自定义乐器、循环、力度、声像及微调音高。
- v6 内置编号 **16 trumpet、17 trumpet_exposed、18 trumpet_weathered、19 trumpet_oxidized**；0–15 保留原次序。
- **自定义乐器从文件头的 `vanillaInstrumentCount` 开始编号**。例如 v5 文件的 16 可能是自定义乐器，不能直接解释为 v6 的小号。
- 未使用已保存配置时，导入文件会按其头部识别内置与自定义乐器，为自定义源编号分配空闲输出行。输出乐器名称固定，映射和移调可编辑；源文件的自定义编号及名称显示在文件摘要中。载入已保存配置时保留用户映射。
- 多个 NBS 乐器可以合并至一个模块；在 NBS 编号字段输入 `0, 5`。同一个源编号不能同时分配到两个启用模块。留空表示模块未分配源。
- 未分配乐器会明确报错，不会悄悄删除。需要丢弃音符时，可先在 NBS 编辑器移除对应乐器。
- 默认按原曲速度重采样至 20 或 10 tick/s，保留时长；也可以保留原始 tick，接受播放速度变化。
- 编码音域是 NBS 33–57（25 个音高）。默认按八度移调，也可选择报错或丢弃。先应用模块的整数半音移调，再处理超音域。
- 微调音高量化至最近半音（恰好半音时向较高音）；静音音符跳过。编码不包含非零力度差异、声像或 NBS 循环，转换报告会说明这些处理。
- 格式化导出统一为 NBS v6；保留自定义乐器定义，并将旧自定义编号迁移至 20 开始。重采样后同层同时间的不同音符移至额外 NBS 层以保留和弦。
- 格式化 NBS 是处理后原音源乐谱：保留其乐器定义，不把用户的声音事件字段嵌入 NBS。乐器合并与机器模块路由以投影为准。

## 唱片箱投影布局

这里编辑的是唱片箱的投影排布，**不是音乐机结构或存档中的红石线路布局**。十字中心空格 (0,0,0) 是底层投影原点，箱列从紧邻中心的位置向外延伸，每层东南西北各一个模块，默认层高 8 格，可在高级设置调整。

| 机器速度 | 乐器数 | 时相模块数 | 预设层数 |
| --- | --- | --- | --- |
| 20 TPS | 16 | 32 | 8 |
| 20 TPS | 20 | 40 | 10 |
| 10 TPS | 16 | 16 | 4 |
| 10 TPS | 20 | 20 | 5 |

10 TPS 默认排布按原存档设置：机器西侧从第 4 层到第 1 层为钢琴、贝斯、底鼓、军鼓；北侧为踩镲、吉他、长笛、铃铛；东侧为风铃、木琴、铁木琴、牛铃；南侧为迪吉里杜管、芯片、班卓琴、电子钢琴。20 乐器预设在第 5 层增加普通、斑驳、锈蚀、氧化小号，分别位于西、北、东、南。

20 TPS 的模块 1 接收偶数 tick，模块 2 接收奇数 tick，每种乐器的两个模块在同一层。西侧为模块 1、北侧为模块 2，第 8 层到第 1 层依次为踩镲、吉他、长笛、铃铛、钢琴、贝斯、底鼓、军鼓。东侧为模块 1、南侧为模块 2，第 8 层到第 1 层依次为迪吉里杜管、芯片、班卓琴、电子钢琴、风铃、木琴、铁木琴、牛铃。第 9 层为普通小号（西/北）、斑驳小号（东/南），第 10 层为锈蚀小号（西/北）、氧化小号（东/南）。

第二页列表默认按乐器编号显示，可按机器方位或层数排序。常用操作只编辑机器方位和层数：底层为第 1 层（Y=0），X/Z 按对应的投影位置计算，Y=(层数−1)×层高。高级设置可解锁 X/Y/Z，也可修改层高；修改层高保留各模块层数。10 TPS 只使用模块 1。切换速度时，当前标准预设会自动切换为相应速度的排布；自定义位置保留，也可点击 16/20 乐器按钮重新应用预设。

| 机器方位 | 投影位置 | 底层首箱坐标 | 低音 → 高音 | 箱子正面朝向 |
| --- | --- | --- | --- | --- |
| 北 | 东 | (1,0,0) | 向东 +X | 南 |
| 东 | 南 | (0,0,1) | 向南 +Z | 西 |
| 南 | 西 | (-1,0,0) | 向西 −X | 北 |
| 西 | 北 | (0,0,-1) | 向北 −Z | 东 |

界面、排序、子区域名称和配置 direction 均按**机器方位**标注。以存档核对的机器南侧为准：箱子朝北，箱列沿东西排列，高音在西；投影仍放在西侧，方便粘贴。其他三侧按同样的旋转关系对应。俯视图标注对应的北侧、东侧、南侧和西侧箱子。

模块坐标是第一组双箱的右半箱位置。每模块包含 25 组双箱，长 50 格、宽 1 格、高 1 格，机器方位确定对应的箱子朝向与投影延伸方向。每个启用模块对应一个独立子区域；**移除空箱子只改变区域内的方块，不改变区域 Position/Size**。包括完全无音符的模块也保留为空气子区域，以保持模板完整。

导出顺序按机器西 → 北 → 东 → 南分组，组内按高度、源编号和模块编号排列。子区域名包含 **方位排序号 + 机器方位 + 原 NBS 乐器编号 + 乐器 + 模块**，例如“01_西_00_钢琴_模块1”“02_北_00_钢琴_模块2”，英文为“01_West_00_Harp_Module1”。方位排序号固定为 01 西、02 北、03 东、04 南，使按名称排序的投影界面也保持西北东南的顺序。编号从 0 开始，多个源编号合并时用 + 连接。10 TPS 名称不包含模块后缀，例如“01_西_00_钢琴”或“01_West_00_Harp”；20 TPS 保留模块 1/2。重复名称添加数字后缀，内部 ID 保持独立。

配置仅支持 version: 4。direction 表示机器侧，layerHeight 保存层高（默认为 8），每个乐器保存两个模块位置。配置 version 1/2/3 不再支持，不提供自动迁移。

投影保留负坐标，不会将原点移动到包围盒角点。只包含箱子及物品，不包含音乐机红石线路、音符盒等。完整模块占地发生重叠时会报错，即使重叠处已移除空箱子。粘贴到已有结构时应选择忽略空气，以保留存档方块。

## 唱片编码规则

完全保留 `nbs-converter/constants.py` 的 `CODE` 和 `NOTES_TO_DISCS`：

- 音高索引 `k = NBS key - 33`。
- 20 tick/s：`lane = tick % 2`、`phase = floor(tick/2) % 4`，每 8 tick 形成一组编码。
- 10 tick/s：`lane = 0`、`phase = tick % 4`，每 4 tick 形成一组编码。
- `k < 24` 时，箱子通道为 `floor(k/2)*2 + floor(phase/2)`，将 `CODE[k][phase%2]` 按位 OR 到唱片信号。
- `k = 24` 时，用第 24 通道与 `CODE[24] = [8,4,2,1]`。
- 信号 1–15 依次为 `13, cat, blocks, chirp, far, mall, mellohi, stal, strad, ward, 11, wait, pigstep, otherside, 5`。
- 空拍压缩为可堆叠地毯，每堆至多 64；也可用不可堆叠剪刀表示每个空拍。中间与开头的空拍保留，最后一张唱片之后的无声尾部省略，沿用旧机器行为。
- 每个潜影盒至多 27 槽，末盒至少含 3 个物品；一个通道至多 54 盒。前 27 盒按右箱的 0–26 槽保存，后 27 盒按左箱的 0–26 槽保存。超容量会报出乐器、模块和通道，不能自动截断或循环覆盖。
- 新实现会输出不足完整周期的最后几个音符；原代码在 20 tick/s 下仅按 4 tick 补齐会丢失这些尾音。

## 乐器映射与唱片用量

第二页乐器名称固定，不提供改名输入框。NBS 源编号与半音移调仍可编辑；多个源编号可用逗号合并到同一乐器。默认乐器的身份不随源编号变化。图标使用对应音符盒底座的原版方块材质：钢琴使用音符盒，贝斯使用橡木木板，四种小号使用不同氧化阶段的铜块。材质随网页一起保存，支持离线使用。

自定义 NBS 乐器通过源编号映射到实际输出乐器，不会自动改名。若已在 NBS 中分好音域、分配好原版乐器并完成移调，网页保留对应编号和移调 0 即可。

第三页移除了资源包音源映射、声音事件输入和 sounds.json 导入。这里保留唱片编码配置，并直接显示各信号对应物品的实际数量和总量。数量来自将要导出的箱内物品，按和弦合并后的编码信号统计；修改映射、移调、速度或编码物品后自动刷新。旧 JSON 中的 sound 字段仅保留兼容，不参与编码。

物品 ID 可通过 GUI 或 JSON 修改。自定义唱片物品必须在机器中输出相同的 1–15 比较器信号；填充物必须可堆叠至 64，非堆叠空拍物品必须不可堆叠。程序可验证 ID 形式与重复映射，无法推测模组/数据包物品的实际比较器行为。

## Litematica 与存档版本

- **Java 26.1**：Litematic v7 / SubVersion 1 / MinecraftDataVersion 4786。箱子物品使用 `count`，潜影盒内部使用 `minecraft:container` 组件。
- **Java 1.20.4**：Litematic v6 / SubVersion 1 / MinecraftDataVersion 3700。物品使用 `Count` 与 `tag.BlockEntityTag.Items`。
- 文件是 gzip 压缩的大端 NBT，含分区域调色板、跨 64 位连续打包的 BlockStates、区域内相对坐标方块实体及完整物品内容。
- 旧版目标只提供箱子物品格式兼容，不会为旧版游戏添加四种小号；音效仍需匹配存档的机器和资源包。
- 在 Litematica 加载投影只能显示放置指引；普通生存放置箱子不会自动填入物品。写入含库存的箱子需要具备权限的粘贴方式，并启用方块实体数据复制。请先在测试世界检查盒子顺序与机器播放。

## 命令行与验证

```sh
npm run convert -- examples/copper-echoes.nbs song.litematic
npm run convert -- input.nbs song.litematic --config examples/machine-20.json --formatted song.formatted.nbs
npm test
```

无显式配置的 CLI 输入若使用自定义乐器会报错，要求先提供明确映射。GUI 与 CLI 共用同一核心。

本地服务的 `/tests/browser-layout.html` 可检查中英文界面在 11 个宽度下的卡片边界、侧栏分离和页面溢出（此开发检查页不进入构建）。

测试包括十字布局、8 格层距、默认排布、配置版本校验、中英文子区域名称与方向顺序，以及独立二进制 NBS 0–6 夹具、25 音高 × 4 时相 × 2 速度 × 4 方向的原编码比对、尾音与和弦、容量边界、空拍压缩、自定义编号迁移、重采样、模块碰撞，以及独立 gzip/NBT 解码检查两版库存和调色板坐标。编码已由用户在游戏存档中验证。

## 目录与来源

`src/nbs.js` 负责文件读写；`encoder.js` 负责格式化、路由、打包与布局；`nbt.js` / `litematic.js` 负责导出；`app.js` / `worker.js` 负责 GUI 与后台转换；`scripts/` 包含本地服务、CLI 和静态构建；`examples/` 包含可导入示例。

- 原项目：[jazziiRed/nbs-converter](https://github.com/jazziiRed/nbs-converter)，本次用户提供的修改版位于 `nbs-converter/`。
- [NBS 官方格式](https://noteblock.studio/nbs)，包含 v6 与 20 乐器定义。
- [Litematica 导出实现](https://github.com/sakura-ryoko/litematica/blob/1.21.4/src/main/java/fi/dy/masa/litematica/schematic/LitematicaSchematic.java)，参考区域、版本和方块实体结构。
- [Minecraft 官方物品组件说明](https://www.minecraft.net/en-us/article/minecraft-java-edition-1-20-5)，包含 `minecraft:container`。
- [Minecraft 数据版本映射](https://github.com/PrismarineJS/minecraft-data/blob/master/data/pc/common/protocolVersions.json)。

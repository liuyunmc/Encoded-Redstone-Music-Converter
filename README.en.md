# Disc Workshop · Encoded Redstone Music

[中文](README.md) · [Redstone music machine video (Bilibili, Chinese)](https://www.bilibili.com/video/BV1aqA4zXE7U/)

Convert NBS songs into encoded music discs for a redstone music machine, pack them into shulker boxes and double chests, and export a `.litematic` schematic containing the inventories. Use the web GUI on GitHub Pages or run it locally. Songs and settings are processed in your browser.

- Reads NBS Classic and v1–v6, including the four trumpet instruments added in Minecraft 26.1.
- Supports 10 TPS with one module per instrument and 20 TPS with two, with 16- and 20-instrument presets.
- Editable source mappings, semitone transposition, module sides and layers, with JSON configuration import/export.
- One subregion per module, plus quantities for all 15 encoded disc signals and their total.
- English and Chinese interfaces, with no third-party npm dependencies.

[Getting started](#getting-started) · [Mapping and formatting](#mapping-and-formatting) · [Projection layout](#projection-layout) · [Export and placement](#export-and-placement) · [GitHub Pages](#deploy-to-github-pages) · [Development and CLI](#development-and-cli)

## Getting started

### Web and local GUI

A deployed GitHub Pages site runs directly in your browser without Node.js. For local use, install **Node.js 22 or later**, download the project, then:

- Windows: double-click `start-local.cmd` and leave its terminal window open.
- Other systems or manual startup: run `npm start` in the project directory.

Open the address printed by the server, normally `http://127.0.0.1:4173`. Use the local server rather than opening `index.html` directly. No `npm install` is needed; local use works offline after startup.

### Convert a song

1. Import an `.nbs` file or try the demo.
2. In **Song & formatting**, select machine speed, timing, out-of-range handling and target game version.
3. In **Projection layout**, apply a 16- or 20-instrument preset. Adjust each module's machine side and layer, and check source NBS IDs and transposition.
4. In **Encoding & materials**, check disc quantities and adjust disc or rest items if needed.
5. After checks pass, export `.litematic`. Formatted `.nbs`, a conversion report and JSON configuration can also be exported.

Settings are saved in the current browser. Export JSON before changing devices or browsers, then import it to restore your layout and mappings. The upper-right selector switches between English and Chinese.

## Mapping and formatting

Instrument names on page two identify the **machine's output instruments** and cannot be renamed. Icons use the corresponding note-block base textures; Harp uses a Note Block. Editing a source NBS ID does not change the output instrument's identity.

| Setting | Purpose |
| --- | --- |
| NBS IDs | Source instruments routed to this output; separate multiple IDs with commas, e.g. `0, 5` |
| Transposition | Integer semitones, applied before out-of-range handling |
| Enabled | Whether to export the instrument's modules; reassign any source IDs still used after disabling it |

IDs are **zero-based**. Each source ID can feed only one enabled output instrument. An empty field receives no notes; unmapped source instruments produce an error.

**Custom NBS instruments** also map by source ID to the machine's output instruments. Their IDs and names appear in the import summary. Legacy custom IDs depend on the file header, so ID 16 is not necessarily a trumpet. If pitch ranges, instrument assignments and transposition are already prepared in NBS, keep the corresponding mappings and set web transposition to `0`. The converter does not create resource packs or replace game sounds; actual timbres depend on your world's note-block bases and resource pack.

Formatting rules:

- Default timing resamples to 20 or 10 ticks/s while retaining song duration. Keeping original ticks may change playback speed.
- The encodable range is **NBS keys 33–57, covering 25 pitches**. Out-of-range notes can be moved by octaves, rejected or dropped.
- Fine pitch is rounded to the nearest semitone; muted notes are skipped. Velocity differences, panning and loops are not encoded; only one playback is exported.
- Notes merged onto the same layer and tick during resampling move to additional NBS layers to preserve chords.
- Formatted files use NBS v6, preserve custom definitions and rebase legacy custom IDs to start at 20. They retain source instrument identities; machine routing is represented by the `.litematic` export.

## Projection layout

**The cross arranges exported disc chests, not the music machine's structure.** The schematic origin is at the bottom center, and chest rows start directly beside it. Directions in the interface consistently identify the machine side.

Each layer has four modules, one per side, with an 8-block vertical interval by default. The bottom is layer 1; `Y = (layer − 1) × spacing`. Normally, edit only side and layer; X/Z are calculated. Advanced settings unlock X/Y/Z and layer spacing. The list defaults to instrument order, with optional side or layer sorting.

| Machine speed | Instruments | Modules | Preset layers |
| --- | --- | --- | --- |
| 10 TPS | 16 / 20 | 16 / 20 | 4 / 5 |
| 20 TPS | 16 / 20 | 32 / 40 | 8 / 10 |

At 20 TPS, Module 1 receives even ticks and Module 2 receives odd ticks. Both modules of an instrument occupy adjacent sides on the same layer by default. At 10 TPS, only Module 1 is used.

### Default 10 TPS layout

Original instruments occupy layers 4 to 1, top to bottom. The 20-instrument preset adds four trumpets on layer 5.

| Layer | West | North | East | South |
| --- | --- | --- | --- | --- |
| 5 (additional) | Trumpet | Exposed Trumpet | Weathered Trumpet | Oxidized Trumpet |
| 4 | Harp | Hi-hat | Chime | Didgeridoo |
| 3 | Bass | Guitar | Xylophone | Bit |
| 2 | Bass Drum | Flute | Iron Xylophone | Banjo |
| 1 | Snare | Bell | Cow Bell | Pling |

### Default 20 TPS layout

Each instrument occupies both listed sides: West/East use Module 1, North/South use Module 2. The 20-instrument preset adds four trumpets on layers 9 and 10.

| Layer | West Module 1 / North Module 2 | East Module 1 / South Module 2 |
| --- | --- | --- |
| 10 (additional) | Weathered Trumpet | Oxidized Trumpet |
| 9 (additional) | Trumpet | Exposed Trumpet |
| 8 | Hi-hat | Didgeridoo |
| 7 | Guitar | Bit |
| 6 | Flute | Banjo |
| 5 | Bell | Pling |
| 4 | Harp | Chime |
| 3 | Bass | Xylophone |
| 2 | Bass Drum | Iron Xylophone |
| 1 | Snare | Cow Bell |

Switching speed rearranges a standard preset automatically; custom positions are preserved. Applying a 16- or 20-instrument preset replaces the current layout.

<details>
<summary>Coordinates, chest facing and subregion names</summary>

A module's coordinate identifies the right half of its first double chest. Coordinates below are on the bottom layer; other layers only change Y.

| Machine side | First chest coordinate | Low → high pitches | Chest facing |
| --- | --- | --- | --- |
| West | (0,0,−1) | North, −Z | East |
| North | (1,0,0) | East, +X | South |
| East | (0,0,1) | South, +Z | West |
| South | (−1,0,0) | West, −X | North |

Each enabled module has a separate, fixed **50 × 1 × 1 block** subregion containing 25 double chests. Omitting empty chests does not change its origin or size; entirely empty modules remain as air subregions. Overlapping complete regions produce an error.

Subregions are grouped **West → North → East → South**. Names contain a side-order prefix, machine side, original NBS source ID, instrument and module:

- 20 TPS: `01_West_00_Harp_Module1`, `02_North_00_Harp_Module2`.
- 10 TPS: `01_West_00_Harp`, without a module suffix.
- Chinese example: `01_西_00_钢琴_模块1`.

Prefixes `01 / 02 / 03 / 04` preserve this grouping when viewers sort names alphabetically. Multiple source IDs are joined with `+`; duplicate names receive numeric suffixes. Re-export and reload older schematics to update their names.

</details>

## Export and placement

Schematics preserve their origin and negative coordinates. They contain chests, shulker boxes and inventories, without redstone circuitry or note blocks.

| Target | Litematic version | Inventory format |
| --- | --- | --- |
| Java 26.1 | v7 / SubVersion 1 | Modern item components, `minecraft:container` |
| Java 1.20.4 | v6 / SubVersion 1 | Legacy `tag.BlockEntityTag.Items` |

The legacy target provides inventory-format compatibility; it does not add trumpet instruments to older games.

Ordinary Litematica survival placement **does not fill chest inventories**. Use a placement method that can copy block-entity data, and ignore air when pasting into existing structures. Disc quantities reflect the actual exported inventories after chord merging and are shown directly on page three.

If changing disc and rest items, discs must match the machine's comparator signals 1–15, fillers must stack to 64, and the unstackable rest item must be unstackable. Each shulker box holds up to 27 slots, and each channel allows up to 54 shulker boxes. Overflow produces an error rather than truncating or overwriting data.

## Deploy to GitHub Pages

1. Upload the project sources to your GitHub repository, keeping `.github/workflows/pages.yml`.
2. Under **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
3. Push to `main` / `master` for automatic deployment, or use **Actions → Deploy converter to GitHub Pages → Run workflow**.
4. After deployment succeeds, open the site from **Settings → Pages**. Later pushes automatically redeploy it.

The workflow tests and builds the site. No third-party dependencies or manual `dist/` upload are needed. Run `npm run build` locally to generate `dist/` for another static host. See the [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Development and CLI

```sh
npm start
npm test
npm run build
npm run convert -- examples/copper-echoes.nbs song.litematic
npm run convert -- input.nbs song.litematic --config examples/machine-20.json --formatted song.formatted.nbs
```

The GUI and CLI share the conversion core. Custom instruments require explicit CLI mapping through `--config`. JSON configurations use `version: 4`, independently of the NBS file version. Configuration versions 1/2/3 have no migration support.

Open `/tests/browser-layout.html` on the local server to check both languages and speeds at 11 widths. This page is excluded from the static build. Automated tests cover original encoding rules, NBS reading/writing, default layouts, name sorting, capacity boundaries and both inventory NBT formats.

| Directory | Contents |
| --- | --- |
| `src/` | NBS IO, encoding, layout, NBT / Litematic export, GUI and worker |
| `scripts/` | Local server, static build, CLI conversion and example generation |
| `examples/` | Demo song, schematic and 16- / 20-instrument configurations |
| `tests/` | Converter and browser layout checks |
| `nbs-converter/` | Original Python converter, retained as an encoding reference |

<details>
<summary>Encoding rules</summary>

Encoding retains `CODE` and `NOTES_TO_DISCS` from the [original converter constants](nbs-converter/constants.py):

- Pitch index: `k = NBS key − 33`.
- 20 TPS: `lane = tick % 2`, `phase = floor(tick / 2) % 4`, one group per 8 ticks.
- 10 TPS: `lane = 0`, `phase = tick % 4`, one group per 4 ticks.
- For `k < 24`, the channel is `floor(k / 2) × 2 + floor(phase / 2)`; combine `CODE[k][phase % 2]` using bitwise OR.
- For `k = 24`, use channel 24 and `CODE[24] = [8, 4, 2, 1]`.
- Signals 1–15 map to `13, cat, blocks, chirp, far, mall, mellohi, stal, strad, ward, 11, wait, pigstep, otherside, 5`.
- Leading and intermediate rests are retained; silence after each channel's final disc is omitted. Notes in a partial final cycle are still exported.
- Rests use stackable carpets by default, or individual shears. The final shulker contains at least 3 items; the first 27 boxes go into the right chest and the next 27 into the left.

</details>

## Sources and credits

- [Redstone music machine video (Bilibili, Chinese)](https://www.bilibili.com/video/BV1aqA4zXE7U/): introduction to the corresponding machine.
- [jazziiRed/nbs-converter](https://github.com/jazziiRed/nbs-converter): original converter and encoding rules, retained in `nbs-converter/`.
- [NBS specification](https://noteblock.studio/nbs), [Litematica implementation](https://github.com/sakura-ryoko/litematica/blob/1.21.4/src/main/java/fi/dy/masa/litematica/schematic/LitematicaSchematic.java), [Minecraft item components](https://www.minecraft.net/en-us/article/minecraft-java-edition-1-20-5).
- Block and disc icons use original Minecraft textures, copyright Mojang Studios / Microsoft. See [asset notes](assets/README.md).

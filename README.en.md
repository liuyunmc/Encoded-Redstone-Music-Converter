# Disc Workshop · Encoded Redstone Music

[中文](README.md)

Format NBS songs into the original redstone machine's encoded discs, pack them into shulker boxes and double chests, and export a `.litematic` schematic with one subregion per timing module. The original Python sources remain in `nbs-converter/`.

## Open the GUI

Install Node.js 22 or later. On Windows, double-click `start-local.cmd`, or run:

```sh
npm start
```

Open `http://127.0.0.1:4173`. Use the **Language** selector in the upper-right corner to switch between English and Chinese. The language is saved with your machine configuration. User-defined instrument names and song titles are preserved.

The application has no external npm dependencies and processes files locally. Use the local HTTP server rather than opening `index.html` directly, because browser modules and workers need HTTP. GitHub Pages deployment is provided by `.github/workflows/pages.yml`; select GitHub Actions under Settings → Pages after pushing the repository. `npm run build` produces the static site in `dist/`.

## Workflow

1. Import an `.nbs` file or try the demo.
2. Select 20 ticks/s (two modules) or 10 ticks/s (one module), timing and pitch handling.
3. Choose a 16- or 20-instrument layout and edit each timing module’s first-chest coordinates and machine side.
4. Map source NBS instrument IDs to the modules in your world. Multiple source IDs can be comma-separated; one source ID cannot feed multiple enabled modules.
5. Export `.litematic`, formatted NBS v6, or a material/conversion report. Export or import JSON to reuse configurations.

## Projection layout and independent timing modules

The cross arranges exported disc-chest inventories. **It does not represent the redstone music machine's structure.** The empty bottom-center block (0,0,0) is the schematic origin. Each layer has one East, South, West and North module, with an 8-block vertical interval.

| Speed | Instruments | Timing modules | Preset layers |
| --- | --- | --- | --- |
| 20 TPS | 16 | 32 | 8 |
| 20 TPS | 20 | 40 | 10 |
| 10 TPS | 16 | 16 | 4 |
| 10 TPS | 20 | 20 | 5 |

At 10 TPS, layers 4 to 1 on machine West contain Harp, Bass, Bass Drum and Snare; North contains Hi-hat, Guitar, Flute and Bell; East contains Chime, Xylophone, Iron Xylophone and Cow Bell; South contains Didgeridoo, Bit, Banjo and Pling. The 20-instrument preset adds Trumpet, Exposed Trumpet, Weathered Trumpet and Oxidized Trumpet on layer 5, on West, North, East and South respectively.


At 20 TPS, each instrument occupies one layer with Module 1/2 on West/North or East/South. Layers 8 to 1 on West/North are Hi-hat, Guitar, Flute, Bell, Harp, Bass, Bass Drum and Snare. East/South layers 8 to 1 are Didgeridoo, Bit, Banjo, Pling, Chime, Xylophone, Iron Xylophone and Cow Bell. Layer 9 adds Trumpet on West/North and Exposed Trumpet on East/South. Layer 10 adds Weathered Trumpet on West/North and Oxidized Trumpet on East/South. Module 1 receives even ticks and Module 2 receives odd ticks.

The list defaults to instrument order, with optional machine-side or layer sorting. Edit machine side and layer; coordinates are calculated, with layer 1 at Y=0 and Y=(layer−1)×spacing. Advanced settings unlock coordinates and spacing. Switching speed rearranges a standard preset automatically; custom positions remain unchanged until a preset is applied.

Directions in controls, sorting, subregion names and configuration identify the machine side. Machine North uses projection East (1,0,0), chest facing South, with high notes farther East. Machine East uses projection South (0,0,1), facing West, with high notes farther South. Machine South uses projection West (-1,0,0), facing North, with high notes farther West. Machine West uses projection North (0,0,-1), facing East, with high notes farther North. The top view labels the North, East, South and West side chests. A module is always 50 blocks long, one wide and one high, containing 25 double chests.

Each enabled timing module has its own fixed-size subregion. Omitting empty chests does **not** change its Position or Size. Fully empty modules remain as air-only regions so the projection template stays intact.

Export order groups machine West → North → East → South, then height, source ID and module number. Region names include a side-order prefix, machine side, original zero-based NBS source ID, instrument and module, e.g. 01_West_00_Harp_Module1 and 02_North_00_Harp_Module2. Prefixes 01 West, 02 North, 03 East and 04 South preserve this grouping in viewers that sort names alphabetically. At 10 TPS the module suffix is omitted, e.g. 01_West_00_Harp. Multiple source IDs are joined with +; duplicate names receive suffixes. Re-export and reload older schematics to use the new names.

Only configuration version 4 is supported. direction identifies the machine side; layerHeight stores spacing, defaulting to 8. Versions 1/2/3 are rejected without migration. Each instrument stores two module positions; 10 TPS only uses Module 1.

Negative region coordinates are preserved. Export does not move the origin to a bounding-box corner. Complete module footprints are checked for overlap even where chests have been omitted. Use ignore-air placement when transferring inventories into existing structures.

## Supported files and sounds

- Reads NBS Classic and versions 1–6, including optional layer and custom-instrument sections.
- NBS v6 IDs 16–19 are Trumpet, Exposed Trumpet, Weathered Trumpet and Oxidized Trumpet. Legacy custom instruments start at the built-in count in the file header, so legacy ID 16 may be a custom sound rather than a trumpet.
- Default timing resamples to machine ticks while retaining song duration. Keeping original ticks changes playback speed instead.
- Encodable keys are 33–57. Choose octave transposition, an error, or dropping notes outside the range. Integer transposition is applied first.
- Fine pitch is rounded to the nearest semitone. Muted notes are skipped. Velocity differences, panning and loops are not encoded; warnings describe these changes.
- Formatted NBS exports use v6 and preserve custom definitions, rebasing legacy custom IDs to start at 20. Notes merged onto one layer during resampling move to additional layers.

Instrument names on page two are fixed; source NBS IDs and semitone transposition remain editable. Changing source IDs does not rename the output instrument. Icons use original textures of representative note-block base blocks, with Note Block for Harp and four copper oxidation stages for the trumpets. Textures are bundled for offline use. Custom NBS instruments are routed to output rows without renaming them.

Page three, Encoding & materials, shows quantities for all 15 encoded disc signals and the total directly. The sidebar's View disc quantities button jumps there. Counts reflect actual exported chest contents after chord merging and update when routing, transposition, speed or disc IDs change. Sound-event fields, sounds.json import and resource-pack routing have been removed. Old JSON sound fields remain compatible but do not affect encoding.

Disc IDs and filler items can be edited. Disc signals must still match the machine's comparator outputs, fillers must stack to 64, and the unstackable rest item must really be unstackable.

## Encoding and export

The bit masks and disc order remain those in `nbs-converter/constants.py`. At 20 ticks/s, even and odd ticks use separate modules and every eight ticks form a group. At 10 ticks/s, every four ticks form a group. Note bits are OR-ed into disc signals 1–15. Leading and intermediate rests are preserved; silence after the final disc is omitted as in the original machine.

Each shulker box holds up to 27 slots, and each channel has a 54-shulker double chest limit. Overflow reports the instrument and channel instead of truncating. A partial final encoding cycle is flushed rather than losing its notes.

- Java 26.1: Litematic v7, MinecraftDataVersion 4786, modern item components.
- Java 1.20.4: Litematic v6, MinecraftDataVersion 3700, legacy item NBT. This option does not add trumpet sounds to older games.
- Inventories are included. Ordinary survival placement does not automatically fill them; pasting inventories requires an appropriate authorized placement method with block-entity data enabled.
- Existing redstone machinery is not included. Ignore air when pasting into an existing machine.

## Checks and source

```sh
npm test
npm run build
npm run convert -- examples/copper-echoes.nbs song.litematic --config examples/machine-20.json
```

For browser layout checks, open `/tests/browser-layout.html` on the local server. It verifies both languages at 11 widths, checking card containment, sidebar separation and page overflow. This development-only page is not included in the static build.

Sources: [original converter](https://github.com/jazziiRed/nbs-converter), [NBS specification](https://noteblock.studio/nbs), [Litematica implementation](https://github.com/sakura-ryoko/litematica/blob/1.21.4/src/main/java/fi/dy/masa/litematica/schematic/LitematicaSchematic.java), [Minecraft item components](https://www.minecraft.net/en-us/article/minecraft-java-edition-1-20-5).

# Default 2 (10t/s). Set to 1 will use 2 modules for each instrument (20t/s)
# 默认设为2 (10t/s)，设为1时每个乐器使用两个模块(20t/s)
NOTE_INTERVAL = 1

# The maximum length of a song, dictated by the capacity of a double chest
# 最大乐曲长度
# MAX_SONG_LENGTH = 5831

# 是否移除空箱子
REMOVE_EMPTY_CHESTS = True

# 是否使用可堆叠物品
USE_STACKABLE = True

# 使用的物品
UNSTACKABLE = '"minecraft:shears"'
STACKABLE = (
    '"minecraft:white_carpet"',
    '"minecraft:light_gray_carpet"',
    '"minecraft:gray_carpet"',
    '"minecraft:black_carpet"',
    '"minecraft:brown_carpet"',
    '"minecraft:red_carpet"',
    '"minecraft:orange_carpet"',
    '"minecraft:yellow_carpet"',
    '"minecraft:lime_carpet"',
    '"minecraft:green_carpet"',
    '"minecraft:cyan_carpet"',
    '"minecraft:light_blue_carpet"',
    '"minecraft:blue_carpet"',
    '"minecraft:purple_carpet"',
    '"minecraft:magenta_carpet"',
    '"minecraft:pink_carpet"'
)

# DO NOT EDIT
# The instrument names in order
INSTRUMENTS = (
    'harp',
    'bass',
    'bassdrum',
    'snare',
    'hat',
    'guitar',
    'flute',
    'bell',
    'chime',
    'xylophone',
    'iron xylophone',
    'cow bell',
    'digeridoo',
    'bit',
    'banjo',
    'pling',
)

INSTRUMENT_COUNT = len(INSTRUMENTS)

# DO NOT EDIT
# The range of .nbs notes that a vanilla note block can play
INSTRUMENT_RANGE = (33, 57)

# DO NOT EDIT
# List of music discs in order
NOTES_TO_DISCS = (
    '"minecraft:music_disc_13"',
    '"minecraft:music_disc_cat"',
    '"minecraft:music_disc_blocks"',
    '"minecraft:music_disc_chirp"',
    '"minecraft:music_disc_far"',
    '"minecraft:music_disc_mall"',
    '"minecraft:music_disc_mellohi"',
    '"minecraft:music_disc_stal"',
    '"minecraft:music_disc_strad"',
    '"minecraft:music_disc_ward"',
    '"minecraft:music_disc_11"',
    '"minecraft:music_disc_wait"',
    '"minecraft:music_disc_pigstep"',
    '"minecraft:music_disc_otherside"',
    '"minecraft:music_disc_5"'
)

CODE = (
    (4,1),
    (8,2),
    (8,2),
    (4,1),
    (4,1),
    (8,2),
    (8,2),
    (4,1),
    (4,1),
    (8,2),
    (8,2),
    (4,1),
    (4,1),
    (8,2),
    (8,2),
    (4,1),
    (4,1),
    (8,2),
    (8,2),
    (4,1),
    (4,1),
    (8,2),
    (8,2),
    (4,1),
    (8,4,2,1)
)
# CODE = (
#     (1,2),
#     (4,8),
#     (1,2),
#     (4,8),
#     (1,2),
#     (4,8),
#     (1,2),
#     (4,8),
#     (1,2),
#     (4,8),
#     (1,2),
#     (4,8),
#     (1,2),
#     (4,8),
#     (1,2),
#     (4,8),
#     (1,2),
#     (4,8),
#     (1,2),
#     (4,8),
#     (1,2),
#     (4,8),
#     (1,2),
#     (4,8),
#     (1,2,4,8)
# )
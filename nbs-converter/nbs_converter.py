import pynbs
import sys
import mcschematic
from constants import *

def verifyFormat(song, songName):
    print('Verifying your song...')
    isValid = True
    # check song length
    # print('Checking song length...')
    # if song.header.song_length > MAX_SONG_LENGTH:
    #     print('Warning: Your song is too long.')
    #     isValid = False

    # check custom instruments
    print('Checking for custom instruments...')
    if len(song.instruments) > 0:
        print('Warning: Your song contains custom instruments.')
        isValid = False

    # check range
    print('Checking note ranges...')
    for note in song.notes:
        if note.key < INSTRUMENT_RANGE[0] or note.key > INSTRUMENT_RANGE[1]:
            print('Warning: Your song contains notes that are outside the normal range.')
            isValid = False
        break

    if not isValid:
        sys.exit(f'We found some issues with your song "{songName}". Please make sure to format it using the "nbs_format_song" script.')
    else:
        print('Song verified. Everything looks good!')

discCount = [0 for _ in range(15)]

def newDiscByCode(slot: int, code: int):
    discCount[code-1]+=1
    return '{Count:1b,Slot:' + str(slot) + 'b,id:' + NOTES_TO_DISCS[code-1] + '},'

def newStackable(slot: int, index: int, count: int):
    return '{Count:'+ str(count) +'b,Slot:' + str(slot) + 'b,id:' + STACKABLE[index] + '},'

def newUnstackable(slot: int):
    return '{Count:1b,Slot:' + str(slot) + 'b,id:'+ UNSTACKABLE +'},'

def createShulker(currentShulker: int, contents):
    slot = currentShulker % 27

    # remove trailing comma
    contents = contents[:len(contents) - 1]
    return '{Count:1b,Slot:' + str(
        slot) + 'b,id:"minecraft:shulker_box",tag:{BlockEntityTag:{Items:[' + contents + '],id:"minecraft:shulker_box"}}},'

def createChest(type_, contents):
    # remove trailing comma
    if len(contents) > 0:
        contents = contents[:len(contents) - 1]

    return 'minecraft:chest[facing=east,type=' + type_ + ']{Items:[' + contents + ']}'

class chest:
    right = ''
    left = ''

    discCode = 0
    # For stackable
    counter = 0
    stackableIndex = 0
    
    shulker = ''
    shulkerSlot = 0
    currentShulker = 0
    shulkerItemCount = 0

    def createDisc(self):
        if USE_STACKABLE:
            if self.discCode == 0:
                self.counter += 1
            else:
                if self.counter > 0:
                    self.addStackable()
                    if self.shulkerSlot > 0:
                        self.stackableIndex += 1
                self.addToShulker(newDiscByCode(self.shulkerSlot,self.discCode),1)
        else:
            if self.discCode == 0:
                self.addToShulker(newUnstackable(self.shulkerSlot),1)
            else:
                self.addToShulker(newDiscByCode(self.shulkerSlot,self.discCode),1)

        self.discCode = 0

    def addStackable(self):
        while(self.counter>=64):
            self.addToShulker(newStackable(self.shulkerSlot,self.stackableIndex,64),64)
            self.counter-=64
        if self.counter>0:
            self.addToShulker(newStackable(self.shulkerSlot,self.stackableIndex,self.counter),self.counter)
            self.counter = 0

    def addToShulker(self,content,itemCount:int):
        self.shulker += content
        self.shulkerSlot += 1
        self.shulkerItemCount += itemCount
        if self.shulkerSlot == 27:
            self.addShulkerToChest()
            self.currentShulker += 1
            self.shulkerSlot = 0
            self.shulker = ''
            self.stackableIndex = 0
            self.shulkerItemCount = 0

    def addShulkerToChest(self):
        self.shulker = createShulker(self.currentShulker,self.shulker)
        if self.currentShulker < 27:
            self.right += self.shulker
        else:
            self.left += self.shulker

    def finishChest(self):
        #盒子至少3个物品
        if self.shulkerItemCount>0 and self.shulkerItemCount<3:
            if USE_STACKABLE:
                self.counter=3-self.shulkerItemCount
                self.addStackable()
            else:
                for _ in range(3-self.shulkerItemCount):
                    self.addToShulker(newUnstackable(self.shulkerSlot),1)
    
        if self.shulkerSlot > 0:
            self.addShulkerToChest()


def generateSchem(instrument, schem, x:int, y:int, chests:list[chest]):
    for i in range(25):
        chests[i].finishChest()
        if REMOVE_EMPTY_CHESTS and chests[i].right == '' and chests[i].left == '':
            continue
        schem.setBlock((x, y, -i*2-2), createChest('right',chests[i].right))
        schem.setBlock((x, y, -i*2-3), createChest('left',chests[i].left))
    schem.setBlock((x, y, -1),'minecraft:glass')
    schem.setBlock((x, y, 0),'minecraft:oak_wall_sign[facing=south,waterlogged=false]{front_text:{color:"black",has_glowing_text:1b,messages:[\'{"text":"'+ instrument +'"}\',\'{"text":"'+ str(x+1) +'"}\',\'{"text":""}\',\'{"text":""}\',\'{"text":""}\']},is_waxed:0b}')

if __name__ == '__main__':
    # get song file from user
    songFile = input('Please enter the file name of your song (include the .nbs): ').strip('\"')
    if not songFile.endswith('.nbs'):
        sys.exit('Your song file must end with ".nbs".')

    try:
        song = pynbs.read(songFile)
        songName = songFile[:-4]
    except Exception as e:
        sys.exit(f'An error occurred while reading the song file "{songFile}".\nError name: {e.__class__.__name__}\nExact error (search this up for help): {e}')

    verifyFormat(song, songName)

    songLengthAdjusted = song.header.song_length + 1
    if songLengthAdjusted%4 != 0:
        songLengthAdjusted += 4-songLengthAdjusted%4

    # initialize data structure

    contents={}
    for instrument in INSTRUMENTS:
        contents[instrument] = [[] for _ in range(songLengthAdjusted)]

    keyModifier = INSTRUMENT_RANGE[0]
    instrumentChord = {}
    for tick, chord in song:
        for instrument in INSTRUMENTS:
            instrumentChord[instrument]=[]
        for note in chord:
            instrument = INSTRUMENTS[note.instrument]
            adjustedKey = note.key - keyModifier
            instrumentChord[instrument].append(adjustedKey)
        for instrument in contents.keys():
            contents[instrument][tick]=instrumentChord[instrument]
    
    schem = mcschematic.MCSchematic()
    offset = 0
    print('Generating Schematic...')
    for instrument, content in contents.items():
        print(instrument)
        chests1 = [chest() for _ in range(25)]
        chests2 = [chest() for _ in range(25)] if NOTE_INTERVAL == 1 else None
        chests = chests1
        for t in range(songLengthAdjusted):
            if NOTE_INTERVAL == 1:
                if t % 2 == 0:
                    chests = chests1 
                else:
                    chests = chests2
                phase = t // 2 % 4
            else:
                phase = t % 4
            chestSwitch = phase // 2
            bitSwitch = phase % 2
            for note in content[t]:
                if note == 24:
                    chests[24].discCode|=CODE[24][phase]
                else:
                    chests[note//2*2+chestSwitch].discCode|=CODE[note][bitSwitch]
            if phase == 3:
                for c in chests:
                    c.createDisc()

        if NOTE_INTERVAL == 1:
            generateSchem(instrument, schem, 0, offset, chests1)
            generateSchem(instrument, schem, 1, offset, chests2)
        else:
            generateSchem(instrument, schem, 0, offset, chests)
        offset += 1
    print("Discs count:")
    for i in range(15):
        print(NOTES_TO_DISCS[i]+': '+str(discCount[i]))
    
    saveName = songName.lower().replace('(', '').replace(')', '').replace(' ', '_')
    schem.save('', saveName, mcschematic.Version.JE_1_20)
    print('Your schematic was successfully generated and saved under "' + saveName + '.schem"')
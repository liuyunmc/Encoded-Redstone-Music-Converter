import pynbs
import sys
from constants import *

def getValidInput(validInputs, prompt):
  while True:
    userInput = input(prompt)
    if userInput in validInputs:
      return userInput
    else:
      print(f'"{userInput}" is not a valid input. Please try again.')


def removeCustomNotes(chord):
  return [note for note in chord if note.instrument <= 15]


def fixIllegalNotes(chord):
  instrumentMin, instrumentMax = INSTRUMENT_RANGE
  newChord = []

  for note in chord:
    while note.key < instrumentMin:
      note.key += 12
    while note.key > instrumentMax:
      note.key -= 12
    newChord.append(note)

  return newChord

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

  # give user option to compress song
  originalSongLength = song.header.song_length
  # if originalSongLength > MAX_SONG_LENGTH:
  #   print(f"Your song's length is {originalSongLength}, and the max length of a song is {MAX_SONG_LENGTH}.")

  print('You might want to compress your song if it is too slow or too long.')
  print('Compressing your song would remove every other tick and make it half as long. This may or may not make your song sound much worse.')
  settingCompress = True if getValidInput(['y', 'n'], 'Would you like to compress your song? (y/n): ') == 'y' else False

  # warn user if there are notes out of range
  for note in song.notes:
    if note.key < INSTRUMENT_RANGE[0] or note.key > INSTRUMENT_RANGE[1]:
      print('Your song contains notes that are outside the normal range. They will be transposed to be playable.')
      input('Press Enter to Continue')
      break

  # warn user if there are custom instruments
  if len(song.instruments) > 0:
    print('Your song contains custom instruments. All notes using custom instruments will be removed.')
    input('Press Enter to Continue')

  newSong = pynbs.new_file()
  newSong.header = song.header
  newSong.layers = song.layers
  newSong.header.tempo = 20 if NOTE_INTERVAL == 1 else 10

  # iterate through the whole song by chords
  for tick, chord in song:
    newTick = tick if not settingCompress else tick // 2

    # if newTick > MAX_SONG_LENGTH:
    #   print('Notice: Your song was too long, so some had to be cut off the end.')
    #   break

    if (tick % 2 != 0 and not settingCompress) or (tick % 2 == 0):
      chord = removeCustomNotes(chord)
      chord = fixIllegalNotes(chord)

      for note in chord:
        note.tick = newTick
        note.panning = 0
        note.pitch = 0
        newSong.notes.append(note)

  # save the new song
  newFileName = songName + ' (Formatted).nbs'

  newSong.save(newFileName)
  print(f'Your formatted song was saved under "{newFileName}"')
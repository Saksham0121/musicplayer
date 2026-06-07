import { downloadAsync, makeDirectoryAsync, getInfoAsync, deleteAsync, documentDirectory } from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { Song } from '../types/music';
import { pickAudio } from '../utils/music';
import { usePlayerStore } from '../store/playerStore';

export async function downloadSong(song: Song) {
  if (Platform.OS === 'web') {
    throw new Error('Offline downloads are available in the Android and iOS app');
  }

  const audioQuality = usePlayerStore.getState().audioQuality;
  const source = pickAudio({ ...song, localUri: undefined }, audioQuality);
  if (!source) throw new Error('No downloadable audio source found');

  const musicDirectory = `${documentDirectory}lokal-music/`;
  
  // Ensure the directory exists
  const dirInfo = await getInfoAsync(musicDirectory);
  if (!dirInfo.exists) {
    await makeDirectoryAsync(musicDirectory, { intermediates: true });
  }

  const destination = `${musicDirectory}${song.id}.m4a`;
  const downloaded = await downloadAsync(source, destination);
  
  if (downloaded.status !== 200) {
    throw new Error(`Download failed with status ${downloaded.status}`);
  }
  
  return downloaded.uri;
}

export async function clearDownloadedFiles() {
  if (Platform.OS === 'web') return;
  try {
    const musicDirectory = `${documentDirectory}lokal-music/`;
    const dirInfo = await getInfoAsync(musicDirectory);
    if (dirInfo.exists) {
      await deleteAsync(musicDirectory, { idempotent: true });
    }
  } catch (error) {
    console.error('Failed to clear downloaded files:', error);
  }
}

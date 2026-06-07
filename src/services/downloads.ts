import { Directory, File, Paths } from 'expo-file-system';
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

  const musicDirectory = new Directory(Paths.document, 'lokal-music');
  await musicDirectory.create({ idempotent: true, intermediates: true });
  const destination = new File(musicDirectory, `${song.id}.m4a`);
  const downloaded = await File.downloadFileAsync(source, destination, {
    idempotent: true,
  });
  return downloaded.uri;
}

export async function clearDownloadedFiles() {
  if (Platform.OS === 'web') return;
  try {
    const musicDirectory = new Directory(Paths.document, 'lokal-music');
    if (musicDirectory.exists) {
      await musicDirectory.delete();
    }
  } catch (error) {
    console.error('Failed to clear downloaded files:', error);
  }
}

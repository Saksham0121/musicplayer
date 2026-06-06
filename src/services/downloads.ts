import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { Song } from '../types/music';
import { pickAudio } from '../utils/music';

export async function downloadSong(song: Song) {
  if (Platform.OS === 'web') {
    throw new Error('Offline downloads are available in the Android and iOS app');
  }

  const source = pickAudio({ ...song, localUri: undefined });
  if (!source) throw new Error('No downloadable audio source found');

  const musicDirectory = new Directory(Paths.document, 'lokal-music');
  musicDirectory.create({ idempotent: true, intermediates: true });
  const destination = new File(musicDirectory, `${song.id}.m4a`);
  const downloaded = await File.downloadFileAsync(source, destination, {
    idempotent: true,
  });
  return downloaded.uri;
}

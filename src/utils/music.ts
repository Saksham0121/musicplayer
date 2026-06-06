import { Song } from '../types/music';

export const pickImage = (song?: Song, preferred = '500x500') => {
  if (!song) return undefined;
  return (
    song.images.find((image) => image.quality === preferred)?.url ??
    song.images.at(-1)?.url
  );
};

export const pickAudio = (song?: Song) => {
  if (!song) return undefined;
  return song.localUri ?? song.audio.find((item) => item.quality === '320kbps')?.url ?? song.audio.at(-1)?.url;
};

export const formatTime = (seconds = 0) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

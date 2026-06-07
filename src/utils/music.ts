import { Song } from '../types/music';

/** Extract the pixel size from a quality string like "150x150" → 150. */
const qualitySize = (q: string) => parseInt(q.split('x')[0] ?? '0') || 0;

/**
 * Pick the best available image URL for a song.
 * - Tries to find the closest resolution to `preferredSize` (default 500).
 * - Falls back to the highest-resolution image available.
 * - Always returns an https:// URL.
 */
export const pickImage = (song?: Song, preferredSize = 500) => {
  if (!song || song.images.length === 0) return undefined;
  // Sort by pixel size descending
  const sorted = [...song.images].sort(
    (a, b) => qualitySize(b.quality) - qualitySize(a.quality),
  );
  // Find the image whose size is >= preferred (first one that fits), or fall back to the largest
  const best =
    sorted.find((img) => qualitySize(img.quality) >= preferredSize) ??
    sorted[0];
  return best?.url;
};

export const pickAudio = (song?: Song, preferredQuality = '320kbps') => {
  if (!song) return undefined;
  return (
    song.localUri ??
    song.audio.find((item) => item.quality === preferredQuality)?.url ??
    song.audio.find((item) => item.quality === '320kbps')?.url ??
    song.audio.at(-1)?.url
  );
};

export const formatTime = (seconds = 0) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

import { Song } from '../types/music';

const API_URL = 'https://saavn.sumit.co/api';

type RawMedia = {
  quality?: string;
  url?: string;
  link?: string;
};

type RawSong = {
  id?: string;
  name?: string;
  title?: string;
  duration?: string | number;
  language?: string;
  primaryArtists?: string;
  album?: { name?: string };
  artists?: { primary?: Array<{ name?: string }> };
  image?: RawMedia[];
  downloadUrl?: RawMedia[];
};

type SearchResponse = {
  success?: boolean;
  status?: string;
  data?: {
    results?: RawSong[];
    total?: number;
  };
};

const decodeText = (value = '') =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const normalizeMedia = (items: RawMedia[] = []) =>
  items
    .map((item) => ({
      quality: item.quality ?? '',
      url: item.url ?? item.link ?? '',
    }))
    .filter((item) => Boolean(item.url));

const normalizeSong = (song: RawSong): Song => ({
  id: song.id ?? `${song.name}-${song.primaryArtists}`,
  title: decodeText(song.name ?? song.title ?? 'Unknown song'),
  artist: decodeText(
    song.primaryArtists ??
      song.artists?.primary?.map((artist) => artist.name).filter(Boolean).join(', ') ??
      'Unknown artist',
  ),
  album: decodeText(song.album?.name ?? 'Single'),
  duration: Number(song.duration) || 0,
  language: song.language ?? '',
  images: normalizeMedia(song.image),
  audio: normalizeMedia(song.downloadUrl),
});

export async function searchSongs(query: string, page = 0, limit = 20) {
  const response = await fetch(
    `${API_URL}/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
  );

  if (!response.ok) {
    throw new Error(`Music service returned ${response.status}`);
  }

  const payload = (await response.json()) as SearchResponse;
  const results = payload.data?.results ?? [];

  return {
    songs: results.map(normalizeSong).filter((song) => song.audio.length > 0),
    total: payload.data?.total ?? results.length,
  };
}

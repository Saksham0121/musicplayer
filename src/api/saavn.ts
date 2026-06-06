import { Album, Artist, Song } from '../types/music';

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
  album?: { name?: string; id?: string };
  artists?: { primary?: Array<{ name?: string }> };
  image?: RawMedia[];
  downloadUrl?: RawMedia[];
};

type RawArtist = {
  id?: string;
  name?: string;
  image?: RawMedia[] | string;
  followerCount?: string | number;
};

type RawAlbum = {
  id?: string;
  name?: string;
  primaryArtists?: string;
  artists?: string;
  year?: string;
  image?: RawMedia[];
  songCount?: string | number;
};

type SearchResponse = {
  success?: boolean;
  status?: string;
  data?: {
    results?: RawSong[];
    total?: number;
  };
};

type ArtistSearchResponse = {
  status?: string;
  data?: {
    results?: RawArtist[];
    total?: number;
  };
};

type AlbumSearchResponse = {
  status?: string;
  data?: {
    results?: RawAlbum[];
    total?: number;
  };
};

export const decodeText = (value = '') =>
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

const pickArtistImage = (raw: RawArtist): string | undefined => {
  if (Array.isArray(raw.image)) {
    const sorted = [...raw.image].sort((a, b) => {
      const qa = parseInt(a.quality ?? '0');
      const qb = parseInt(b.quality ?? '0');
      return qb - qa;
    });
    return sorted[0]?.url ?? sorted[0]?.link ?? undefined;
  }
  if (typeof raw.image === 'string') return raw.image;
  return undefined;
};

const normalizeArtist = (raw: RawArtist): Artist => ({
  id: raw.id ?? raw.name ?? '',
  name: decodeText(raw.name ?? 'Unknown Artist'),
  image: pickArtistImage(raw),
});

const normalizeAlbum = (raw: RawAlbum): Album => ({
  id: raw.id ?? raw.name ?? '',
  name: decodeText(raw.name ?? 'Unknown Album'),
  artist: decodeText(raw.primaryArtists ?? raw.artists ?? 'Unknown Artist'),
  year: raw.year,
  image: raw.image
    ? (() => {
        const sorted = [...raw.image].sort((a, b) => {
          const qa = parseInt(a.quality ?? '0');
          const qb = parseInt(b.quality ?? '0');
          return qb - qa;
        });
        return sorted[0]?.url ?? sorted[0]?.link ?? undefined;
      })()
    : undefined,
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

export async function searchArtists(query: string, page = 0, limit = 15) {
  const response = await fetch(
    `${API_URL}/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
  );

  if (!response.ok) {
    throw new Error(`Music service returned ${response.status}`);
  }

  const payload = (await response.json()) as ArtistSearchResponse;
  const results = payload.data?.results ?? [];

  return {
    artists: results.map(normalizeArtist).filter((a) => Boolean(a.name)),
    total: payload.data?.total ?? results.length,
  };
}

export async function searchAlbums(query: string, page = 0, limit = 20) {
  const response = await fetch(
    `${API_URL}/search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
  );

  if (!response.ok) {
    throw new Error(`Music service returned ${response.status}`);
  }

  const payload = (await response.json()) as AlbumSearchResponse;
  const results = payload.data?.results ?? [];

  return {
    albums: results.map(normalizeAlbum).filter((a) => Boolean(a.name)),
    total: payload.data?.total ?? results.length,
  };
}

export type ImageAsset = {
  quality: string;
  url: string;
};

export type AudioAsset = {
  quality: string;
  url: string;
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  language: string;
  images: ImageAsset[];
  audio: AudioAsset[];
  localUri?: string;
};

export type Artist = {
  id: string;
  name: string;
  image?: string;
  songCount?: number;
  songs?: Song[];
};

export type Album = {
  id: string;
  name: string;
  artist: string;
  year?: string;
  image?: string;
  songs?: Song[];
};

export type RepeatMode = 'off' | 'all' | 'one';

export type SortOption = 'asc' | 'desc' | 'artist' | 'album' | 'year';

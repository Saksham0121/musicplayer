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

export type RepeatMode = 'off' | 'all' | 'one';

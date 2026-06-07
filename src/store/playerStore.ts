import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { RepeatMode, Song } from '../types/music';
import { ThemeMode, setThemeGetter } from '../theme';

const STORAGE_KEY = '@lokal/player';

type PersistedState = {
  queue: Song[];
  currentIndex: number;
  repeatMode: RepeatMode;
  shuffle: boolean;
  downloaded: Record<string, Song>;
  favorites: Song[];    // full Song objects so favorites survive queue clearing
  recentlyPlayed: Song[];
  audioQuality: string; // persisted quality pref ('96kbps' | '160kbps' | '320kbps')
  theme: ThemeMode;
};

type PlayerState = PersistedState & {
  hydrated: boolean;
  shouldPlay: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  position: number;
  duration: number;
  hydrate: () => Promise<void>;
  playSong: (song: Song, sourceList?: Song[]) => void;
  setShouldPlay: (value: boolean) => void;
  setPlaybackStatus: (status: Partial<Pick<PlayerState, 'isPlaying' | 'isBuffering' | 'position' | 'duration'>>) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  moveQueueItem: (from: number, to: number) => void;
  clearQueue: () => void;
  clearDownloads: () => void;
  next: () => void;
  previous: () => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
  setAudioQuality: (quality: string) => void;
  markDownloaded: (song: Song, localUri: string) => void;
  toggleFavorite: (song: Song) => void;
  isFavorite: (songId: string) => boolean;
  setTheme: (theme: ThemeMode) => void;
};

const persist = (state: PlayerState) => {
  const payload: PersistedState = {
    queue: state.queue,
    currentIndex: state.currentIndex,
    repeatMode: state.repeatMode,
    shuffle: state.shuffle,
    downloaded: state.downloaded,
    favorites: state.favorites,
    recentlyPlayed: state.recentlyPlayed,
    audioQuality: state.audioQuality,
    theme: state.theme,
  };
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch((error) => {
    console.error('Failed to persist player state:', error);
  });
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  repeatMode: 'off',
  shuffle: false,
  downloaded: {},
  favorites: [],
  recentlyPlayed: [],
  audioQuality: '320kbps',
  theme: 'dark',
  hydrated: false,
  shouldPlay: false,
  isPlaying: false,
  isBuffering: false,
  position: 0,
  duration: 0,

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as any;
        // Migration: old format stored favorites as string[]. Reset to [] if so.
        const rawFavorites = parsed.favorites ?? [];
        const favorites: Song[] =
          rawFavorites.length > 0 && typeof rawFavorites[0] === 'string'
            ? []
            : (rawFavorites as Song[]);
        
        // Migration: old format stored downloaded as Record<string, string> (localUri).
        const rawDownloaded = parsed.downloaded ?? {};
        const downloaded: Record<string, Song> = {};
        for (const [id, value] of Object.entries(rawDownloaded)) {
          if (typeof value === 'string') {
            const existingSong = [...(parsed.queue ?? []), ...(parsed.recentlyPlayed ?? []), ...favorites]
              .find((s) => s.id === id);
            if (existingSong) {
              downloaded[id] = { ...existingSong, localUri: value };
            } else {
              downloaded[id] = {
                id,
                title: 'Downloaded Track',
                artist: 'Unknown Artist',
                album: 'Offline',
                duration: 0,
                language: '',
                images: [],
                audio: [],
                localUri: value,
              };
            }
          } else {
            downloaded[id] = value as Song;
          }
        }

        set({
          ...parsed,
          downloaded,
          favorites,
          recentlyPlayed: parsed.recentlyPlayed ?? [],
          audioQuality: parsed.audioQuality ?? '320kbps',
          theme: parsed.theme ?? 'dark',
          hydrated: true,
        });
        return;
      }
    } catch {
      // A corrupt local snapshot should not prevent the app from launching.
    }
    set({ hydrated: true });
  },

  playSong: (song, sourceList) => {
    const downloads = get().downloaded;
    const currentQueue = (sourceList?.length ? sourceList : get().queue).map((item) =>
      downloads[item.id] ? { ...item, localUri: downloads[item.id].localUri } : item,
    );
    const playableSong = downloads[song.id] ? { ...song, localUri: downloads[song.id].localUri } : song;
    const existingIndex = currentQueue.findIndex((item) => item.id === song.id);
    const queue = existingIndex >= 0 ? currentQueue : [...currentQueue, playableSong];
    const currentIndex = existingIndex >= 0 ? existingIndex : queue.length - 1;

    // Update recently played (max 20, most recent first, no duplicates)
    const recent = get().recentlyPlayed;
    const filteredRecent = recent.filter((r) => r.id !== playableSong.id);
    const recentlyPlayed = [playableSong, ...filteredRecent].slice(0, 20);

    set({
      queue,
      currentIndex,
      shouldPlay: true,
      position: 0,
      recentlyPlayed,
    });
    persist(get());
  },

  setShouldPlay: (value) => {
    set({ shouldPlay: value });
    persist(get());
  },

  setPlaybackStatus: (status) => {
    set(status);
  },

  addToQueue: (song) => {
    const downloads = get().downloaded;
    const playableSong = downloads[song.id] ? { ...song, localUri: downloads[song.id].localUri } : song;
    const { queue, currentIndex } = get();
    if (queue.some((s) => s.id === playableSong.id)) return;
    
    const newQueue = [...queue];
    newQueue.splice(currentIndex + 1, 0, playableSong);
    set({ queue: newQueue });
    persist(get());
  },

  removeFromQueue: (index) => {
    const { queue, currentIndex } = get();
    const newQueue = queue.filter((_, i) => i !== index);
    let newIndex = currentIndex;
    if (index < currentIndex) {
      newIndex = currentIndex - 1;
    } else if (index === currentIndex) {
      newIndex = newQueue.length > 0 ? Math.min(currentIndex, newQueue.length - 1) : -1;
    }
    set({ queue: newQueue, currentIndex: newIndex });
    persist(get());
  },

  moveQueueItem: (from, to) => {
    const { queue, currentIndex } = get();
    const newQueue = [...queue];
    const [moved] = newQueue.splice(from, 1);
    if (moved) {
      newQueue.splice(to, 0, moved);
    }
    
    let newIndex = currentIndex;
    if (currentIndex === from) {
      newIndex = to;
    } else if (currentIndex > from && currentIndex <= to) {
      newIndex = currentIndex - 1;
    } else if (currentIndex < from && currentIndex >= to) {
      newIndex = currentIndex + 1;
    }
    
    set({ queue: newQueue, currentIndex: newIndex });
    persist(get());
  },

  clearQueue: () => {
    set({ queue: [], currentIndex: -1 });
    persist(get());
  },

  clearDownloads: () => {
    set((state) => ({
      downloaded: {},
      queue: state.queue.map((song) => ({ ...song, localUri: undefined })),
      recentlyPlayed: state.recentlyPlayed.map((song) => ({ ...song, localUri: undefined })),
    }));
    persist(get());
  },

  next: () => {
    const { queue, currentIndex, repeatMode, shuffle } = get();
    if (queue.length === 0) return;
    
    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      set({ currentIndex: randomIndex, shouldPlay: true, position: 0 });
      persist(get());
      return;
    }
    
    let nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        return; // stop playback
      }
    }
    set({ currentIndex: nextIndex, shouldPlay: true, position: 0 });
    persist(get());
  },

  previous: () => {
    const { queue, currentIndex, repeatMode, shuffle } = get();
    if (queue.length === 0) return;
    
    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      set({ currentIndex: randomIndex, shouldPlay: true, position: 0 });
      persist(get());
      return;
    }
    
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      if (repeatMode === 'all') {
        prevIndex = queue.length - 1;
      } else {
        prevIndex = 0;
      }
    }
    set({ currentIndex: prevIndex, shouldPlay: true, position: 0 });
    persist(get());
  },

  cycleRepeat: () => {
    const nextMode: Record<RepeatMode, RepeatMode> = {
      off: 'all',
      all: 'one',
      one: 'off',
    };
    set({ repeatMode: nextMode[get().repeatMode] });
    persist(get());
  },

  toggleShuffle: () => {
    set((state) => ({ shuffle: !state.shuffle }));
    persist(get());
  },

  markDownloaded: (song, localUri) => {
    const downloadedSong = { ...song, localUri };
    set((state) => ({
      downloaded: { ...state.downloaded, [song.id]: downloadedSong },
      queue: state.queue.map((item) =>
        item.id === song.id ? { ...item, localUri } : item,
      ),
      recentlyPlayed: state.recentlyPlayed.map((item) =>
        item.id === song.id ? { ...item, localUri } : item,
      ),
    }));
    persist(get());
  },

  toggleFavorite: (song) => {
    const { favorites } = get();
    const newFavorites = favorites.some((s) => s.id === song.id)
      ? favorites.filter((s) => s.id !== song.id)
      : [...favorites, song];
    set({ favorites: newFavorites });
    persist(get());
  },

  isFavorite: (songId) => get().favorites.some((s) => s.id === songId),

  setAudioQuality: (audioQuality) => {
    set({ audioQuality });
    persist(get());
  },

  setTheme: (theme) => {
    set({ theme });
    persist(get());
  },
}));

// Connect the store theme state to the global theme colors helper
setThemeGetter(() => usePlayerStore.getState().theme || 'dark');

export const selectCurrentSong = (state: PlayerState): Song | undefined => {
  const { queue, currentIndex } = state;
  if (currentIndex >= 0 && currentIndex < queue.length) {
    return queue[currentIndex];
  }
  return undefined;
};

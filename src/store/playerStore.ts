import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { RepeatMode, Song } from '../types/music';

const STORAGE_KEY = '@lokal/player';

type PersistedState = {
  queue: Song[];
  currentIndex: number;
  repeatMode: RepeatMode;
  shuffle: boolean;
  downloaded: Record<string, string>;
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
  next: () => void;
  previous: () => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
  markDownloaded: (songId: string, localUri: string) => void;
};

const persist = (state: PlayerState) => {
  const payload: PersistedState = {
    queue: state.queue,
    currentIndex: state.currentIndex,
    repeatMode: state.repeatMode,
    shuffle: state.shuffle,
    downloaded: state.downloaded,
  };
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  repeatMode: 'off',
  shuffle: false,
  downloaded: {},
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
        const parsed = JSON.parse(saved) as PersistedState;
        set({ ...parsed, downloaded: parsed.downloaded ?? {}, hydrated: true });
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
      downloads[item.id] ? { ...item, localUri: downloads[item.id] } : item,
    );
    const playableSong = downloads[song.id] ? { ...song, localUri: downloads[song.id] } : song;
    const existingIndex = currentQueue.findIndex((item) => item.id === song.id);
    const queue = existingIndex >= 0 ? currentQueue : [...currentQueue, playableSong];
    const currentIndex = existingIndex >= 0 ? existingIndex : queue.length - 1;
    set({ queue, currentIndex, shouldPlay: true, position: 0 });
    persist(get());
  },

  setShouldPlay: (shouldPlay) => set({ shouldPlay }),
  setPlaybackStatus: (status) => set(status),

  addToQueue: (song) => {
    if (get().queue.some((item) => item.id === song.id)) return;
    set((state) => ({ queue: [...state.queue, song] }));
    persist(get());
  },

  removeFromQueue: (index) => {
    const state = get();
    const queue = state.queue.filter((_, itemIndex) => itemIndex !== index);
    let currentIndex = state.currentIndex;
    if (index < currentIndex) currentIndex -= 1;
    if (index === currentIndex) currentIndex = Math.min(currentIndex, queue.length - 1);
    set({
      queue,
      currentIndex,
      shouldPlay: queue.length > 0 && state.shouldPlay,
    });
    persist(get());
  },

  moveQueueItem: (from, to) => {
    const state = get();
    if (to < 0 || to >= state.queue.length || from === to) return;
    const queue = [...state.queue];
    const [moved] = queue.splice(from, 1);
    queue.splice(to, 0, moved);
    let currentIndex = state.currentIndex;
    if (currentIndex === from) currentIndex = to;
    else if (from < currentIndex && to >= currentIndex) currentIndex -= 1;
    else if (from > currentIndex && to <= currentIndex) currentIndex += 1;
    set({ queue, currentIndex });
    persist(get());
  },

  clearQueue: () => {
    set({ queue: [], currentIndex: -1, shouldPlay: false, isPlaying: false });
    persist(get());
  },

  next: () => {
    const state = get();
    if (!state.queue.length) return;
    let currentIndex: number;
    if (state.shuffle && state.queue.length > 1) {
      do {
        currentIndex = Math.floor(Math.random() * state.queue.length);
      } while (currentIndex === state.currentIndex);
    } else {
      const atEnd = state.currentIndex >= state.queue.length - 1;
      if (atEnd && state.repeatMode === 'off') {
        set({ shouldPlay: false, isPlaying: false, position: 0 });
        return;
      }
      currentIndex = (state.currentIndex + 1) % state.queue.length;
    }
    set({ currentIndex, shouldPlay: true, position: 0 });
    persist(get());
  },

  previous: () => {
    const state = get();
    if (!state.queue.length) return;
    const currentIndex =
      state.currentIndex <= 0 ? state.queue.length - 1 : state.currentIndex - 1;
    set({ currentIndex, shouldPlay: true, position: 0 });
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

  markDownloaded: (songId, localUri) => {
    set((state) => ({
      downloaded: { ...state.downloaded, [songId]: localUri },
      queue: state.queue.map((song) =>
        song.id === songId ? { ...song, localUri } : song,
      ),
    }));
    persist(get());
  },
}));

export const selectCurrentSong = (state: PlayerState) =>
  state.queue[state.currentIndex];

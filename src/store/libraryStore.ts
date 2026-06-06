import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { Song } from '../types/music';

const STORAGE_KEY = '@lokal/library';

export type Playlist = {
  id: string;
  name: string;
  createdAt: number;
  songs: Song[];
};

type LibraryState = {
  playlists: Playlist[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
};

const persist = (state: LibraryState) => {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ playlists: state.playlists }));
};

export const useLibraryStore = create<LibraryState>((set, get) => ({
  playlists: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { playlists: Playlist[] };
        set({ playlists: parsed.playlists ?? [], hydrated: true });
        return;
      }
    } catch {
      // Corrupt snapshot – start fresh
    }
    set({ hydrated: true });
  },

  createPlaylist: (name) => {
    const playlist: Playlist = {
      id: `playlist-${Date.now()}`,
      name: name.trim(),
      createdAt: Date.now(),
      songs: [],
    };
    set((state) => ({ playlists: [...state.playlists, playlist] }));
    persist(get());
    return playlist;
  },

  deletePlaylist: (id) => {
    set((state) => ({ playlists: state.playlists.filter((p) => p.id !== id) }));
    persist(get());
  },

  renamePlaylist: (id, name) => {
    set((state) => ({
      playlists: state.playlists.map((p) =>
        p.id === id ? { ...p, name: name.trim() } : p,
      ),
    }));
    persist(get());
  },

  addSongToPlaylist: (playlistId, song) => {
    set((state) => ({
      playlists: state.playlists.map((p) => {
        if (p.id !== playlistId) return p;
        if (p.songs.some((s) => s.id === song.id)) return p; // no duplicates
        return { ...p, songs: [...p.songs, song] };
      }),
    }));
    persist(get());
  },

  removeSongFromPlaylist: (playlistId, songId) => {
    set((state) => ({
      playlists: state.playlists.map((p) =>
        p.id === playlistId
          ? { ...p, songs: p.songs.filter((s) => s.id !== songId) }
          : p,
      ),
    }));
    persist(get());
  },
}));

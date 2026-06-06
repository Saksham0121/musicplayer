import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { searchAlbums, searchArtists, searchSongs } from '../api/saavn';
import { Artwork } from '../components/Artwork';
import { ArtistCard } from '../components/ArtistCard';
import { CategoryTabs, CategoryTabId } from '../components/CategoryTabs';
import { HorizontalSongCard } from '../components/HorizontalSongCard';
import { SORT_LABELS, SortPicker } from '../components/SortPicker';
import { SongRow } from '../components/SongRow';
import { RootStackParamList } from '../navigation/types';
import { usePlayerStore } from '../store/playerStore';
import { colors, radius, spacing } from '../theme';
import { Album, Artist, Song, SortOption } from '../types/music';
import { formatTime, pickImage } from '../utils/music';

const DEFAULT_QUERY = 'Bollywood hits';

function sortSongs(songs: Song[], option: SortOption): Song[] {
  const sorted = [...songs];
  switch (option) {
    case 'asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case 'artist':
      return sorted.sort((a, b) => a.artist.localeCompare(b.artist));
    case 'album':
      return sorted.sort((a, b) => a.album.localeCompare(b.album));
    case 'year':
      return sorted; // no year in Song type; fallback to default order
    default:
      return sorted;
  }
}

// ─── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={sectionStyles.row}>
      <Text style={sectionStyles.title}>{title}</Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={sectionStyles.seeAll}>See All</Text>
        </Pressable>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  seeAll: { color: colors.accent, fontSize: 13, fontWeight: '700' },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const recentlyPlayed = usePlayerStore((s) => s.recentlyPlayed);
  const playSong = usePlayerStore((s) => s.playSong);
  const toggleFavorite = usePlayerStore((s) => s.toggleFavorite);
  const favorites = usePlayerStore((s) => s.favorites);

  // ── Category tab ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<CategoryTabId>('Suggested');

  // ── Search ───────────────────────────────────────────────────────────
  const [showSearch, setShowSearch] = useState(false);
  const [input, setInput] = useState('');
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const searchRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim() || DEFAULT_QUERY), 450);
    return () => clearTimeout(timer);
  }, [input]);

  // ── Songs ────────────────────────────────────────────────────────────
  const [songs, setSongs] = useState<Song[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('asc');
  const [showSort, setShowSort] = useState(false);

  const loadSongs = useCallback(async (q: string, p: number) => {
    p === 0 ? setLoadingSongs(true) : setLoadingMore(true);
    try {
      const result = await searchSongs(q, p);
      setSongs((prev) =>
        p === 0
          ? result.songs
          : [...prev, ...result.songs.filter((s) => !prev.some((ps) => ps.id === s.id))],
      );
      setTotal(result.total);
      setPage(p);
    } catch {
      // swallow
    } finally {
      setLoadingSongs(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { void loadSongs(query, 0); }, [loadSongs, query]);

  const sortedSongs = useMemo(() => sortSongs(songs, sortOption), [songs, sortOption]);

  // ── Artists ──────────────────────────────────────────────────────────
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const artistsLoadedFor = useRef('');

  const loadArtists = useCallback(async (q: string) => {
    if (artistsLoadedFor.current === q) return;
    setLoadingArtists(true);
    try {
      const result = await searchArtists(q);
      setArtists(result.artists);
      artistsLoadedFor.current = q;
    } catch {
      // swallow
    } finally {
      setLoadingArtists(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'Artists') void loadArtists(query);
  }, [activeTab, query, loadArtists]);

  // Load artists for Suggested tab too (separate quiet load)
  const [suggestedArtists, setSuggestedArtists] = useState<Artist[]>([]);
  const suggestedArtistsLoadedFor = useRef('');

  useEffect(() => {
    if (suggestedArtistsLoadedFor.current === query) return;
    void searchArtists(query, 0, 8).then((r) => {
      setSuggestedArtists(r.artists);
      suggestedArtistsLoadedFor.current = query;
    }).catch(() => {});
  }, [query]);

  // ── Albums ───────────────────────────────────────────────────────────
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const albumsLoadedFor = useRef('');

  const loadAlbums = useCallback(async (q: string) => {
    if (albumsLoadedFor.current === q) return;
    setLoadingAlbums(true);
    try {
      const result = await searchAlbums(q);
      setAlbums(result.albums);
      albumsLoadedFor.current = q;
    } catch {
      // swallow
    } finally {
      setLoadingAlbums(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'Albums') void loadAlbums(query);
  }, [activeTab, query, loadAlbums]);

  // ── Play helpers ──────────────────────────────────────────────────────
  const play = (song: Song, list: Song[]) => {
    playSong(song, list);
    navigation.navigate('Player');
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ─── App Bar ─────────────────────────────────────────────── */}
      <View style={styles.appBar}>
        <View style={styles.logoRow}>
          <Ionicons name="musical-notes" size={26} color={colors.accent} />
          <Text style={styles.logoText}>Mume</Text>
        </View>
        <Pressable
          style={styles.iconBtn}
          onPress={() => {
            setShowSearch((v) => !v);
            setTimeout(() => searchRef.current?.focus(), 100);
          }}
          accessibilityLabel="Search"
        >
          <Ionicons name={showSearch ? 'close' : 'search'} size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* ─── Search bar ────────────────────────────────────────────── */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            ref={searchRef}
            value={input}
            onChangeText={setInput}
            placeholder="Songs, artists, albums…"
            placeholderTextColor={colors.subtle}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {input.length > 0 && (
            <Pressable onPress={() => setInput('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
      )}

      {/* ─── Category Tabs ─────────────────────────────────────────── */}
      <CategoryTabs active={activeTab} onChange={setActiveTab} />

      {/* ─── Tab Content ───────────────────────────────────────────── */}
      {activeTab === 'Suggested' && (
        <SuggestedTab
          recentlyPlayed={recentlyPlayed}
          songs={songs}
          artists={suggestedArtists}
          loading={loadingSongs}
          onPlay={(s) => play(s, songs)}
        />
      )}

      {activeTab === 'Songs' && (
        <SongsTab
          songs={sortedSongs}
          total={total}
          loading={loadingSongs}
          loadingMore={loadingMore}
          sortOption={sortOption}
          onSort={() => setShowSort(true)}
          onPlay={(s) => play(s, sortedSongs)}
          onEndReached={() => {
            if (!loadingMore && songs.length < total) void loadSongs(query, page + 1);
          }}
          onRefresh={() => void loadSongs(query, 0)}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {activeTab === 'Artists' && (
        <ArtistsTab artists={artists} loading={loadingArtists} />
      )}

      {activeTab === 'Albums' && (
        <AlbumsTab albums={albums} loading={loadingAlbums} />
      )}

      {activeTab === 'Folders' && <FoldersTab />}

      {/* ─── Sort Picker Modal ─────────────────────────────────────── */}
      <SortPicker
        visible={showSort}
        current={sortOption}
        onSelect={setSortOption}
        onClose={() => setShowSort(false)}
      />
    </SafeAreaView>
  );
}

// ─── Suggested Tab ────────────────────────────────────────────────────────────
function SuggestedTab({
  recentlyPlayed,
  songs,
  artists,
  loading,
  onPlay,
}: {
  recentlyPlayed: Song[];
  songs: Song[];
  artists: Artist[];
  loading: boolean;
  onPlay: (s: Song) => void;
}) {
  const topPicks = songs.slice(0, 8);

  if (loading && songs.length === 0) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.suggestedContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <>
          <SectionHeader title="Recently Played" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {recentlyPlayed.slice(0, 10).map((song) => (
              <HorizontalSongCard key={song.id} song={song} onPress={() => onPlay(song)} />
            ))}
          </ScrollView>
        </>
      )}

      {/* Artists */}
      {artists.length > 0 && (
        <>
          <SectionHeader title="Artists" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} size={88} />
            ))}
          </ScrollView>
        </>
      )}

      {/* Top Picks */}
      {topPicks.length > 0 && (
        <>
          <SectionHeader title="Top Picks" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {topPicks.map((song) => (
              <HorizontalSongCard key={`top-${song.id}`} song={song} onPress={() => onPlay(song)} />
            ))}
          </ScrollView>
        </>
      )}

      {recentlyPlayed.length === 0 && songs.length === 0 && (
        <View style={styles.emptyCenter}>
          <Ionicons name="musical-note-outline" size={48} color={colors.subtle} />
          <Text style={styles.emptyTitle}>Play some songs to get started</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Songs Tab ────────────────────────────────────────────────────────────────
function SongsTab({
  songs,
  total,
  loading,
  loadingMore,
  sortOption,
  onSort,
  onPlay,
  onEndReached,
  onRefresh,
  favorites,
  onToggleFavorite,
}: {
  songs: Song[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  sortOption: SortOption;
  onSort: () => void;
  onPlay: (s: Song) => void;
  onEndReached: () => void;
  onRefresh: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <FlatList
      style={styles.flex}
      data={songs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SongRow
          song={item}
          onPress={() => onPlay(item)}
        />
      )}
      contentContainerStyle={styles.songsList}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.45}
      refreshControl={
        <RefreshControl
          refreshing={loading && songs.length > 0}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
      ListHeaderComponent={
        <View style={styles.songsHeader}>
          <Text style={styles.songsCount}>{total > 0 ? `${total.toLocaleString()} songs` : 'Songs'}</Text>
          <Pressable style={styles.sortButton} onPress={onSort}>
            <Text style={styles.sortLabel}>{SORT_LABELS[sortOption]}</Text>
            <Ionicons
              name={sortOption === 'desc' ? 'arrow-down' : 'arrow-up'}
              size={14}
              color={colors.accent}
            />
          </Pressable>
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={colors.accent} size="large" style={styles.listLoader} />
        ) : (
          <View style={styles.emptyCenter}>
            <Ionicons name="musical-note-outline" size={40} color={colors.subtle} />
            <Text style={styles.emptyTitle}>No songs found</Text>
          </View>
        )
      }
      ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.accent} style={styles.footer} /> : null}
    />
  );
}

// ─── Artists Tab ──────────────────────────────────────────────────────────────
function ArtistsTab({ artists, loading }: { artists: Artist[]; loading: boolean }) {
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.flex}
      data={artists}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.artistsList}
      renderItem={({ item }) => (
        <View style={styles.artistRow}>
          <Artwork
            uri={item.image}
            style={styles.artistAvatar}
            radius={25}
            fallbackIcon="person"
          />
          <View style={styles.artistInfo}>
            <Text style={styles.artistName} numberOfLines={1}>{item.name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyCenter}>
          <Ionicons name="person-outline" size={40} color={colors.subtle} />
          <Text style={styles.emptyTitle}>No artists found</Text>
        </View>
      }
    />
  );
}

// ─── Albums Tab ───────────────────────────────────────────────────────────────
function AlbumsTab({ albums, loading }: { albums: Album[]; loading: boolean }) {
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.flex}
      data={albums}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.albumsGrid}
      columnWrapperStyle={styles.albumRow}
      renderItem={({ item }) => (
        <View style={styles.albumCard}>
          <Artwork
            uri={item.image}
            style={styles.albumArt}
            radius={radius.md}
          />
          <Text style={styles.albumName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.albumArtist} numberOfLines={1}>{item.artist}</Text>
          {item.year ? <Text style={styles.albumYear}>{item.year}</Text> : null}
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyCenter}>
          <Ionicons name="albums-outline" size={40} color={colors.subtle} />
          <Text style={styles.emptyTitle}>No albums found</Text>
        </View>
      }
    />
  );
}

// ─── Folders Tab ──────────────────────────────────────────────────────────────
function FoldersTab() {
  const downloaded = usePlayerStore((s) => s.downloaded);
  const queue = usePlayerStore((s) => s.queue);
  const downloadedSongs = queue.filter((s) => s.localUri);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.folderContent}>
      <View style={styles.folderHeader}>
        <Ionicons name="folder-open" size={40} color={colors.accent} />
        <Text style={styles.folderTitle}>Downloaded Songs</Text>
        <Text style={styles.folderSub}>{downloadedSongs.length} songs available offline</Text>
      </View>

      {downloadedSongs.length === 0 ? (
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyCopy}>
            Download songs from the player screen to listen offline.
          </Text>
        </View>
      ) : (
        downloadedSongs.map((song) => (
          <View key={song.id} style={styles.folderRow}>
            <Artwork uri={pickImage(song, '150x150')} style={styles.folderArt} radius={8} />
            <View style={styles.folderInfo}>
              <Text style={styles.folderSongTitle} numberOfLines={1}>{song.title}</Text>
              <Text style={styles.folderSongArtist} numberOfLines={1}>{song.artist}</Text>
            </View>
            <Text style={styles.folderDuration}>{formatTime(song.duration)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  // App bar
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoText: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 46,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },

  // Suggested tab
  suggestedContent: { paddingBottom: 160 },
  hScroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },

  // Songs tab
  songsList: { paddingBottom: 160 },
  songsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}60`,
  },
  songsCount: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${colors.accent}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: `${colors.accent}40`,
  },
  sortLabel: { color: colors.accent, fontSize: 12, fontWeight: '700' },

  // Artists tab
  artistsList: { paddingHorizontal: spacing.lg, paddingBottom: 160, paddingTop: spacing.sm },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}50`,
    gap: spacing.md,
  },
  artistAvatar: { width: 50, height: 50 },
  artistInfo: { flex: 1 },
  artistName: { color: colors.text, fontSize: 15, fontWeight: '700' },

  // Albums tab
  albumsGrid: { paddingHorizontal: spacing.md, paddingBottom: 160, paddingTop: spacing.md },
  albumRow: { gap: spacing.md, marginBottom: spacing.lg },
  albumCard: { flex: 1 },
  albumArt: { width: '100%', aspectRatio: 1, marginBottom: spacing.sm },
  albumName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  albumArtist: { color: colors.muted, fontSize: 11, marginTop: 2 },
  albumYear: { color: colors.subtle, fontSize: 10, marginTop: 1 },

  // Folders tab
  folderContent: { paddingBottom: 160 },
  folderHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  folderTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  folderSub: { color: colors.muted, fontSize: 13 },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}50`,
    gap: spacing.md,
  },
  folderArt: { width: 46, height: 46 },
  folderInfo: { flex: 1 },
  folderSongTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  folderSongArtist: { color: colors.muted, fontSize: 12, marginTop: 2 },
  folderDuration: { color: colors.subtle, fontSize: 12 },

  // Shared
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listLoader: { marginTop: 60 },
  footer: { paddingVertical: spacing.xl },
  emptyCenter: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { color: colors.muted, fontSize: 16, fontWeight: '700', marginTop: spacing.lg },
  emptyCopy: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginTop: spacing.md },
});

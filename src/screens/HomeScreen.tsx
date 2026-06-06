import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { searchSongs } from '../api/saavn';
import { Artwork } from '../components/Artwork';
import { SongRow } from '../components/SongRow';
import { RootStackParamList } from '../navigation/types';
import { usePlayerStore } from '../store/playerStore';
import { colors, radius, spacing } from '../theme';
import { Song } from '../types/music';
import { pickImage } from '../utils/music';

const DEFAULT_QUERY = 'Bollywood hits';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const playSong = usePlayerStore((state) => state.playSong);
  const [input, setInput] = useState('');
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [songs, setSongs] = useState<Song[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(input.trim() || DEFAULT_QUERY);
    }, 450);
    return () => clearTimeout(timer);
  }, [input]);

  const load = useCallback(async (targetQuery: string, targetPage: number) => {
    targetPage === 0 ? setLoading(true) : setLoadingMore(true);
    setError(undefined);
    try {
      const result = await searchSongs(targetQuery, targetPage);
      setSongs((current) =>
        targetPage === 0
          ? result.songs
          : [...current, ...result.songs.filter((song) => !current.some((item) => item.id === song.id))],
      );
      setTotal(result.total);
      setPage(targetPage);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load music');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load(query, 0);
  }, [load, query]);

  const featured = useMemo(() => songs.slice(0, 6), [songs]);
  const cardWidth = Math.min(178, Math.max(148, width * 0.42));

  const play = (song: Song) => {
    playSong(song, songs);
    navigation.navigate('Player');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SongRow song={item} onPress={() => play(item)} />}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={loading && songs.length > 0}
            onRefresh={() => void load(query, 0)}
            tintColor={colors.accent}
          />
        }
        onEndReached={() => {
          if (!loadingMore && songs.length < total) void load(query, page + 1);
        }}
        onEndReachedThreshold={0.45}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>YOUR MUSIC, YOUR MOOD</Text>
                <Text style={styles.heading}>Good evening</Text>
              </View>
              <Pressable accessibilityLabel="Open queue" style={styles.queueButton} onPress={() => navigation.navigate('Queue')}>
                <Ionicons name="list" size={23} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.search}>
              <Ionicons name="search" size={20} color={colors.muted} />
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Songs, artists or albums"
                placeholderTextColor={colors.subtle}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {input.length > 0 && (
                <Pressable onPress={() => setInput('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={colors.muted} />
                </Pressable>
              )}
            </View>

            {!input && featured.length > 0 && (
              <>
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>Made for this moment</Text>
                  <Text style={styles.sectionHint}>Fresh picks</Text>
                </View>
                <FlatList
                  horizontal
                  data={featured}
                  keyExtractor={(item) => `featured-${item.id}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredList}
                  renderItem={({ item, index }) => (
                    <Pressable
                      onPress={() => play(item)}
                      style={[styles.featuredCard, { width: cardWidth }]}
                    >
                      <Artwork
                        uri={pickImage(item)}
                        style={[styles.featuredArtwork, { width: cardWidth, height: cardWidth }]}
                        radius={radius.lg}
                      />
                      <LinearGradient
                        colors={['transparent', '#000000E6']}
                        style={styles.featuredGradient}
                      />
                      <View style={styles.featuredCopy}>
                        <Text style={styles.featuredNumber}>0{index + 1}</Text>
                        <Text style={styles.featuredTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.featuredArtist} numberOfLines={1}>
                          {item.artist}
                        </Text>
                      </View>
                    </Pressable>
                  )}
                />
              </>
            )}

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>{input ? 'Search results' : 'Popular now'}</Text>
              <Text style={styles.sectionHint}>{songs.length} songs</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="musical-note-outline" size={42} color={colors.subtle} />
              <Text style={styles.emptyTitle}>{error ? 'Could not load music' : 'No songs found'}</Text>
              <Text style={styles.emptyCopy}>{error ?? 'Try a different artist or song name.'}</Text>
              {error && (
                <Pressable style={styles.retry} onPress={() => void load(query, 0)}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              )}
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={colors.accent} style={styles.footerLoader} /> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  heading: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: 4 },
  queueButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  search: {
    height: 52,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, paddingHorizontal: spacing.md },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  sectionHint: { color: colors.muted, fontSize: 12 },
  featuredList: { paddingHorizontal: spacing.lg, gap: spacing.md },
  featuredCard: {
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  featuredArtwork: { position: 'absolute' },
  featuredGradient: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  featuredCopy: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md },
  featuredNumber: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  featuredTitle: { color: colors.white, fontSize: 16, fontWeight: '800', marginTop: 3 },
  featuredArtist: { color: '#D7D7DB', fontSize: 11, marginTop: 3 },
  loader: { paddingVertical: 80 },
  footerLoader: { paddingVertical: spacing.xl },
  empty: { alignItems: 'center', paddingHorizontal: 42, paddingVertical: 70 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: spacing.lg },
  emptyCopy: { color: colors.muted, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  retry: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  retryText: { color: colors.white, fontWeight: '800' },
});

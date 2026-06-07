import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Artwork } from '../components/Artwork';
import { RootStackParamList } from '../navigation/types';
import { usePlayerStore } from '../store/playerStore';
import { createThemeStyles, darkColors, lightColors, radius, spacing } from '../theme';
import { Song } from '../types/music';
import { formatTime, pickImage } from '../utils/music';

export function FavoritesScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const favorites = usePlayerStore((state) => state.favorites);
  const queue = usePlayerStore((state) => state.queue);
  const recentlyPlayed = usePlayerStore((state) => state.recentlyPlayed);
  const playSong = usePlayerStore((state) => state.playSong);
  const toggleFavorite = usePlayerStore((state) => state.toggleFavorite);
  const theme = usePlayerStore((state) => state.theme);

  const favoriteSongs = favorites;
  const themeColors = theme === 'dark' ? darkColors : lightColors;

  const play = (song: Song) => {
    playSong(song, favoriteSongs);
    navigation.navigate('Player');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="heart" size={24} color={themeColors.accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.heading}>Favourites</Text>
          <Text style={styles.subtitle}>{favoriteSongs.length} songs</Text>
        </View>
      </View>

      {favoriteSongs.length > 0 && (
        <View style={styles.playAllRow}>
          <Pressable
            style={styles.playAllButton}
            onPress={() => favoriteSongs[0] && play(favoriteSongs[0])}
          >
            <Ionicons name="play" size={18} color={themeColors.white} style={{ marginLeft: 2 }} />
            <Text style={styles.playAllText}>Play All</Text>
          </Pressable>
          <Pressable
            style={styles.shuffleButton}
            onPress={() => {
              if (favoriteSongs.length === 0) return;
              const random = favoriteSongs[Math.floor(Math.random() * favoriteSongs.length)];
              if (random) play(random);
            }}
          >
            <Ionicons name="shuffle" size={18} color={themeColors.accent} />
            <Text style={styles.shuffleText}>Shuffle</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={favoriteSongs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => play(item)}>
            <Artwork uri={pickImage(item, '150x150')} style={styles.artwork} radius={radius.sm} />
            <View style={styles.copy}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
            </View>
            <Text style={styles.duration}>{formatTime(item.duration)}</Text>
            <Pressable
              hitSlop={10}
              onPress={() => toggleFavorite(item)}
              style={styles.heartButton}
            >
              <Ionicons name="heart" size={22} color={themeColors.accent} />
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="heart-outline" size={40} color={themeColors.accent} />
            </View>
            <Text style={styles.emptyTitle}>No favourites yet</Text>
            <Text style={styles.emptyCopy}>
              Tap the ♥ on any song to add it here. Your favourites persist between sessions.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = createThemeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${colors.accent}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  heading: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 3 },
  playAllRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  playAllButton: {
    flex: 1,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  playAllText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  shuffleButton: {
    flex: 1,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  shuffleText: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 160 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}80`,
  },
  artwork: { width: 52, height: 52 },
  copy: { flex: 1, paddingHorizontal: spacing.md },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
  artist: { color: colors.muted, fontSize: 12, marginTop: 3 },
  duration: { color: colors.subtle, fontSize: 12, marginRight: spacing.sm },
  heartButton: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${colors.accent}18`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptyCopy: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.md,
  },
}));

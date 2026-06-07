import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAudioControls } from '../audio/AudioProvider';
import { Artwork } from '../components/Artwork';
import { RootStackParamList } from '../navigation/types';
import { useLibraryStore } from '../store/libraryStore';
import { selectCurrentSong, usePlayerStore } from '../store/playerStore';
import { createThemeStyles, darkColors, lightColors, radius, spacing } from '../theme';
import { formatTime, pickImage } from '../utils/music';
import { downloadSong } from '../services/downloads';

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;

export function PlayerScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();

  const song = usePlayerStore(selectCurrentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isBuffering = usePlayerStore((s) => s.isBuffering);
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const favorites = usePlayerStore((s) => s.favorites);
  const downloaded = usePlayerStore((s) => s.downloaded);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const toggleFavorite = usePlayerStore((s) => s.toggleFavorite);
  const markDownloaded = usePlayerStore((s) => s.markDownloaded);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const theme = usePlayerStore((s) => s.theme);

  const playlists = useLibraryStore((s) => s.playlists);
  const addSongToPlaylist = useLibraryStore((s) => s.addSongToPlaylist);

  const { toggle, seek, skipNext, skipPrevious } = useAudioControls();

  const isFav = song ? favorites.some((s) => s.id === song.id) : false;
  const isDownloaded = song ? !!downloaded[song.id] : false;
  const themeColors = theme === 'dark' ? darkColors : lightColors;

  const gradientColors: [string, string, string] = theme === 'dark'
    ? ['#2A1810', '#14120F', themeColors.background]
    : ['#FBEFEA', '#F9F6F5', themeColors.background];

  // Menus
  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [slidingValue, setSlidingValue] = useState<number | null>(null);

  const handleSeekForward = () => void seek(Math.min(position + 10, duration));
  const handleSeekBackward = () => void seek(Math.max(position - 10, 0));

  const handleDownload = async () => {
    if (!song || isDownloaded || downloading) return;
    setDownloading(true);
    try {
      const uri = await downloadSong(song);
      markDownloaded(song, uri);
      Alert.alert('Downloaded', `"${song.title}" saved for offline listening.`);
    } catch (e) {
      Alert.alert('Download failed', e instanceof Error ? e.message : 'Could not download.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!song) return;
    setShowMenu(false);
    await Share.share({ message: `🎵 Listening to "${song.title}" by ${song.artist} on Mume` });
  };

  // Artwork: make it nearly full width, fill more vertical space
  const artworkSize = Math.min(width - 32, height * 0.40);

  if (!song) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable onPress={navigation.goBack} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color={themeColors.text} />
        </Pressable>
        <View style={styles.noSong}>
          <Ionicons name="headset-outline" size={58} color={themeColors.subtle} />
          <Text style={styles.noSongTitle}>Choose something to play</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safe}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.player}>
        {/* ── Top Bar ─────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Close player"
            onPress={navigation.goBack}
            style={styles.iconButton}
          >
            <Ionicons name="chevron-back" size={28} color={themeColors.text} />
          </Pressable>

          <View style={styles.topCenter}>
            <Text style={styles.nowPlayingLabel}>NOW PLAYING</Text>
            <Text style={styles.albumLabel} numberOfLines={1}>{song.album}</Text>
          </View>

          <Pressable
            accessibilityLabel="More options"
            onPress={() => setShowMenu(true)}
            style={styles.iconButton}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={themeColors.text} />
          </Pressable>
        </View>

        {/* ── Artwork ─────────────────────────────────────────── */}
        <View style={styles.artworkWrap}>
          <View style={[styles.artworkShadow, { width: artworkSize, height: artworkSize }]}>
            <Artwork
              uri={pickImage(song)}
              style={{ width: artworkSize, height: artworkSize }}
              radius={radius.xl}
            />
          </View>
        </View>

        {/* ── Details + Controls ──────────────────────────────── */}
        <View style={styles.controls}>
          {/* Title + Favourite */}
          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
              <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
            </View>
            <Pressable
              accessibilityLabel={isFav ? 'Remove from favourites' : 'Add to favourites'}
              onPress={() => toggleFavorite(song)}
              hitSlop={8}
            >
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={26}
                color={isFav ? themeColors.accent : themeColors.text}
              />
            </Pressable>
          </View>

          {/* Seek bar */}
          <Slider
            value={slidingValue !== null ? slidingValue : position}
            maximumValue={Math.max(duration, 1)}
            onValueChange={(value) => setSlidingValue(value)}
            onSlidingComplete={async (value) => {
              await seek(value);
              setSlidingValue(null);
            }}
            minimumTrackTintColor={themeColors.accent}
            maximumTrackTintColor={themeColors.surfaceElevated}
            thumbTintColor={themeColors.accent}
            style={styles.slider}
          />
          <View style={styles.timeRow}>
            <Text style={styles.time}>{formatTime(slidingValue !== null ? slidingValue : position)}</Text>
            <Text style={styles.time}>{formatTime(duration)}</Text>
          </View>

          {/* Main playback controls */}
          <View style={styles.mainControls}>
            {/* Previous */}
            <Pressable
              accessibilityLabel="Previous song"
              onPress={skipPrevious}
              style={styles.controlBtn}
            >
              <Ionicons name="play-skip-back" size={28} color={themeColors.text} />
            </Pressable>

            {/* Seek -10s */}
            <Pressable
              accessibilityLabel="Seek back 10 seconds"
              onPress={handleSeekBackward}
              style={styles.seekBtn}
            >
              <Ionicons name="reload" size={22} color={themeColors.text} />
              <Text style={styles.seekLabel}>10</Text>
            </Pressable>

            {/* Play/Pause */}
            <Pressable
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              onPress={toggle}
              style={styles.playButton}
            >
              <Ionicons
                name={isBuffering ? 'hourglass-outline' : isPlaying ? 'pause' : 'play'}
                size={36}
                color={themeColors.white}
                style={!isPlaying && !isBuffering && { marginLeft: 3 }}
              />
            </Pressable>

            {/* Seek +10s */}
            <Pressable
              accessibilityLabel="Seek forward 10 seconds"
              onPress={handleSeekForward}
              style={styles.seekBtn}
            >
              <Ionicons name="reload" size={22} color={themeColors.text} style={{ transform: [{ scaleX: -1 }] }} />
              <Text style={styles.seekLabel}>10</Text>
            </Pressable>

            {/* Next */}
            <Pressable
              accessibilityLabel="Next song"
              onPress={skipNext}
              style={styles.controlBtn}
            >
              <Ionicons name="play-skip-forward" size={28} color={themeColors.text} />
            </Pressable>
          </View>

          {/* Secondary controls row */}
          <View style={styles.secondaryControls}>
            <Pressable
              accessibilityLabel="Toggle shuffle"
              onPress={toggleShuffle}
              style={styles.secondaryBtn}
            >
              <Ionicons name="shuffle" size={22} color={shuffle ? themeColors.accent : themeColors.muted} />
            </Pressable>

            <Pressable
              accessibilityLabel="Open queue"
              onPress={() => navigation.navigate('Queue')}
              style={styles.secondaryBtn}
            >
              <Ionicons name="list" size={22} color={themeColors.muted} />
            </Pressable>

            <Pressable
              accessibilityLabel={`Repeat mode: ${repeatMode}`}
              onPress={cycleRepeat}
              style={styles.secondaryBtn}
            >
              <Ionicons
                name={repeatMode === 'one' ? 'repeat' : 'repeat-outline'}
                size={22}
                color={repeatMode === 'off' ? themeColors.muted : themeColors.accent}
              />
              {repeatMode === 'one' && <Text style={styles.repeatOne}>1</Text>}
            </Pressable>

            <Pressable
              accessibilityLabel="More options"
              onPress={() => setShowMenu(true)}
              style={styles.secondaryBtn}
            >
              <Ionicons name="ellipsis-vertical" size={22} color={themeColors.muted} />
            </Pressable>
          </View>

          {/* Status */}
          <Text style={styles.status}>
            {isBuffering
              ? 'Buffering…'
              : song.localUri
                ? '📁 Playing offline'
                : '✦ Streaming high quality audio'}
          </Text>
        </View>
      </SafeAreaView>

      {/* ── Options Menu Modal ─────────────────────────────── */}
      <Modal
        visible={showMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setShowMenu(false)}>
          <Pressable style={styles.menuSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.menuHandle} />

            {/* Song info */}
            <View style={styles.menuSongInfo}>
              <Artwork uri={pickImage(song, 150)} style={styles.menuArtwork} radius={10} />
              <View style={{ flex: 1 }}>
                <Text style={styles.menuSongTitle} numberOfLines={1}>{song.title}</Text>
                <Text style={styles.menuSongArtist} numberOfLines={1}>{song.artist}</Text>
              </View>
            </View>
            <View style={styles.menuDivider} />

            {[
              {
                icon: 'heart' as const,
                label: isFav ? 'Remove from Favourites' : 'Add to Favourites',
                accent: isFav,
                action: () => { toggleFavorite(song); setShowMenu(false); },
              },
              {
                icon: 'list-outline' as const,
                label: 'Add to Playlist',
                action: () => { setShowMenu(false); setTimeout(() => setShowPlaylistPicker(true), 200); },
              },
              {
                icon: 'play-skip-forward-outline' as const,
                label: 'Play Next',
                action: () => { addToQueue(song); setShowMenu(false); },
              },
              {
                icon: 'add-circle-outline' as const,
                label: 'Add to Queue',
                action: () => { addToQueue(song); setShowMenu(false); },
              },
              {
                icon: isDownloaded ? 'checkmark-circle' as const : 'arrow-down-circle-outline' as const,
                label: isDownloaded ? 'Already Downloaded' : downloading ? 'Downloading…' : 'Download Song',
                accent: isDownloaded,
                action: () => { void handleDownload(); setShowMenu(false); },
              },
              {
                icon: 'share-social-outline' as const,
                label: 'Share',
                action: handleShare,
              },
            ].map((item) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={item.action}
              >
                <View style={[styles.menuIconWrap, item.accent && styles.menuIconWrapAccent]}>
                  <Ionicons
                    name={item.icon}
                    size={19}
                    color={item.accent ? themeColors.accent : themeColors.muted}
                  />
                </View>
                <Text style={[styles.menuItemText, item.accent && styles.menuItemAccent]}>
                  {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={themeColors.subtle} />
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Playlist Picker Modal ────────────────────────────── */}
      <Modal
        visible={showPlaylistPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlaylistPicker(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setShowPlaylistPicker(false)}>
          <Pressable style={styles.menuSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.menuHandle} />
            <Text style={styles.pickerHeading}>Add to Playlist</Text>

            {playlists.length === 0 ? (
              <View style={styles.pickerEmpty}>
                <Ionicons name="list-outline" size={36} color={themeColors.subtle} />
                <Text style={styles.pickerEmptyText}>No playlists yet. Create one in the Playlists tab.</Text>
              </View>
            ) : (
              <FlatList
                data={playlists}
                keyExtractor={(p) => p.id}
                style={{ maxHeight: 340 }}
                renderItem={({ item }) => {
                  const alreadyAdded = item.songs.some((s) => s.id === song.id);
                  return (
                    <Pressable
                      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                      onPress={() => {
                        addSongToPlaylist(item.id, song);
                        setShowPlaylistPicker(false);
                        Alert.alert('Added ✓', `"${song.title}" added to "${item.name}"`);
                      }}
                    >
                      <View style={styles.menuIconWrap}>
                        <Ionicons name="musical-notes" size={18} color={themeColors.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.menuItemText}>{item.name}</Text>
                        <Text style={styles.pickerSubtext}>{item.songs.length} songs</Text>
                      </View>
                      {alreadyAdded && <Ionicons name="checkmark" size={18} color={themeColors.accent} />}
                    </Pressable>
                  );
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = createThemeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.background },
  player: { flex: 1 },

  // No song
  headerBtn: { marginTop: spacing.md, marginLeft: spacing.md, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  noSong: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noSongTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: spacing.lg },

  // Top bar
  topBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  topCenter: { flex: 1, alignItems: 'center' },
  nowPlayingLabel: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  albumLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },

  // Artwork
  artworkWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  artworkShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
    borderRadius: radius.xl,
  },

  // Controls section
  controls: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleCopy: { flex: 1, paddingRight: spacing.md },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  artist: { color: colors.muted, fontSize: 14, marginTop: 4 },

  slider: { marginHorizontal: -4, height: 36 },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
    marginBottom: spacing.lg,
  },
  time: { color: colors.muted, fontSize: 11, fontVariant: ['tabular-nums'] },

  // Main controls
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  controlBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  seekBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  seekLabel: {
    position: 'absolute',
    bottom: 6,
    color: colors.text,
    fontSize: 9,
    fontWeight: '800',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },

  // Secondary controls
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  secondaryBtn: {
    width: 48,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  repeatOne: {
    position: 'absolute',
    bottom: 5,
    color: colors.accent,
    fontSize: 8,
    fontWeight: '900',
  },

  status: { color: colors.subtle, fontSize: 10, textAlign: 'center' },

  // Options menu
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  menuSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    paddingBottom: 40,
    paddingHorizontal: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  menuHandle: {
    width: 38,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  menuSongInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  menuArtwork: { width: 48, height: 48 },
  menuSongTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  menuSongArtist: { color: colors.muted, fontSize: 12, marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  menuItemPressed: { backgroundColor: colors.surfaceElevated },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconWrapAccent: { backgroundColor: `${colors.accent}25` },
  menuItemText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  menuItemAccent: { color: colors.accent },

  // Playlist picker
  pickerHeading: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: spacing.md },
  pickerEmpty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  pickerEmptyText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  pickerSubtext: { color: colors.muted, fontSize: 12, marginTop: 2 },
}));

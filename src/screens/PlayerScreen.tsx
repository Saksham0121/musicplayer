import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAudioControls } from '../audio/AudioProvider';
import { Artwork } from '../components/Artwork';
import { RootStackParamList } from '../navigation/types';
import { selectCurrentSong, usePlayerStore } from '../store/playerStore';
import { colors, radius, spacing } from '../theme';
import { formatTime, pickImage } from '../utils/music';

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;

export function PlayerScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const song = usePlayerStore(selectCurrentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const position = usePlayerStore((state) => state.position);
  const duration = usePlayerStore((state) => state.duration);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const favorites = usePlayerStore((state) => state.favorites);
  const cycleRepeat = usePlayerStore((state) => state.cycleRepeat);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const toggleFavorite = usePlayerStore((state) => state.toggleFavorite);
  const { toggle, seek, skipNext, skipPrevious } = useAudioControls();

  const isFav = song ? favorites.includes(song.id) : false;

  if (!song) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable onPress={navigation.goBack} style={styles.back}>
          <Ionicons name="chevron-down" size={28} color={colors.text} />
        </Pressable>
        <View style={styles.noSong}>
          <Ionicons name="headset-outline" size={58} color={colors.subtle} />
          <Text style={styles.noSongTitle}>Choose something to play</Text>
        </View>
      </SafeAreaView>
    );
  }

  const artworkSize = Math.min(width - 48, height * 0.32, 430);

  return (
    <View style={styles.safe}>
      <LinearGradient colors={['#3B2218', colors.background, colors.background]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.player}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Close player" onPress={navigation.goBack} style={styles.iconButton}>
            <Ionicons name="chevron-down" size={28} color={colors.text} />
          </Pressable>
          <View style={styles.topCopy}>
            <Text style={styles.nowPlaying}>NOW PLAYING</Text>
            <Text style={styles.album} numberOfLines={1}>
              {song.album}
            </Text>
          </View>
          <Pressable accessibilityLabel="Open queue" onPress={() => navigation.navigate('Queue')} style={styles.iconButton}>
            <Ionicons name="list" size={25} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.artworkWrap}>
          <Artwork
            uri={pickImage(song)}
            style={{ width: artworkSize, height: artworkSize }}
            radius={radius.xl}
          />
        </View>

        <View style={styles.details}>
          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <Text style={styles.title} numberOfLines={1}>
                {song.title}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {song.artist}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={isFav ? 'Remove from favourites' : 'Add to favourites'}
              onPress={() => song && toggleFavorite(song.id)}
              hitSlop={8}
            >
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={26}
                color={isFav ? colors.accent : colors.text}
              />
            </Pressable>
          </View>

          <Slider
            value={position}
            maximumValue={Math.max(duration, 1)}
            onSlidingComplete={(value) => void seek(value)}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.surfaceElevated}
            thumbTintColor={colors.accent}
            style={styles.slider}
          />
          <View style={styles.timeRow}>
            <Text style={styles.time}>{formatTime(position)}</Text>
            <Text style={styles.time}>{formatTime(duration)}</Text>
          </View>

          <View style={styles.controls}>
            <Pressable accessibilityLabel="Toggle shuffle" onPress={toggleShuffle} style={styles.smallControl}>
              <Ionicons name="shuffle" size={22} color={shuffle ? colors.accent : colors.muted} />
            </Pressable>
            <Pressable accessibilityLabel="Previous song" onPress={skipPrevious} style={styles.controlButton}>
              <Ionicons name="play-skip-back" size={30} color={colors.text} />
            </Pressable>
            <Pressable accessibilityLabel={isPlaying ? 'Pause' : 'Play'} onPress={toggle} style={styles.playButton}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={35}
                color={colors.white}
                style={!isPlaying && { marginLeft: 3 }}
              />
            </Pressable>
            <Pressable accessibilityLabel="Next song" onPress={skipNext} style={styles.controlButton}>
              <Ionicons name="play-skip-forward" size={30} color={colors.text} />
            </Pressable>
            <Pressable accessibilityLabel={`Repeat mode ${repeatMode}`} onPress={cycleRepeat} style={styles.smallControl}>
              <Ionicons
                name={repeatMode === 'one' ? 'repeat' : 'repeat-outline'}
                size={23}
                color={repeatMode === 'off' ? colors.muted : colors.accent}
              />
              {repeatMode === 'one' && <Text style={styles.repeatOne}>1</Text>}
            </Pressable>
          </View>
          <Text style={styles.status}>
            {isBuffering ? 'Buffering high quality audio...' : song.localUri ? 'Playing offline' : 'Streaming high quality audio'}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  player: { flex: 1 },
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  topCopy: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
  nowPlaying: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  album: { color: colors.muted, fontSize: 12, marginTop: 3 },
  artworkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  details: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  titleCopy: { flex: 1, paddingRight: spacing.lg },
  title: { color: colors.text, fontSize: 25, fontWeight: '800' },
  artist: { color: colors.muted, fontSize: 15, marginTop: 6 },
  slider: { marginHorizontal: -4, height: 38 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -7 },
  time: { color: colors.muted, fontSize: 11, fontVariant: ['tabular-nums'] },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  smallControl: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  controlButton: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 10,
  },
  repeatOne: { position: 'absolute', color: colors.accent, fontSize: 8, fontWeight: '900' },
  status: { color: colors.subtle, fontSize: 10, textAlign: 'center', marginTop: spacing.lg },
  back: { marginTop: spacing.sm, marginLeft: spacing.md, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  noSong: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noSongTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: spacing.lg },
});

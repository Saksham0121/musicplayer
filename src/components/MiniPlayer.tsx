import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { NavigationProp } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAudioControls } from '../audio/AudioProvider';
import { RootStackParamList } from '../navigation/types';
import { selectCurrentSong, usePlayerStore } from '../store/playerStore';
import { colors, radius, spacing } from '../theme';
import { pickImage } from '../utils/music';
import { Artwork } from './Artwork';

type Props = {
  navigation: NavigationProp<RootStackParamList>;
};

export function MiniPlayer({ navigation }: Props) {
  const song = usePlayerStore(selectCurrentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const position = usePlayerStore((state) => state.position);
  const duration = usePlayerStore((state) => state.duration);
  const { toggle, skipNext } = useAudioControls();

  if (!song) return null;

  return (
    <View style={styles.wrap}>
      <Slider
        value={position}
        maximumValue={Math.max(duration, 1)}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.border}
        thumbTintColor="transparent"
        disabled
        style={styles.progress}
      />
      <Pressable style={styles.content} onPress={() => navigation.navigate('Player')}>
        <Artwork uri={pickImage(song, '150x150')} style={styles.artwork} radius={10} />
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>
            {song.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {song.artist}
          </Text>
        </View>
        <Pressable accessibilityLabel={isPlaying ? 'Pause' : 'Play'} onPress={toggle} hitSlop={8} style={styles.control}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color={colors.text} />
        </Pressable>
        <Pressable accessibilityLabel="Next song" onPress={skipNext} hitSlop={8} style={styles.control}>
          <Ionicons name="play-skip-forward" size={22} color={colors.text} />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: '#242429F5',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#383840',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  progress: { position: 'absolute', top: -8, left: -6, right: -6, height: 18 },
  content: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: 3,
  },
  artwork: { width: 52, height: 52 },
  copy: { flex: 1, paddingHorizontal: spacing.md },
  title: { color: colors.text, fontWeight: '700', fontSize: 14 },
  artist: { color: colors.muted, fontSize: 12, marginTop: 4 },
  control: { width: 42, height: 48, alignItems: 'center', justifyContent: 'center' },
});

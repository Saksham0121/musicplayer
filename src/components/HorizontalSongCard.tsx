import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Artwork } from './Artwork';
import { colors, radius, spacing } from '../theme';
import { Song } from '../types/music';
import { formatTime, pickImage } from '../utils/music';

type Props = {
  song: Song;
  onPress: () => void;
  width?: number;
};

export function HorizontalSongCard({ song, onPress, width = 140 }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { width }]}
      accessibilityLabel={`Play ${song.title}`}
    >
      <View style={[styles.artworkWrap, { width, height: width }]}>
        <Artwork uri={pickImage(song)} style={{ width, height: width }} radius={radius.md} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 0.5, y: 1 }}
        />
        <View style={styles.duration}>
          <Text style={styles.durationText}>{formatTime(song.duration)}</Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
      <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginRight: spacing.md,
  },
  artworkWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  duration: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  artist: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
});

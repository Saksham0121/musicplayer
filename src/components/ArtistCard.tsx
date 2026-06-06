import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Artwork } from './Artwork';
import { colors, spacing } from '../theme';
import { Artist } from '../types/music';

type Props = {
  artist: Artist;
  onPress?: () => void;
  size?: number;
};

export function ArtistCard({ artist, onPress, size = 90 }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { width: size + 16 }]}
      accessibilityLabel={artist.name}
    >
      <View style={[styles.avatarWrap, { width: size, height: size, borderRadius: size / 2 }]}>
        <Artwork
          uri={artist.image}
          style={{ width: size, height: size }}
          radius={size / 2}
          fallbackIcon="person"
        />
      </View>
      <Text style={styles.name} numberOfLines={2}>{artist.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarWrap: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});

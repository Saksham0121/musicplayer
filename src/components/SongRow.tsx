import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { downloadSong } from '../services/downloads';
import { usePlayerStore } from '../store/playerStore';
import { colors, radius, spacing } from '../theme';
import { Song } from '../types/music';
import { formatTime, pickImage } from '../utils/music';
import { Artwork } from './Artwork';

type Props = {
  song: Song;
  onPress: () => void;
  showQueueAction?: boolean;
};

export function SongRow({ song, onPress, showQueueAction = true }: Props) {
  const addToQueue = usePlayerStore((state) => state.addToQueue);
  const markDownloaded = usePlayerStore((state) => state.markDownloaded);
  const localUri = usePlayerStore((state) => state.downloaded[song.id]);
  const [downloading, setDownloading] = useState(false);
  const effectiveSong = localUri ? { ...song, localUri } : song;

  const handleDownload = async () => {
    if (effectiveSong.localUri || downloading) return;
    setDownloading(true);
    try {
      const uri = await downloadSong(effectiveSong);
      markDownloaded(song.id, uri);
    } catch (reason) {
      Alert.alert(
        'Download unavailable',
        reason instanceof Error ? reason.message : 'Could not download this song.',
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Artwork uri={pickImage(song, '150x150')} style={styles.artwork} radius={12} />
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {song.artist}  ·  {formatTime(song.duration)}
        </Text>
      </View>
      <Pressable
        accessibilityLabel={effectiveSong.localUri ? 'Downloaded' : 'Download song'}
        hitSlop={8}
        onPress={(event) => {
          event.stopPropagation();
          void handleDownload();
        }}
        style={styles.iconButton}
      >
        {downloading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Ionicons
            name={effectiveSong.localUri ? 'checkmark-circle' : 'arrow-down-circle-outline'}
            size={22}
            color={effectiveSong.localUri ? colors.success : colors.muted}
          />
        )}
      </Pressable>
      {showQueueAction && (
        <Pressable
          accessibilityLabel="Add to queue"
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            addToQueue(song);
          }}
          style={styles.iconButton}
        >
          <Ionicons name="add-circle-outline" size={23} color={colors.muted} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  pressed: { backgroundColor: colors.surface },
  artwork: { width: 54, height: 54 },
  copy: { flex: 1, paddingHorizontal: spacing.md },
  title: { color: colors.text, fontSize: 15, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 5 },
  iconButton: {
    width: 34,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

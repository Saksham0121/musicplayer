import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { downloadSong } from '../services/downloads';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { colors, createThemeStyles, radius, spacing } from '../theme';
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
  const toggleFavorite = usePlayerStore((state) => state.toggleFavorite);
  const favorites = usePlayerStore((state) => state.favorites);
  const playlists = useLibraryStore((state) => state.playlists);
  const addSongToPlaylist = useLibraryStore((state) => state.addSongToPlaylist);

  const [downloading, setDownloading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);

  const effectiveSong = localUri ? { ...song, localUri } : song;
  const isFav = favorites.some((s) => s.id === song.id);

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
    <>
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

        {/* Download */}
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

        {/* Options menu */}
        <Pressable
          accessibilityLabel="More options"
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            setShowMenu(true);
          }}
          style={styles.iconButton}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.muted} />
        </Pressable>
      </Pressable>

      {/* ── Options Menu Modal ────────────────────────────────────────── */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setShowMenu(false)}>
          <Pressable style={styles.menuSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.menuHandle} />
            {/* Song info */}
            <View style={styles.menuSongInfo}>
              <Artwork uri={pickImage(song, '150x150')} style={styles.menuArtwork} radius={8} />
              <View style={styles.menuSongText}>
                <Text style={styles.menuSongTitle} numberOfLines={1}>{song.title}</Text>
                <Text style={styles.menuSongArtist} numberOfLines={1}>{song.artist}</Text>
              </View>
            </View>
            <View style={styles.menuDivider} />

            {/* Actions */}
            {[
              {
                icon: 'play-skip-forward-outline' as const,
                label: 'Play Next',
                onPress: () => { addToQueue(song); setShowMenu(false); },
              },
              {
                icon: 'add-circle-outline' as const,
                label: 'Add to Queue',
                onPress: () => { addToQueue(song); setShowMenu(false); },
              },
              {
                icon: isFav ? 'heart' as const : 'heart-outline' as const,
                label: isFav ? 'Remove from Favourites' : 'Add to Favourites',
                accent: isFav,
                onPress: () => { toggleFavorite(song); setShowMenu(false); },
              },
              {
                icon: 'list-outline' as const,
                label: 'Add to Playlist',
                onPress: () => { setShowMenu(false); setTimeout(() => setShowPlaylistPicker(true), 200); },
              },
              {
                icon: effectiveSong.localUri ? 'checkmark-circle' as const : 'arrow-down-circle-outline' as const,
                label: effectiveSong.localUri ? 'Downloaded' : 'Download',
                accent: !!effectiveSong.localUri,
                onPress: () => { void handleDownload(); setShowMenu(false); },
              },
            ].map((action) => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={action.onPress}
              >
                <Ionicons
                  name={action.icon}
                  size={20}
                  color={action.accent ? colors.accent : colors.muted}
                />
                <Text style={[styles.menuItemText, action.accent && styles.menuItemAccent]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Playlist Picker Modal ─────────────────────────────────────── */}
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
                <Ionicons name="list-outline" size={32} color={colors.subtle} />
                <Text style={styles.pickerEmptyText}>No playlists yet. Create one first!</Text>
              </View>
            ) : (
              <FlatList
                data={playlists}
                keyExtractor={(p) => p.id}
                style={{ maxHeight: 320 }}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                    onPress={() => {
                      addSongToPlaylist(item.id, song);
                      setShowPlaylistPicker(false);
                      Alert.alert('Added', `"${song.title}" added to "${item.name}"`);
                    }}
                  >
                    <View style={styles.pickerPlaylistIcon}>
                      <Ionicons name="musical-notes" size={16} color={colors.accent} />
                    </View>
                    <View style={styles.pickerPlaylistInfo}>
                      <Text style={styles.menuItemText}>{item.name}</Text>
                      <Text style={styles.pickerPlaylistCount}>{item.songs.length} songs</Text>
                    </View>
                    {item.songs.some((s) => s.id === song.id) && (
                      <Ionicons name="checkmark" size={18} color={colors.accent} />
                    )}
                  </Pressable>
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = createThemeStyles((themeColors) => ({
  row: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  pressed: { backgroundColor: themeColors.surface },
  artwork: { width: 54, height: 54 },
  copy: { flex: 1, paddingHorizontal: spacing.md },
  title: { color: themeColors.text, fontSize: 15, fontWeight: '700' },
  meta: { color: themeColors.muted, fontSize: 12, marginTop: 5 },
  iconButton: {
    width: 34,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Menu modal
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    paddingBottom: 36,
    paddingHorizontal: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
  },
  menuHandle: {
    width: 38,
    height: 4,
    backgroundColor: themeColors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  menuSongInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  menuArtwork: { width: 46, height: 46 },
  menuSongText: { flex: 1 },
  menuSongTitle: { color: themeColors.text, fontSize: 15, fontWeight: '700' },
  menuSongArtist: { color: themeColors.muted, fontSize: 12, marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: themeColors.border, marginBottom: spacing.md },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  menuItemPressed: { backgroundColor: themeColors.surfaceElevated },
  menuItemText: { flex: 1, color: themeColors.text, fontSize: 15, fontWeight: '600' },
  menuItemAccent: { color: themeColors.accent },
  pickerHeading: {
    color: themeColors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  pickerEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  pickerEmptyText: { color: themeColors.muted, fontSize: 14, textAlign: 'center' },
  pickerPlaylistIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${themeColors.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerPlaylistInfo: { flex: 1 },
  pickerPlaylistCount: { color: themeColors.muted, fontSize: 12, marginTop: 2 },
}));

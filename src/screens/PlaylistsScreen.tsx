import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Artwork } from '../components/Artwork';
import { SongRow } from '../components/SongRow';
import { RootStackParamList } from '../navigation/types';
import { Playlist, useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { createThemeStyles, darkColors, lightColors, radius, spacing } from '../theme';
import { Song } from '../types/music';
import { pickImage } from '../utils/music';

type View_ = 'list' | 'detail';

export function PlaylistsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const playlists = useLibraryStore((s) => s.playlists);
  const createPlaylist = useLibraryStore((s) => s.createPlaylist);
  const deletePlaylist = useLibraryStore((s) => s.deletePlaylist);
  const renamePlaylist = useLibraryStore((s) => s.renamePlaylist);
  const removeSongFromPlaylist = useLibraryStore((s) => s.removeSongFromPlaylist);
  const playSong = usePlayerStore((s) => s.playSong);
  const theme = usePlayerStore((s) => s.theme);
  const themeColors = theme === 'dark' ? darkColors : lightColors;

  const [view, setView] = useState<View_>('list');
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Rename modal
  const [showRename, setShowRename] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [renameTarget, setRenameTarget] = useState<Playlist | null>(null);

  const openDetail = (playlist: Playlist) => {
    setActivePlaylist(playlist);
    setView('detail');
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    createPlaylist(name);
    setNewName('');
    setShowCreate(false);
  };

  const handleDelete = (playlist: Playlist) => {
    Alert.alert(
      `Delete "${playlist.name}"?`,
      'This will permanently delete the playlist.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (view === 'detail' && activePlaylist?.id === playlist.id) {
              setView('list');
              setActivePlaylist(null);
            }
            deletePlaylist(playlist.id);
          },
        },
      ],
    );
  };

  const handleRenameOpen = (playlist: Playlist) => {
    setRenameTarget(playlist);
    setRenameName(playlist.name);
    setShowRename(true);
  };

  const handleRenameConfirm = () => {
    const name = renameName.trim();
    if (!name || !renameTarget) return;
    renamePlaylist(renameTarget.id, name);
    if (activePlaylist?.id === renameTarget.id) {
      setActivePlaylist((prev) => prev ? { ...prev, name } : prev);
    }
    setShowRename(false);
    setRenameTarget(null);
  };

  const play = (song: Song, songs: Song[]) => {
    playSong(song, songs);
    navigation.navigate('Player');
  };

  // Sync active playlist from store (songs may have been added)
  const livePlaylist = activePlaylist
    ? playlists.find((p) => p.id === activePlaylist.id) ?? activePlaylist
    : null;

  // ── Playlist list view ────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.heading}>Playlists</Text>
            <Text style={styles.subtitle}>{playlists.length} playlists</Text>
          </View>
          <Pressable
            style={styles.createBtn}
            onPress={() => {
              setShowCreate(true);
              setTimeout(() => inputRef.current?.focus(), 150);
            }}
            accessibilityLabel="Create playlist"
          >
            <Ionicons name="add" size={22} color={themeColors.white} />
          </Pressable>
        </View>

        <FlatList
          style={styles.flex}
          data={playlists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <PlaylistCard
              playlist={item}
              onPress={() => openDetail(item)}
              onRename={() => handleRenameOpen(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="list" size={36} color={themeColors.accent} />
              </View>
              <Text style={styles.emptyTitle}>No playlists yet</Text>
              <Text style={styles.emptyCopy}>
                Tap the + button to create your first playlist. Then add songs using the ⋮ menu on any song.
              </Text>
              <Pressable
                style={styles.createEmptyBtn}
                onPress={() => {
                  setShowCreate(true);
                  setTimeout(() => inputRef.current?.focus(), 150);
                }}
              >
                <Ionicons name="add" size={18} color={themeColors.white} />
                <Text style={styles.createEmptyText}>Create Playlist</Text>
              </Pressable>
            </View>
          }
        />

        {/* Create Playlist Modal */}
        <CreateModal
          visible={showCreate}
          value={newName}
          inputRef={inputRef}
          onChange={setNewName}
          onConfirm={handleCreate}
          onClose={() => { setShowCreate(false); setNewName(''); }}
        />
      </SafeAreaView>
    );
  }

  // ── Playlist detail view ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Detail header */}
      <View style={styles.detailHeader}>
        <Pressable
          style={styles.backBtn}
          onPress={() => { setView('list'); setActivePlaylist(null); }}
          accessibilityLabel="Back to playlists"
        >
          <Ionicons name="chevron-back" size={26} color={themeColors.text} />
        </Pressable>
        <Text style={styles.detailTitle} numberOfLines={1}>{livePlaylist?.name ?? ''}</Text>
        <Pressable
          style={styles.backBtn}
          onPress={() => livePlaylist && handleRenameOpen(livePlaylist)}
          accessibilityLabel="Rename playlist"
        >
          <Ionicons name="pencil-outline" size={20} color={themeColors.muted} />
        </Pressable>
      </View>

      {/* Playlist artwork collage + stats */}
      {livePlaylist && (
        <View style={styles.detailMeta}>
          <PlaylistArtwork songs={livePlaylist.songs} size={110} />
          <View style={styles.detailMetaText}>
            <Text style={styles.detailName}>{livePlaylist.name}</Text>
            <Text style={styles.detailCount}>{livePlaylist.songs.length} songs</Text>
            {livePlaylist.songs.length > 0 && (
              <View style={styles.detailActions}>
                <Pressable
                  style={styles.playAllBtn}
                  onPress={() => livePlaylist.songs[0] && play(livePlaylist.songs[0], livePlaylist.songs)}
                >
                  <Ionicons name="play" size={16} color={themeColors.white} style={{ marginLeft: 2 }} />
                  <Text style={styles.playAllText}>Play</Text>
                </Pressable>
                <Pressable
                  style={styles.shuffleBtn}
                  onPress={() => {
                    const songs = livePlaylist.songs;
                    if (!songs.length) return;
                    const random = songs[Math.floor(Math.random() * songs.length)];
                    if (random) play(random, songs);
                  }}
                >
                  <Ionicons name="shuffle" size={16} color={themeColors.accent} />
                  <Text style={styles.shuffleText}>Shuffle</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      )}

      <FlatList
        style={styles.flex}
        data={livePlaylist?.songs ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.detailList}
        renderItem={({ item }) => (
          <View style={styles.detailRow}>
            <SongRow
              song={item}
              onPress={() => livePlaylist && play(item, livePlaylist.songs)}
              showQueueAction={false}
            />
            <Pressable
              style={styles.removeBtn}
              hitSlop={8}
              onPress={() => livePlaylist && removeSongFromPlaylist(livePlaylist.id, item.id)}
              accessibilityLabel="Remove from playlist"
            >
              <Ionicons name="close-circle-outline" size={22} color={themeColors.muted} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="musical-note-outline" size={40} color={themeColors.subtle} />
            <Text style={styles.emptyTitle}>No songs yet</Text>
            <Text style={styles.emptyCopy}>Use the ⋮ menu on any song to add it here.</Text>
          </View>
        }
      />

      {/* Rename Modal */}
      <CreateModal
        visible={showRename}
        value={renameName}
        inputRef={inputRef}
        onChange={setRenameName}
        onConfirm={handleRenameConfirm}
        onClose={() => { setShowRename(false); setRenameTarget(null); }}
        title="Rename Playlist"
        confirmLabel="Rename"
      />
    </SafeAreaView>
  );
}

// ─── PlaylistCard ─────────────────────────────────────────────────────────────
function PlaylistCard({
  playlist,
  onPress,
  onRename,
  onDelete,
}: {
  playlist: Playlist;
  onPress: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const theme = usePlayerStore((s) => s.theme);
  const themeColors = theme === 'dark' ? darkColors : lightColors;

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={onPress}
      >
        <PlaylistArtwork songs={playlist.songs} size={62} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{playlist.name}</Text>
          <Text style={styles.cardCount}>{playlist.songs.length} songs</Text>
        </View>
        <Pressable
          hitSlop={8}
          style={styles.cardMenu}
          onPress={(e) => { e.stopPropagation(); setShowMenu(true); }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={themeColors.muted} />
        </Pressable>
      </Pressable>

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
            <Text style={styles.menuTitle}>{playlist.name}</Text>
            {[
              { icon: 'pencil-outline' as const, label: 'Rename', onPress: () => { setShowMenu(false); setTimeout(onRename, 200); } },
              { icon: 'trash-outline' as const, label: 'Delete', danger: true, onPress: () => { setShowMenu(false); setTimeout(onDelete, 200); } },
            ].map((item) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={item.onPress}
              >
                <Ionicons name={item.icon} size={20} color={item.danger ? themeColors.danger : themeColors.muted} />
                <Text style={[styles.menuItemText, item.danger && styles.menuItemDanger]}>{item.label}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ─── PlaylistArtwork ─────────────────────────────────────────────────────────
function PlaylistArtwork({ songs, size }: { songs: Song[]; size: number }) {
  const images = songs.slice(0, 4).map((s) => pickImage(s, '150x150'));
  const half = size / 2;
  const theme = usePlayerStore((s) => s.theme);
  const themeColors = theme === 'dark' ? darkColors : lightColors;

  if (images.length === 0) {
    return (
      <View style={[styles.artworkWrap, { width: size, height: size, borderRadius: radius.md }]}>
        <Ionicons name="musical-notes" size={size * 0.4} color={themeColors.muted} />
      </View>
    );
  }

  if (images.length < 4) {
    return (
      <Artwork
        uri={images[0]}
        style={{ width: size, height: size }}
        radius={radius.md}
      />
    );
  }

  // 2x2 collage
  return (
    <View style={{ width: size, height: size, borderRadius: radius.md, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row' }}>
        <Artwork uri={images[0]} style={{ width: half, height: half }} radius={0} />
        <Artwork uri={images[1]} style={{ width: half, height: half }} radius={0} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <Artwork uri={images[2]} style={{ width: half, height: half }} radius={0} />
        <Artwork uri={images[3]} style={{ width: half, height: half }} radius={0} />
      </View>
    </View>
  );
}

// ─── CreateModal ─────────────────────────────────────────────────────────────
function CreateModal({
  visible,
  value,
  inputRef,
  onChange,
  onConfirm,
  onClose,
  title = 'New Playlist',
  confirmLabel = 'Create',
}: {
  visible: boolean;
  value: string;
  inputRef: React.RefObject<TextInput | null>;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  title?: string;
  confirmLabel?: string;
}) {
  const theme = usePlayerStore((s) => s.theme);
  const themeColors = theme === 'dark' ? darkColors : lightColors;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChange}
            placeholder="Playlist name"
            placeholderTextColor={themeColors.subtle}
            style={styles.modalInput}
            maxLength={60}
            returnKeyType="done"
            onSubmitEditing={onConfirm}
            autoFocus
          />
          <View style={styles.modalActions}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, !value.trim() && styles.confirmBtnDisabled]}
              onPress={onConfirm}
              disabled={!value.trim()}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = createThemeStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  // List header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  heading: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 3 },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 160, gap: 4 },

  // Playlist card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  cardPressed: { backgroundColor: colors.surface },
  artworkWrap: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  cardCount: { color: colors.muted, fontSize: 12, marginTop: 3 },
  cardMenu: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // Detail view
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    height: 60,
  },
  backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  detailTitle: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}60`,
  },
  detailMetaText: { flex: 1 },
  detailName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  detailCount: { color: colors.muted, fontSize: 13, marginTop: 4 },
  detailActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
  },
  playAllText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shuffleText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  detailList: { paddingBottom: 160 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  removeBtn: { paddingHorizontal: spacing.md, height: 74, alignItems: 'center', justifyContent: 'center' },

  // Empty state
  emptyWrap: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
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
  createEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  createEmptyText: { color: colors.white, fontWeight: '800', fontSize: 14 },

  // Menus
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  menuSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    paddingBottom: 36,
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
  menuTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: spacing.md },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  menuItemPressed: { backgroundColor: colors.surfaceElevated },
  menuItemText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  menuItemDanger: { color: colors.danger },

  // Create / Rename modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalInput: {
    height: 50,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  modalActions: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: { color: colors.muted, fontWeight: '700' },
  confirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmText: { color: colors.white, fontWeight: '800' },
}));

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Artwork } from '../components/Artwork';
import { RootStackParamList } from '../navigation/types';
import { selectCurrentSong, usePlayerStore } from '../store/playerStore';
import { colors, createThemeStyles, darkColors, radius, spacing } from '../theme';
import { pickImage } from '../utils/music';

type Props = NativeStackScreenProps<RootStackParamList, 'Queue'>;

export function QueueScreen({ navigation }: Props) {
  const queue = usePlayerStore((state) => state.queue);
  const currentSong = usePlayerStore(selectCurrentSong);
  const theme = usePlayerStore((state) => state.theme);
  const playSong = usePlayerStore((state) => state.playSong);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const moveQueueItem = usePlayerStore((state) => state.moveQueueItem);
  const clearQueue = usePlayerStore((state) => state.clearQueue);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Go back" onPress={navigation.goBack} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.heading}>Up next</Text>
          <Text style={styles.subtitle}>{queue.length} songs in your queue</Text>
        </View>
        <Pressable accessibilityLabel="Clear queue" onPress={clearQueue} style={styles.headerButton} disabled={!queue.length}>
          <Ionicons name="trash-outline" size={22} color={queue.length ? colors.danger : colors.subtle} />
        </Pressable>
      </View>

      <FlatList
        data={queue}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={[styles.list, !queue.length && styles.emptyList]}
        renderItem={({ item, index }) => {
          const active = item.id === currentSong?.id;
          return (
            <Pressable
              onPress={() => {
                playSong(item, queue);
                navigation.navigate('Player');
              }}
              style={[styles.row, active && styles.activeRow]}
            >
              <View style={styles.grab}>
                <Pressable accessibilityLabel="Move song up" disabled={index === 0} onPress={() => moveQueueItem(index, index - 1)} hitSlop={6}>
                  <Ionicons name="chevron-up" size={18} color={index === 0 ? colors.subtle : colors.muted} />
                </Pressable>
                <Pressable accessibilityLabel="Move song down" disabled={index === queue.length - 1} onPress={() => moveQueueItem(index, index + 1)} hitSlop={6}>
                  <Ionicons name="chevron-down" size={18} color={index === queue.length - 1 ? colors.subtle : colors.muted} />
                </Pressable>
              </View>
              <Artwork uri={pickImage(item, '150x150')} style={styles.artwork} radius={11} />
              <View style={styles.copy}>
                <Text style={[styles.title, active && styles.activeText]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.artist} numberOfLines={1}>
                  {item.artist}
                </Text>
              </View>
              {active && <Ionicons name="volume-high" size={19} color={colors.accent} />}
              <Pressable
                accessibilityLabel="Remove from queue"
                onPress={(event) => {
                  event.stopPropagation();
                  removeFromQueue(index);
                }}
                hitSlop={8}
                style={styles.remove}
              >
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="list" size={38} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>Your queue is empty</Text>
            <Text style={styles.emptyCopy}>Add songs from Home and they will stay here between app launches.</Text>
            <Pressable style={styles.explore} onPress={() => navigation.navigate('MainTabs')}>
              <Text style={styles.exploreText}>Explore music</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = createThemeStyles((themeColors) => ({
  safe: { flex: 1, backgroundColor: themeColors.background },
  header: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  headerButton: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, alignItems: 'center' },
  heading: { color: themeColors.text, fontSize: 20, fontWeight: '800' },
  subtitle: { color: themeColors.muted, fontSize: 11, marginTop: 3 },
  list: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 112 },
  emptyList: { flexGrow: 1 },
  row: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    marginBottom: 3,
  },
  activeRow: { backgroundColor: themeColors.accentSoft },
  grab: { width: 28, alignItems: 'center', justifyContent: 'center', gap: 2 },
  artwork: { width: 52, height: 52 },
  copy: { flex: 1, paddingHorizontal: spacing.md },
  title: { color: themeColors.text, fontSize: 14, fontWeight: '700' },
  activeText: { color: themeColors.accent },
  artist: { color: themeColors.muted, fontSize: 12, marginTop: 4 },
  remove: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 42, paddingBottom: 80 },
  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: themeColors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { color: themeColors.text, fontSize: 20, fontWeight: '800', marginTop: spacing.xl },
  emptyCopy: { color: themeColors.muted, textAlign: 'center', lineHeight: 20, marginTop: spacing.sm },
  explore: { marginTop: spacing.xl, backgroundColor: themeColors.accent, borderRadius: radius.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  exploreText: { color: themeColors.white, fontWeight: '800' },
}));

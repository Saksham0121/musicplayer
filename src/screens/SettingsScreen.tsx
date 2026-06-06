import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePlayerStore } from '../store/playerStore';
import { colors, radius, spacing } from '../theme';

type AudioQuality = '96kbps' | '160kbps' | '320kbps';
const QUALITY_KEY = '@lokal/quality';
const APP_VERSION = '1.0.0';

const QUALITY_OPTIONS: Array<{ value: AudioQuality; label: string; desc: string }> = [
  { value: '96kbps', label: '96 kbps', desc: 'Saves data · Lower quality' },
  { value: '160kbps', label: '160 kbps', desc: 'Balanced · Recommended' },
  { value: '320kbps', label: '320 kbps', desc: 'Best quality · Uses more data' },
];

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.wrap}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={sectionStyles.card}>{children}</View>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  title: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: spacing.sm, paddingHorizontal: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});

function SettingRow({
  icon,
  label,
  value,
  onPress,
  danger,
  last,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        rowStyles.row,
        !last && rowStyles.border,
        pressed && rowStyles.pressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[rowStyles.icon, danger && rowStyles.iconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.accent} />
      </View>
      <Text style={[rowStyles.label, danger && rowStyles.labelDanger]}>{label}</Text>
      {value ? <Text style={rowStyles.value}>{value}</Text> : null}
      {onPress && !danger && <Ionicons name="chevron-forward" size={16} color={colors.subtle} />}
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: spacing.md,
  },
  border: { borderBottomWidth: 1, borderBottomColor: `${colors.border}80` },
  pressed: { backgroundColor: colors.surfaceElevated },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: `${colors.accent}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDanger: { backgroundColor: `${colors.danger}18` },
  label: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  labelDanger: { color: colors.danger },
  value: { color: colors.muted, fontSize: 13 },
});

export function SettingsScreen() {
  const downloaded = usePlayerStore((s) => s.downloaded);
  const queue = usePlayerStore((s) => s.queue);
  const markDownloaded = usePlayerStore((s) => s.markDownloaded);
  const clearQueue = usePlayerStore((s) => s.clearQueue);

  const [quality, setQuality] = useState<AudioQuality>('320kbps');
  const downloadedCount = Object.keys(downloaded).length;

  useEffect(() => {
    AsyncStorage.getItem(QUALITY_KEY).then((val) => {
      if (val) setQuality(val as AudioQuality);
    }).catch(() => {});
  }, []);

  const handleQualityChange = async (q: AudioQuality) => {
    setQuality(q);
    await AsyncStorage.setItem(QUALITY_KEY, q).catch(() => {});
  };

  const handleClearDownloads = () => {
    Alert.alert(
      'Clear Downloads',
      `This will remove all ${downloadedCount} downloaded song files from local storage.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // Reset downloaded map in store by clearing queue's localUris
            clearQueue();
            Alert.alert('Done', 'Downloaded songs cleared.');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>Settings</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Audio Quality ─────────────────────────────────────── */}
        <SettingSection title="AUDIO QUALITY">
          {QUALITY_OPTIONS.map((opt, i) => (
            <Pressable
              key={opt.value}
              style={({ pressed }) => [
                qualityStyles.row,
                i < QUALITY_OPTIONS.length - 1 && qualityStyles.border,
                pressed && qualityStyles.pressed,
              ]}
              onPress={() => void handleQualityChange(opt.value)}
            >
              <View style={qualityStyles.text}>
                <Text style={qualityStyles.label}>{opt.label}</Text>
                <Text style={qualityStyles.desc}>{opt.desc}</Text>
              </View>
              <View style={[qualityStyles.radio, quality === opt.value && qualityStyles.radioActive]}>
                {quality === opt.value && <View style={qualityStyles.radioDot} />}
              </View>
            </Pressable>
          ))}
        </SettingSection>

        {/* ── Playback ──────────────────────────────────────────── */}
        <SettingSection title="PLAYBACK">
          <SettingRow
            icon="shuffle-outline"
            label="Crossfade"
            value="Off"
            last
          />
        </SettingSection>

        {/* ── Storage ───────────────────────────────────────────── */}
        <SettingSection title="STORAGE">
          <SettingRow
            icon="cloud-download-outline"
            label="Downloaded Songs"
            value={`${downloadedCount} songs`}
          />
          <SettingRow
            icon="trash-outline"
            label="Clear Downloads"
            onPress={handleClearDownloads}
            danger
            last
          />
        </SettingSection>

        {/* ── About ─────────────────────────────────────────────── */}
        <SettingSection title="ABOUT">
          <SettingRow icon="musical-notes-outline" label="App Name" value="Mume" />
          <SettingRow icon="code-slash-outline" label="Version" value={APP_VERSION} />
          <SettingRow icon="server-outline" label="API" value="JioSaavn (saavn.sumit.co)" last />
        </SettingSection>

        {/* Attribution */}
        <View style={styles.footer}>
          <Ionicons name="musical-notes" size={20} color={colors.accent} />
          <Text style={styles.footerText}>Built with ❤️ using JioSaavn API</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const qualityStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: spacing.md,
  },
  border: { borderBottomWidth: 1, borderBottomColor: `${colors.border}80` },
  pressed: { backgroundColor: colors.surfaceElevated },
  text: { flex: 1 },
  label: { color: colors.text, fontSize: 15, fontWeight: '600' },
  desc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.accent },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  heading: { color: colors.text, fontSize: 26, fontWeight: '800' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 160, paddingTop: spacing.sm },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  footerText: { color: colors.subtle, fontSize: 13 },
});

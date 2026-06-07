import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
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
import { darkColors, lightColors, radius, spacing } from '../theme';
import { clearDownloadedFiles } from '../services/downloads';

type AudioQuality = '96kbps' | '160kbps' | '320kbps';
const QUALITY_KEY = '@lokal/quality';
const APP_VERSION = '1.0.0';

const QUALITY_OPTIONS: Array<{ value: AudioQuality; label: string; desc: string }> = [
  { value: '96kbps', label: '96 kbps', desc: 'Saves data · Lower quality' },
  { value: '160kbps', label: '160 kbps', desc: 'Balanced · Recommended' },
  { value: '320kbps', label: '320 kbps', desc: 'Best quality · Uses more data' },
];

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = usePlayerStore((s) => s.theme);
  const themeColors = theme === 'dark' ? darkColors : lightColors;
  const styles = getSectionStyles(themeColors);
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const getSectionStyles = (themeColors: typeof darkColors) => StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  title: { color: themeColors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: spacing.sm, paddingHorizontal: spacing.md },
  card: {
    backgroundColor: themeColors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: themeColors.border,
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
  const theme = usePlayerStore((s) => s.theme);
  const themeColors = theme === 'dark' ? darkColors : lightColors;
  const styles = getRowStyles(themeColors);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !last && styles.border,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.icon, danger && styles.iconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? themeColors.danger : themeColors.accent} />
      </View>
      <Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {onPress && !danger && <Ionicons name="chevron-forward" size={16} color={themeColors.subtle} />}
    </Pressable>
  );
}

const getRowStyles = (themeColors: typeof darkColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: spacing.md,
  },
  border: { borderBottomWidth: 1, borderBottomColor: `${themeColors.border}80` },
  pressed: { backgroundColor: themeColors.surfaceElevated },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: `${themeColors.accent}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDanger: { backgroundColor: `${themeColors.danger}18` },
  label: { flex: 1, color: themeColors.text, fontSize: 15, fontWeight: '600' },
  labelDanger: { color: themeColors.danger },
  value: { color: themeColors.muted, fontSize: 13 },
});

export function SettingsScreen() {
  const downloaded = usePlayerStore((s) => s.downloaded);
  const audioQuality = usePlayerStore((s) => s.audioQuality) as AudioQuality;
  const setAudioQuality = usePlayerStore((s) => s.setAudioQuality);
  const clearDownloads = usePlayerStore((s) => s.clearDownloads);

  const themeState = usePlayerStore((s) => s.theme);
  const setTheme = usePlayerStore((s) => s.setTheme);

  const quality = audioQuality;
  const downloadedCount = Object.keys(downloaded).length;

  const themeColors = themeState === 'dark' ? darkColors : lightColors;
  const styles = getStyles(themeColors);
  const qualityStyles = getQualityStyles(themeColors);

  useEffect(() => {
    AsyncStorage.getItem(QUALITY_KEY).then((val) => {
      if (val && val !== audioQuality) {
        setAudioQuality(val);
      }
    }).catch(() => {});
  }, []);

  const handleQualityChange = async (q: AudioQuality) => {
    setAudioQuality(q);
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
            clearDownloads();
            void clearDownloadedFiles();
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
        {/* ── Theme ─────────────────────────────────────────────── */}
        <SettingSection title="THEME">
          {[
            { value: 'dark' as const, label: 'Dark Mode', desc: 'Saves battery · Easy on eyes' },
            { value: 'light' as const, label: 'Light Mode', desc: 'Clean, iOS-style appearance' },
          ].map((opt, i, arr) => (
            <Pressable
              key={opt.value}
              style={({ pressed }) => [
                qualityStyles.row,
                i < arr.length - 1 && qualityStyles.border,
                pressed && qualityStyles.pressed,
              ]}
              onPress={() => setTheme(opt.value)}
            >
              <View style={qualityStyles.text}>
                <Text style={qualityStyles.label}>{opt.label}</Text>
                <Text style={qualityStyles.desc}>{opt.desc}</Text>
              </View>
              <View style={[qualityStyles.radio, themeState === opt.value && qualityStyles.radioActive]}>
                {themeState === opt.value && <View style={qualityStyles.radioDot} />}
              </View>
            </Pressable>
          ))}
        </SettingSection>

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
          <Ionicons name="musical-notes" size={20} color={themeColors.accent} />
          <Text style={styles.footerText}>Built with ❤️ using JioSaavn API</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getQualityStyles = (themeColors: typeof darkColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: spacing.md,
  },
  border: { borderBottomWidth: 1, borderBottomColor: `${themeColors.border}80` },
  pressed: { backgroundColor: themeColors.surfaceElevated },
  text: { flex: 1 },
  label: { color: themeColors.text, fontSize: 15, fontWeight: '600' },
  desc: { color: themeColors.muted, fontSize: 12, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: themeColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: themeColors.accent },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: themeColors.accent,
  },
});

const getStyles = (themeColors: typeof darkColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: themeColors.background },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  heading: { color: themeColors.text, fontSize: 26, fontWeight: '800' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 160, paddingTop: spacing.sm },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  footerText: { color: themeColors.subtle, fontSize: 13 },
});

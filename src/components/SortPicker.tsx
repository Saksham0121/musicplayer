import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, createThemeStyles, darkColors, radius, spacing } from '../theme';
import { SortOption } from '../types/music';

type SortConfig = {
  value: SortOption;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const SORT_OPTIONS: SortConfig[] = [
  { value: 'asc', label: 'Ascending (A → Z)', icon: 'arrow-up-outline' },
  { value: 'desc', label: 'Descending (Z → A)', icon: 'arrow-down-outline' },
  { value: 'artist', label: 'Artist', icon: 'person-outline' },
  { value: 'album', label: 'Album', icon: 'albums-outline' },
  { value: 'year', label: 'Year', icon: 'calendar-outline' },
];

export const SORT_LABELS: Record<SortOption, string> = {
  asc: 'Ascending',
  desc: 'Descending',
  artist: 'Artist',
  album: 'Album',
  year: 'Year',
};

type Props = {
  visible: boolean;
  current: SortOption;
  onSelect: (option: SortOption) => void;
  onClose: () => void;
};

export function SortPicker({ visible, current, onSelect, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.heading}>Sort by</Text>
          {SORT_OPTIONS.map((opt) => {
            const isSelected = opt.value === current;
            return (
              <Pressable
                key={opt.value}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => {
                  onSelect(opt.value);
                  onClose();
                }}
              >
                <View style={[styles.optionIcon, isSelected && styles.optionIconActive]}>
                  <Ionicons
                    name={opt.icon}
                    size={18}
                    color={isSelected ? colors.accent : colors.muted}
                  />
                </View>
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                  {opt.label}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={20} color={colors.accent} />
                )}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = createThemeStyles((themeColors) => ({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
  },
  handle: {
    width: 38,
    height: 4,
    backgroundColor: themeColors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  heading: {
    color: themeColors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: 4,
    gap: spacing.md,
  },
  optionSelected: {
    backgroundColor: `${themeColors.accent}15`,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: themeColors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconActive: {
    backgroundColor: `${themeColors.accent}25`,
  },
  optionLabel: {
    flex: 1,
    color: themeColors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  optionLabelActive: {
    color: themeColors.text,
    fontWeight: '700',
  },
}));

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

export type CategoryTabId = 'Suggested' | 'Songs' | 'Artists' | 'Albums' | 'Folders';

const TABS: CategoryTabId[] = ['Suggested', 'Songs', 'Artists', 'Albums', 'Folders'];

type Props = {
  active: CategoryTabId;
  onChange: (tab: CategoryTabId) => void;
};

export function CategoryTabs({ active, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      {TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab}</Text>
            {isActive && <View style={styles.indicator} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}60`,
  },
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
    flexDirection: 'row',
  },
  tab: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.subtle,
    letterSpacing: 0.1,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
});

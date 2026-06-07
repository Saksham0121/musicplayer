import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '../components/MiniPlayer';
import { TabParamList, RootStackParamList } from './types';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PlaylistsScreen } from '../screens/PlaylistsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { usePlayerStore, selectCurrentSong } from '../store/playerStore';
import { darkColors, lightColors, spacing } from '../theme';

const Tab = createBottomTabNavigator<TabParamList>();

type TabBarIconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Array<{
  name: keyof TabParamList;
  label: string;
  icon: TabBarIconName;
  activeIcon: TabBarIconName;
}> = [
  { name: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'Favorites', label: 'Favourites', icon: 'heart-outline', activeIcon: 'heart' },
  { name: 'Playlists', label: 'Playlists', icon: 'musical-notes-outline', activeIcon: 'musical-notes' },
  { name: 'Settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
];

const TAB_BAR_HEIGHT = 68;

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const song = usePlayerStore(selectCurrentSong);
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();
  const theme = usePlayerStore((s) => s.theme);
  const themeColors = theme === 'dark' ? darkColors : lightColors;
  const styles = getStyles(themeColors);

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 4) }]}>
      {!!song && <MiniPlayer navigation={rootNavigation} />}
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG.find((t) => t.name === route.name);
          if (!config) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={config.label}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconWrap, isFocused && styles.tabIconWrapActive]}>
                <Ionicons
                  name={isFocused ? config.activeIcon : config.icon}
                  size={21}
                  color={isFocused ? themeColors.accent : themeColors.subtle}
                />
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]} numberOfLines={1}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Playlists" component={PlaylistsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const getStyles = (themeColors: typeof darkColors) => StyleSheet.create({
  tabBarContainer: {
    backgroundColor: themeColors.background,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
  },
  tabBar: {
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_BAR_HEIGHT,
    gap: 3,
  },
  tabIconWrap: {
    width: 42,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabIconWrapActive: {
    backgroundColor: `${themeColors.accent}20`,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: themeColors.subtle,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: themeColors.accent,
    fontWeight: '700',
  },
});

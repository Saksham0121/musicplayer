import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '../components/MiniPlayer';
import { TabParamList, RootStackParamList } from './types';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PlaylistsScreen } from '../screens/PlaylistsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { usePlayerStore, selectCurrentSong } from '../store/playerStore';
import { colors, spacing } from '../theme';

const Tab = createBottomTabNavigator<TabParamList>();

type TabBarIconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Array<{
  name: keyof TabParamList;
  label: string;
  icon: TabBarIconName;
  activeIcon: TabBarIconName;
}> = [
  { name: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'Favorites', label: 'Favorites', icon: 'heart-outline', activeIcon: 'heart' },
  { name: 'Playlists', label: 'Playlists', icon: 'list-outline', activeIcon: 'list' },
  { name: 'Settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
];

const TAB_BAR_HEIGHT = 62;
const MINI_PLAYER_HEIGHT = 80; // approximate height of mini player card

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const song = usePlayerStore(selectCurrentSong);
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();

  const miniPlayerVisible = !!song;

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom }]}>
      {miniPlayerVisible && (
        <MiniPlayer navigation={rootNavigation} />
      )}
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
                  size={22}
                  color={isFocused ? colors.accent : colors.subtle}
                />
              </View>
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

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabBar: {
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_BAR_HEIGHT,
  },
  tabIconWrap: {
    width: 44,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  tabIconWrapActive: {
    backgroundColor: `${colors.accent}22`,
  },
});

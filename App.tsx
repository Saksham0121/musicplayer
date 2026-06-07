import 'react-native-gesture-handler';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AudioProvider } from './src/audio/AudioProvider';
import { TabNavigator } from './src/navigation/TabNavigator';
import { RootStackParamList } from './src/navigation/types';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { QueueScreen } from './src/screens/QueueScreen';
import { useLibraryStore } from './src/store/libraryStore';
import { usePlayerStore } from './src/store/playerStore';
import { darkColors, lightColors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const hydrate = usePlayerStore((state) => state.hydrate);
  const hydrateLibrary = useLibraryStore((state) => state.hydrate);
  const theme = usePlayerStore((state) => state.theme);

  useEffect(() => {
    hydrate();
    hydrateLibrary();
  }, [hydrate, hydrateLibrary]);

  const isDark = theme === 'dark';
  const themeColors = isDark ? darkColors : lightColors;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AudioProvider>
          <NavigationContainer
            theme={{
              dark: isDark,
              colors: {
                primary: themeColors.accent,
                background: themeColors.background,
                card: themeColors.background,
                text: themeColors.text,
                border: themeColors.border,
                notification: themeColors.accent,
              },
              fonts: {
                regular: { fontFamily: 'System', fontWeight: '400' },
                medium: { fontFamily: 'System', fontWeight: '500' },
                bold: { fontFamily: 'System', fontWeight: '700' },
                heavy: { fontFamily: 'System', fontWeight: '800' },
              },
            }}
          >
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: themeColors.background },
              }}
            >
              {/* Main tab navigator is the root screen */}
              <Stack.Screen name="MainTabs" component={TabNavigator} />
              {/* Player and Queue open as full-screen modals over the tabs */}
              <Stack.Screen
                name="Player"
                component={PlayerScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="Queue"
                component={QueueScreen}
                options={{ animation: 'slide_from_right' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </AudioProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

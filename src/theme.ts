import { StyleSheet } from 'react-native';

export type ThemeMode = 'dark' | 'light';

export const darkColors = {
  background: '#0D0D0F',
  surface: '#17171B',
  surfaceElevated: '#222228',
  border: '#2D2D34',
  text: '#F8F8FA',
  muted: '#A0A0AA',
  subtle: '#676771',
  accent: '#eb6e35ff',
  accentSoft: '#3A2117',
  success: '#43D17A',
  danger: '#FF5E67',
  white: '#FFFFFF',
};

export const lightColors = {
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceElevated: '#EAEAEF',
  border: '#E2E2E7',
  text: '#1C1C1E',
  muted: '#8E8E93',
  subtle: '#AEAEB2',
  accent: '#eb6e35ff',
  accentSoft: '#FDF0EA',
  success: '#34C759',
  danger: '#FF3B30',
  white: '#FFFFFF',
};

let getThemeFn: () => ThemeMode = () => 'dark';

export const setThemeGetter = (fn: () => ThemeMode) => {
  getThemeFn = fn;
};

export const getTheme = () => getThemeFn();

// Dynamic colors lookup (for JSX inline usage)
export const colors = {
  get background() { return getTheme() === 'dark' ? darkColors.background : lightColors.background; },
  get surface() { return getTheme() === 'dark' ? darkColors.surface : lightColors.surface; },
  get surfaceElevated() { return getTheme() === 'dark' ? darkColors.surfaceElevated : lightColors.surfaceElevated; },
  get border() { return getTheme() === 'dark' ? darkColors.border : lightColors.border; },
  get text() { return getTheme() === 'dark' ? darkColors.text : lightColors.text; },
  get muted() { return getTheme() === 'dark' ? darkColors.muted : lightColors.muted; },
  get subtle() { return getTheme() === 'dark' ? darkColors.subtle : lightColors.subtle; },
  get accent() { return darkColors.accent; },
  get accentSoft() { return getTheme() === 'dark' ? darkColors.accentSoft : lightColors.accentSoft; },
  get success() { return getTheme() === 'dark' ? darkColors.success : lightColors.success; },
  get danger() { return getTheme() === 'dark' ? darkColors.danger : lightColors.danger; },
  get white() { return darkColors.white; },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

// Dynamic stylesheet proxy that auto-resolves style declarations per active theme.
export function createThemeStyles<T extends StyleSheet.NamedStyles<T>>(
  styleFactory: (themeColors: typeof darkColors) => T
): T {
  let cachedTheme: ThemeMode | null = null;
  let cachedStyles: T | null = null;

  const getStyles = (): T => {
    const currentTheme = getTheme();
    if (currentTheme !== cachedTheme || !cachedStyles) {
      cachedTheme = currentTheme;
      const themeColors = currentTheme === 'dark' ? darkColors : lightColors;
      cachedStyles = StyleSheet.create(styleFactory(themeColors));
    }
    return cachedStyles;
  };

  return new Proxy({} as any, {
    get(_, prop) {
      return getStyles()[prop as keyof T];
    },
  }) as T;
}

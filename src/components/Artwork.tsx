import { Ionicons } from '@expo/vector-icons';
import { Image, ImageStyle, StyleProp, StyleSheet, View } from 'react-native';

import { colors } from '../theme';

type Props = {
  uri?: string;
  style?: StyleProp<ImageStyle>;
  radius?: number;
  fallbackIcon?: React.ComponentProps<typeof Ionicons>['name'];
};

export function Artwork({ uri, style, radius = 14, fallbackIcon = 'musical-notes' }: Props) {
  if (uri) {
    return <Image source={{ uri }} style={[styles.image, { borderRadius: radius }, style]} />;
  }

  return (
    <View style={[styles.placeholder, { borderRadius: radius }, style]}>
      <Ionicons name={fallbackIcon} size={28} color={colors.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.surfaceElevated },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
});

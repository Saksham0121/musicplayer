import { Ionicons } from '@expo/vector-icons';
import { Image, ImageStyle, StyleProp, StyleSheet, View } from 'react-native';

import { colors } from '../theme';

type Props = {
  uri?: string;
  style?: StyleProp<ImageStyle>;
  radius?: number;
};

export function Artwork({ uri, style, radius = 14 }: Props) {
  if (uri) {
    return <Image source={{ uri }} style={[styles.image, { borderRadius: radius }, style]} />;
  }

  return (
    <View style={[styles.placeholder, { borderRadius: radius }, style]}>
      <Ionicons name="musical-notes" size={28} color={colors.muted} />
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

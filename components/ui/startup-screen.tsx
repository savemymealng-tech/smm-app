import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from './brand-logo';
import { palette } from './screen-kit';

export function StartupScreen() {
  return (
    <View accessibilityViewIsModal style={styles.screen}>
      <BrandLogo width={220} />
      <View
        style={{
          position: 'absolute',
          top: '50%',
          marginTop: 60,
          alignItems: 'center',
          gap: 24,
        }}
      >
        <Text style={{ color: palette.muted, fontSize: 14 }}>
          Good food. Better value.
        </Text>
        <ActivityIndicator
          accessibilityLabel="Preparing Savemymeal"
          color={palette.green}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          bottom: 48,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
        }}
      >
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: palette.orange,
          }}
        />
        <Text style={{ fontSize: 12, color: palette.muted }}>
          Save more. Waste less.
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 100,
    elevation: 100,
  },
});

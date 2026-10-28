import { Image } from 'react-native';

/** Raster export of the site's logo.svg, bundled for offline/native startup. */
export function BrandLogo({ width = 170 }: { width?: number }) {
  return (
    <Image
      source={require('@/assets/brand-logo.png')}
      accessibilityLabel="Savemymeal"
      resizeMode="contain"
      style={{ width, height: (width * 36) / 127.5 }}
    />
  );
}

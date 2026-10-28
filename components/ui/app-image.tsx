import { useEffect, useState } from 'react';
import { Image, type ImageProps, type ImageSourcePropType } from 'react-native';

type Props = ImageProps & { fallbackSource?: ImageSourcePropType };
/** Reset failures when the image changes and avoid retrying a broken URL forever. */
export function AppImage({
  source,
  fallbackSource = require('@/assets/images/default-product.jpg'),
  onError,
  ...props
}: Props) {
  const [failed, setFailed] = useState(false);
  const key =
    typeof source === 'number'
      ? source
      : Array.isArray(source)
        ? source.map((item) => item.uri).join('|')
        : source?.uri;
  useEffect(() => setFailed(false), [key]);
  return (
    <Image
      {...props}
      source={failed || !source ? fallbackSource : source}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}

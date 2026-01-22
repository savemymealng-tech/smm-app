/**
 * Below are the colors that are used in the app. The app uses light mode only.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Brand Colors
const ORANGE = "#F39C12";
const GREEN = "#1E8449";

const tintColorLight = GREEN;

export const Colors = {
  light: {
    text: "#202124",
    background: "#ffffff",
    surface: "#f8f9fa",
    tint: tintColorLight,
    primary: GREEN,
    secondary: ORANGE,
    icon: "#5f6368",
    tabIconDefault: "#5f6368",
    tabIconSelected: tintColorLight,
    border: "#dadce0",
    success: GREEN,
    error: "#ea4335",
    warning: ORANGE,
    info: "#3498db",
  },
  
  // Brand colors for direct use
  brand: {
    orange: ORANGE,
    green: GREEN,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

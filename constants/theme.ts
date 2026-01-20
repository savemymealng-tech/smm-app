/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Brand Colors
const ORANGE = "#F39C12";
const GREEN = "#1E8449";

const tintColorLight = GREEN;
const tintColorDark = "#e8eaed";

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
  dark: {
    text: "#e8eaed",
    background: "#202124",
    surface: "#303134",
    tint: tintColorDark,
    primary: GREEN,
    secondary: ORANGE,
    icon: "#9aa0a6",
    tabIconDefault: "#9aa0a6",
    tabIconSelected: tintColorDark,
    border: "#3c4043",
    success: "#81c995",
    error: "#f28b82",
    warning: "#fdd663",
    info: "#5dade2",
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

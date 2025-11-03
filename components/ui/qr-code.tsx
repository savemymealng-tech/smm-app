import React from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Text } from './text';

type QRCodeProps = {
  value: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
  logo?: any;
  logoSize?: number;
  logoBackgroundColor?: string;
  logoMargin?: number;
  logoBorderRadius?: number;
  quietZone?: number;
  enableLinearGradient?: boolean;
  linearGradient?: string[];
  gradientDirection?: string[];
  showDescription?: boolean;
  description?: string;
  descriptionStyle?: string;
  className?: string;
};

export function QRCodeComponent({
  value,
  size = 200,
  backgroundColor = 'white',
  color = 'black',
  logo,
  logoSize = 30,
  logoBackgroundColor = 'white',
  logoMargin = 2,
  logoBorderRadius = 0,
  quietZone = 0,
  enableLinearGradient = false,
  linearGradient,
  gradientDirection,
  showDescription = false,
  description,
  descriptionStyle = 'text-slate-600 text-sm text-center',
  className = '',
}: QRCodeProps) {
  return (
    <View className={`items-center ${className}`}>
      <View
        className="shadow-md shadow-black/10"
        style={{
          backgroundColor: backgroundColor,
          borderRadius: 12,
          padding: 8,
          elevation: 3,
        }}
      >
        <QRCode
          value={value}
          size={size}
          backgroundColor={backgroundColor}
          color={color}
          logo={logo}
          logoSize={logoSize}
          logoBackgroundColor={logoBackgroundColor}
          logoMargin={logoMargin}
          logoBorderRadius={logoBorderRadius}
          quietZone={quietZone}
          enableLinearGradient={enableLinearGradient}
          linearGradient={linearGradient}
          gradientDirection={gradientDirection}
        />
      </View>

      {showDescription && description && (
        <Text className={descriptionStyle} style={{ marginTop: 8 }}>
          {description}
        </Text>
      )}
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';

type DividerProps = {
  className?: string;
};

export function Divider({ className = '' }: DividerProps) {
  return <View className={`h-px bg-gray-200 ${className}`} />;
}

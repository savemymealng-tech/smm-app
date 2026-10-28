import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  useWindowDimensions,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  PanResponder,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { Text } from './text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
};

export function BottomSheet({
  visible,
  onClose,
  children,
  title = 'Categories',
  description,
}: Props) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const screenHeightRef = useRef(screenHeight);
  screenHeightRef.current = screenHeight;
  const [availableHeight, setAvailableHeight] = useState<number | null>(null);
  const sheetHeight = Math.min(
    screenHeight * 0.85,
    Math.max(0, (availableHeight ?? screenHeight) - insets.top),
  );
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          closeRef.current();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: screenHeightRef.current,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  const handleBackdropPress = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View
          style={styles.container}
          onLayout={(event) =>
            setAvailableHeight(event.nativeEvent.layout.height)
          }
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleBackdropPress}
          >
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.bottomSheet,
              {
                height: sheetHeight,
                transform: [{ translateY }],
                opacity,
              },
            ]}
          >
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.gradient}
            >
              {/* Handle - pan responder only here so content (e.g. ScrollView) can scroll */}
              <View
                style={styles.handleContainer}
                {...panResponder.panHandlers}
              >
                <View style={styles.handle} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <View style={{ flex: 1 }}>
                    <Text variant="h3" className="text-gray-900 font-bold">
                      {title}
                    </Text>
                    {description && (
                      <View className="flex-row items-center mt-1">
                        <Text className="text-sm text-gray-600 mt-1">
                          {description}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Pressable
                    accessibilityLabel="Close sheet"
                    onPress={onClose}
                    style={{ padding: 8 }}
                  >
                    <Text className="text-gray-500 text-xl">×</Text>
                  </Pressable>
                </View>
              </View>

              {/* Content */}
              <View
                style={[
                  styles.content,
                  { paddingBottom: Math.max(insets.bottom, 12) },
                ]}
              >
                {children}
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    maxHeight: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 16,
  },
  gradient: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleContainer: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    minHeight: 0,
    paddingTop: 16,
  },
});

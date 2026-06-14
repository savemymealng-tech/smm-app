import { memo } from 'react';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';

import { IconSymbol } from './icon-symbol';
import { Text } from './text';
import { usePaystackWebView } from '@/hooks/use-paystack-webview'; // adjust path if needed

interface PaystackWebViewProps {
  visible: boolean;
  authorizationUrl: string;
  reference: string;
  onClose: () => void;
  onPaymentSuccess: (reference: string) => void;
  onPaymentCancel: () => void;
  callbackUrl?: string;
}

const PaystackWebViewComponent = ({
  visible,
  authorizationUrl,
  reference,
  onClose,
  onPaymentSuccess,
  onPaymentCancel,
  callbackUrl,
}: PaystackWebViewProps) => {
  const insets = useSafeAreaInsets();

  const {
    webViewRef,
    isLoading,
    loadingProgress,
    error,
    setError,
    handleMessage,
    detectOutcome,
    injectedJavaScriptBeforeContentLoaded,
    handleLoadStart,
    handleLoadEnd,
    handleLoadProgress,
    handleError,
  } = usePaystackWebView({ visible, reference, onPaymentSuccess, onPaymentCancel, callbackUrl });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onPaymentCancel}
    >
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        {/* Header - Same as original */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
          <Pressable onPress={onPaymentCancel} className="p-2 -ml-2">
            <IconSymbol name="chevron.left" size={26} color="#000" />
          </Pressable>

          <Text className="text-xl font-semibold">Secure Payment</Text>

          <View className="flex-row items-center">
            <IconSymbol name="lock.fill" size={18} color="#22c55e" />
            <Text className="ml-2 text-sm text-green-600 font-medium">Secured</Text>
          </View>
        </View>

        {/* Progress - Same as original */}
        {isLoading && (
          <View className="h-1 mt-50 bg-gray-100 overflow-hidden">
            <View
              className="h-full bg-green-600"
              style={{ width: `${Math.min(loadingProgress * 100, 100)}%` }}
            />
          </View>
        )}

        <View style={{ flex: 1, minHeight: 600 }}>
          <WebView
            ref={webViewRef}
            source={{ uri: authorizationUrl }}
            style={{ flex: 1 }}
            cacheEnabled={false}
            incognito={true}
            forceDarkOn={false}
            androidLayerType="software"
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
            onMessage={handleMessage}
            onNavigationStateChange={(navState: WebViewNavigation) => detectOutcome(navState.url)}
            onShouldStartLoadWithRequest={({ url }) => !detectOutcome(url)}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onLoadProgress={handleLoadProgress}
            onError={handleError}
            startInLoadingState={false}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            scrollEnabled={true}
          />
        </View>

        {/* Loading overlay - Same positioning as original */}
        {isLoading && !error && (
          <View className="mt-50 absolute inset-0 bg-white/90 items-center justify-center">
            <ActivityIndicator size="large" color="#15785B" />
            <Text className="mt-6 text-gray-700 font-medium">
              Loading Paystack secure checkout...
            </Text>
          </View>
        )}

        {/* Error overlay - Same as original */}
        {error && (
          <View className="absolute inset-0 bg-white items-center justify-center px-10">
            <IconSymbol name="exclamationmark.triangle.fill" size={70} color="#ef4444" />
            <Text className="text-2xl font-bold mt-8 text-center">Loading Failed</Text>
            <Text className="text-gray-600 text-center mt-4 mb-10">{error}</Text>

            <View className="flex-row gap-5">
              <Pressable onPress={onPaymentCancel} className="px-8 py-4 bg-gray-200 rounded-2xl">
                <Text className="font-semibold">Close</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setError(null);
                  webViewRef.current?.reload();
                }}
                className="px-8 py-4 bg-green-600 rounded-2xl"
              >
                <Text className="text-white font-semibold">Retry</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={{ height: insets.bottom }} className="bg-white" />
      </View>
    </Modal>
  );
};

export const PaystackWebView = memo(PaystackWebViewComponent);
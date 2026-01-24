import { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';

import { IconSymbol } from './icon-symbol';
import { Text } from './text';

interface PaystackWebViewProps {
  visible: boolean;
  authorizationUrl: string;
  reference: string;
  onClose: () => void;
  onPaymentSuccess: (reference: string) => void;
  onPaymentCancel: () => void;
  callbackUrl?: string;
}

/**
 * In-app Paystack payment WebView component
 * Displays the Paystack payment page in a modal and handles payment callbacks
 */
export function PaystackWebView({
  visible,
  authorizationUrl,
  reference,
  onClose,
  onPaymentSuccess,
  onPaymentCancel,
  callbackUrl = '/payment/callback',
}: PaystackWebViewProps) {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState;

    // Check for successful payment (callback URL)
    if (url.includes(callbackUrl) || url.includes('payment/callback') || url.includes('trxref=')) {
      // Extract reference from URL if needed
      const urlParams = new URL(url).searchParams;
      const refFromUrl = urlParams.get('reference') || urlParams.get('trxref') || reference;
      
      onPaymentSuccess(refFromUrl);
      return;
    }

    // Check for cancelled payment
    if (url.includes('/payment/cancel') || url.includes('cancel')) {
      onPaymentCancel();
      return;
    }

    // Check for close action from Paystack
    if (url.includes('close') || url.includes('paystack.co/close')) {
      onPaymentCancel();
      return;
    }
  };

  const handleShouldStartLoad = (event: { url: string }) => {
    const { url } = event;
    
    // Intercept callback URLs
    if (url.includes(callbackUrl) || url.includes('payment/callback') || url.includes('trxref=')) {
      const urlParams = new URL(url).searchParams;
      const refFromUrl = urlParams.get('reference') || urlParams.get('trxref') || reference;
      onPaymentSuccess(refFromUrl);
      return false; // Prevent loading the callback URL
    }

    if (url.includes('/payment/cancel') || url.includes('cancel') || url.includes('close')) {
      onPaymentCancel();
      return false;
    }

    return true;
  };

  const handleClose = () => {
    onClose();
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <View className="flex-row items-center">
            <Pressable
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="mr-3 p-1"
            >
              <IconSymbol name="xmark" size={24} color="#000" />
            </Pressable>
            <Text className="text-lg font-semibold">Complete Payment</Text>
          </View>
          
          <View className="flex-row items-center">
            <IconSymbol name="lock.fill" size={16} color="#22c55e" />
            <Text className="ml-1 text-sm text-green-600">Secure</Text>
          </View>
        </View>

        {/* Loading Progress Bar */}
        {isLoading && (
          <View className="h-1 bg-gray-100">
            <View
              className="h-full bg-green-600"
              style={{ width: `${loadingProgress * 100}%` }}
            />
          </View>
        )}

        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: authorizationUrl }}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onLoadProgress={({ nativeEvent }) => setLoadingProgress(nativeEvent.progress)}
          startInLoadingState
          renderLoading={() => (
            <View className="absolute inset-0 items-center justify-center bg-white">
              <ActivityIndicator size="large" color="#15785B" />
              <Text className="mt-4 text-gray-600">Loading payment page...</Text>
            </View>
          )}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={['*']}
          style={{ flex: 1 }}
        />

        {/* Bottom Safe Area */}
        <View style={{ height: insets.bottom }} className="bg-white" />
      </View>
    </Modal>
  );
}

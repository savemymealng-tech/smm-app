import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';

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

const PaystackWebViewComponent = ({
  visible,
  authorizationUrl,
  reference,
  onClose,
  onPaymentSuccess,
  onPaymentCancel,
  callbackUrl = '/payment/callback',
}: PaystackWebViewProps) => {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stuckDetected, setStuckDetected] = useState(false);

  // ─── Timeout: if stuck too long → force verify or close ──────────────────────
  useEffect(() => {
    if (!visible) return;

    const stuckTimer = setTimeout(() => {
      if (isLoading && loadingProgress > 0.1 && loadingProgress < 0.95) {
        console.warn('[Paystack] Stuck detected — forcing success callback');
        setStuckDetected(true);
        onPaymentSuccess(reference);
      }
    }, 30000); // 30 seconds

    return () => clearTimeout(stuckTimer);
  }, [visible, isLoading, loadingProgress, reference, onPaymentSuccess]);

  // ─── Auto-reload after 8 seconds if still loading (helps some Android cases) ─
  useEffect(() => {
    if (!visible || !isLoading) return;

    const reloadTimer = setTimeout(() => {
      if (isLoading && !error && !stuckDetected) {
        console.log('[Paystack] Auto-reloading after 8s timeout');
        webViewRef.current?.reload();
      }
    }, 8000);

    return () => clearTimeout(reloadTimer);
  }, [visible, isLoading, error, stuckDetected]);

  const detectOutcome = useCallback(
    (url: string): boolean => {
      const lower = url.toLowerCase();

      if (lower.includes('standard.paystack.co/close') || lower.includes('paystack.co/close')) {
        console.log('[Paystack] Detected CLOSE signal → success');
        onPaymentSuccess(reference);
        return true;
      }

      if (
        lower.includes(callbackUrl.toLowerCase()) ||
        lower.includes('reference=') ||
        lower.includes('trxref=') ||
        lower.includes('success') ||
        lower.includes('thank-you')
      ) {
        console.log('[Paystack] Detected SUCCESS pattern');
        try {
          const params = new URL(url, 'https://example.com').searchParams;
          const ref = params.get('reference') || params.get('trxref') || reference;
          onPaymentSuccess(ref);
        } catch {
          onPaymentSuccess(reference);
        }
        return true;
      }

      if (lower.includes('cancel') || lower.includes('dismiss') || lower.includes('failed')) {
        console.log('[Paystack] Detected CANCEL pattern');
        onPaymentCancel();
        return true;
      }

      return false;
    },
    [callbackUrl, reference, onPaymentSuccess, onPaymentCancel],
  );

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      console.log('[Paystack Nav]', navState.url, navState.loading ? '(loading)' : '');
      detectOutcome(navState.url);
    },
    [detectOutcome],
  );

  const handleShouldStartLoad = useCallback(
    ({ url }: { url: string }) => {
      if (detectOutcome(url)) return false;
      return true;
    },
    [detectOutcome],
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const msg = event.nativeEvent.data;
      console.log('[WebView → RN]', msg);

      try {
        const data = typeof msg === 'string' ? JSON.parse(msg) : msg;
        if (data?.type?.includes('success')) {
          onPaymentSuccess(data.reference || reference);
        } else if (data?.type?.includes('cancel') || data?.type?.includes('close')) {
          onPaymentCancel();
        }
      } catch {}
    },
    [reference, onPaymentSuccess, onPaymentCancel],
  );

  const injectedJavaScript = `
    (function() {
      // Force visibility
      document.body.style.visibility = 'visible';
      document.body.style.backgroundColor = '#ffffff';

      // Log when page is interactive
      window.addEventListener('load', () => {
        window.ReactNativeWebView.postMessage('page:loaded');
      });

      // Try to catch Paystack events
      setInterval(() => {
        if (window.PaystackPop && window.PaystackPop.close) {
          window.ReactNativeWebView.postMessage('paystack:ready');
        }
      }, 2000);

      true;
    })();
  `;

  const handleLoadStart = () => {
    console.log('[Paystack] → Load started');
    setIsLoading(true);
    setError(null);
    setStuckDetected(false);
  };

  const handleLoadEnd = () => {
    console.log('[Paystack] → Load ended');
    setIsLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[Paystack WebView ERROR]', nativeEvent);
    setError(nativeEvent.description || 'Cannot load payment page');
    setIsLoading(false);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
          <Pressable onPress={onClose} className="p-2 -ml-2">
            <IconSymbol name="chevron.left" size={26} color="#000" />
          </Pressable>

          <Text className="text-xl font-semibold">Secure Payment</Text>

          <View className="flex-row items-center">
            <IconSymbol name="lock.fill" size={18} color="#22c55e" />
            <Text className="ml-2 text-sm text-green-600 font-medium">Secured</Text>
          </View>
        </View>

        {/* Progress */}
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
          injectedJavaScript={injectedJavaScript}
          onMessage={handleMessage}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onLoadProgress={({ nativeEvent }) => setLoadingProgress(nativeEvent.progress)}
          onError={handleError}
          startInLoadingState={true}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
            scrollEnabled={true}
        />
        </View>

        {/* Loading overlay */}
        {isLoading && !error && (
          <View className="mt-50 absolute inset-0 bg-white/90 items-center justify-center">
            <ActivityIndicator size="large" color="#15785B" />
            <Text className="mt-6 text-gray-700 font-medium">
              Loading Paystack secure checkout...
            </Text>
          </View>
        )}

        {/* Error overlay */}
        {error && (
          <View className="absolute inset-0 bg-white items-center justify-center px-10">
            <IconSymbol name="exclamationmark.triangle.fill" size={70} color="#ef4444" />
            <Text className="text-2xl font-bold mt-8 text-center">Loading Failed</Text>
            <Text className="text-gray-600 text-center mt-4 mb-10">{error}</Text>

            <View className="flex-row gap-5">
              <Pressable
                onPress={onClose}
                className="px-8 py-4 bg-gray-200 rounded-2xl"
              >
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
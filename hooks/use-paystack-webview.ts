import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useRef, useState } from 'react';
import { WebViewMessageEvent } from 'react-native-webview';

export const usePaystackWebView = ({
  visible,
  reference,
  onPaymentSuccess,
  onPaymentCancel,
  callbackUrl = '/payment/callback',
}: {
  visible: boolean;
  reference: string;
  onPaymentSuccess: (reference: string) => void;
  onPaymentCancel: () => void;
  callbackUrl?: string;
}) => {
  const webViewRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Stuck detection
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn('[Paystack] Stuck detected — forcing success');
        onPaymentSuccess(reference);
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [visible, isLoading, reference, onPaymentSuccess]);

  const detectOutcome = useCallback(
    (url: string): boolean => {
      const lower = url.toLowerCase();

      const isCallbackRedirect =
        lower.includes(callbackUrl.toLowerCase()) ||
        lower.includes('/payment/callback') ||
        lower.startsWith('savemymeal://payment/callback');

      if (isCallbackRedirect) {
        let callbackStatus = '';
        let callbackReference = reference;

        try {
          const parsed = new URL(url);
          callbackStatus = (parsed.searchParams.get('status') || '').toLowerCase();
          callbackReference =
            parsed.searchParams.get('reference') ||
            parsed.searchParams.get('trxref') ||
            reference;
        } catch {
          callbackStatus = '';
          callbackReference = reference;
        }

        if (
          callbackStatus === 'failed' ||
          callbackStatus === 'abandoned' ||
          callbackStatus === 'cancelled' ||
          callbackStatus === 'canceled' ||
          callbackStatus === 'error'
        ) {
          onPaymentCancel();
        } else {
          onPaymentSuccess(callbackReference);
        }

        return true;
      }

      if (lower.includes('paystack.co/close') || lower.includes('success') || lower.includes('thank-you')) {
        let successReference = reference;
        try {
          const parsed = new URL(url);
          successReference =
            parsed.searchParams.get('reference') ||
            parsed.searchParams.get('trxref') ||
            reference;
        } catch {
          successReference = reference;
        }
        onPaymentSuccess(successReference);
        return true;
      }
      if (lower.includes('cancel') || lower.includes('dismiss') || lower.includes('failed')) {
        onPaymentCancel();
        return true;
      }
      return false;
    },
    [reference, onPaymentSuccess, onPaymentCancel]
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      void (async () => {
        const msg = event.nativeEvent.data;
        console.log('[WebView → RN]', msg);

        let data: any = null;
        try {
          data = typeof msg === 'string' ? JSON.parse(msg) : msg;
        } catch {}

        if (data?.type === 'clipboard-copy' || data?.type === 'COPY_TO_CLIPBOARD') {
          const text = String(data.text || '').trim();
          if (text.length > 0) {
            try {
              await Clipboard.setStringAsync(text);
              console.log('[Clipboard SUCCESS]', text);
            } catch (err) {
              console.error('[Clipboard FAILED]', err);
            }
          }
          return;
        }

        if (data?.type?.toLowerCase().includes('cancel') || data?.type?.toLowerCase().includes('close')) {
          onPaymentCancel();
        }
      })();
    },
    [onPaymentCancel]
  );

  const injectedJavaScriptBeforeContentLoaded = `
    (function() {
      const post = (p) => { try { window.ReactNativeWebView.postMessage(JSON.stringify(p)); } catch(e){} };
      const postCopy = (text) => {
        text = String(text || '').trim();
        if (text.length > 5) post({ type: 'clipboard-copy', text });
      };

      if (navigator.clipboard?.writeText) {
        const orig = navigator.clipboard.writeText;
        navigator.clipboard.writeText = function(t) {
          postCopy(t);
          return orig.call(this, t).catch(() => {});
        };
      }

      document.addEventListener('copy', () => postCopy(window.getSelection?.toString() || ''), true);

      document.addEventListener('click', (e) => {
        const t = e.target.closest?.('button,[role="button"]');
        if (t) {
          const txt = (t.textContent || '').toLowerCase();
          if (txt.includes('cancel') || txt.includes('close')) post({ type: 'cancel' });
        }
      }, true);

      console.log('[Bridge] Ready');
      true;
    })();
  `;

  return {
    webViewRef,
    isLoading,
    loadingProgress,
    error,
    setError,
    handleMessage,
    detectOutcome,
    injectedJavaScriptBeforeContentLoaded,
    handleLoadStart: () => setIsLoading(true),
    handleLoadEnd: () => setIsLoading(false),
    handleLoadProgress: ({ nativeEvent }: any) => setLoadingProgress(nativeEvent.progress),
    handleError: (syntheticEvent: any) => {
      setError(syntheticEvent.nativeEvent.description || 'Cannot load payment page');
      setIsLoading(false);
    },
  };
};
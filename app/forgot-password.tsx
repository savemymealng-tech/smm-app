import { useRef, useState } from 'react';
import { Keyboard, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSetAtom } from 'jotai';
import { KeyRound } from 'lucide-react-native';
import {
  AuthError,
  AuthField,
  AuthLink,
  AuthScreen,
} from '@/components/auth/auth-screen';
import { Action, palette, ui } from '@/components/ui/screen-kit';
import { api } from '@/lib/api';
import { passwordResetContextAtom } from '@/lib/atoms/auth';
import { authError, emailError } from '@/lib/auth-form';
import { resolveAppLink } from '@/lib/deep-links';

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string; returnTo?: string }>();
  const destination =
    typeof params.returnTo === 'string'
      ? resolveAppLink(params.returnTo) || '/(tabs)'
      : '/(tabs)';
  const [email, setEmail] = useState(
    typeof params.email === 'string' ? params.email : '',
  );
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const setReset = useSetAtom(passwordResetContextAtom);
  const login = () => {
    if (!busy)
      router.replace({
        pathname: '/login',
        params: { email: email.trim(), returnTo: destination },
      });
  };
  async function sendCode() {
    if (submitting.current) return;
    const validation = emailError(email);
    setFieldError(validation || '');
    setError('');
    if (validation) return;
    submitting.current = true;
    setBusy(true);
    Keyboard.dismiss();
    try {
      await api.auth.forgotPassword(email.trim());
      setReset({ email: email.trim(), code: null });
      router.push({
        pathname: '/verify-reset-code',
        params: { returnTo: destination },
      });
    } catch (cause) {
      setError(
        authError(cause, 'Unable to send your reset code. Please try again.'),
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <AuthScreen
      title="Forgot your password?"
      description="Enter your account email and we’ll help you get back in."
      onBack={login}
      footer={
        <View style={{ alignItems: 'center' }}>
          <AuthLink label="Back to sign in" disabled={busy} onPress={login} />
        </View>
      }
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: palette.greenSurface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <KeyRound size={22} color={palette.green} />
      </View>
      <Text style={ui.heading}>Reset by email</Text>
      <Text style={ui.muted}>
        We’ll send a 6-digit code. Enter it on the next screen to choose a new
        password.
      </Text>
      <AuthError message={error} />
      <AuthField
        label="Email address"
        placeholder="you@example.com"
        value={email}
        error={fieldError}
        onChangeText={(value) => {
          setEmail(value);
          setFieldError('');
          setError('');
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        editable={!busy}
        returnKeyType="send"
        onSubmitEditing={() => void sendCode()}
      />
      <Action
        label={busy ? 'Sending code…' : 'Send reset code'}
        busy={busy}
        onPress={() => void sendCode()}
      />
    </AuthScreen>
  );
}

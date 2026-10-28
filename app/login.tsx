import { useRef, useState } from 'react';
import { Keyboard, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSetAtom } from 'jotai';
import {
  AuthError,
  AuthField,
  AuthLink,
  AuthScreen,
} from '@/components/auth/auth-screen';
import { Action, ui } from '@/components/ui/screen-kit';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { setAuthStateAtom, verificationContextAtom } from '@/lib/atoms/auth';
import { resolveAppLink } from '@/lib/deep-links';
import { authError, loginErrors, verificationEmail } from '@/lib/auth-form';
import type { User } from '@/types';

export default function LoginScreen() {
  const params = useLocalSearchParams<{ email?: string; returnTo?: string }>();
  const destination =
    typeof params.returnTo === 'string'
      ? resolveAppLink(params.returnTo) || '/(tabs)'
      : '/(tabs)';
  const setAuth = useSetAtom(setAuthStateAtom);
  const setVerification = useSetAtom(verificationContextAtom);
  const [email, setEmail] = useState(
    typeof params.email === 'string' ? params.email : '',
  );
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const passwordInput = useRef<TextInput>(null);
  async function login() {
    if (submitting.current) return;
    const validation = loginErrors(email, password);
    setErrors(validation);
    setError('');
    if (Object.keys(validation).length) return;
    submitting.current = true;
    setBusy(true);
    Keyboard.dismiss();
    try {
      // Passwords are submitted exactly as typed, including spaces.
      const result = await api.auth.login({ email: email.trim(), password });
      let user: User;
      try {
        user = await api.profile.getProfile();
      } catch {
        user = {
          id: String(result.user.id),
          email: result.user.email || email.trim(),
        };
      }
      await setAuth({
        user,
        accessToken: result.token,
        refreshToken: result.refreshToken || '',
      });
      router.replace(destination as never);
    } catch (cause) {
      const unverified = verificationEmail(cause, email);
      if (unverified) setVerifyEmail(unverified);
      else
        setError(
          authError(
            cause,
            'Unable to sign in. Check your details and try again.',
          ),
        );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <AuthScreen
        title="Welcome back"
        description="Sign in to manage your orders, pickups and rewards."
        onBack={() => !busy && router.replace('/(tabs)')}
        footer={
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            <Text style={ui.muted}>New to Savemymeal?</Text>
            <AuthLink
              label="Create an account"
              disabled={busy}
              onPress={() =>
                router.push({
                  pathname: '/signup',
                  params: { returnTo: destination },
                })
              }
            />
          </View>
        }
      >
        <AuthError message={error} />
        <AuthField
          label="Email address"
          placeholder="you@example.com"
          value={email}
          error={errors.email}
          onChangeText={(value) => {
            setEmail(value);
            setErrors((previous) => ({ ...previous, email: '' }));
            setError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          editable={!busy}
          returnKeyType="next"
          onSubmitEditing={() => passwordInput.current?.focus()}
        />
        <AuthField
          ref={passwordInput}
          password
          label="Password"
          placeholder="Your password"
          value={password}
          error={errors.password}
          onChangeText={(value) => {
            setPassword(value);
            setErrors((previous) => ({ ...previous, password: '' }));
            setError('');
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          editable={!busy}
          returnKeyType="go"
          onSubmitEditing={() => void login()}
        />
        <View style={{ alignItems: 'flex-end' }}>
          <AuthLink
            label="Forgot password?"
            disabled={busy}
            onPress={() =>
              router.push({
                pathname: '/forgot-password',
                params: { email: email.trim(), returnTo: destination },
              })
            }
          />
        </View>
        <Action
          label={busy ? 'Signing in…' : 'Sign in'}
          busy={busy}
          onPress={() => void login()}
        />
      </AuthScreen>
      <ConfirmDialog
        open={!!verifyEmail}
        onClose={() => setVerifyEmail(null)}
        title="Verify your email"
        message="Verify your email address before signing in. You can enter your code or request a new one on the next screen."
        primaryLabel="Verify email"
        onPrimary={() => {
          if (!verifyEmail) return;
          setVerification({ email: verifyEmail, fromSignup: false });
          const value = verifyEmail;
          setVerifyEmail(null);
          router.push({
            pathname: '/verify-otp',
            params: { email: value, returnTo: destination },
          });
        }}
        secondaryLabel="Keep editing"
      />
    </>
  );
}

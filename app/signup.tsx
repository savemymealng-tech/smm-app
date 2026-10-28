import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Linking,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSetAtom } from 'jotai';
import { ChevronDown, ChevronUp, Gift } from 'lucide-react-native';
import {
  AuthError,
  AuthField,
  AuthLink,
  AuthScreen,
} from '@/components/auth/auth-screen';
import { Action, palette, ui } from '@/components/ui/screen-kit';
import { api } from '@/lib/api';
import { verificationContextAtom } from '@/lib/atoms/auth';
import { resolveAppLink } from '@/lib/deep-links';
import { authError, normalizePhone, signupErrors } from '@/lib/auth-form';

export default function SignupScreen() {
  const params = useLocalSearchParams<{
    referral_code?: string;
    returnTo?: string;
  }>();
  const destination =
    typeof params.returnTo === 'string'
      ? resolveAppLink(params.returnTo) || '/(tabs)'
      : '/(tabs)';
  const setVerification = useSetAtom(verificationContextAtom);
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  // Query parameters are applied after hydration so static web HTML also matches.
  const [referral, setReferral] = useState('');
  const [referralOpen, setReferralOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const phoneInput = useRef<TextInput>(null),
    passwordInput = useRef<TextInput>(null),
    confirmInput = useRef<TextInput>(null);
  useEffect(() => {
    if (typeof params.referral_code === 'string' && params.referral_code) {
      setReferral(params.referral_code);
      setReferralOpen(true);
    }
  }, [params.referral_code]);
  function change(key: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: '' }));
    setError('');
  }
  async function signup() {
    if (submitting.current) return;
    const validation = signupErrors(form);
    setErrors(validation);
    setError('');
    if (Object.keys(validation).length) return;
    submitting.current = true;
    setBusy(true);
    Keyboard.dismiss();
    try {
      await api.auth.signup({
        email: form.email.trim(),
        password: form.password,
        phone: normalizePhone(form.phone),
        referral_code: referral.trim() || undefined,
      });
      setVerification({ email: form.email.trim(), fromSignup: true });
      router.push({
        pathname: '/verify-otp',
        params: { email: form.email.trim(), returnTo: destination },
      });
    } catch (cause) {
      setError(
        authError(cause, 'Unable to create your account. Please try again.'),
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  async function legal(page: 'terms' | 'privacy') {
    try {
      await Linking.openURL(`https://savemymeal.com/${page}`);
    } catch {
      setError('Unable to open this page. Please try again.');
    }
  }
  return (
    <AuthScreen
      title="Create your account"
      description="Discover meals worth saving. Order ahead and collect from local vendors."
      onBack={() => {
        if (busy) return;
        if (router.canGoBack()) router.back();
        else router.replace('/login');
      }}
      footer={
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            <Text style={ui.muted}>Already have an account?</Text>
            <AuthLink
              label="Sign in"
              disabled={busy}
              onPress={() =>
                router.replace({
                  pathname: '/login',
                  params: { returnTo: destination, email: form.email.trim() },
                })
              }
            />
          </View>
          <Text style={[ui.muted, { textAlign: 'center', fontSize: 11 }]}>
            By creating an account, you agree to our
          </Text>
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <AuthLink
              label="Terms of service"
              disabled={busy}
              onPress={() => void legal('terms')}
            />
            <AuthLink
              label="Privacy policy"
              disabled={busy}
              onPress={() => void legal('privacy')}
            />
          </View>
        </>
      }
    >
      <AuthError message={error} />
      <AuthField
        label="Email address"
        placeholder="you@example.com"
        value={form.email}
        error={errors.email}
        onChangeText={(value) => change('email', value)}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        editable={!busy}
        returnKeyType="next"
        onSubmitEditing={() => phoneInput.current?.focus()}
      />
      <AuthField
        ref={phoneInput}
        label="Phone number"
        placeholder="08012345678"
        value={form.phone}
        error={errors.phone}
        onChangeText={(value) => change('phone', value)}
        keyboardType="phone-pad"
        autoComplete="tel"
        editable={!busy}
        returnKeyType="next"
        onSubmitEditing={() => passwordInput.current?.focus()}
        maxLength={30}
      />
      <AuthField
        ref={passwordInput}
        password
        label="Password"
        placeholder="Create a password"
        hint="Use at least 6 characters."
        value={form.password}
        error={errors.password}
        onChangeText={(value) => change('password', value)}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        editable={!busy}
        returnKeyType="next"
        onSubmitEditing={() => confirmInput.current?.focus()}
      />
      <AuthField
        ref={confirmInput}
        password
        label="Confirm password"
        placeholder="Enter your password again"
        value={form.confirmPassword}
        error={errors.confirmPassword}
        onChangeText={(value) => change('confirmPassword', value)}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        editable={!busy}
        returnKeyType="done"
        onSubmitEditing={() => void signup()}
      />
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: palette.border,
          paddingTop: 4,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: referralOpen }}
          disabled={busy}
          onPress={() => setReferralOpen((value) => !value)}
          style={{
            minHeight: 44,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Gift size={16} color={palette.green} />
          <Text style={[ui.link, { flex: 1 }]}>
            {referral ? 'Referral code added' : 'Have a referral code?'}
          </Text>
          {referralOpen ? (
            <ChevronUp size={16} color={palette.green} />
          ) : (
            <ChevronDown size={16} color={palette.green} />
          )}
        </Pressable>
        {referralOpen && (
          <AuthField
            label="Referral code (optional)"
            placeholder="Friend or partner code"
            hint="Eligible benefits are confirmed at checkout."
            value={referral}
            onChangeText={(value) => {
              setReferral(value);
              setError('');
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={40}
            editable={!busy}
          />
        )}
      </View>
      <Action
        label={busy ? 'Creating account…' : 'Create account'}
        busy={busy}
        onPress={() => void signup()}
      />
    </AuthScreen>
  );
}

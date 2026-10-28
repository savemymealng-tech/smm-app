import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import {
  useNavigation,
  usePreventRemove,
  type NavigationAction,
} from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Check, Mail } from 'lucide-react-native';
import {
  Action,
  Card,
  Message,
  PageScroll,
  Screen,
  palette,
  ui,
} from '@/components/ui/screen-kit';
import { AppImage } from '@/components/ui/app-image';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/components/ui/toast';
import {
  useProfile,
  useUpdateProfile,
  useUploadProfilePicture,
} from '@/lib/hooks/use-profile';
import { useProtectedRoute } from '@/lib/hooks/use-protected-route';
import { getImageSource } from '@/lib/utils';
import {
  normalizeProfile,
  profileChanges,
  profileErrors,
  profileForm,
  type ProfileForm,
} from '@/lib/profile-form';

function Field({
  label,
  error,
  required,
  ...props
}: TextInputProps & { label: string; error?: string; required?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={palette.muted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          ui.input,
          {
            minHeight: 48,
            borderColor: error
              ? palette.red
              : focused
                ? palette.green
                : palette.border,
          },
        ]}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { isAuthenticated, isLoading: authLoading } = useProtectedRoute();
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadProfilePicture();
  const initialized = useRef<string | null>(null);
  const saving = useRef(false);
  const [form, setForm] = useState<ProfileForm>(() => profileForm());
  const [original, setOriginal] = useState<ProfileForm>(() => profileForm());
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [avatar, setAvatar] = useState('');
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProfileForm, string>>
  >({});
  const [error, setError] = useState('');
  const [discardOpen, setDiscardOpen] = useState(false);
  const [allowLeave, setAllowLeave] = useState(false);
  const exitAction = useRef<NavigationAction | null>(null);
  const changes = profileChanges(form, original);
  const dirty = !!photo || Object.keys(changes).length > 0;

  useEffect(() => {
    const user = profile.data;
    if (!user || initialized.current === String(user.id)) return;
    initialized.current = String(user.id);
    const next = profileForm(user);
    setForm(next);
    setOriginal(next);
    setAvatar(user.profile_picture_url || user.avatar || '');
    setPhoto(null);
    setErrors({});
  }, [profile.data]);
  usePreventRemove(!allowLeave && (dirty || busy || picking), ({ data }) => {
    if (saving.current || picking) return;
    exitAction.current = data.action;
    Keyboard.dismiss();
    setDiscardOpen(true);
  });
  useEffect(() => {
    if (!allowLeave) return;
    if (exitAction.current) navigation.dispatch(exitAction.current);
    else if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  }, [allowLeave, navigation, router]);

  function change(key: keyof ProfileForm, value: string) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
    setError('');
  }
  async function pickPhoto() {
    if (saving.current || picking) return;
    setPicking(true);
    setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
          setError('Choose a photo smaller than 10 MB.');
          return;
        }
        setPhoto(asset);
      }
    } catch {
      setError(
        'Unable to open your photos. Check photo access in your device settings and try again.',
      );
    } finally {
      setPicking(false);
    }
  }
  async function save() {
    if (saving.current || !dirty || picking) return;
    const validation = profileErrors(form);
    setErrors(validation);
    if (Object.keys(validation).length) {
      setError('Check the highlighted fields before saving.');
      return;
    }
    saving.current = true;
    setBusy(true);
    setError('');
    Keyboard.dismiss();
    let detailsSaved = false;
    try {
      if (Object.keys(changes).length) {
        await updateProfile.mutateAsync(changes);
        const next = normalizeProfile(form);
        setForm(next);
        setOriginal(next);
        detailsSaved = true;
      }
      if (photo) {
        const result = await uploadPhoto.mutateAsync({
          uri: photo.uri,
          type: photo.mimeType || 'image/jpeg',
        });
        setAvatar(result.url);
        setPhoto(null);
      }
      toast.success('Profile updated', 'Your changes have been saved.');
      setAllowLeave(true);
    } catch (cause) {
      const failure = cause as {
        message?: string;
        error?: string;
        validationErrors?: { field: string; message: string }[];
      };
      if (failure.validationErrors)
        setErrors(
          Object.fromEntries(
            failure.validationErrors
              .filter((item) => item.field in form)
              .map((item) => [item.field, item.message]),
          ),
        );
      setError(
        detailsSaved
          ? 'Your details were saved, but your photo could not be uploaded. Tap Save changes to retry the photo.'
          : failure.message ||
              failure.error ||
              'Unable to save your changes. Please try again.',
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;
  const ready =
    !!profile.data && initialized.current === String(profile.data.id);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Screen
        title="Edit profile"
        footer={
          ready && !profile.isError ? (
            <View style={{ gap: 8 }}>
              {!!error && (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
              )}
              <Action
                label={
                  busy
                    ? uploadPhoto.isPending
                      ? 'Uploading photo…'
                      : 'Saving changes…'
                    : 'Save changes'
                }
                busy={busy}
                disabled={!dirty || picking}
                onPress={() => void save()}
              />
              <Text style={[ui.muted, { textAlign: 'center', fontSize: 11 }]}>
                {dirty
                  ? 'Your changes are not saved yet'
                  : 'Your profile is up to date'}
              </Text>
            </View>
          ) : undefined
        }
      >
        {profile.isLoading || (!ready && !profile.isError) ? (
          <View style={styles.center}>
            <ActivityIndicator color={palette.green} />
            <Text style={ui.muted}>Loading your profile…</Text>
          </View>
        ) : profile.isError || !profile.data ? (
          <View style={{ padding: 16 }}>
            <Message
              title="Could not load your profile"
              body="Please try again before editing your details."
              onRetry={() => void profile.refetch()}
            />
          </View>
        ) : (
          <PageScroll
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <Card>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
              >
                <View>
                  {photo?.uri || avatar ? (
                    <AppImage
                      source={getImageSource(photo?.uri || avatar)}
                      fallbackSource={require('@/assets/images/default-profile.jpg')}
                      style={{
                        width: 76,
                        height: 76,
                        borderRadius: 38,
                        backgroundColor: palette.greenSurface,
                      }}
                      accessibilityLabel="Profile photo"
                    />
                  ) : (
                    <View
                      accessibilityLabel="Profile initials"
                      style={{
                        width: 76,
                        height: 76,
                        borderRadius: 38,
                        backgroundColor: palette.greenSurface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 26,
                          fontWeight: '700',
                          color: palette.green,
                        }}
                      >
                        {`${form.first_name.charAt(0)}${form.last_name.charAt(0)}`.toUpperCase() ||
                          form.username.charAt(0).toUpperCase() ||
                          'U'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.camera}>
                    <Camera size={13} color={palette.orangeInk} />
                  </View>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={ui.heading}>Profile photo</Text>
                  <Text style={ui.muted}>A little more you.</Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy || picking}
                    onPress={() => void pickPhoto()}
                    style={{
                      alignSelf: 'flex-start',
                      minHeight: 44,
                      justifyContent: 'center',
                      opacity: busy || picking ? 0.5 : 1,
                    }}
                  >
                    <Text style={ui.link}>
                      {picking
                        ? 'Opening photos…'
                        : photo
                          ? 'Choose another photo'
                          : avatar
                            ? 'Change photo'
                            : 'Add a photo'}
                    </Text>
                  </Pressable>
                </View>
              </View>
              {!!photo && (
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <Check size={14} color={palette.green} />
                  <Text style={[ui.muted, { color: palette.green }]}>
                    New photo ready to save
                  </Text>
                </View>
              )}
            </Card>
            <Card>
              <Text style={ui.heading}>Personal details</Text>
              <Text style={ui.muted}>Required fields are marked with *.</Text>
              <Field
                label="First name"
                required
                value={form.first_name}
                onChangeText={(value) => change('first_name', value)}
                error={errors.first_name}
                placeholder="Your first name"
                autoComplete="given-name"
                autoCapitalize="words"
                editable={!busy}
                maxLength={255}
              />
              <Field
                label="Last name"
                value={form.last_name}
                onChangeText={(value) => change('last_name', value)}
                error={errors.last_name}
                placeholder="Your last name"
                autoComplete="family-name"
                autoCapitalize="words"
                editable={!busy}
                maxLength={255}
              />
              <Field
                label="Username"
                required
                value={form.username}
                onChangeText={(value) => change('username', value)}
                error={errors.username}
                placeholder="Your username"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!busy}
                maxLength={255}
              />
            </Card>
            <Card>
              <Text style={ui.heading}>Contact details</Text>
              <View style={{ gap: 5 }}>
                <Text style={styles.label}>Email address</Text>
                <View
                  style={[
                    ui.input,
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: palette.bg,
                    },
                  ]}
                >
                  <Mail size={16} color={palette.muted} />
                  <Text
                    selectable
                    style={{ flex: 1, fontSize: 14, color: palette.muted }}
                  >
                    {profile.data.email || 'No email address'}
                  </Text>
                </View>
                <Text style={[ui.muted, { fontSize: 11 }]}>
                  Your sign-in email is managed separately.
                </Text>
              </View>
              <Field
                label="Phone number"
                value={form.phone}
                onChangeText={(value) => change('phone', value)}
                error={errors.phone}
                placeholder="08012345678"
                autoComplete="tel"
                keyboardType="phone-pad"
                editable={!busy}
                maxLength={30}
              />
              <Field
                label="City"
                value={form.city}
                onChangeText={(value) => change('city', value)}
                error={errors.city}
                placeholder="Your city"
                autoCapitalize="words"
                editable={!busy}
                maxLength={255}
              />
              <Text style={[ui.muted, { fontSize: 11 }]}>
                To browse pickup in another area, use the location selector on
                Home or Explore.
              </Text>
            </Card>
          </PageScroll>
        )}
        <ConfirmDialog
          open={discardOpen}
          onClose={() => setDiscardOpen(false)}
          title="Discard changes?"
          message="Your unsaved profile changes will be lost."
          primaryLabel="Discard changes"
          destructive
          onPrimary={() => {
            setDiscardOpen(false);
            setAllowLeave(true);
          }}
          secondaryLabel="Keep editing"
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: palette.ink },
  error: { fontSize: 12, lineHeight: 18, color: palette.red },
  camera: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.orange,
    borderWidth: 2,
    borderColor: '#fff',
  },
});

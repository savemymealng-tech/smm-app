import { useState } from 'react';
import { Text, Linking, Share, Platform } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useSetAtom } from 'jotai';
import {
  UserRound,
  KeyRound,
  Mail,
  FileText,
  ShieldCheck,
  Star,
  Share2,
  Trash2,
} from 'lucide-react-native';
import {
  Screen,
  PageScroll,
  Card,
  MenuRow,
  ui,
} from '@/components/ui/screen-kit';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Text as DialogText } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { passwordResetContextAtom } from '@/lib/atoms/auth';
import { useProfile, useDeleteAccount } from '@/lib/hooks/use-profile';
import { useProtectedRoute } from '@/lib/hooks/use-protected-route';
export default function SettingsScreen() {
  const { isAuthenticated, isLoading } = useProtectedRoute();
  const { data: user } = useProfile();
  const deletion = useDeleteAccount();
  const setResetContext = useSetAtom(passwordResetContextAtom);
  const [confirm, setConfirm] = useState(false);
  const [reset, setReset] = useState(false);
  const [sending, setSending] = useState(false);
  async function open(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      toast.error(
        'Unable to open link',
        'Please try again or email support@savemymeal.com.',
      );
    }
  }
  async function password() {
    if (sending) return;
    setSending(true);
    try {
      if (!user?.email)
        throw new Error('Add an email address to your profile first.');
      await api.auth.forgotPassword(user.email);
      setResetContext({ email: user.email, code: null });
      setReset(false);
      router.push('/verify-reset-code');
    } catch (error) {
      toast.error('Could not send code', (error as Error).message);
    } finally {
      setSending(false);
    }
  }
  async function remove() {
    try {
      await deletion.mutateAsync();
      setConfirm(false);
      router.replace('/login');
    } catch (error) {
      toast.error(
        'Unable to delete account',
        (error as Error).message || 'Please try again.',
      );
    }
  }
  if (isLoading || !isAuthenticated) return null;
  return (
    <Screen title="Settings">
      <PageScroll>
        <Card>
          <Text style={ui.heading}>Account</Text>
          <MenuRow
            icon={UserRound}
            label="Edit profile"
            onPress={() => router.push('/edit-profile')}
          />
          <MenuRow
            icon={KeyRound}
            label={sending ? 'Sending reset code…' : 'Change password'}
            detail="Verify a code sent to your email"
            onPress={() => !sending && setReset(true)}
          />
        </Card>
        <Card>
          <Text style={ui.heading}>Support & legal</Text>
          <MenuRow
            icon={Mail}
            label="Contact support"
            detail="support@savemymeal.com"
            onPress={() => void open('mailto:support@savemymeal.com')}
          />
          <MenuRow
            icon={FileText}
            label="Terms of service"
            onPress={() => void open('https://savemymeal.com/terms')}
          />
          <MenuRow
            icon={ShieldCheck}
            label="Privacy policy"
            onPress={() => void open('https://savemymeal.com/privacy')}
          />
        </Card>
        <Card>
          <Text style={ui.heading}>Savemymeal</Text>
          <MenuRow
            icon={Star}
            label="Rate the app"
            onPress={() =>
              void open(
                Platform.OS === 'ios'
                  ? 'https://apps.apple.com/app/id6795679400?action=write-review'
                  : 'https://play.google.com/store/apps/details?id=com.savemymeal.app',
              )
            }
          />
          <MenuRow
            icon={Share2}
            label="Share Savemymeal"
            detail="Help someone discover their next meal"
            onPress={() =>
              void Share.share({
                message:
                  'Discover great meals for pickup on Savemymeal. https://savemymeal.com',
              }).catch(() => {})
            }
          />
          <Text style={ui.muted}>
            Version {Constants.expoConfig?.version || '1.0.0'} · Pickup orders,
            securely paid through Paystack.
          </Text>
        </Card>
        <Card>
          <MenuRow
            icon={Trash2}
            label="Delete account"
            detail="Permanently delete your account"
            danger
            onPress={() => setConfirm(true)}
          />
        </Card>
      </PageScroll>
      <ConfirmDialog
        busy={sending}
        open={reset}
        onClose={() => setReset(false)}
        title="Change your password"
        message={`We will send a verification code to ${user?.email || 'your email'}.`}
        primaryLabel={sending ? 'Sending…' : 'Send reset code'}
        onPrimary={() => void password()}
        secondaryLabel="Cancel"
        onSecondary={() => setReset(false)}
      />
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent compact>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your account. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <DialogText>Keep account</DialogText>
            </AlertDialogCancel>
            <AlertDialogAction
              tone="destructive"
              disabled={deletion.isPending}
              onPress={() => void remove()}
            >
              <DialogText>
                {deletion.isPending ? 'Deleting…' : 'Delete account'}
              </DialogText>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Screen>
  );
}

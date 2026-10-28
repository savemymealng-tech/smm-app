import { router } from 'expo-router';
import { Text, View, ActivityIndicator } from 'react-native';
import { ShoppingBag, Gift, Star, Settings, Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import {
  Screen,
  PageScroll,
  Card,
  MenuRow,
  Action,
  Message,
  ui,
} from '@/components/ui/screen-kit';
import { AppImage } from '@/components/ui/app-image';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { clearAuthStateAtom } from '@/lib/atoms/auth';
import { growthApi } from '@/lib/api/growth';
import { useProfile } from '@/lib/hooks/use-profile';
import { useProtectedRoute } from '@/lib/hooks/use-protected-route';
import { getImageSource } from '@/lib/utils';
export default function ProfileScreen() {
  const { isAuthenticated, isLoading: authLoading } = useProtectedRoute();
  const profile = useProfile();
  const user = profile.data;
  const config = useQuery({
    queryKey: ['growth-config'],
    queryFn: growthApi.config,
    enabled: isAuthenticated,
  });
  const clear = useSetAtom(clearAuthStateAtom);
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');
  async function logout() {
    setLeaving(true);
    try {
      await queryClient.cancelQueries();
      await clear();
      queryClient.clear();
      router.replace('/');
    } catch {
      setError('Unable to sign out. Please try again.');
    } finally {
      setLeaving(false);
      setConfirm(false);
    }
  }
  if (authLoading || !isAuthenticated) return null;
  return (
    <Screen title="Account" back={false}>
      <PageScroll contentContainerStyle={{ paddingBottom: 100 }}>
        {profile.isLoading ? (
          <ActivityIndicator color="#008236" />
        ) : profile.isError ? (
          <Message
            title="Could not load your profile"
            onRetry={() => void profile.refetch()}
          />
        ) : (
          <Card>
            <View style={ui.row}>
              <AppImage
                source={getImageSource(user?.profile_picture_url)}
                fallbackSource={require('@/assets/images/default-profile.jpg')}
                style={{ width: 64, height: 64, borderRadius: 32 }}
              />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={ui.heading}>
                  {[user?.first_name, user?.last_name]
                    .filter(Boolean)
                    .join(' ') ||
                    user?.username ||
                    'Your account'}
                </Text>
                <Text style={ui.muted}>{user?.email || user?.phone}</Text>
              </View>
            </View>
            <MenuRow
              icon={Pencil}
              label="Edit profile"
              detail="Name, photo and contact details"
              onPress={() => router.push('/edit-profile')}
            />
          </Card>
        )}
        <Card>
          <Text style={ui.heading}>Your activity</Text>
          <MenuRow
            icon={ShoppingBag}
            label="Orders"
            detail="Track payments and pickups"
            onPress={() => router.push('/orders')}
          />
          {(config.data?.coins_enabled || config.data?.referrals_enabled) && (
            <MenuRow
              icon={Gift}
              label="SMM Coin & referrals"
              detail="Your rewards and invitations"
              onPress={() => router.push('/rewards')}
            />
          )}
          <MenuRow
            icon={Star}
            label="My reviews"
            onPress={() => router.push('/my-reviews')}
          />
          <MenuRow
            icon={Settings}
            label="Settings"
            onPress={() => router.push('/settings')}
          />
        </Card>
        {error && <Text style={ui.muted}>{error}</Text>}
        <Action
          secondary
          danger
          label="Sign out"
          busy={leaving}
          onPress={() => setConfirm(true)}
        />
        <Text style={[ui.muted, { textAlign: 'center' }]}>
          Savemymeal · {Constants.expoConfig?.version || '1.0.0'}
        </Text>
      </PageScroll>
      <ConfirmDialog
        busy={leaving}
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Sign out?"
        message="You can sign in again to view your orders and rewards."
        primaryLabel="Sign out"
        onPrimary={() => void logout()}
        secondaryLabel="Stay signed in"
        onSecondary={() => setConfirm(false)}
      />
    </Screen>
  );
}

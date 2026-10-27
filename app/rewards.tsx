import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  Share,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { growthApi } from '@/lib/api/growth';
import { useProtectedRoute } from '@/lib/hooks/use-protected-route';
export default function RewardsScreen() {
  useProtectedRoute();
  const config = useQuery({
    queryKey: ['growth-config'],
    queryFn: growthApi.config,
  });
  const rewards = useQuery({
    queryKey: ['rewards'],
    queryFn: growthApi.rewards,
    enabled: Boolean(
      config.data?.coins_enabled || config.data?.referrals_enabled,
    ),
    refetchOnMount: 'always',
  });
  const data = rewards.data;
  return (
    <SafeAreaView className="flex-1 bg-[#f8f8f0]">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <Pressable onPress={() => router.back()}>
          <Text className="text-[#008236]">← Back</Text>
        </Pressable>
        <Text className="mt-6 text-3xl font-bold">SMM Coin & referrals</Text>
        <Text className="mt-2 text-gray-600">
          Share good food. Earn toward your next meal.
        </Text>
        {config.isLoading || rewards.isLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color="#008236" />
        ) : config.isError || rewards.isError ? (
          <View>
            <Text className="mt-6 text-red-700">
              {String(
                (rewards.error || config.error)?.message ||
                  'Unable to load rewards',
              )}
            </Text>
            <Pressable
              onPress={() => {
                void config.refetch();
                void rewards.refetch();
              }}
            >
              <Text className="mt-4 text-[#008236]">Try again</Text>
            </Pressable>
          </View>
        ) : !config.data?.referrals_enabled && !config.data?.coins_enabled ? (
          <Text className="mt-8">Rewards are not available yet.</Text>
        ) : (
          data && (
            <>
              {data.coins_enabled && (
                <View className="mt-6 rounded-2xl bg-[#008236] p-6">
                  <Text className="text-white">Available SMM Coin</Text>
                  <Text className="mt-2 text-4xl font-bold text-white">
                    {data.account.available.toLocaleString()}
                  </Text>
                  <Text className="mt-2 text-white">
                    Worth ₦
                    {(
                      (data.account.available * (data.coin_value_kobo || 0)) /
                      100
                    ).toLocaleString()}
                  </Text>
                  <Text className="mt-3 text-white">
                    Reserved at checkout: {data.account.reserved}
                  </Text>
                  {data.account.debt > 0 && (
                    <Text className="mt-2 text-white">
                      Rewards to offset after refunds: {data.account.debt}. New
                      earnings settle this first.
                    </Text>
                  )}
                  <Text className="mt-3 text-sm text-white">
                    Use coins at checkout, subject to the current offer’s limit.
                    Coins cannot be withdrawn as cash.
                  </Text>
                </View>
              )}
              {data.referrals_enabled && data.code && (
                <View className="mt-6 rounded-2xl bg-white p-6">
                  <Text className="text-lg font-bold">Invite a friend</Text>
                  <Text className="mt-4 text-2xl font-bold text-[#008236]">
                    {data.code}
                  </Text>
                  <Text className="mt-3">
                    Your code has {data.stats.signups} attributed signups.
                    Rewards are earned after an eligible referred purchase is
                    paid and fulfilled.
                  </Text>
                  <Pressable
                    onPress={() =>
                      void Share.share({
                        message: `Join me on SaveMyMeal! Enter ${data.code} during signup. ${data.referral_link}`,
                      })
                    }
                    className="mt-5 rounded-xl bg-[#008236] p-4"
                  >
                    <Text className="text-center font-semibold text-white">
                      Share my invite
                    </Text>
                  </Pressable>
                  {data.attributed_code && (
                    <Text className="mt-4 text-sm text-gray-500">
                      You joined with {data.attributed_code}.
                    </Text>
                  )}
                </View>
              )}
              {data.partner_codes?.map((code) => (
                <View key={code.code} className="mt-4 rounded-xl bg-white p-5">
                  <Text className="font-semibold">
                    {code.partner_name} · {code.active ? 'Active' : 'Paused'}
                  </Text>
                  <Text className="mt-2 text-xl font-bold text-[#008236]">
                    {code.code}
                  </Text>
                  <Pressable
                    onPress={() =>
                      void Share.share({
                        message: `Join SaveMyMeal with ${code.code}: https://savemymeal.com/ref/${code.code}`,
                      })
                    }
                  >
                    <Text className="mt-3 text-[#008236]">
                      Share partner invite
                    </Text>
                  </Pressable>
                </View>
              ))}
              {data.pending_checkouts?.map((checkout) => (
                <View
                  key={checkout.id}
                  className="mt-4 rounded-xl bg-white p-5"
                >
                  <Text className="font-semibold">Unfinished checkout</Text>
                  <Text className="mt-2">
                    ₦{(checkout.payable_kobo / 100).toLocaleString()} ·{' '}
                    {new Date(checkout.createdAt).toLocaleDateString()}
                  </Text>
                  <Text className="mt-2 text-sm text-gray-500">
                    Complete or verify the payment from your orders.
                    Reservations can be released once no payment is pending.
                  </Text>
                  <Pressable
                    onPress={async () => {
                      try {
                        await growthApi.release(checkout.id);
                        void rewards.refetch();
                      } catch (error) {
                        alert(
                          (error as Error).message ||
                            'Verify your payment from orders first.',
                        );
                      }
                    }}
                  >
                    <Text className="mt-3 text-[#008236]">
                      Release unused reservation
                    </Text>
                  </Pressable>
                </View>
              ))}
              <Text className="mb-3 mt-8 text-xl font-semibold">
                Coin activity
              </Text>
              {!data.entries.length ? (
                <Text>No coin activity yet.</Text>
              ) : (
                data.entries.map((entry) => (
                  <View key={entry.id} className="mb-3 rounded-xl bg-white p-4">
                    <View className="flex-row justify-between">
                      <Text className="flex-1 font-semibold">{entry.note}</Text>
                      <Text className="font-bold text-[#008236]">
                        {entry.available_delta > 0 ? '+' : ''}
                        {entry.available_delta}
                      </Text>
                    </View>
                    <Text className="mt-2 text-xs text-gray-500">
                      {new Date(entry.createdAt).toLocaleString()} ·{' '}
                      {entry.kind.replace(/_/g, ' ')}
                    </Text>
                  </View>
                ))
              )}
            </>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

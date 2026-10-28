import { Coins } from 'lucide-react-native';
import { formatMoney as formatCurrency } from '@/lib/order-display';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, Share } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Screen,
  PageScroll,
  Card,
  Action,
  Message,
  Badge,
  AmountRow,
  ui,
  palette,
} from '@/components/ui/screen-kit';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { growthApi } from '@/lib/api/growth';
import { useProtectedRoute } from '@/lib/hooks/use-protected-route';
export default function RewardsScreen() {
  const { isAuthenticated, isLoading: authLoading } = useProtectedRoute();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'coins' | 'referrals'>('coins');
  const [release, setRelease] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState('');
  const config = useQuery({
    queryKey: ['growth-config'],
    queryFn: growthApi.config,
    enabled: isAuthenticated,
  });
  const enabled = Boolean(
    config.data?.coins_enabled || config.data?.referrals_enabled,
  );
  const rewards = useQuery({
    queryKey: ['rewards'],
    queryFn: growthApi.rewards,
    enabled: isAuthenticated && enabled,
    refetchOnMount: 'always',
  });
  const activity = useInfiniteQuery({
    queryKey: ['coin-activity'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => growthApi.activity(pageParam),
    getNextPageParam: (last) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
    enabled: isAuthenticated && Boolean(config.data?.coins_enabled),
  });
  const data = rewards.data;
  const coinTab =
    Boolean(config.data?.coins_enabled) &&
    (tab === 'coins' || !config.data?.referrals_enabled);
  async function releaseReservation() {
    if (!release || busy) return;
    setBusy(true);
    try {
      await growthApi.release(release);
      setRelease(null);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['rewards'] }),
        qc.invalidateQueries({ queryKey: ['coin-activity'] }),
        qc.invalidateQueries({ queryKey: ['orders'] }),
      ]);
      setMessage('Reservation released and its unpaid orders cancelled.');
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function copy(code: string) {
    try {
      await Clipboard.setStringAsync(code);
      setCopied(code);
    } catch {
      setMessage('Could not copy this code. Please try sharing it.');
    }
  }
  async function share(code: string, link?: string | null) {
    try {
      await Share.share({
        message: `Join me on Savemymeal! Enter ${code} during signup. ${link || `https://savemymeal.com/ref/${encodeURIComponent(code)}`}`,
      });
    } catch {
      setMessage('Could not open sharing. Please try copying your code.');
    }
  }
  if (authLoading || !isAuthenticated) return null;
  return (
    <Screen title="Rewards">
      <PageScroll>
        {config.isLoading || rewards.isLoading ? (
          <ActivityIndicator color={palette.green} />
        ) : config.isError || rewards.isError ? (
          <Message
            title="Unable to load rewards"
            body={(config.error || rewards.error)?.message}
            onRetry={() => {
              void config.refetch();
              void rewards.refetch();
            }}
          />
        ) : !enabled ? (
          <Message
            title="Rewards are not available yet"
            body="Check back for SMM Coin and referral offers."
          />
        ) : (
          data && (
            <>
              {data.coins_enabled && data.referrals_enabled && (
                <View
                  style={[
                    ui.row,
                    {
                      backgroundColor: '#e8eeea',
                      padding: 4,
                      borderRadius: 12,
                    },
                  ]}
                >
                  {(['coins', 'referrals'] as const).map((t) => (
                    <Pressable
                      key={t}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: tab === t }}
                      onPress={() => setTab(t)}
                      style={{
                        flex: 1,
                        minHeight: 44,
                        borderRadius: 9,
                        backgroundColor: tab === t ? '#fff' : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={tab === t ? ui.link : ui.muted}>
                        {t === 'coins' ? 'SMM Coin' : 'Referrals'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {coinTab ? (
                <>
                  <Card>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          padding: 8,
                          borderRadius: 10,
                          backgroundColor: palette.orangeSurface,
                        }}
                      >
                        <Coins size={20} color={palette.orangeInk} />
                      </View>
                      <Text style={ui.muted}>Available SMM Coin</Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 32,
                        fontWeight: '700',
                        color: palette.orangeInk,
                      }}
                    >
                      {data.account.available.toLocaleString()}
                    </Text>
                    <Text style={ui.heading}>
                      {formatCurrency(
                        (data.account.available * (data.coin_value_kobo || 0)) /
                          100,
                      )}{' '}
                      to use at checkout
                    </Text>
                    <View style={ui.line} />
                    <AmountRow
                      label="Reserved for unfinished checkouts"
                      value={data.account.reserved.toLocaleString()}
                    />
                    <Text style={ui.muted}>
                      Apply coins at checkout within the current redemption
                      limit. Coins cannot be withdrawn as cash.
                    </Text>
                    {data.account.debt > 0 && (
                      <Text style={ui.muted}>
                        A refund adjustment of {data.account.debt} coins will be
                        settled from future earnings.
                      </Text>
                    )}
                  </Card>
                  {data.pending_checkouts.length > 0 && (
                    <Card>
                      <Text style={ui.heading}>Unfinished checkouts</Text>
                      <Text style={ui.muted}>
                        Check the payment in Orders first. Releasing a
                        reservation cancels all unpaid orders in that checkout.
                      </Text>
                      <Action
                        secondary
                        label="View orders"
                        onPress={() => router.push('/orders')}
                      />
                      {data.pending_checkouts.map((c) => (
                        <View
                          key={c.id}
                          style={{
                            gap: 8,
                            paddingTop: 12,
                            borderTopWidth: 1,
                            borderTopColor: palette.border,
                          }}
                        >
                          <AmountRow
                            label={new Date(c.createdAt).toLocaleDateString()}
                            value={formatCurrency(c.payable_kobo / 100)}
                          />
                          <Action
                            secondary
                            label="Release unused reservation"
                            onPress={() => {
                              setMessage('');
                              setRelease(c.id);
                            }}
                          />
                        </View>
                      ))}
                    </Card>
                  )}
                  <Card>
                    <Text style={ui.heading}>Coin activity</Text>
                    {activity.isLoading ? (
                      <ActivityIndicator color={palette.green} />
                    ) : activity.isError ? (
                      <Message
                        title="Unable to load activity"
                        onRetry={() => void activity.refetch()}
                      />
                    ) : !activity.data?.pages[0].data.length ? (
                      <Text style={ui.muted}>
                        Your coin earnings and spending will appear here.
                      </Text>
                    ) : (
                      activity.data.pages
                        .flatMap((p) => p.data)
                        .map((e) => (
                          <View
                            key={e.id}
                            style={{
                              paddingVertical: 10,
                              gap: 4,
                              borderBottomWidth: 1,
                              borderBottomColor: palette.border,
                            }}
                          >
                            <AmountRow
                              label={e.kind.replace(/_/g, ' ')}
                              value={`${e.available_delta > 0 ? '+' : ''}${e.available_delta} available`}
                            />
                            <Text style={ui.body}>{e.note}</Text>
                            {e.reserved_delta !== 0 && (
                              <Text style={ui.muted}>
                                {e.reserved_delta > 0 ? '+' : ''}
                                {e.reserved_delta} reserved
                              </Text>
                            )}
                            <Text style={ui.muted}>
                              {new Date(e.createdAt).toLocaleString()}
                            </Text>
                          </View>
                        ))
                    )}
                    {activity.hasNextPage && (
                      <Action
                        secondary
                        busy={activity.isFetchingNextPage}
                        label="Load more activity"
                        onPress={() => void activity.fetchNextPage()}
                      />
                    )}
                  </Card>
                </>
              ) : (
                <>
                  <Card>
                    <Text style={ui.heading}>Invite someone to Savemymeal</Text>
                    <Text style={ui.muted}>
                      Share your code for signup. Benefits depend on an active
                      campaign and an eligible paid, fulfilled order.
                    </Text>
                    {data.code ? (
                      <>
                        <View
                          style={{
                            backgroundColor: '#edf7f0',
                            padding: 16,
                            borderRadius: 12,
                          }}
                        >
                          <Text
                            selectable
                            style={{
                              fontSize: 24,
                              fontWeight: '700',
                              letterSpacing: 2,
                              color: palette.green,
                            }}
                          >
                            {data.code}
                          </Text>
                        </View>
                        <View style={ui.row}>
                          <View style={{ flex: 1 }}>
                            <Action
                              secondary
                              label={
                                copied === data.code ? 'Copied' : 'Copy code'
                              }
                              onPress={() => void copy(data.code!)}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Action
                              label="Share invite"
                              tone="accent"
                              onPress={() =>
                                void share(data.code!, data.referral_link)
                              }
                            />
                          </View>
                        </View>
                      </>
                    ) : (
                      <Text style={ui.muted}>
                        Your personal referral code is not available yet.
                      </Text>
                    )}
                    <AmountRow
                      label="Signups using your code"
                      value={String(data.stats.signups)}
                    />
                    {data.attributed_code && (
                      <Text style={ui.muted}>
                        You joined with {data.attributed_code}.
                      </Text>
                    )}
                  </Card>
                  {data.partner_codes.map((c) => (
                    <Card key={c.code}>
                      <View style={ui.between}>
                        <Text style={ui.heading}>
                          {c.partner_name || 'Partner invite'}
                        </Text>
                        <Badge
                          neutral={!c.active}
                          label={c.active ? 'Active' : 'Paused'}
                        />
                      </View>
                      <Text selectable style={ui.heading}>
                        {c.code}
                      </Text>
                      {c.active ? (
                        <View style={ui.row}>
                          <View style={{ flex: 1 }}>
                            <Action
                              secondary
                              label={copied === c.code ? 'Copied' : 'Copy'}
                              onPress={() => void copy(c.code)}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Action
                              label="Share"
                              onPress={() => void share(c.code)}
                            />
                          </View>
                        </View>
                      ) : (
                        <Text style={ui.muted}>
                          This invite is paused and cannot be used for new
                          referrals.
                        </Text>
                      )}
                    </Card>
                  ))}
                </>
              )}
              {message && (
                <Text accessibilityRole="alert" style={ui.body}>
                  {message}
                </Text>
              )}
            </>
          )
        )}
      </PageScroll>
      <ConfirmDialog
        busy={busy}
        destructive
        error={message}
        open={!!release}
        onClose={() => !busy && setRelease(null)}
        title="Release this reservation?"
        message="All unpaid orders in this checkout will be cancelled. If a payment is pending, check its status in Orders first."
        primaryLabel={busy ? 'Releasing…' : 'Release & cancel orders'}
        onPrimary={() => void releaseReservation()}
        secondaryLabel="Keep checkout"
        onSecondary={() => !busy && setRelease(null)}
      />
    </Screen>
  );
}

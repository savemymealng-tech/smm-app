import { ActivityIndicator, Pressable } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function DetailRefreshButton({
  refreshing,
  onRefresh,
  label,
}: {
  refreshing: boolean;
  onRefresh: () => void;
  label: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: refreshing, disabled: refreshing }}
      disabled={refreshing}
      onPress={onRefresh}
      hitSlop={6}
      style={{
        position: 'absolute',
        top: insets.top + 12,
        right: 16,
        zIndex: 100,
        elevation: 8,
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#dce4df',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      }}
    >
      {refreshing ? (
        <ActivityIndicator color="#008236" size="small" />
      ) : (
        <RefreshCw
          accessible={false}
          size={21}
          color="#008236"
          strokeWidth={1.9}
        />
      )}
    </Pressable>
  );
}

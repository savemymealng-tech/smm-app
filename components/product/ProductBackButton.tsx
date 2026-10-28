import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
export function ProductBackButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back from product"
      hitSlop={6}
      onPress={() =>
        router.canGoBack() ? router.back() : router.replace('/(tabs)/explore')
      }
      style={{
        position: 'absolute',
        top: insets.top + 12,
        left: 16,
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
        shadowOpacity: 0.18,
        shadowRadius: 4,
      }}
    >
      <ArrowLeft size={22} color="#17251d" />
    </Pressable>
  );
}

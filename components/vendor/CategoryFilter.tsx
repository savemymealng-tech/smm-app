import { Pressable, ScrollView, Text, View } from "react-native";
import { palette } from "@/components/ui/screen-kit";
import type { VendorMenuCategory } from "@/lib/vendor-menu";

type CategoryFilterProps = {
  categories: VendorMenuCategory[];
  total: number;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
};

export function CategoryFilter({
  categories,
  total,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  if (!categories.length) return null;
  const tabs = [{ key: null, label: "All", count: total }, ...categories];
  return (
    <View
      style={{
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
      >
        {tabs.map((category) => {
          const selected = selectedCategory === category.key;
          return (
            <Pressable
              key={category.key ?? "all"}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`${category.label}, ${category.count} items`}
              onPress={() => onSelectCategory(category.key)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
                minHeight: 44,
                paddingHorizontal: 12,
                borderRadius: 12,
                borderWidth: 1,
                backgroundColor: selected ? palette.green : "#fff",
                borderColor: selected ? palette.green : palette.border,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                numberOfLines={1}
                style={{
                  maxWidth: 170,
                  fontSize: 13,
                  fontWeight: "600",
                  color: selected ? "#fff" : palette.ink,
                }}
              >
                {category.label}
              </Text>
              <View
                style={{
                  borderRadius: 6,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  backgroundColor: selected
                    ? "rgba(255,255,255,0.18)"
                    : palette.greenSurface,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: selected ? "#fff" : palette.green,
                  }}
                >
                  {category.count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

import { Pressable, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { formatCurrency } from "@/lib/utils";
import type { Customization } from "@/types";

interface ProductCustomizationsProps {
  customizations: Customization[];
  selectedCustomizations: Record<string, string[]>;
  onToggleCustomization: (
    customizationId: string,
    optionId: string
  ) => void;
}

export function ProductCustomizations({
  customizations,
  selectedCustomizations,
  onToggleCustomization,
}: ProductCustomizationsProps) {
  return (
    <View className="mx-4 mb-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <Text className="text-lg font-bold text-gray-900 mb-4">
        Customize Your Order
      </Text>
      {customizations.map((customization) => (
        <View key={customization.id} className="mb-5 last:mb-0">
          <View className="flex-row items-center mb-3">
            <Text className="font-semibold text-base text-gray-900">
              {customization.name}
            </Text>
            {customization.required && (
              <Text className="text-red-600 ml-1 font-bold">*</Text>
            )}
            {customization.type === "multiple" && (
              <Text className="text-gray-500 text-xs ml-2">
                (Select multiple)
              </Text>
            )}
          </View>
          {customization.options.map((option) => {
            const isSelected = selectedCustomizations[customization.id]?.includes(
              option.id
            );
            return (
              <Pressable
                key={option.id}
                onPress={() =>
                  onToggleCustomization(customization.id, option.id)
                }
                className={`flex-row items-center justify-between p-4 mb-2.5 rounded-xl border-2 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                      customization.type === "single"
                        ? "rounded-full"
                        : "rounded"
                    } ${
                      isSelected
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <IconSymbol
                        name={
                          customization.type === "single"
                            ? "checkmark"
                            : "checkmark"
                        }
                        size={12}
                        color="white"
                      />
                    )}
                  </View>
                  <Text
                    className={`flex-1 ${
                      isSelected
                        ? "font-semibold text-gray-900"
                        : "text-gray-700"
                    }`}
                  >
                    {option.name}
                  </Text>
                </View>
                {option.price > 0 && (
                  <Text
                    className={`font-semibold ml-3 ${
                      isSelected ? "text-blue-600" : "text-gray-600"
                    }`}
                  >
                    +{formatCurrency(option.price)}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}


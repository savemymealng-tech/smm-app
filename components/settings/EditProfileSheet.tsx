import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { useUpdateProfile, useUploadProfilePicture } from '@/lib/hooks/use-profile';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';

type ProfileData = {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  city: string;
  avatar?: string;
};

type EditProfileSheetProps = {
  visible: boolean;
  onClose: () => void;
  profileData: ProfileData;
  onProfileDataChange: (data: ProfileData) => void;
};

export function EditProfileSheet({
  visible,
  onClose,
  profileData,
  onProfileDataChange,
}: EditProfileSheetProps) {
  const updateProfileMutation = useUpdateProfile();
  const uploadPictureMutation = useUploadProfilePicture();

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        toast.error('Permission Denied', 'We need camera roll permissions to update your profile picture.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onProfileDataChange({ ...profileData, avatar: result.assets[0].uri });
        toast.success('Photo Selected', 'Your profile photo will be updated when you save.');
      }
    } catch (error) {
      toast.error('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSaveProfile = async () => {
    if (!profileData.firstName || !profileData.username) {
      toast.warning('Missing Fields', 'First name and username are required.');
      return;
    }

    try {
      // Upload profile picture first if selected
      if (profileData.avatar) {
        await uploadPictureMutation.mutateAsync({ 
          uri: profileData.avatar,
          type: 'image/jpeg'
        });
      }

      // Then update profile data
      await updateProfileMutation.mutateAsync({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        username: profileData.username,
        phone: profileData.phone,
        city: profileData.city,
      });
      
      toast.success('Profile Updated', 'Your profile has been updated successfully!');
      onClose();
    } catch (error: any) {
      toast.error('Update Failed', error.error || error.message || 'Failed to update profile. Please try again.');
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Edit Profile">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 24,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={true}
        bounces={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        >
        {/* Profile Picture Section */}
        <View className="items-center mb-6">
          {profileData.avatar ? (
            <Image
              source={{ uri: profileData.avatar }}
              className="w-24 h-24 rounded-full mb-3"
              resizeMode="cover"
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-blue-600 items-center justify-center mb-3">
              <Text className="text-white text-4xl font-bold">
                {profileData.firstName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <Pressable onPress={pickImage}>
            <View className="flex-row items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
              <IconSymbol name="camera.fill" size={16} color="#3b82f6" />
              <Text className="text-blue-600 font-semibold text-sm">
                {profileData.avatar ? 'Change Photo' : 'Add Photo'}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Form Fields */}
        <View className="mb-6">
          <Input
            label="First Name"
            placeholder="Enter your first name"
            value={profileData.firstName}
            onChangeText={(text) => onProfileDataChange({ ...profileData, firstName: text })}
            isRequired
          />
        </View>

        <View className="mb-6">
          <Input
            label="Last Name"
            placeholder="Enter your last name"
            value={profileData.lastName}
            onChangeText={(text) => onProfileDataChange({ ...profileData, lastName: text })}
          />
        </View>

        <View className="mb-6">
          <Input
            label="Username"
            placeholder="Enter your username"
            value={profileData.username}
            onChangeText={(text) => onProfileDataChange({ ...profileData, username: text })}
            autoCapitalize="none"
            isRequired
          />
        </View>

        <View className="mb-6">
          <Input
            label="Phone Number"
            placeholder="Enter your phone number"
            value={profileData.phone}
            onChangeText={(text) => onProfileDataChange({ ...profileData, phone: text })}
            keyboardType="phone-pad"
          />
        </View>

        <View className="mb-6">
          <Input
            label="City"
            placeholder="Enter your city"
            value={profileData.city}
            onChangeText={(text) => onProfileDataChange({ ...profileData, city: text })}
          />
        </View>

        {/* Save Button */}
        <Button 
          onPress={handleSaveProfile} 
          disabled={updateProfileMutation.isPending || uploadPictureMutation.isPending}
          className="mb-4"
          size="lg"
        >
          {(updateProfileMutation.isPending || uploadPictureMutation.isPending) ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-semibold">Save Changes</Text>
          )}
        </Button>
      </ScrollView>
    </BottomSheet>
  );
}

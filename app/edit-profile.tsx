import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { useProfile, useUpdateProfile, useUploadProfilePicture } from '@/lib/hooks/use-profile';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getImageSource } from '@/lib/utils';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: user } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const uploadPictureMutation = useUploadProfilePicture();

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    city: '',
    avatar: '',
  });

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        username: user.username || '',
        phone: user.phone || '',
        city: user.city || '',
        avatar: user.profile_picture_url || '',
      });
    }
  }, [user]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        toast.error('Permission Denied', 'We need camera roll permissions to update your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileData({ ...profileData, avatar: result.assets[0].uri });
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
      // Upload profile picture first if it's a new local image
      if (profileData.avatar && profileData.avatar.startsWith('file://')) {
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
      router.back();
    } catch (error: any) {
      toast.error('Update Failed', error.message || 'Failed to update profile. Please try again.');
    }
  };

  const isLoading = updateProfileMutation.isPending || uploadPictureMutation.isPending;

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      {/* <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <IconSymbol name="arrow.back" size={24} color="#000" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">Edit Profile</Text>
        <View className="w-10" />
      </View> */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}
      >
        {/* Profile Picture Section */}
        <View className="items-center my-8">
          {profileData.avatar ? (
            <Image
              source={getImageSource(profileData.avatar)}
              className="w-32 h-32 rounded-full mb-4"
              resizeMode="cover"
            />
          ) : (
            <View className="w-32 h-32 rounded-full bg-blue-600 items-center justify-center mb-4">
              <Text className="text-white text-5xl font-bold">
                {profileData.firstName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <Pressable onPress={pickImage} disabled={isLoading}>
            <View className="flex-row items-center gap-2 bg-gray-100 px-6 py-3 rounded-full">
              <IconSymbol name="camera.fill" size={18} color="#3b82f6" />
              <Text className="text-blue-600 font-semibold">
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
            onChangeText={(text) => setProfileData({ ...profileData, firstName: text })}
            isRequired
            editable={!isLoading}
          />
        </View>

        <View className="mb-6">
          <Input
            label="Last Name"
            placeholder="Enter your last name"
            value={profileData.lastName}
            onChangeText={(text) => setProfileData({ ...profileData, lastName: text })}
            editable={!isLoading}
          />
        </View>

        <View className="mb-6">
          <Input
            label="Username"
            placeholder="Enter your username"
            value={profileData.username}
            onChangeText={(text) => setProfileData({ ...profileData, username: text })}
            autoCapitalize="none"
            isRequired
            editable={!isLoading}
          />
        </View>

        <View className="mb-6">
          <Input
            label="Phone Number"
            placeholder="Enter your phone number"
            value={profileData.phone}
            onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
            keyboardType="phone-pad"
            editable={!isLoading}
          />
        </View>

        <View className="mb-6">
          <Input
            label="City"
            placeholder="Enter your city"
            value={profileData.city}
            onChangeText={(text) => setProfileData({ ...profileData, city: text })}
            editable={!isLoading}
          />
        </View>

        {/* Save Button */}
        <Button 
          onPress={handleSaveProfile} 
          disabled={isLoading}
          className="mt-4"
          size="lg"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-semibold text-white">Save Changes</Text>
          )}
        </Button>
      </ScrollView>
    </View>
  );
}

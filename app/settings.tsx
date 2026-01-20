import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { useProfile, useUpdateProfile } from '@/lib/hooks/use-profile';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: user, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    newVendors: false,
    recommendations: true
  });
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    city: '',
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        username: user.username || '',
        phone: user.phone || '',
        city: user.city || '',
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!profileData.firstName || !profileData.username) {
      Alert.alert('Error', 'First name and username are required.');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        username: profileData.username,
        phone: profileData.phone,
        city: profileData.city,
      });
      
      Alert.alert(
        'Success', 
        'Profile updated successfully!',
        [{ text: 'OK', onPress: () => setShowEditProfile(false) }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    }
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'A password reset link will be sent to your email address.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Link', onPress: () => {
          Alert.alert('Success', 'Password reset link sent to your email!');
        }}
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
          // Here you would handle account deletion and navigation to auth screen
        }}
      ]
    );
  };

  type MenuItem = {
    icon: string;
    label: string;
    onPress: () => void;
    showArrow?: boolean;
    showSwitch?: boolean;
    switchValue?: boolean;
    textColor?: string;
  };

  const settingSections: Array<{ title: string; items: MenuItem[] }> = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person.fill',
          label: 'Edit Profile',
          onPress: () => setShowEditProfile(true),
          showArrow: true
        },
        {
          icon: 'key.fill',
          label: 'Change Password',
          onPress: handleChangePassword,
          showArrow: true
        },
        {
          icon: 'location.fill',
          label: 'Manage Addresses',
          onPress: () => router.push('/addresses'),
          showArrow: true
        },
        {
          icon: 'creditcard.fill',
          label: 'Payment Methods',
          onPress: () => router.push('/payments'),
          showArrow: true
        }
      ]
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: 'bell.fill',
          label: 'Order Updates',
          onPress: () => setNotifications({ ...notifications, orderUpdates: !notifications.orderUpdates }),
          showSwitch: true,
          switchValue: notifications.orderUpdates
        },
        {
          icon: 'tag.fill',
          label: 'Promotions & Offers',
          onPress: () => setNotifications({ ...notifications, promotions: !notifications.promotions }),
          showSwitch: true,
          switchValue: notifications.promotions
        },
        {
          icon: 'storefront.fill',
          label: 'New Vendors',
          onPress: () => setNotifications({ ...notifications, newVendors: !notifications.newVendors }),
          showSwitch: true,
          switchValue: notifications.newVendors
        },
        {
          icon: 'star.fill',
          label: 'Recommendations',
          onPress: () => setNotifications({ ...notifications, recommendations: !notifications.recommendations }),
          showSwitch: true,
          switchValue: notifications.recommendations
        }
      ]
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'questionmark.circle.fill',
          label: 'Help Center',
          onPress: () => Alert.alert('Help Center', 'Contact support at help@foodapp.com'),
          showArrow: true
        },
        {
          icon: 'envelope.fill',
          label: 'Contact Us',
          onPress: () => Alert.alert('Contact Us', 'Email: support@foodapp.com\nPhone: (555) 123-4567'),
          showArrow: true
        },
        {
          icon: 'doc.text.fill',
          label: 'Terms of Service',
          onPress: () => Alert.alert('Terms of Service', 'View our terms at foodapp.com/terms'),
          showArrow: true
        },
        {
          icon: 'hand.raised.fill',
          label: 'Privacy Policy',
          onPress: () => Alert.alert('Privacy Policy', 'View our privacy policy at foodapp.com/privacy'),
          showArrow: true
        }
      ]
    },
    {
      title: 'App',
      items: [
        {
          icon: 'info.circle.fill',
          label: 'About',
          onPress: () => Alert.alert('About', 'FoodApp v1.0.0\nMade with ??'),
          showArrow: true
        },
        {
          icon: 'star.fill',
          label: 'Rate App',
          onPress: () => Alert.alert('Rate App', 'Thanks for using our app! Please rate us on the App Store.'),
          showArrow: true
        },
        {
          icon: 'square.and.arrow.up.fill',
          label: 'Share App',
          onPress: () => Alert.alert('Share App', 'Share with friends: Download FoodApp for the best food delivery!'),
          showArrow: true
        },
        {
          icon: 'building.2.fill',
          label: 'Become a Partner',
          onPress: () => {
            // Open web partner page
            const webUrl = 'https://yourwebsite.com/vendor'; // Replace with actual web URL
            // In a real app, you'd use Linking.openURL(webUrl)
            Alert.alert('Become a Partner', `Visit our website to become a partner: ${webUrl}`);
          },
          showArrow: true
        }
      ]
    },
    {
      title: 'Danger Zone',
      items: [
        {
          icon: 'trash.fill',
          label: 'Delete Account',
          onPress: handleDeleteAccount,
          showArrow: true,
          textColor: 'text-red-600'
        }
      ]
    }
  ];

  // Show loading state while fetching profile
  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color="#15785B" />
        <Text className="text-gray-500 mt-4">Loading settings...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center border-b border-gray-100">
        <Pressable 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full items-center justify-center -ml-2"
        >
          <IconSymbol name="chevron.left" size={24} color={Colors.light.text} />
        </Pressable>
        <Text className="text-xl font-bold ml-2 text-gray-900">Settings</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          {settingSections.map((section, sectionIndex) => (
            <View key={section.title} className="mb-8">
              <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">
                {section.title}
              </Text>
              <View className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm">
                {section.items.map((item, itemIndex) => (
                  <Pressable
                    key={item.label}
                    onPress={item.onPress}
                    className={`flex-row items-center justify-between p-5 ${
                      itemIndex < section.items.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <View className="flex-row items-center flex-1">
                      <View 
                        className="w-9 h-9 rounded-full items-center justify-center mr-4"
                        style={{ backgroundColor: `${item.textColor?.includes('red') ? "#fee2e2" : "#f8f9fa"}` }}
                      >
                        <IconSymbol 
                          name={item.icon} 
                          size={20} 
                          color={item.textColor?.includes('red') ? "#ef4444" : "#5f6368"} 
                        />
                      </View>
                      <Text className={`text-base font-medium ${item.textColor || 'text-gray-800'}`}>
                        {item.label}
                      </Text>
                    </View>
                    
                    {item.showSwitch && (
                      <Switch
                        value={item.switchValue}
                        onValueChange={item.onPress}
                        trackColor={{ false: '#e2e8f0', true: '#15785B' }}
                        thumbColor={'#ffffff'}
                      />
                    )}
                    
                    {item.showArrow && (
                      <IconSymbol name="chevron.right" size={18} color="#dadce0" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          {/* App Info */}
          <View className="items-center py-8">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Savemymeal</Text>
            <Text className="text-gray-300 text-[10px] mt-1">v1.0.0 • Made with ?</Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Bottom Sheet */}
      <BottomSheet
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        title="Edit Profile">
        <ScrollView className="p-4">
          <View className="items-center mb-6">
            <View className="w-24 h-24 rounded-full bg-blue-600 items-center justify-center mb-3">
              <Text className="text-white text-4xl font-bold">
                {profileData.firstName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Button variant="outline" size="sm">
              Change Photo
            </Button>
          </View>

          <Input
            label="First Name"
            placeholder="Enter your first name"
            value={profileData.firstName}
            onChangeText={(text) => setProfileData({ ...profileData, firstName: text })}
            className="mb-4"
          />

          <Input
            label="Last Name"
            placeholder="Enter your last name"
            value={profileData.lastName}
            onChangeText={(text) => setProfileData({ ...profileData, lastName: text })}
            className="mb-4"
          />

          <Input
            label="Username"
            placeholder="Enter your username"
            value={profileData.username}
            onChangeText={(text) => setProfileData({ ...profileData, username: text })}
            autoCapitalize="none"
            className="mb-4"
          />

          <Input
            label="Phone Number"
            placeholder="Enter your phone number"
            value={profileData.phone}
            onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
            keyboardType="phone-pad"
            className="mb-4"
          />

          <Input
            label="City"
            placeholder="Enter your city"
            value={profileData.city}
            onChangeText={(text) => setProfileData({ ...profileData, city: text })}
            className="mb-6"
          />

          <Button 
            onPress={handleSaveProfile} 
            disabled={updateProfileMutation.isPending}
            className="mb-4"
          >
            {updateProfileMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text>Save Changes</Text>
            )}
          </Button>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}
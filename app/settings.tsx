import { useState } from 'react';
import { View, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProfile } from '@/lib/hooks/use-profile';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { BottomSheet } from '@/components/ui/bottom-sheet';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: user } = useProfile();
  
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    newVendors: false,
    recommendations: true
  });
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const handleSaveProfile = () => {
    if (!profileData.name || !profileData.email) {
      Alert.alert('Error', 'Name and email are required.');
      return;
    }

    // Here you would typically make an API call to update the profile
    Alert.alert(
      'Success', 
      'Profile updated successfully!',
      [{ text: 'OK', onPress: () => setShowEditProfile(false) }]
    );
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

  const settingSections = [
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

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3">
            <IconSymbol name="arrow.left" size={24} color="#000" />
          </Pressable>
          <Text className="text-xl font-bold">Settings</Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="px-4 py-4">
          {settingSections.map((section, sectionIndex) => (
            <View key={section.title} className="mb-6">
              <Text className="text-lg font-semibold mb-3 px-1">{section.title}</Text>
              <View className="bg-white rounded-xl shadow-sm overflow-hidden">
                {section.items.map((item, itemIndex) => (
                  <Pressable
                    key={item.label}
                    onPress={item.onPress}
                    className={`flex-row items-center justify-between p-4 ${
                      itemIndex < section.items.length - 1 ? 'border-b border-gray-100' : ''
                    }`}>
                    <View className="flex-row items-center flex-1">
                      <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-3">
                        <IconSymbol 
                          name={item.icon} 
                          size={18} 
                          color={item.textColor?.includes('red') ? "#ef4444" : "#666"} 
                        />
                      </View>
                      <Text className={`font-medium ${item.textColor || 'text-gray-900'}`}>
                        {item.label}
                      </Text>
                    </View>
                    
                    {item.showSwitch && (
                      <Switch
                        value={item.switchValue}
                        onValueChange={item.onPress}
                        trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                        thumbColor={item.switchValue ? '#ffffff' : '#ffffff'}
                      />
                    )}
                    
                    {item.showArrow && (
                      <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          {/* App Version */}
          <View className="items-center py-4">
            <Text className="text-gray-500 text-sm">Version 1.0.0</Text>
            <Text className="text-gray-400 text-xs mt-1">? 2024 FoodApp. All rights reserved.</Text>
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
                {profileData.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Button variant="outline" size="sm">
              Change Photo
            </Button>
          </View>

          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={profileData.name}
            onChangeText={(text) => setProfileData({ ...profileData, name: text })}
            className="mb-4"
          />

          <Input
            label="Email"
            placeholder="Enter your email"
            value={profileData.email}
            onChangeText={(text) => setProfileData({ ...profileData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            className="mb-4"
          />

          <Input
            label="Phone Number"
            placeholder="Enter your phone number"
            value={profileData.phone}
            onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
            keyboardType="phone-pad"
            className="mb-6"
          />

          <Button onPress={handleSaveProfile} className="mb-4">
            Save Changes
          </Button>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}
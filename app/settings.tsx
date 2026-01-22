import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import {
  AppInfo,
  EditProfileSheet,
  MenuItem,
  SettingsHeader,
  SettingsSection,
} from '@/components/settings';
import { useProfile } from '@/lib/hooks/use-profile';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: user, isLoading } = useProfile();
  
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
    <View className="flex flex-col flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <SettingsHeader />

      <ScrollView className="flex flex-col" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          {settingSections.map((section) => (
            <SettingsSection
              key={section.title}
              title={section.title}
              items={section.items}
            />
          ))}

          <AppInfo />
        </View>
      </ScrollView>

      <EditProfileSheet
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profileData={profileData}
        onProfileDataChange={setProfileData}
      />
    </View>
  );
}
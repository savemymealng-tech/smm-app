import {
  AppInfo,
  MenuItem,
  SettingsHeader,
  SettingsSection,
} from '@/components/settings';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { useProfile } from '@/lib/hooks/use-profile';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: user, isLoading } = useProfile();
  
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    newVendors: false,
    recommendations: true
  });

  const handleChangePassword = () => {
    setPasswordDialogOpen(true);
  };

  const confirmChangePassword = () => {
    setPasswordDialogOpen(false);
    toast.success('Email Sent', 'Password reset link sent to your email!');
  };

  const handleDeleteAccount = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = () => {
    setDeleteDialogOpen(false);
    toast.success('Account Deleted', 'Your account has been deleted successfully.');
    // Here you would handle account deletion and navigation to auth screen
  };

  const settingSections: Array<{ title: string; items: MenuItem[] }> = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person.fill',
          label: 'Edit Profile',
          onPress: () => router.push('/edit-profile'),
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
          onPress: () => toast.info('Help Center', 'Contact support at help@savemymeal.com'),
          showArrow: true
        },
        {
          icon: 'envelope.fill',
          label: 'Contact Us',
          onPress: () => toast.info('Contact Us', 'Email: support@savemymeal.com'),
          showArrow: true
        },
        {
          icon: 'doc.text.fill',
          label: 'Terms of Service',
          onPress: () => Linking.openURL('https://savemymeal.com/terms'),
          showArrow: true
        },
        {
          icon: 'hand.raised.fill',
          label: 'Privacy Policy',
          onPress: () => Linking.openURL('https://savemymeal.com/privacy'),
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
          onPress: () => toast.info('About', 'SaveMyMeal v1.0.0'),
          showArrow: true
        },
        {
          icon: 'star.fill',
          label: 'Rate App',
          onPress: () => toast.success('Thank You!', 'Thanks for using our app!'),
          showArrow: true
        },
        {
          icon: 'square.and.arrow.up.fill',
          label: 'Share App',
          onPress: () => toast.info('Share', 'Download SaveMyMeal for the best food delivery!'),
          showArrow: true
        },
        {
          icon: 'building.2.fill',
          label: 'Become a Partner',
          onPress: () => {
            const webUrl = 'https://savemymeal.com/signup';
            Linking.openURL(webUrl);
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

      {/* <EditProfileSheet
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profileData={profileData}
        onProfileDataChange={setProfileData}
      /> */}

      {/* Change Password Dialog */}
      <AlertDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Password</AlertDialogTitle>
            <AlertDialogDescription>
              A password reset link will be sent to your email address.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={confirmChangePassword}>
              <Text className="text-white">Send Link</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={confirmDeleteAccount} className="bg-red-500">
              <Text className="text-white">Delete</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}

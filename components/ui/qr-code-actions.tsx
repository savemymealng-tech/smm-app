import { toast } from '@/components/ui/toast';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useRef } from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { captureRef } from 'react-native-view-shot';
import { Button } from './button';
import { QRCodeComponent } from './qr-code';
import { Text } from './text';

type QRCodeActionsProps = {
  value: string;
  ticketId: string;
  eventTitle: string;
  size?: number;
  className?: string;
};

export function QRCodeActions({ 
  value, 
  ticketId, 
  eventTitle, 
  size = 200,
  className = '' 
}: QRCodeActionsProps) {
  const qrRef = useRef<View>(null);

  const handleShareQR = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        toast.error('Sharing Unavailable', 'Sharing is not available on this device');
        return;
      }

      if (qrRef.current) {
        const uri = await captureRef(qrRef, {
          format: 'png',
          quality: 1,
        });

        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Share QR Code - ${eventTitle}`,
        });
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      toast.error('Share Failed', 'Failed to share QR code');
    }
  };

  const handleSaveQR = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        toast.warning(
          'Permission Required',
          'Please grant permission to save images to your photo library'
        );
        return;
      }

      if (qrRef.current) {
        const uri = await captureRef(qrRef, {
          format: 'png',
          quality: 1,
        });

        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync('Party With Me', asset, false);
        
        toast.success('Saved', 'QR code saved to your photo library');
      }
    } catch (error) {
      console.error('Error saving QR code:', error);
      toast.error('Save Failed', 'Failed to save QR code');
    }
  };

  return (
    <View className={`items-center ${className}`}>
      {/* QR Code with ref for capture */}
      <View ref={qrRef} className="bg-white p-4 rounded-2xl">
        <QRCodeComponent
          value={value}
          size={size}
          backgroundColor="white"
          color="#1e293b"
          showDescription={true}
          description={`${eventTitle} - Ticket ${ticketId}`}
          descriptionStyle="text-slate-600 text-sm text-center mb-2"
        />
      </View>

      {/* Action Buttons */}
      <View className="flex-row space-x-3 mt-4">
        <Button
          variant="outline"
          onPress={handleShareQR}
          className="flex-1"
        >
          <View className="flex-row items-center">
            <Icon name="share-outline" size={16} color="#15785B" />
            <Text className="text-primary font-medium ml-2">Share</Text>
          </View>
        </Button>

        <Button
          variant="outline"
          onPress={handleSaveQR}
          className="flex-1"
        >
          <View className="flex-row items-center">
            <Icon name="download-outline" size={16} color="#15785B" />
            <Text className="text-primary font-medium ml-2">Save</Text>
          </View>
        </Button>
      </View>
    </View>
  );
}

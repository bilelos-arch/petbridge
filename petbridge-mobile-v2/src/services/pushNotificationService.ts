
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import axiosInstance from '../lib/axios';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  // Push distantes non supportées dans Expo Go
  const isExpoGo = Constants.appOwnership === 'expo';
  if (isExpoGo) {
    console.log('Push distantes non disponibles dans Expo Go — utilise un development build');
    return null;
  }

  if (!Device.isDevice) {
    console.log('Push notifications nécessitent un device physique');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission push refusée');
    return null;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    return token;
  } catch (e) {
    console.log('Impossible de récupérer le push token:', e);
    return null;
  }
}

export async function savePushToken(token: string) {
  try {
    await axiosInstance.patch('/users/me/push-token', { token });
  } catch (e) {
    console.error('Erreur sauvegarde push token:', e);
  }
}
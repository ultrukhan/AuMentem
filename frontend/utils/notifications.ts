import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return false;
  }
  
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('events', {
      name: 'Event Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  
  return true;
}

export async function scheduleEventReminder(eventTitle: string, eventDateStr: string) {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return false;

  const eventDate = new Date(eventDateStr);
  
  const triggerDate = new Date(eventDate.getTime() - 60 * 60 * 1000);
  
  const now = new Date();
  let triggerTime = triggerDate;
  if (triggerDate <= now) {
      triggerTime = new Date(now.getTime() + 10 * 1000);
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Нагадування про подію! 🕒',
      body: `Подія "${eventTitle}" розпочнеться вже незабаром!`,
      sound: true,
    },
    trigger: { date: triggerTime } as Notifications.NotificationTriggerInput,
  });
  
  return true;
}

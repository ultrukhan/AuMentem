import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

let NotificationsModule: any = null;

const getNotifications = () => {
  if (!NotificationsModule) {
    try {
      NotificationsModule = require('expo-notifications');
      NotificationsModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch (e) {
      console.log("Push notifications not supported");
    }
  }
  
  return NotificationsModule;
};

export async function requestNotificationPermissions() {
  const Notifications = getNotifications();
  if (!Notifications) return false;

  try {
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
  } catch (e) {
    return false;
  }
}

export async function scheduleEventReminder(eventTitle: string, eventDateStr: string) {
  try {
    const savedSettings = await SecureStore.getItemAsync('userSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (parsed.notificationsEnabled === false) return false;
    }
  } catch {}

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return false;

  const eventDate = new Date(eventDateStr);
  
  const triggerDate = new Date(eventDate.getTime() - 60 * 60 * 1000);
  
  const now = new Date();
  let triggerTime = triggerDate;


  if (triggerDate <= now) {
      if (eventDate > now) {
          triggerTime = new Date(now.getTime() + 5 * 1000);
      } else {
          return false;
      }
  }

  const Notifications = getNotifications();
  if (!Notifications) return false;

  try {
    const secondsToWait = Math.max(1, Math.floor((triggerTime.getTime() - now.getTime()) / 1000));

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Нагадування про подію! 🕒',
        body: `Подія "${eventTitle}" розпочнеться вже незабаром!`,
        sound: true,
        vibrate: [0, 250, 250, 250],
        data: { eventTitle },
      },
      trigger: { seconds: secondsToWait },
    });
  } catch (error) {
    console.log("Notifications are not fully supported in this environment:", error);
    return false;
  }
  
  return true;
}

export async function cancelEventReminder(eventTitle: string) {
  const Notifications = getNotifications();
  if (!Notifications) return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.body?.includes(eventTitle)) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (error) {
    console.log("Could not cancel notification:", error);
  }
}

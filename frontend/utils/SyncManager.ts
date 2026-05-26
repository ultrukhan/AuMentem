import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';

const SYNC_QUEUE_KEY = 'offline_sync_queue';

interface SyncAction {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  timestamp: number;
}

export class SyncManager {

  static async enqueueAction(url: string, method: string, body?: any) {
    try {
      const existingQueue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue: SyncAction[] = existingQueue ? JSON.parse(existingQueue) : [];

      const token = await SecureStore.getItemAsync('userToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const action: SyncAction = {
        id: Math.random().toString(36).substr(2, 9),
        url,
        method,
        headers,
        body,
        timestamp: Date.now(),
      };

      queue.push(action);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      

      this.syncNow();
    } catch (e) {
      console.error('Error enqueuing action:', e);
    }
  }


  static async syncNow() {
    try {
      const state = await NetInfo.fetch();
      if (!state.isConnected || state.isInternetReachable === false) {
        return;
      }

      const existingQueue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (!existingQueue) return;

      const queue: SyncAction[] = JSON.parse(existingQueue);
      if (queue.length === 0) return;

      const failedActions: SyncAction[] = [];

      for (const action of queue) {
        try {
          const response = await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.body ? JSON.stringify(action.body) : undefined,
          });


          if (!response.ok && response.status >= 500) {
            failedActions.push(action);
          }
        } catch (err) {

          failedActions.push(action);
        }
      }


      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failedActions));

    } catch (e) {
      console.error('Error syncing offline actions:', e);
    }
  }


  static init() {
    NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        this.syncNow();
      }
    });
  }
}

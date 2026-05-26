import { DeviceEventEmitter } from 'react-native';

export interface ToastConfig {
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

export const Toast = {
  show: (config: ToastConfig) => {
    DeviceEventEmitter.emit('SHOW_TOAST', config);
  },
  error: (title: string, message?: string) => {
    DeviceEventEmitter.emit('SHOW_TOAST', { title, message, type: 'error' });
  },
  success: (title: string, message?: string) => {
    DeviceEventEmitter.emit('SHOW_TOAST', { title, message, type: 'success' });
  },
  info: (title: string, message?: string) => {
    DeviceEventEmitter.emit('SHOW_TOAST', { title, message, type: 'info' });
  }
};

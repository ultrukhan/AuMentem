import { Alert, Linking } from 'react-native';
import { PRIVACY_POLICY_URL } from '@/constants/links';

export function openPrivacyPolicy() {
  Linking.openURL(PRIVACY_POLICY_URL).catch(() => {
    Alert.alert('Політика', 'Сторінка в розробці.');
  });
}

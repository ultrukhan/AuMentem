import { Platform, TextStyle } from 'react-native';

/** Зменшує дивні переноси слів на Android у вузьких контейнерах */
export const textLayout: TextStyle = Platform.select({
  android: { includeFontPadding: false, textBreakStrategy: 'simple' },
  default: {},
}) ?? {};

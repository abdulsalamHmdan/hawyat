import type { ReactNode } from 'react';
import { Platform, View, type ViewProps } from 'react-native';

/**
 * على الجوال الاتجاه يجي من I18nManager.forceRTL. على الويب (المعاينة فقط)
 * react-native-web يحتاج dir="rtl" على العنصر الجذري.
 */
export function RtlRoot({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  const webProps = { dir: 'rtl', style: { flex: 1 } } as ViewProps;
  return <View {...webProps}>{children}</View>;
}

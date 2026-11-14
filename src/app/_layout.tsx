import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RtlRoot } from '@/components/rtl-root';
import { MockProvider } from '@/data/mock';
import { fontFiles, useColors, useIsDark } from '@/theme';

// التطبيق كله من اليمين لليسار. (في app.json فعّلنا forcesRTL عن طريق expo-localization أيضًا.)
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(fontFiles);
  const [queryClient] = useState(() => new QueryClient());
  const c = useColors();
  const dark = useIsDark();

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <RtlRoot>
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <MockProvider>
          <StatusBar style={dark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: c.surface },
            }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
            <Stack.Screen
              name="invite"
              options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }}
            />
            <Stack.Screen name="new-qatta" options={{ presentation: 'modal' }} />
            <Stack.Screen name="new-expense" options={{ presentation: 'modal' }} />
          </Stack>
        </MockProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
    </RtlRoot>
  );
}

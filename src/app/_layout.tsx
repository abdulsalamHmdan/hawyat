import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RtlRoot } from '@/components/rtl-root';
import { AuthProvider, useAuth, useMe } from '@/data/hooks';
import '@/lib/geofence'; // تعريف مهمة الموقع لازم يكون أول ما يشتغل التطبيق
import { fontFiles, useColors, useIsDark } from '@/theme';

// التطبيق كله من اليمين لليسار. (في app.json فعّلنا forcesRTL عن طريق expo-localization أيضًا.)
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

SplashScreen.preventAutoHideAsync();

function Root() {
  const c = useColors();
  const dark = useIsDark();
  const { ready, userId } = useAuth();
  const me = useMe();
  const loading = !ready || (!!userId && me.isPending);

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.surface } }}>
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts(fontFiles);
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 15_000 } } }),
  );
  if (!loaded && !error) return null;
  return (
    <RtlRoot>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Root />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </RtlRoot>
  );
}

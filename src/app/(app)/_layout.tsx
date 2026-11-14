import { Redirect, Stack } from 'expo-router';

import { useAuth, useMe } from '@/data/hooks';
import { usePush } from '@/lib/push';
import { useColors } from '@/theme';

/** الشاشات اللي ما تنفتح إلا للأعضاء. */
export default function AppLayout() {
  const c = useColors();
  const { userId } = useAuth();
  const me = useMe();
  usePush(me.data?.member.id);

  if (!userId) return <Redirect href="/welcome" />;
  if (me.isPending) return null;
  if (!me.data) return <Redirect href="/profile-setup" />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.surface } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="invite"
        options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }}
      />
      <Stack.Screen name="new-qatta" options={{ presentation: 'modal' }} />
      <Stack.Screen name="new-expense" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

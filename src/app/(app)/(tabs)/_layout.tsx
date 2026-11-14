import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/tab-bar';
import { useMyQatta } from '@/data/hooks';

export default function TabsLayout() {
  const mine = useMyQatta();
  // نقطة على «القطة» لو عليك قطة مفتوحة ما ضغطت فيها «دفعت». يشوفها صاحبها فقط.
  const hasDue = (mine.data ?? []).some((q) => q.status === 'open' && !q.myPaidAt);
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} dots={{ qatta: hasDue }} />}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="qatta" />
      <Tabs.Screen name="expenses" />
      <Tabs.Screen name="members" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

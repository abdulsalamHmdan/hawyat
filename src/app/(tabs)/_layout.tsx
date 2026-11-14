import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/tab-bar';
import { useMock } from '@/data/mock';

export default function TabsLayout() {
  const { mine } = useMock();
  // نقطة على «القطة» لو عليك قطة ما ضغطت فيها «دفعت». يشوفها صاحبها فقط.
  const hasDue = mine.some((q) => !q.myPaidAt);
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

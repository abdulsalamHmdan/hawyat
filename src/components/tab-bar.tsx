import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { House, Receipt, Settings, Users, Wallet, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { radius, size, space, useColors } from '@/theme';

import { Press } from './pressable';
import { Txt } from './text';

const TABS: Record<string, { label: string; icon: LucideIcon }> = {
  home: { label: 'الرئيسية', icon: House },
  qatta: { label: 'القطة', icon: Wallet },
  expenses: { label: 'المصاريف', icon: Receipt },
  members: { label: 'الشباب', icon: Users },
  settings: { label: 'الإعدادات', icon: Settings },
};

/** شريط التبويبات السفلي. `dots` يحط نقطة ember على تبويب (القطة لو عليك قطة). */
export function TabBar({ state, emitter, navigateToTab, insets, dots = {} }: BottomTabBarProps & { dots?: Record<string, boolean> }) {
  const c = useColors();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        backgroundColor: c.surfaceRaised,
        borderTopWidth: 1,
        borderTopColor: c.line,
        paddingTop: space[2],
        paddingHorizontal: space[2],
        paddingBottom: Math.max(insets.bottom, space[3]),
      }}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = index === state.index;
        const Icon = tab.icon;
        const color = focused ? c.olive : c.inkMuted;
        const onPress = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };
        const dot = dots[route.name];
        return (
          <Press
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={dot ? `${tab.label}، فيه قطة عليك` : tab.label}
            style={{ flex: 1, alignItems: 'center', gap: space[1] }}>
            <View>
              <Icon size={size.iconTab} color={color} strokeWidth={2} />
              {dot && (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    end: -4,
                    width: size.tabDot,
                    height: size.tabDot,
                    borderRadius: radius.full,
                    backgroundColor: c.ember,
                  }}
                />
              )}
            </View>
            <Txt v={focused ? 'tabActive' : 'tab'} c={focused ? 'olive' : 'inkMuted'}>
              {tab.label}
            </Txt>
          </Press>
        );
      })}
    </View>
  );
}

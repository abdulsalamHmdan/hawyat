// الإشعارات: التسجيل في Expo Push، وأزرار الرد داخل الإشعار، وفتح الشاشة المناسبة.
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { backend } from '@/data';
import type { ReplyKind } from '@/data/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const REPLY_ACTIONS: { id: ReplyKind; title: string }[] = [
  { id: 'coming', title: 'جايكم' },
  { id: 'soon', title: 'قريب، دقايق' },
  { id: 'dinner', title: 'معكم بالعشاء' },
  { id: 'cant', title: 'ما أقدر' },
];

/** فئات الإشعار: الدعوة العادية، والدعوة اللي فيها عشاء (يظهر فيها «معكم بالعشاء»). */
async function setCategories() {
  const action = (id: ReplyKind) => {
    const a = REPLY_ACTIONS.find((x) => x.id === id)!;
    return { identifier: a.id, buttonTitle: a.title, options: { opensAppToForeground: true } };
  };
  await Notifications.setNotificationCategoryAsync('invite', [action('coming'), action('soon'), action('cant')]);
  await Notifications.setNotificationCategoryAsync('invite_dinner', [action('coming'), action('dinner'), action('cant')]);
}

export async function registerForPush(memberId: string): Promise<'granted' | 'denied' | 'unavailable'> {
  if (Platform.OS === 'web' || !Device.isDevice) return 'unavailable';
  await setCategories();
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return 'denied';
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return 'unavailable';
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await backend.registerPushToken(memberId, token);
  return 'granted';
}

function handleResponse(r: Notifications.NotificationResponse) {
  const data = (r.notification.request.content.data ?? {}) as { url?: string; session_id?: string };
  const action = r.actionIdentifier as ReplyKind;
  if (data.session_id && REPLY_ACTIONS.some((a) => a.id === action)) {
    backend.respond(data.session_id, action).catch(() => {});
    router.push('/session');
    return;
  }
  if (typeof data.url === 'string' && data.url.startsWith('/')) router.push(data.url as never);
}

/** يسجل الجهاز ويستقبل ضغطات الإشعار (حتى لو انفتح التطبيق من الإشعار). */
export function usePush(memberId: string | undefined) {
  const handled = useRef<string | null>(null);
  const last = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!memberId || backend.demo) return;
    registerForPush(memberId).catch(() => {});
  }, [memberId]);

  useEffect(() => {
    if (!memberId || !last) return;
    const id = last.notification.request.identifier + last.actionIdentifier;
    if (handled.current === id) return;
    handled.current = id;
    handleResponse(last);
  }, [last, memberId]);
}

import { router } from 'expo-router';
import { Bell, Beef, Coffee, CupSoda, Utensils, X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Mark } from '@/components/brand/logo';
import { Button, IconButton } from '@/components/button';
import { ChoiceTile, Field, Pill, Segmented } from '@/components/controls';
import { inviteHeadline } from '@/components/invite-card';
import { useCardShadow } from '@/components/surface';
import { Txt } from '@/components/text';
import { TREAT_LABEL } from '@/data/labels';
import { useMock } from '@/data/mock';
import type { SessionKind, Treat } from '@/data/types';
import { formatTime } from '@/lib/format';
import { gap, radius, shape, size, space, useColors } from '@/theme';

const TREATS: { value: Treat; icon: typeof CupSoda }[] = [
  { value: 'tea', icon: CupSoda },
  { value: 'coffee', icon: Coffee },
  { value: 'dinner', icon: Utensils },
  { value: 'bbq', icon: Beef },
];

/** أقرب نص ساعة وساعة بعدها كخيارات سريعة للوقت. */
function timeOptions(count: number) {
  const now = new Date();
  const first = new Date(now);
  first.setMinutes(now.getMinutes() < 30 ? 30 : 60, 0, 0);
  if (first.getTime() - now.getTime() < 15 * 60_000) first.setMinutes(first.getMinutes() + 30);
  return Array.from({ length: count }, (_, i) => new Date(first.getTime() + i * 30 * 60_000));
}

/** 03 — نافذة «وصلت المخيم»: النوع، العزيمة، الوقت، والرسالة. */
export default function InviteSheet() {
  const c = useColors();
  const sheetShadow = useCardShadow('sheet');
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { me, announce } = useMock();
  const [kind, setKind] = useState<SessionKind>('arrived');
  const [treat, setTreat] = useState<Treat | null>('tea');
  const [more, setMore] = useState(false);
  const opts = timeOptions(more ? 8 : 2);
  const [time, setTime] = useState<number>(-1); // -1 = الحين
  const [message, setMessage] = useState('');

  const previewTitle =
    kind === 'arrived'
      ? `${me.displayName} وصل المخيم${treat ? ` · عازمكم على ${TREAT_LABEL[treat]}` : ''}`
      : inviteHeadline(me.displayName, { kind, treat });

  const send = () => {
    announce({ kind, treat, atTime: time >= 0 ? opts[time] : null, message: message.trim() || undefined });
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.scrim, justifyContent: 'flex-end' }}>
      <Pressable style={{ flex: 1 }} onPress={() => router.back()} accessibilityLabel="إغلاق" accessibilityRole="button" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View
          entering={SlideInDown.duration(260)}
          style={[
            {
              backgroundColor: c.surfaceRaised,
              borderTopStartRadius: radius.lg,
              borderTopEndRadius: radius.lg,
              maxHeight: height - insets.top - space[6],
            },
            sheetShadow,
          ]}>
          <ScrollView
              style={{ flexGrow: 0 }}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingTop: space[3], paddingHorizontal: gap.form, paddingBottom: Math.max(insets.bottom, space[4]) + space[4], gap: gap.form }}>
              <View
                style={{
                  width: size.sheetHandle.width,
                  height: size.sheetHandle.height,
                  borderRadius: radius.full,
                  backgroundColor: c.line,
                  alignSelf: 'center',
                }}
              />
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space[3] }}>
                <View style={{ flex: 1 }}>
                  <Txt v="sheetTitle" accessibilityRole="header">
                    وصلت المخيم
                  </Txt>
                  <Txt v="body" c="inkMuted">
                    وش تبي تقول للشباب؟
                  </Txt>
                </View>
                <IconButton icon={X} label="إغلاق" tone="sunken" onPress={() => router.back()} />
              </View>

              <Segmented<SessionKind>
                options={[
                  { value: 'arrived', label: 'وصلت وموجود' },
                  { value: 'going', label: 'رايح الحين' },
                ]}
                value={kind}
                onChange={setKind}
              />

              <View style={{ gap: space[2] + 2 }}>
                <Txt v="linkSm">تعزمهم على شي؟</Txt>
                <View style={{ flexDirection: 'row', gap: space[2] }}>
                  {TREATS.map((t) => (
                    <ChoiceTile
                      key={t.value}
                      label={TREAT_LABEL[t.value]}
                      icon={t.icon}
                      on={treat === t.value}
                      onPress={() => setTreat((cur) => (cur === t.value ? null : t.value))}
                    />
                  ))}
                </View>
              </View>

              <View style={{ gap: space[2] + 2 }}>
                <Txt v="linkSm">متى؟</Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
                  <Pill label="الحين" on={time === -1} onPress={() => setTime(-1)} />
                  {opts.map((d, i) => (
                    <Pill key={i} label={formatTime(d)} on={time === i} onPress={() => setTime(i)} />
                  ))}
                  {!more && <Pill label="وقت ثاني" on={false} onPress={() => setMore(true)} />}
                </View>
              </View>

              <Field
                label="رسالة للشباب"
                hint="(اختياري)"
                placeholder="النار مشبوبة، تعالوا"
                value={message}
                onChangeText={setMessage}
                maxLength={120}
              />

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space[3],
                  backgroundColor: c.surfaceSunken,
                  borderRadius: shape.field,
                  paddingVertical: space[3],
                  paddingHorizontal: space[3] + 2,
                }}
                accessible
                accessibilityLabel={`معاينة الإشعار: ${previewTitle}`}>
                <View
                  style={{
                    width: size.touch - space[2],
                    height: size.touch - space[2],
                    borderRadius: shape.tile,
                    backgroundColor: c.night,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Mark width={size.iconTab + space[1]} tone="reverse" />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt v="linkSm" numberOfLines={1}>
                    {previewTitle}
                  </Txt>
                  {message.trim() ? (
                    <Txt v="small" c="inkMuted" numberOfLines={1}>
                      {message.trim()}
                    </Txt>
                  ) : null}
                </View>
              </View>

              <Button label="بلّغ الشباب" icon={Bell} variant="ember" large block onPress={send} />
            </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { Bell, ChevronLeft, HandCoins, KeyRound, LogOut, MapPin, Wallet, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Share, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ToggleRow } from '@/components/controls';
import { FormError } from '@/components/form-error';
import { ListCard, Screen, ScreenHeader, Section } from '@/components/layout';
import { Press } from '@/components/pressable';
import { Card } from '@/components/surface';
import { Txt } from '@/components/text';
import { backend } from '@/data';
import { useCamp } from '@/data/hooks';
import { startGeofence, stopGeofence } from '@/lib/geofence';
import { riyal } from '@/lib/format';
import { size, space, useColors } from '@/theme';

function LinkRow({ icon: Icon, title, value, href, onPress }: { icon: LucideIcon; title: string; value?: string; href?: Href; onPress?: () => void }) {
  const c = useColors();
  return (
    <Press
      onPress={onPress ?? (href ? () => router.push(href) : undefined)}
      accessibilityRole="button"
      accessibilityLabel={value ? `${title}، ${value}` : title}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], paddingHorizontal: space[4], paddingVertical: space[3] }}>
      <Icon size={size.icon} color={c.ink} strokeWidth={2} />
      <Txt v="rowTitle" style={{ flex: 1 }}>
        {title}
      </Txt>
      {value ? (
        <Txt v="bodySm" c="inkMuted">
          {value}
        </Txt>
      ) : null}
      <ChevronLeft size={size.icon} color={c.inkMuted} strokeWidth={2} />
    </Press>
  );
}

const GEO_ERRORS = {
  no_center: 'مسؤول الصندوق ما حدد مكان المخيم للحين.',
  denied: 'لازم تسمح للتطبيق يستخدم الموقع «دايمًا» من إعدادات الآيفون.',
  unsupported: 'هذي الميزة تشتغل في النسخة الكاملة من التطبيق (TestFlight)، مو في Expo Go.',
} as const;

/** الإعدادات: الملف الشخصي، الإشعارات، الموقع، وإعدادات مسؤول الصندوق. */
export default function Settings() {
  const qc = useQueryClient();
  const { member, camp } = useCamp();
  const isFm = member.role === 'fund_manager';
  const [geoErr, setGeoErr] = useState<string | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const code = useQuery({ queryKey: ['invite', camp.id], queryFn: () => backend.getInviteCode(camp.id), enabled: isFm });

  const toggleGeo = async (on: boolean) => {
    setGeoErr(null);
    setGeoBusy(true);
    try {
      if (on) {
        const r = await startGeofence(camp);
        if (r !== 'ok') {
          setGeoErr(GEO_ERRORS[r]);
          return;
        }
      } else {
        await stopGeofence();
      }
      await backend.setGeofenceEnabled(on);
      await qc.invalidateQueries({ queryKey: ['me'] });
    } catch {
      setGeoErr('صار خطأ، جرّب مرة ثانية');
    } finally {
      setGeoBusy(false);
    }
  };

  const shareCode = () =>
    code.data &&
    Share.share({
      message: `انضم لمخيم ${camp.name} في تطبيق الحاويات.\nكود الدعوة: ${code.data}`,
    });

  return (
    <Screen>
      <ScreenHeader title="الإعدادات" />

      <Press onPress={() => router.push('/profile-setup')} accessibilityRole="button" accessibilityLabel="عدّل ملفك">
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
          <Avatar name={member.displayName} uri={member.avatarUrl} />
          <View style={{ flex: 1 }}>
            <Txt v="bodyStrong">{member.displayName}</Txt>
            <Txt v="bodySm" c="inkMuted">
              {isFm ? 'مسؤول الصندوق' : 'عضو'} · مخيم {camp.name}
            </Txt>
          </View>
          <Txt v="linkSm" c="olive">
            عدّل
          </Txt>
        </Card>
      </Press>

      <Section label="عام">
        <ListCard>
          <LinkRow icon={Bell} title="الإشعارات" href="/notifications" />
          <ToggleRow
            title="أعلن وصولي تلقائيًا"
            sub="أول ما تدخل حدود المخيم يبلّغ الشباب، ولما تطلع يسجّل خروجك. ما نحفظ موقعك."
            value={member.geofenceEnabled}
            onChange={toggleGeo}
            disabled={geoBusy}
          />
        </ListCard>
        <FormError text={geoErr} />
      </Section>

      {isFm && (
        <Section label="مسؤول الصندوق">
          <ListCard>
            <LinkRow icon={Wallet} title="القطة الشهرية" value={riyal(camp.monthlyAmount)} href="/camp-settings" />
            <LinkRow icon={MapPin} title="حدود المخيم" value={camp.centerLat != null ? `${camp.radiusM} متر` : 'ما تحددت'} href="/camp-settings" />
            <LinkRow icon={KeyRound} title="كود الدعوة" value={code.data ?? '...'} onPress={shareCode} />
            <LinkRow icon={HandCoins} title="التسوية" value={`يوم 30`} href="/settlement" />
          </ListCard>
          <Press
            onPress={() =>
              Alert.alert('تغيّر كود الدعوة؟', 'الكود القديم ما عاد يشتغل.', [
                { text: 'لا', style: 'cancel' },
                { text: 'غيّره', onPress: () => backend.regenerateInviteCode(camp.id).then(() => code.refetch()) },
              ])
            }
            accessibilityRole="button"
            accessibilityLabel="غيّر كود الدعوة">
            <Txt v="linkSm" c="inkMuted">
              غيّر كود الدعوة
            </Txt>
          </Press>
        </Section>
      )}

      <ListCard>
        <LinkRow
          icon={LogOut}
          title="اطلع من حسابك"
          onPress={() =>
            Alert.alert('تطلع من حسابك؟', '', [
              { text: 'لا', style: 'cancel' },
              {
                text: 'اطلع',
                style: 'destructive',
                onPress: async () => {
                  await stopGeofence().catch(() => {});
                  await backend.signOut();
                  router.replace('/welcome');
                },
              },
            ])
          }
        />
      </ListCard>
      {backend.demo && (
        <Txt v="small" c="inkMuted" center>
          نسخة تجريبية: البيانات وهمية وما تنحفظ
        </Txt>
      )}
    </Screen>
  );
}

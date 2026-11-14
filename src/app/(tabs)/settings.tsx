import { router, type Href } from 'expo-router';
import { Bell, ChevronLeft, HandCoins, KeyRound, LogOut, MapPin, Share2, Wallet, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Share, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ToggleRow } from '@/components/controls';
import { ListCard, Screen, ScreenHeader, Section } from '@/components/layout';
import { Press } from '@/components/pressable';
import { Card } from '@/components/surface';
import { Txt } from '@/components/text';
import { CAMP, useMock } from '@/data/mock';
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

/** الإعدادات: الملف الشخصي، الإشعارات، الموقع، وإعدادات مسؤول الصندوق. */
export default function Settings() {
  const { me } = useMock();
  const [geo, setGeo] = useState(false);
  const isManager = me.role === 'fund_manager';

  return (
    <Screen>
      <ScreenHeader title="الإعدادات" />

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
        <Avatar name={me.displayName} />
        <View style={{ flex: 1 }}>
          <Txt v="bodyStrong">{me.displayName}</Txt>
          <Txt v="bodySm" c="inkMuted">
            {isManager ? 'مسؤول الصندوق' : 'عضو'}
          </Txt>
        </View>
        <Press onPress={() => router.push('/profile-setup')} accessibilityRole="button" accessibilityLabel="عدّل ملفك">
          <Txt v="linkSm" c="olive">
            عدّل
          </Txt>
        </Press>
      </Card>

      <Section label="عام">
        <ListCard>
          <LinkRow icon={Bell} title="الإشعارات" href="/notifications" />
          <ToggleRow
            title="أعلن وصولي تلقائيًا"
            sub="أول ما تدخل حدود المخيم. يحتاج النسخة الكاملة من التطبيق"
            value={geo}
            onChange={setGeo}
          />
        </ListCard>
      </Section>

      {isManager && (
        <Section label="مسؤول الصندوق">
          <ListCard>
            <LinkRow icon={Wallet} title="القطة الشهرية" value={riyal(CAMP.monthlyAmount)} />
            <LinkRow icon={MapPin} title="حدود المخيم" value="ما تحددت" />
            <LinkRow
              icon={KeyRound}
              title="كود الدعوة"
              value={CAMP.inviteCode}
              onPress={() => Share.share({ message: `انضم لمخيم ${CAMP.name} في تطبيق الحاويات. الكود: ${CAMP.inviteCode}` })}
            />
            <LinkRow icon={HandCoins} title="التسوية" value="يوم 30" />
          </ListCard>
        </Section>
      )}

      <ListCard>
        <LinkRow icon={Share2} title="شارك التطبيق مع الشباب" onPress={() => Share.share({ message: `الكود: ${CAMP.inviteCode}` })} />
        <LinkRow icon={LogOut} title="اطلع من حسابك" onPress={() => router.replace('/welcome')} />
      </ListCard>
    </Screen>
  );
}

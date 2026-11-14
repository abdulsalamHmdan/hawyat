import { Coffee, CupSoda, Beef, Utensils, Tent, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { REPLY_LABEL, TREAT_LABEL } from '@/data/labels';
import type { ReplyKind, Session } from '@/data/types';
import { formatTime } from '@/lib/format';
import { opacity, radius, size, space, useColors } from '@/theme';

import { Press } from './pressable';
import { QuickReply } from './quick-reply';
import { Card } from './surface';
import { Txt } from './text';

export const TREAT_ICON: Record<NonNullable<Session['treat']> | 'none', LucideIcon> = {
  tea: CupSoda,
  coffee: Coffee,
  dinner: Utensils,
  bbq: Beef,
  none: Tent,
};

export function inviteHeadline(name: string, s: Pick<Session, 'kind' | 'treat'>) {
  if (s.treat) return `${name} عازمكم على ${TREAT_LABEL[s.treat]}`;
  return s.kind === 'arrived' ? `${name} وصل المخيم` : `${name} رايح المخيم`;
}

/** الأزرار المتاحة للرد: «معكم بالعشاء» تظهر فقط لو الدعوة فيها عشاء. */
export function replyOptions(s: Pick<Session, 'treat'>): ReplyKind[] {
  return s.treat === 'dinner' ? ['coming', 'dinner', 'cant'] : ['coming', 'soon', 'cant'];
}

/** بطاقة الجلسة الحية (ليلية) مع أزرار الرد. */
export function InviteCard({
  session,
  starterName,
  meta,
  myReply,
  onReply,
  onPress,
}: {
  session: Session;
  starterName: string;
  meta: string;
  myReply: ReplyKind | null;
  onReply?: (r: ReplyKind) => void;
  onPress?: () => void;
}) {
  const c = useColors();
  const Icon = TREAT_ICON[session.treat ?? 'none'];
  return (
    <Card tone="night" style={{ gap: space[3] }}>
      <Press
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={`${inviteHeadline(starterName, session)}، ${meta}`}
        dimWhenDisabled={false}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
        <View
          style={{
            width: size.iconTile,
            height: size.iconTile,
            borderRadius: radius.full,
            backgroundColor: c.glow,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon size={size.iconHeader} color={c.night} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt v="cardTitle" c="sand">
            {inviteHeadline(starterName, session)}
          </Txt>
          <Txt v="small" c="sand" style={{ opacity: opacity.nightMuted }}>
            {meta}
          </Txt>
        </View>
      </Press>
      {onReply && (
        <View style={{ flexDirection: 'row', gap: space[2] }}>
          {replyOptions(session).map((r) => (
            <QuickReply
              key={r}
              label={REPLY_LABEL[r]}
              on={myReply === r}
              no={r === 'cant'}
              grow={r !== 'cant'}
              onPress={() => onReply(r)}
            />
          ))}
        </View>
      )}
    </Card>
  );
}

export function sessionMeta(s: Session, comingCount: number) {
  const parts = [`${s.kind === 'arrived' ? 'وصل' : 'طلع'} ${formatTime(s.createdAt)}`];
  if (s.treat && s.atTime) parts.push(`ال${TREAT_LABEL[s.treat]} ${formatTime(s.atTime)}`);
  if (comingCount > 0) parts.push(`${comingCount} جايين`);
  return parts.join(' · ');
}

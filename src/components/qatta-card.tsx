import { Check, Lock } from 'lucide-react-native';
import { View } from 'react-native';

import type { MyContribution } from '@/data/types';
import { formatDayDate, formatNumber, remainingDays } from '@/lib/format';
import { size, space, useColors } from '@/theme';

import { Button } from './button';
import { StatusChip } from './status-chip';
import { Card } from './surface';
import { Txt } from './text';

/**
 * بطاقة القطة كما يشوفها العضو: حالته هو فقط.
 * «دفعت» يسجّل فورًا بدون تأكيد، و«تراجعت» لو انضغط بالغلط.
 */
export function QattaCard({
  qatta,
  onPaid,
  onUndo,
  privacyNote,
}: {
  qatta: MyContribution;
  onPaid: () => void;
  onUndo: () => void;
  privacyNote: string;
}) {
  const c = useColors();
  const paid = !!qatta.myPaidAt;
  return (
    <Card style={{ gap: space[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space[3] }}>
        <Txt v="title" style={{ flex: 1 }}>
          {qatta.title}
        </Txt>
        <StatusChip tone={paid ? 'paid' : 'due'} label={paid ? 'دفعت' : 'ما دفعت'} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space[2] }}>
        <Txt v="amountLg">{formatNumber(qatta.amountPerPerson)}</Txt>
        <Txt v="body">ريال</Txt>
      </View>
      <Txt v="body" c="inkMuted">
        {paid ? 'سجّلنا إنك دفعت. شكرًا' : `تستحق ${formatDayDate(qatta.dueDate)} · ${remainingDays(qatta.dueDate)}`}
      </Txt>
      {paid ? (
        <Button label="تراجعت" onPress={onUndo} block muted accessibilityLabel="تراجعت، ما دفعت" />
      ) : (
        <Button label="دفعت" icon={Check} variant="primary" onPress={onPaid} block />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
        <Lock size={size.iconSm + 1} color={c.inkMuted} strokeWidth={2} />
        <Txt v="small" c="inkMuted">
          {privacyNote}
        </Txt>
      </View>
    </Card>
  );
}

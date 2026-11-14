import { Check, ImagePlus, Lock } from 'lucide-react-native';
import { View } from 'react-native';

import type { MyContribution } from '@/data/types';
import { formatDayDate, formatNumber, remainingDays } from '@/lib/format';
import { size, space, useColors } from '@/theme';

import { Button } from './button';
import { Press } from './pressable';
import { StatusChip } from './status-chip';
import { Card } from './surface';
import { Txt } from './text';

/**
 * بطاقة القطة كما يشوفها العضو: حالته هو فقط.
 * «دفعت» يسجّل فورًا بدون تأكيد، و«تراجعت» لو انضغط بالغلط.
 */
export function QattaCard({
  qatta,
  title,
  onPaid,
  onUndo,
  onAttach,
  busy,
  privacyNote,
}: {
  qatta: MyContribution;
  title?: string;
  onPaid: () => void;
  onUndo: () => void;
  /** إرفاق صورة التحويل (اختياري) */
  onAttach?: () => void;
  busy?: boolean;
  privacyNote: string;
}) {
  const c = useColors();
  const paid = !!qatta.myPaidAt;
  const closed = qatta.status === 'closed';
  return (
    <Card style={{ gap: space[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space[3] }}>
        <Txt v="title" style={{ flex: 1 }}>
          {title ?? qatta.title}
        </Txt>
        <StatusChip tone={paid ? 'paid' : 'due'} label={paid ? 'دفعت' : 'ما دفعت'} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space[2] }}>
        <Txt v="amountLg">{formatNumber(qatta.amountPerPerson)}</Txt>
        <Txt v="body">ريال</Txt>
      </View>
      <Txt v="body" c="inkMuted">
        {paid ? 'سجّلنا إنك دفعت' : closed ? 'القطة انقفلت' : `تستحق ${formatDayDate(qatta.dueDate)} · ${remainingDays(qatta.dueDate)}`}
      </Txt>
      {paid ? (
        <>
          {onAttach && (
            <Press onPress={onAttach} accessibilityRole="button" accessibilityLabel="أرفق صورة التحويل" style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
              <ImagePlus size={size.icon} color={c.olive} strokeWidth={2} />
              <Txt v="linkSm" c="olive">
                {qatta.myReceiptPath ? 'غيّر صورة التحويل' : 'أرفق صورة التحويل (اختياري)'}
              </Txt>
            </Press>
          )}
          <Button label="تراجعت" onPress={onUndo} block muted disabled={busy} accessibilityLabel="تراجعت، ما دفعت" />
        </>
      ) : (
        !closed && <Button label="دفعت" icon={Check} variant="primary" onPress={onPaid} block disabled={busy} />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
        <Lock size={size.iconSm + 1} color={c.inkMuted} strokeWidth={2} />
        <Txt v="small" c="inkMuted" style={{ flex: 1 }}>
          {privacyNote}
        </Txt>
      </View>
    </Card>
  );
}

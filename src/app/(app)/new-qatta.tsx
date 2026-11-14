import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Field, Pill, Segmented } from '@/components/controls';
import { FormError } from '@/components/form-error';
import { Screen, ScreenHeader } from '@/components/layout';
import { Txt } from '@/components/text';
import { backend } from '@/data';
import { errorText, useAction, useCamp, useMemberName, useMembers } from '@/data/hooks';
import { formatDayDate, formatNumber, riyal } from '@/lib/format';
import { gap, size, space, useColors } from '@/theme';

type Mode = 'per' | 'total';
const DUE = [
  { label: 'بكرة', days: 1 },
  { label: 'بعد 3 أيام', days: 3 },
  { label: 'أسبوع', days: 7 },
  { label: 'أسبوعين', days: 14 },
];

/** 07 — إنشاء قطة مناسبة. */
export default function NewQatta() {
  const c = useColors();
  const { member, camp } = useCamp();
  const members = useMembers().data ?? [];
  const name = useMemberName();
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<Mode>('total');
  const [amount, setAmount] = useState('');
  const [picked, setPicked] = useState<string[] | null>(null); // null = الكل
  const [due, setDue] = useState(1);
  const create = useAction((p: Parameters<typeof backend.createEventContribution>[0]) => backend.createEventContribution(p), [['qatta']]);

  const chosen = picked ?? members.map((m) => m.id);
  const includeMe = chosen.includes(member.id);
  const others = chosen.filter((id) => id !== member.id);
  const n = Number(amount.replace(/[^\d.]/g, '')) || 0;
  const splitBy = others.length + (includeMe ? 1 : 0);
  const per = mode === 'per' ? n : splitBy ? Math.round((n / splitBy) * 100) / 100 : 0;
  const ok = title.trim().length > 0 && n > 0 && others.length > 0;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + DUE[due].days);

  const toggle = (id: string) => setPicked(chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id]);

  const publish = () =>
    create.mutate([{ campId: camp.id, title: title.trim(), mode, amount: n, memberIds: others, dueDate, includeMe }], {
      onSuccess: (id) => router.replace(`/qatta/${id}`),
    });

  return (
    <Screen
      edges={['top', 'bottom']}
      gap={gap.form}
      footer={
        <View style={{ paddingHorizontal: space[4], paddingBottom: space[4], gap: space[2] }}>
          <FormError text={create.error ? errorText(create.error) : null} />
          <Button label={create.isPending ? 'لحظة...' : 'انشر القطة'} variant="primary" large block disabled={!ok || create.isPending} onPress={publish} />
        </View>
      }>
      <ScreenHeader title="قطة جديدة" close />

      <Field label="وش القطة؟" placeholder="عشاء الجمعة" value={title} onChangeText={setTitle} maxLength={40} />

      <View style={{ gap: space[2] }}>
        <Txt v="linkSm">المبلغ</Txt>
        <Segmented<Mode>
          options={[
            { value: 'per', label: 'لكل شخص' },
            { value: 'total', label: 'مبلغ كامل يتقسم' },
          ]}
          value={mode}
          onChange={setMode}
        />
        <Field big placeholder="0" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" suffix="ريال" accessibilityLabel="المبلغ" />
        {mode === 'total' && n > 0 && splitBy > 0 && (
          <Txt v="linkSm" c="olive">
            نصيب كل واحد {riyal(per)}
          </Txt>
        )}
      </View>

      <View style={{ gap: space[3] }}>
        <Txt v="linkSm">
          مين معك فيها؟{' '}
          <Txt v="small" c="inkMuted">
            {`${formatNumber(chosen.length)} من ${members.length}`}
          </Txt>
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
          {members.map((m) => (
            <Pill key={m.id} label={name(m.id)} on={chosen.includes(m.id)} onPress={() => toggle(m.id)} />
          ))}
        </View>
      </View>

      <View style={{ gap: space[3] }}>
        <Txt v="linkSm">
          آخر موعد للدفع{' '}
          <Txt v="small" c="inkMuted">
            {formatDayDate(dueDate)}
          </Txt>
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
          {DUE.map((d, i) => (
            <Pill key={d.label} label={d.label} on={due === i} onPress={() => setDue(i)} />
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: space[3], alignItems: 'flex-start' }}>
        <Bell size={size.icon} color={c.inkMuted} strokeWidth={2} />
        <Txt v="bodySm" c="inkMuted" style={{ flex: 1 }}>
          يوصلهم إشعار الحين، وتذكير لين يضغطون «دفعت». حالاتهم تشوفها أنت بس.
        </Txt>
      </View>
    </Screen>
  );
}

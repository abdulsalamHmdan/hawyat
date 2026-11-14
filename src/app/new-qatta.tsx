import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Field, Pill, Segmented } from '@/components/controls';
import { Screen, ScreenHeader } from '@/components/layout';
import { Txt } from '@/components/text';
import { ME, MEMBERS, memberName, useMock } from '@/data/mock';
import { formatNumber, riyal } from '@/lib/format';
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
  const { addOwned } = useMock();
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<Mode>('total');
  const [amount, setAmount] = useState('');
  const [picked, setPicked] = useState<string[]>(MEMBERS.filter((m) => m.id !== 'm6').map((m) => m.id));
  const [due, setDue] = useState(1);

  const n = Number(amount.replace(/[^\d.]/g, '')) || 0;
  const per = mode === 'per' ? n : picked.length ? Math.round((n / picked.length) * 100) / 100 : 0;
  const ok = title.trim().length > 0 && n > 0 && picked.length > 1;

  const toggle = (id: string) => setPicked((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  const publish = () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + DUE[due].days);
    // المنشئ ما يدفع لنفسه: صفوف الدفع للباقين فقط.
    const id = addOwned({
      title: title.trim(),
      amountPerPerson: per,
      dueDate,
      participants: picked.filter((m) => m !== ME).map((memberId) => ({ memberId, paidAt: null, lastRemindedAt: null })),
    });
    router.replace(`/qatta/${id}`);
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      gap={gap.form}
      footer={
        <View style={{ paddingHorizontal: space[4], paddingBottom: space[4] }}>
          <Button label="انشر القطة" variant="primary" large block disabled={!ok} onPress={publish} />
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
        {mode === 'total' && n > 0 && picked.length > 0 && (
          <Txt v="linkSm" c="olive">
            نصيب كل واحد {riyal(per)}
          </Txt>
        )}
      </View>

      <View style={{ gap: space[3] }}>
        <Txt v="linkSm">
          مين معك فيها؟{' '}
          <Txt v="small" c="inkMuted">
            {`${formatNumber(picked.length)} من ${MEMBERS.length}`}
          </Txt>
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
          {MEMBERS.map((m) => (
            <Pill key={m.id} label={memberName(m.id)} on={picked.includes(m.id)} onPress={() => toggle(m.id)} />
          ))}
        </View>
      </View>

      <View style={{ gap: space[3] }}>
        <Txt v="linkSm">آخر موعد للدفع</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
          {DUE.map((d, i) => (
            <Pill key={d.label} label={d.label} on={due === i} onPress={() => setDue(i)} />
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: space[3], alignItems: 'flex-start' }}>
        <Bell size={size.icon} color={c.inkMuted} strokeWidth={2} />
        <Txt v="bodySm" c="inkMuted" style={{ flex: 1 }}>
          يوصلهم إشعار الحين، وتذكير كل يومين لين يضغطون «دفعت». حالاتهم تشوفها أنت بس.
        </Txt>
      </View>
    </Screen>
  );
}

import { router } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Field, Pill } from '@/components/controls';
import { Screen, ScreenHeader } from '@/components/layout';
import { Txt } from '@/components/text';
import { CATEGORY_LABEL } from '@/data/labels';
import { useMock } from '@/data/mock';
import type { ExpenseCategory } from '@/data/types';
import { gap, space } from '@/theme';

const CATS = Object.keys(CATEGORY_LABEL) as ExpenseCategory[];

/** تسجيل مصروف دفعته من جيبك للمخيم. يصير دين لك على الصندوق. */
export default function NewExpense() {
  const { addExpense } = useMock();
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState<ExpenseCategory>('firewood');
  const [desc, setDesc] = useState('');
  const n = Number(amount.replace(/[^\d.]/g, '')) || 0;

  const save = () => {
    addExpense({ amount: n, category: cat, description: desc.trim() || CATEGORY_LABEL[cat], hasReceipt: false, spentAt: new Date() });
    router.back();
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      gap={gap.form}
      footer={
        <View style={{ paddingHorizontal: space[4], paddingBottom: space[4] }}>
          <Button label="سجّل المصروف" variant="primary" large block disabled={n <= 0} onPress={save} />
        </View>
      }>
      <ScreenHeader title="سجّل مصروف" sub="دفعته من جيبك؟ يرجع لك من الصندوق" close />
      <Field big label="المبلغ" placeholder="0" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" suffix="ريال" autoFocus />
      <View style={{ gap: space[3] }}>
        <Txt v="linkSm">الفئة</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
          {CATS.map((k) => (
            <Pill key={k} label={CATEGORY_LABEL[k]} on={cat === k} onPress={() => setCat(k)} />
          ))}
        </View>
      </View>
      <Field label="وش اشتريت؟" placeholder="مثلًا: حطب سمر" value={desc} onChangeText={setDesc} maxLength={60} />
      <Button label="أرفق الفاتورة (اختياري)" icon={Camera} block onPress={() => {}} />
    </Screen>
  );
}

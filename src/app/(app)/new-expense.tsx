import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Field, Pill } from '@/components/controls';
import { FormError } from '@/components/form-error';
import { Screen, ScreenHeader } from '@/components/layout';
import { Txt } from '@/components/text';
import { backend } from '@/data';
import { errorText, useAction, useCamp } from '@/data/hooks';
import { CATEGORY_LABEL } from '@/data/labels';
import type { ExpenseCategory, ImageFile } from '@/data/types';
import { pickImage } from '@/lib/image';
import { gap, radius, size, space } from '@/theme';

const CATS = Object.keys(CATEGORY_LABEL) as ExpenseCategory[];

/** تسجيل مصروف دفعته من جيبك للمخيم. يصير دين لك على الصندوق. */
export default function NewExpense() {
  const { camp } = useCamp();
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState<ExpenseCategory>('firewood');
  const [desc, setDesc] = useState('');
  const [receipt, setReceipt] = useState<ImageFile | null>(null);
  const add = useAction((p: Parameters<typeof backend.addExpense>[0]) => backend.addExpense(p), [['expenses'], ['account']]);
  const n = Number(amount.replace(/[^\d.]/g, '')) || 0;

  const save = () =>
    add.mutate([{ campId: camp.id, amount: n, category: cat, description: desc.trim() || CATEGORY_LABEL[cat], receipt }], {
      onSuccess: () => router.back(),
    });

  return (
    <Screen
      edges={['top', 'bottom']}
      gap={gap.form}
      footer={
        <View style={{ paddingHorizontal: space[4], paddingBottom: space[4], gap: space[2] }}>
          <FormError text={add.error ? errorText(add.error) : null} />
          <Button label={add.isPending ? 'لحظة...' : 'سجّل المصروف'} variant="primary" large block disabled={n <= 0 || add.isPending} onPress={save} />
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
      {receipt ? (
        <View style={{ gap: space[2] }}>
          <Image source={{ uri: receipt.uri }} style={{ width: size.profilePhoto, height: size.profilePhoto, borderRadius: radius.sm }} accessibilityLabel="الفاتورة" />
          <Button label="شيل الفاتورة" variant="quiet" muted onPress={() => setReceipt(null)} />
        </View>
      ) : (
        <Button label="أرفق الفاتورة (اختياري)" icon={Camera} block onPress={async () => setReceipt(await pickImage())} />
      )}
      <Txt v="small" c="inkMuted">
        المصاريف يشوفها كل الشباب عشان يعرفون وين راحت فلوس الصندوق.
      </Txt>
    </Screen>
  );
}

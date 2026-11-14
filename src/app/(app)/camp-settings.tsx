import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { LocateFixed } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Field, Pill } from '@/components/controls';
import { FormError } from '@/components/form-error';
import { Screen, ScreenHeader, Section } from '@/components/layout';
import { Card } from '@/components/surface';
import { Txt } from '@/components/text';
import { backend } from '@/data';
import { errorText, useCamp } from '@/data/hooks';
import { currentPosition } from '@/lib/geofence';
import { gap, space } from '@/theme';

const DUE_DAYS = [1, 5, 10, 15, 20, 25];
const RADII = [100, 150, 300, 500];

/** إعدادات مسؤول الصندوق: مبلغ القطة الشهرية، يوم الاستحقاق، وحدود المخيم. */
export default function CampSettings() {
  const qc = useQueryClient();
  const { camp, member } = useCamp();
  const [amount, setAmount] = useState(String(camp.monthlyAmount));
  const [dueDay, setDueDay] = useState(camp.monthlyDueDay);
  const [center, setCenter] = useState(camp.centerLat != null ? { lat: camp.centerLat, lng: camp.centerLng! } : null);
  const [radius, setRadius] = useState(camp.radiusM);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (member.role !== 'fund_manager') {
    return (
      <Screen>
        <ScreenHeader title="إعدادات المخيم" back />
        <Txt v="body" c="inkMuted">
          هذي الإعدادات لمسؤول الصندوق.
        </Txt>
      </Screen>
    );
  }

  const n = Number(amount.replace(/[^\d.]/g, '')) || 0;

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      await backend.updateCamp(camp.id, { monthlyAmount: n, monthlyDueDay: dueDay, centerLat: center?.lat, centerLng: center?.lng, radiusM: radius });
      await qc.invalidateQueries({ queryKey: ['me'] });
      router.back();
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      gap={gap.form}
      footer={
        <View style={{ paddingHorizontal: space[4], paddingBottom: space[6], gap: space[2] }}>
          <FormError text={err} />
          <Button label={busy ? 'لحظة...' : 'احفظ'} variant="primary" large block disabled={n <= 0 || busy} onPress={save} />
        </View>
      }>
      <ScreenHeader title="إعدادات المخيم" sub="تخصك أنت كمسؤول الصندوق" back />

      <Section label="القطة الشهرية">
        <Field big label="المبلغ لكل شخص" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" suffix="ريال" />
        <Txt v="linkSm" style={{ marginTop: space[3] }}>
          تستحق يوم كم في الشهر؟
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
          {DUE_DAYS.map((d) => (
            <Pill key={d} label={String(d)} on={dueDay === d} onPress={() => setDueDay(d)} />
          ))}
        </View>
        <Txt v="small" c="inkMuted">
          التغيير يطبّق من الشهر الجاي. القطة تنزل أول كل شهر لكل الأعضاء.
        </Txt>
      </Section>

      <Section label="حدود المخيم">
        <Card style={{ gap: space[3] }}>
          <Txt v="body">
            {center ? `محدد (${center.lat.toFixed(4)}، ${center.lng.toFixed(4)})` : 'ما تحدد للحين'}
          </Txt>
          <Txt v="small" c="inkMuted">
            روح المخيم واضغط الزر وأنت هناك. نستخدمه عشان التطبيق يبلّغ الشباب لما أحد يوصل.
          </Txt>
          <Button
            label={locating ? 'لحظة...' : 'أنا بالمخيم الحين، استخدم موقعي'}
            icon={LocateFixed}
            block
            disabled={locating}
            onPress={async () => {
              setLocating(true);
              setErr(null);
              const p = await currentPosition().catch(() => null);
              setLocating(false);
              if (p) setCenter(p);
              else setErr('ما قدرنا ناخذ موقعك. اسمح للتطبيق يستخدم الموقع.');
            }}
          />
          <Txt v="linkSm">نصف القطر</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
            {RADII.map((r) => (
              <Pill key={r} label={`${r} متر`} on={radius === r} onPress={() => setRadius(r)} />
            ))}
          </View>
        </Card>
      </Section>
    </Screen>
  );
}

import { useState } from 'react';
import { View } from 'react-native';

import { Switch, ToggleRow } from '@/components/controls';
import { ListCard, Screen, ScreenHeader, Section } from '@/components/layout';
import { Card } from '@/components/surface';
import { Txt } from '@/components/text';
import { CAMP } from '@/data/mock';
import type { NotificationPrefKey } from '@/data/types';
import { riyal } from '@/lib/format';
import { opacity, space } from '@/theme';

/** 09 — تخصيص الإشعارات: مفتاح عام، وتحته مفتاح لكل نوع، وأوقات الهدوء. */
export default function Notifications() {
  const [all, setAll] = useState(true);
  const [prefs, setPrefs] = useState<Record<NotificationPrefKey, boolean>>({
    monthly_due: true,
    monthly_reminder: true,
    event_qatta: true,
    arrival: true,
    treat: true,
    settlement: false,
  });
  const [quiet, setQuiet] = useState(true);
  const set = (k: NotificationPrefKey) => (v: boolean) => setPrefs((p) => ({ ...p, [k]: v }));
  const off = !all;

  return (
    <Screen gap={space[4]}>
      <ScreenHeader title="الإشعارات" back />

      <Card tone="night" style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
        <View style={{ flex: 1 }}>
          <Txt v="bodyStrong" c="sand">
            كل الإشعارات
          </Txt>
          <Txt v="bodySm" c="sand" style={{ opacity: opacity.nightMuted }}>
            لو طفيتها ما يوصلك شي أبدًا
          </Txt>
        </View>
        <Switch value={all} onChange={setAll} label="كل الإشعارات" />
      </Card>

      <Section label="القطة">
        <ListCard>
          <ToggleRow title="نزول القطة الشهرية" sub={`أول كل شهر · ${riyal(CAMP.monthlyAmount)}`} value={prefs.monthly_due} onChange={set('monthly_due')} disabled={off} />
          <ToggleRow title="تذكير القطة الشهرية" sub="كل يومين لين تدفع" value={prefs.monthly_reminder} onChange={set('monthly_reminder')} disabled={off} />
          <ToggleRow title="قطط المناسبات" sub="لما أحد يسوي قطة، وتذكير يومي" value={prefs.event_qatta} onChange={set('event_qatta')} disabled={off} />
        </ListCard>
      </Section>

      <Section label="الحضور والدعوات">
        <ListCard>
          <ToggleRow title="أحد وصل المخيم" sub="كل الشباب" value={prefs.arrival} onChange={set('arrival')} disabled={off} />
          <ToggleRow title="عزايم جديدة" sub="شاهي، قهوة، عشاء" value={prefs.treat} onChange={set('treat')} disabled={off} />
        </ListCard>
      </Section>

      <Section label="المصاريف">
        <ListCard>
          <ToggleRow title="تسوية نهاية الشهر" sub="ملخص حسابك يوم 30" value={prefs.settlement} onChange={set('settlement')} disabled={off} />
        </ListCard>
      </Section>

      <ListCard>
        <ToggleRow title="أوقات الهدوء" sub="من 12:00ص إلى 7:00ص" value={quiet} onChange={setQuiet} disabled={off} />
      </ListCard>
    </Screen>
  );
}

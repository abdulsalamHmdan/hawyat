import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/button';
import { Pill, Switch, ToggleRow } from '@/components/controls';
import { FormError } from '@/components/form-error';
import { ListCard, Screen, ScreenHeader, Section, Status } from '@/components/layout';
import { Card } from '@/components/surface';
import { Txt } from '@/components/text';
import { backend } from '@/data';
import { errorText, useAction, useCamp, useMemberName, useMembers, useNotificationSettings } from '@/data/hooks';
import type { Frequency, NotificationPrefKey, NotificationSettings } from '@/data/types';
import { riyal } from '@/lib/format';
import { opacity, space } from '@/theme';

const FREQ: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'يومي' },
  { value: 'every2', label: 'كل يومين' },
  { value: 'weekly', label: 'أسبوعي' },
];
const FREQ_SUB: Record<Frequency, string> = { daily: 'كل يوم لين تدفع', every2: 'كل يومين لين تدفع', weekly: 'كل أسبوع لين تدفع' };

function hourLabel(t: string) {
  const h = Number(t.slice(0, 2));
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00${h < 12 ? 'ص' : 'م'}`;
}
const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);

function HourPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[2], paddingHorizontal: space[4] }}>
      {HOURS.map((h) => (
        <Pill key={h} label={hourLabel(h)} on={value.slice(0, 2) === h.slice(0, 2)} onPress={() => onChange(h)} />
      ))}
    </ScrollView>
  );
}

/** 09 — تخصيص الإشعارات: مفتاح عام، وتحته مفتاح لكل نوع، وأوقات الهدوء. يُحفظ تلقائيًا. */
export default function Notifications() {
  const { member, camp } = useCamp();
  const query = useNotificationSettings();
  const members = useMembers().data ?? [];
  const name = useMemberName();
  const [local, setS] = useState<NotificationSettings | null>(null);
  const s = local ?? query.data ?? null;
  const [open, setOpen] = useState<null | 'monthly' | 'event' | 'arrival' | 'quiet'>(null);
  const save = useAction((v: NotificationSettings) => backend.saveNotificationSettings(member.id, v), [['notif']]);

  if (!s) {
    return (
      <Screen>
        <ScreenHeader title="الإشعارات" back />
        <Status loading={query.isPending} error={query.error} onRetry={() => query.refetch()} />
      </Screen>
    );
  }

  const update = (next: NotificationSettings) => {
    setS(next);
    save.mutate([next]);
  };
  const setPref = (k: NotificationPrefKey, patch: Partial<NotificationSettings['prefs'][NotificationPrefKey]>) =>
    update({ ...s, prefs: { ...s.prefs, [k]: { ...s.prefs[k], ...patch } } });
  const off = !s.enabled;
  const only = s.prefs.arrival.onlyMemberIds ?? [];
  const others = members.filter((m) => m.id !== member.id);

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
        <Switch value={s.enabled} onChange={(v) => update({ ...s, enabled: v })} label="كل الإشعارات" />
      </Card>

      <Section label="القطة">
        <ListCard>
          <ToggleRow title="نزول القطة الشهرية" sub={`أول كل شهر · ${riyal(camp.monthlyAmount)}`} value={s.prefs.monthly_due.enabled} onChange={(v) => setPref('monthly_due', { enabled: v })} disabled={off} />
          <View>
            <ToggleRow
              title="تذكير القطة الشهرية"
              sub={`${FREQ_SUB[s.prefs.monthly_reminder.frequency ?? 'every2']} · اضغط للتكرار`}
              value={s.prefs.monthly_reminder.enabled}
              onChange={(v) => setPref('monthly_reminder', { enabled: v })}
              disabled={off}
            />
            {!off && s.prefs.monthly_reminder.enabled && (
              <View style={{ flexDirection: 'row', gap: space[2], paddingHorizontal: space[4], paddingBottom: space[3] }}>
                {FREQ.map((f) => (
                  <Pill key={f.value} label={f.label} on={(s.prefs.monthly_reminder.frequency ?? 'every2') === f.value} onPress={() => setPref('monthly_reminder', { frequency: f.value })} />
                ))}
              </View>
            )}
          </View>
          <View>
            <ToggleRow
              title="قطط المناسبات"
              sub={`لما أحد يسوي قطة، وتذكير ${FREQ.find((f) => f.value === (s.prefs.event_qatta.frequency ?? 'every2'))!.label}`}
              value={s.prefs.event_qatta.enabled}
              onChange={(v) => setPref('event_qatta', { enabled: v })}
              disabled={off}
            />
            {!off && s.prefs.event_qatta.enabled && (
              <View style={{ flexDirection: 'row', gap: space[2], paddingHorizontal: space[4], paddingBottom: space[3] }}>
                {FREQ.map((f) => (
                  <Pill key={f.value} label={f.label} on={(s.prefs.event_qatta.frequency ?? 'every2') === f.value} onPress={() => setPref('event_qatta', { frequency: f.value })} />
                ))}
              </View>
            )}
          </View>
        </ListCard>
      </Section>

      <Section label="الحضور والدعوات">
        <ListCard>
          <View>
            <ToggleRow
              title="أحد وصل المخيم"
              sub={only.length ? only.map((id) => name(id)).join('، ') : 'كل الشباب'}
              value={s.prefs.arrival.enabled}
              onChange={(v) => setPref('arrival', { enabled: v })}
              disabled={off}
            />
            {!off && s.prefs.arrival.enabled && (
              <View style={{ paddingHorizontal: space[4], paddingBottom: space[3], gap: space[2] }}>
                {open !== 'arrival' ? (
                  <Button label={only.length ? 'غيّر الأشخاص' : 'بس أشخاص محددين'} variant="quiet" onPress={() => setOpen('arrival')} />
                ) : (
                  <>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[2] }}>
                      <Pill label="كل الشباب" on={only.length === 0} onPress={() => setPref('arrival', { onlyMemberIds: null })} />
                      {others.map((m) => (
                        <Pill
                          key={m.id}
                          label={m.displayName}
                          on={only.includes(m.id)}
                          onPress={() =>
                            setPref('arrival', { onlyMemberIds: only.includes(m.id) ? only.filter((x) => x !== m.id) : [...only, m.id] })
                          }
                        />
                      ))}
                    </View>
                    <Button label="تم" variant="quiet" onPress={() => setOpen(null)} />
                  </>
                )}
              </View>
            )}
          </View>
          <ToggleRow title="عزايم جديدة" sub="شاهي، قهوة، عشاء، شوي" value={s.prefs.treat.enabled} onChange={(v) => setPref('treat', { enabled: v })} disabled={off} />
        </ListCard>
      </Section>

      <Section label="المصاريف">
        <ListCard>
          <ToggleRow title="تسوية نهاية الشهر" sub="ملخص حسابك يوم 30" value={s.prefs.settlement.enabled} onChange={(v) => setPref('settlement', { enabled: v })} disabled={off} />
        </ListCard>
      </Section>

      <ListCard>
        <View>
          <ToggleRow
            title="أوقات الهدوء"
            sub={`من ${hourLabel(s.quietStart)} إلى ${hourLabel(s.quietEnd)}`}
            value={s.quietEnabled}
            onChange={(v) => update({ ...s, quietEnabled: v })}
            disabled={off}
          />
          {!off && s.quietEnabled && (
            <View style={{ paddingBottom: space[3], gap: space[2] }}>
              {open !== 'quiet' ? (
                <Button label="غيّر الأوقات" variant="quiet" onPress={() => setOpen('quiet')} />
              ) : (
                <>
                  <Txt v="smallStrong" c="inkMuted" style={{ paddingHorizontal: space[4] }}>
                    من
                  </Txt>
                  <HourPicker value={s.quietStart} onChange={(v) => update({ ...s, quietStart: v })} />
                  <Txt v="smallStrong" c="inkMuted" style={{ paddingHorizontal: space[4] }}>
                    إلى
                  </Txt>
                  <HourPicker value={s.quietEnd} onChange={(v) => update({ ...s, quietEnd: v })} />
                  <Button label="تم" variant="quiet" onPress={() => setOpen(null)} />
                </>
              )}
            </View>
          )}
        </View>
      </ListCard>
      <FormError text={save.error ? errorText(save.error) : null} />
    </Screen>
  );
}

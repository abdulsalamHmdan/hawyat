import { router } from 'expo-router';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Progress } from '@/components/controls';
import { IconTile, ListCard, Row, Screen, ScreenHeader, Section } from '@/components/layout';
import { Press } from '@/components/pressable';
import { QattaCard } from '@/components/qatta-card';
import { QATTA_ICON } from '@/components/qatta-icon';
import { StatusChip } from '@/components/status-chip';
import { Card } from '@/components/surface';
import { Txt } from '@/components/text';
import { memberName, useMock } from '@/data/mock';
import { countOf, riyal } from '@/lib/format';
import { size, space, useColors } from '@/theme';

/** 05 — القطة كما يشوفها العضو: حالته هو فقط، وقططه اللي سوّاها. */
export default function QattaTab() {
  const c = useColors();
  const { mine, owned, setPaid } = useMock();
  const monthly = mine.find((q) => q.kind === 'monthly');
  const events = mine.filter((q) => q.kind === 'event');
  const myOpen = owned.filter((q) => q.status === 'open');

  return (
    <Screen>
      <ScreenHeader
        title="القطة"
        action={<Button label="قطة جديدة" icon={Plus} onPress={() => router.push('/new-qatta')} />}
      />

      {monthly && (
        <QattaCard
          qatta={monthly}
          onPaid={() => setPaid(monthly.id, true)}
          onUndo={() => setPaid(monthly.id, false)}
          privacyNote="حالتك يشوفها أنت ومسؤول الصندوق فقط"
        />
      )}

      {events.length > 0 && (
        <Section label="قطط المناسبات">
          <ListCard>
            {events.map((q) => (
              <Press key={q.id} onPress={() => router.push(`/qatta/${q.id}`)} accessibilityLabel={`${q.title}، ${riyal(q.amountPerPerson)}`}>
                <Row
                  lead={<IconTile icon={QATTA_ICON[q.icon]} />}
                  title={`${q.title} · ${riyal(q.amountPerPerson)}`}
                  sub={`سوّاها ${memberName(q.createdBy)}`}
                  trail={
                    q.myPaidAt ? (
                      <StatusChip tone="paid" label="دفعت" />
                    ) : (
                      <Button label="دفعت" variant="primary" onPress={() => setPaid(q.id, true)} accessibilityLabel={`دفعت ${q.title}`} />
                    )
                  }
                />
              </Press>
            ))}
          </ListCard>
        </Section>
      )}

      {myOpen.length > 0 && (
        <Section label="قطط سوّيتها">
          {myOpen.map((q) => {
            const paid = q.participants.filter((p) => p.paidAt).length;
            const total = q.participants.length;
            return (
              <Press key={q.id} onPress={() => router.push(`/qatta/${q.id}`)} accessibilityLabel={`${q.title}، ${countOf(paid, total)} دفعوا`}>
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
                  <View style={{ flex: 1, gap: space[3] }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Txt v="bodyStrong">{`${q.title} · ${riyal(q.amountPerPerson)}`}</Txt>
                      <Txt v="small" c="inkMuted">
                        {countOf(paid, total)}
                      </Txt>
                    </View>
                    <Progress value={paid / total} />
                  </View>
                  <ChevronLeft size={size.icon} color={c.ink} strokeWidth={2} />
                </Card>
              </Press>
            );
          })}
        </Section>
      )}
    </Screen>
  );
}

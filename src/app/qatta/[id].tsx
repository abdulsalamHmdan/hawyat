import { router, useLocalSearchParams } from 'expo-router';
import { Bell, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Progress } from '@/components/controls';
import { ListCard, Row, Screen, ScreenHeader } from '@/components/layout';
import { QattaCard } from '@/components/qatta-card';
import { StatusChip } from '@/components/status-chip';
import { Card } from '@/components/surface';
import { Txt } from '@/components/text';
import { memberName, useMock } from '@/data/mock';
import { countOf, formatNumber, formatRelativeDay, riyal } from '@/lib/format';
import { size, space, useColors } from '@/theme';

export default function QattaDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { owned, mine } = useMock();
  const own = owned.find((q) => q.id === id);
  if (own) return <OwnerView id={own.id} />;
  const m = mine.find((q) => q.id === id);
  if (m) return <MemberView id={m.id} />;
  return (
    <Screen>
      <ScreenHeader title="القطة" back />
      <Txt v="body" c="inkMuted">
        ما لقينا هذي القطة.
      </Txt>
    </Screen>
  );
}

/** القطة كما يشوفها العضو: حالته هو فقط، بدون أي عدد أو أسماء. */
function MemberView({ id }: { id: string }) {
  const { mine, setPaid } = useMock();
  const q = mine.find((x) => x.id === id)!;
  return (
    <Screen>
      <ScreenHeader title={q.title} sub={`سوّاها ${memberName(q.createdBy)}`} back />
      <QattaCard
        qatta={{ ...q, title: 'نصيبك' }}
        onPaid={() => setPaid(q.id, true)}
        onUndo={() => setPaid(q.id, false)}
        privacyNote={`حالتك يشوفها أنت و${memberName(q.createdBy)} فقط`}
      />
      <Txt v="bodySm" c="inkMuted">
        حوّل المبلغ لـ{memberName(q.createdBy)} مباشرة، وبعدين اضغط «دفعت».
      </Txt>
    </Screen>
  );
}

/** 06 — القطة كما يشوفها منشئها: الوحيد اللي يشوف حالة الكل. */
function OwnerView({ id }: { id: string }) {
  const c = useColors();
  const { owned, closeOwned } = useMock();
  const q = owned.find((x) => x.id === id)!;
  const [reminded, setReminded] = useState(false);
  const paidCount = q.participants.filter((p) => p.paidAt).length;
  const total = q.participants.length;
  const unpaid = total - paidCount;

  return (
    <Screen
      footer={
        <View style={{ paddingHorizontal: space[4], paddingBottom: space[6], gap: space[2] }}>
          {q.status === 'open' && unpaid > 0 && (
            <>
              <Button
                label={reminded ? 'وصلهم التذكير' : 'ذكّر اللي ما دفعوا'}
                icon={Bell}
                large
                block
                disabled={reminded}
                onPress={() => setReminded(true)}
              />
              <Txt v="small" c="inkMuted" center>
                التذكير يوصل من التطبيق، بدون اسمك
              </Txt>
            </>
          )}
          {q.status === 'open' ? (
            <Button
              label="اقفل القطة"
              variant="quiet"
              muted
              block
              onPress={() => {
                closeOwned(q.id);
                router.back();
              }}
            />
          ) : (
            <Txt v="bodySm" c="inkMuted" center>
              القطة مقفولة
            </Txt>
          )}
        </View>
      }>
      <ScreenHeader title={q.title} sub={`سوّيتها أنت · ${riyal(q.amountPerPerson)} للشخص`} back />

      <Card tone="olive" style={{ flexDirection: 'row', gap: space[3], alignItems: 'flex-start' }}>
        <Lock size={size.iconTab} color={c.olive} strokeWidth={2} />
        <Txt v="body" style={{ flex: 1 }}>
          هذي القائمة تشوفها أنت بس. كل واحد من الشباب يشوف حالته هو فقط، وما يدري عن غيره.
        </Txt>
      </Card>

      <Card style={{ gap: space[4] }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space[2] }}>
            <Txt v="amountLg">{formatNumber(paidCount * q.amountPerPerson)}</Txt>
            <Txt v="body" c="inkMuted">
              من {riyal(total * q.amountPerPerson)}
            </Txt>
          </View>
          <Txt v="linkSm">{countOf(paidCount, total)} دفعوا</Txt>
        </View>
        <Progress value={paidCount / total} />
      </Card>

      <ListCard>
        {q.participants.map((p) => (
          <Row
            key={p.memberId}
            lead={<Avatar name={memberName(p.memberId)} />}
            title={memberName(p.memberId)}
            sub={
              p.paidAt
                ? `ضغط دفعت · ${formatRelativeDay(p.paidAt)}`
                : p.lastRemindedAt || reminded
                  ? 'وصله تذكير اليوم'
                  : 'ما وصله تذكير للحين'
            }
            trail={<StatusChip tone={p.paidAt ? 'paid' : 'due'} label={p.paidAt ? 'دفعت' : 'ما دفع'} />}
          />
        ))}
      </ListCard>
    </Screen>
  );
}

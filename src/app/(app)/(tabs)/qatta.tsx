import { router } from 'expo-router';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Progress } from '@/components/controls';
import { IconTile, ListCard, Row, Screen, ScreenHeader, Section, Status } from '@/components/layout';
import { Press } from '@/components/pressable';
import { QattaCard } from '@/components/qatta-card';
import { QATTA_ICON, guessQattaIcon } from '@/components/qatta-icon';
import { StatusChip } from '@/components/status-chip';
import { Card } from '@/components/surface';
import { Txt } from '@/components/text';
import { backend } from '@/data';
import { useAction, useCamp, useMemberName, useMyQatta, useOwnedQatta } from '@/data/hooks';
import type { OwnedContribution } from '@/data/types';
import { pickImage } from '@/lib/image';
import { countOf, riyal } from '@/lib/format';
import { size, space, useColors } from '@/theme';

const QATTA_KEYS = [['qatta'], ['account']];

function OwnedCard({ q }: { q: OwnedContribution }) {
  const c = useColors();
  const paid = q.participants.filter((p) => p.paidAt).length;
  const total = q.participants.length;
  return (
    <Press onPress={() => router.push(`/qatta/${q.id}`)} accessibilityLabel={`${q.title}، ${countOf(paid, total)} دفعوا`}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
        <View style={{ flex: 1, gap: space[3] }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space[2] }}>
            <Txt v="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>{`${q.title} · ${riyal(q.amountPerPerson)}`}</Txt>
            <Txt v="small" c="inkMuted">
              {countOf(paid, total)}
            </Txt>
          </View>
          <Progress value={total ? paid / total : 0} />
        </View>
        <ChevronLeft size={size.icon} color={c.ink} strokeWidth={2} />
      </Card>
    </Press>
  );
}

/** 05 — القطة كما يشوفها العضو: حالته هو فقط، وقططه اللي سوّاها. */
export default function QattaTab() {
  const { member } = useCamp();
  const mine = useMyQatta();
  const owned = useOwnedQatta();
  const name = useMemberName();
  const setPaid = useAction(
    (id: string, paid: boolean, receipt?: Awaited<ReturnType<typeof pickImage>>) => backend.setPaid(id, paid, receipt),
    QATTA_KEYS,
  );

  const list = mine.data ?? [];
  const monthly = list.find((q) => q.kind === 'monthly' && q.status === 'open') ?? list.find((q) => q.kind === 'monthly');
  const events = list.filter((q) => q.kind === 'event' && (q.status === 'open' || !q.myPaidAt));
  const ownedOpen = (owned.data ?? []).filter((q) => q.status === 'open');
  const myEvents = ownedOpen.filter((q) => q.kind === 'event');
  const fundMonthly = member.role === 'fund_manager' ? ownedOpen.filter((q) => q.kind === 'monthly') : [];

  return (
    <Screen
      onRefresh={() => Promise.all([mine.refetch(), owned.refetch()])}
      refreshing={mine.isRefetching}>
      <ScreenHeader title="القطة" action={<Button label="قطة جديدة" icon={Plus} onPress={() => router.push('/new-qatta')} />} />

      {(mine.isPending || mine.error) && <Status loading={mine.isPending} error={mine.error} onRetry={() => mine.refetch()} />}

      {monthly && (
        <QattaCard
          qatta={monthly}
          busy={setPaid.isPending}
          onPaid={() => setPaid.mutate([monthly.id, true])}
          onUndo={() => setPaid.mutate([monthly.id, false])}
          onAttach={async () => {
            const img = await pickImage();
            if (img) setPaid.mutate([monthly.id, true, img]);
          }}
          privacyNote="حالتك يشوفها أنت ومسؤول الصندوق فقط"
        />
      )}

      {mine.data && !monthly && events.length === 0 && myEvents.length === 0 && (
        <Status empty="ما عليك قطط الحين. القطة الشهرية تنزل أول الشهر." />
      )}

      {events.length > 0 && (
        <Section label="قطط المناسبات">
          <ListCard>
            {events.map((q) => (
              <Press key={q.id} onPress={() => router.push(`/qatta/${q.id}`)} accessibilityLabel={`${q.title}، ${riyal(q.amountPerPerson)}`}>
                <Row
                  lead={<IconTile icon={QATTA_ICON[guessQattaIcon(q.title)]} />}
                  title={`${q.title} · ${riyal(q.amountPerPerson)}`}
                  sub={`سوّاها ${name(q.createdBy)}`}
                  trail={
                    q.myPaidAt ? (
                      <StatusChip tone="paid" label="دفعت" />
                    ) : (
                      <Button
                        label="دفعت"
                        variant="primary"
                        disabled={setPaid.isPending}
                        onPress={() => setPaid.mutate([q.id, true])}
                        accessibilityLabel={`دفعت ${q.title}`}
                      />
                    )
                  }
                />
              </Press>
            ))}
          </ListCard>
        </Section>
      )}

      {myEvents.length > 0 && (
        <Section label="قطط سوّيتها">
          {myEvents.map((q) => (
            <OwnedCard key={q.id} q={q} />
          ))}
        </Section>
      )}

      {fundMonthly.length > 0 && (
        <Section label="الصندوق (تشوفها لأنك مسؤول الصندوق)">
          {fundMonthly.map((q) => (
            <OwnedCard key={q.id} q={q} />
          ))}
        </Section>
      )}
    </Screen>
  );
}

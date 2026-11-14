import { router, useLocalSearchParams } from 'expo-router';
import { Bell, Image as ImageIcon, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Progress } from '@/components/controls';
import { FormError } from '@/components/form-error';
import { ListCard, Row, Screen, ScreenHeader, Status } from '@/components/layout';
import { Press } from '@/components/pressable';
import { QattaCard } from '@/components/qatta-card';
import { StatusChip } from '@/components/status-chip';
import { Card } from '@/components/surface';
import { Txt } from '@/components/text';
import { backend } from '@/data';
import { errorText, useAction, useMemberMap, useMemberName, useMyQatta, useOwnedQatta } from '@/data/hooks';
import type { MyContribution, OwnedContribution } from '@/data/types';
import { countOf, formatNumber, formatRelativeDay, riyal } from '@/lib/format';
import { pickImage } from '@/lib/image';
import { size, space, useColors } from '@/theme';

const KEYS = [['qatta'], ['account']];

export default function QattaDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const owned = useOwnedQatta();
  const mine = useMyQatta();
  const own = owned.data?.find((q) => q.id === id);
  if (own) return <OwnerView q={own} />;
  const m = mine.data?.find((q) => q.id === id);
  if (m) return <MemberView q={m} />;
  const loading = owned.isPending || mine.isPending;
  return (
    <Screen>
      <ScreenHeader title="القطة" back />
      {loading ? <Status loading /> : <Status empty="ما لقينا هذي القطة." />}
    </Screen>
  );
}

/** القطة كما يشوفها العضو: حالته هو فقط، بدون أي عدد أو أسماء. */
function MemberView({ q }: { q: MyContribution }) {
  const name = useMemberName();
  const setPaid = useAction((paid: boolean, receipt?: Awaited<ReturnType<typeof pickImage>>) => backend.setPaid(q.id, paid, receipt), KEYS);
  const owner = q.kind === 'monthly' ? 'مسؤول الصندوق' : name(q.createdBy);
  return (
    <Screen>
      <ScreenHeader title={q.title} sub={q.kind === 'monthly' ? 'القطة الشهرية' : `سوّاها ${owner}`} back />
      <QattaCard
        qatta={q}
        title="نصيبك"
        busy={setPaid.isPending}
        onPaid={() => setPaid.mutate([true])}
        onUndo={() => setPaid.mutate([false])}
        onAttach={async () => {
          const img = await pickImage();
          if (img) setPaid.mutate([true, img]);
        }}
        privacyNote={`حالتك يشوفها أنت و${owner} فقط`}
      />
      <FormError text={setPaid.error ? errorText(setPaid.error) : null} />
      <Txt v="bodySm" c="inkMuted">
        حوّل المبلغ لـ{owner} مباشرة، وبعدين اضغط «دفعت».
      </Txt>
    </Screen>
  );
}

/** 06 — القطة كما يشوفها منشئها (أو مسؤول الصندوق للشهرية): الوحيد اللي يشوف حالة الكل. */
function OwnerView({ q }: { q: OwnedContribution }) {
  const c = useColors();
  const name = useMemberName();
  const members = useMemberMap();
  const remind = useAction(() => backend.remindUnpaid(q.id), KEYS);
  const close = useAction(() => backend.closeContribution(q.id), KEYS);

  const paidCount = q.participants.filter((p) => p.paidAt).length;
  const total = q.participants.length;
  const unpaid = total - paidCount;
  const [now] = useState(() => Date.now());
  const remindedToday = (d: Date | null) => !!d && now - d.getTime() < 12 * 3600_000;
  const allRemindedRecently = q.participants.filter((p) => !p.paidAt).every((p) => remindedToday(p.lastRemindedAt));
  const sorted = [...q.participants].sort((a, b) => name(a.memberId).localeCompare(name(b.memberId), 'ar'));

  const openReceipt = async (path: string) => {
    const url = await backend.signedUrl('payment-receipts', path);
    if (url) Linking.openURL(url);
  };

  return (
    <Screen
      footer={
        <View style={{ paddingHorizontal: space[4], paddingBottom: space[6], gap: space[2] }}>
          {q.status === 'open' && unpaid > 0 && (
            <>
              <Button
                label={remind.isSuccess || allRemindedRecently ? 'وصلهم التذكير' : 'ذكّر اللي ما دفعوا'}
                icon={Bell}
                large
                block
                disabled={remind.isPending || remind.isSuccess || allRemindedRecently}
                onPress={() => remind.mutate([])}
              />
              <Txt v="small" c="inkMuted" center>
                التذكير يوصل من التطبيق، بدون اسمك
              </Txt>
            </>
          )}
          {q.status === 'open' && q.kind === 'event' ? (
            <Button
              label="اقفل القطة"
              variant="quiet"
              muted
              block
              onPress={() =>
                Alert.alert('تقفل القطة؟', 'ما يوصل أحد تذكير بعدها.', [
                  { text: 'لا', style: 'cancel' },
                  { text: 'اقفلها', onPress: () => close.mutate([], { onSuccess: () => router.back() }) },
                ])
              }
            />
          ) : q.status === 'closed' ? (
            <Txt v="bodySm" c="inkMuted" center>
              القطة مقفولة
            </Txt>
          ) : null}
        </View>
      }>
      <ScreenHeader
        title={q.title}
        sub={q.kind === 'monthly' ? `القطة الشهرية · ${riyal(q.amountPerPerson)} للشخص` : `سوّيتها أنت · ${riyal(q.amountPerPerson)} للشخص`}
        back
      />

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
        <Progress value={total ? paidCount / total : 0} />
      </Card>

      <ListCard>
        {sorted.map((p) => (
          <Row
            key={p.memberId}
            lead={<Avatar name={name(p.memberId, { raw: true })} uri={members.get(p.memberId)?.avatarUrl} />}
            title={name(p.memberId)}
            sub={
              p.paidAt
                ? `ضغط دفعت · ${formatRelativeDay(p.paidAt)}`
                : remindedToday(p.lastRemindedAt)
                  ? 'وصله تذكير اليوم'
                  : 'ما وصله تذكير للحين'
            }
            trail={
              <View style={{ alignItems: 'flex-end', gap: space[1] }}>
                <StatusChip tone={p.paidAt ? 'paid' : 'due'} label={p.paidAt ? 'دفع' : 'ما دفع'} />
                {p.receiptPath && (
                  <Press onPress={() => openReceipt(p.receiptPath!)} accessibilityRole="button" accessibilityLabel={`صورة تحويل ${name(p.memberId)}`} style={{ flexDirection: 'row', alignItems: 'center', gap: space[1] }}>
                    <ImageIcon size={size.iconSm} color={c.olive} strokeWidth={2} />
                    <Txt v="small" c="olive">
                      التحويل
                    </Txt>
                  </Press>
                )}
              </View>
            }
          />
        ))}
      </ListCard>
      <FormError text={remind.error ? errorText(remind.error) : close.error ? errorText(close.error) : null} />
    </Screen>
  );
}

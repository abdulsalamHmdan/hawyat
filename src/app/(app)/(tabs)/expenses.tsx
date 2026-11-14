import { router } from 'expo-router';
import { ChevronLeft, Flame, HandCoins, Plus, ReceiptText } from 'lucide-react-native';
import { Alert, Linking, View } from 'react-native';

import { Button } from '@/components/button';
import { IconTile, ListCard, Row, Screen, ScreenHeader, Section, Status } from '@/components/layout';
import { Press } from '@/components/pressable';
import { StatusChip } from '@/components/status-chip';
import { Card } from '@/components/surface';
import { Txt } from '@/components/text';
import { backend } from '@/data';
import { useAccount, useAction, useCamp, useExpenses, useMemberName } from '@/data/hooks';
import { CATEGORY_LABEL } from '@/data/labels';
import type { Expense } from '@/data/types';
import { formatDate, formatNumber, monthName, riyal } from '@/lib/format';
import { size, space, useColors } from '@/theme';

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <Card style={{ flex: 1, gap: space[1], shadowOpacity: 0, elevation: 0 }}>
      <Txt v="bodySm" c="inkMuted">
        {label}
      </Txt>
      <Txt v="title">{riyal(value)}</Txt>
    </Card>
  );
}

/** 08 — المصاريف وحسابك. سجل المصاريف يشوفه الكل (شفافية الصندوق). */
export default function Expenses() {
  const c = useColors();
  const { member } = useCamp();
  const expenses = useExpenses();
  const account = useAccount();
  const name = useMemberName();
  const del = useAction((id: string) => backend.deleteExpense(id), [['expenses'], ['account']]);

  const list = expenses.data ?? [];
  const mine = list.filter((e) => e.paidBy === member.id);
  const others = list.filter((e) => e.paidBy !== member.id);
  const acc = account.data;

  const openReceipt = async (e: Expense) => {
    if (!e.receiptPath) return;
    const url = await backend.signedUrl('expense-receipts', e.receiptPath);
    if (url) Linking.openURL(url);
  };

  const row = (e: Expense, own: boolean) => (
    <Press
      key={e.id}
      onPress={() => openReceipt(e)}
      onLongPress={
        own && !e.settledAt
          ? () =>
              Alert.alert('تحذف المصروف؟', `${e.description ?? CATEGORY_LABEL[e.category]} · ${riyal(e.amount)}`, [
                { text: 'لا', style: 'cancel' },
                { text: 'احذفه', style: 'destructive', onPress: () => del.mutate([e.id]) },
              ])
          : undefined
      }
      accessibilityLabel={`${e.description ?? CATEGORY_LABEL[e.category]}، ${riyal(e.amount)}`}
      accessibilityHint={own && !e.settledAt ? 'اضغط مطوّل للحذف' : undefined}>
      <Row
        lead={<IconTile icon={e.category === 'firewood' ? Flame : ReceiptText} tone={e.category === 'firewood' ? 'ember' : 'neutral'} />}
        title={`${e.description || CATEGORY_LABEL[e.category]} · ${riyal(e.amount)}`}
        sub={[formatDate(e.spentAt), own ? null : name(e.paidBy), e.receiptPath ? 'معه فاتورة' : null].filter(Boolean).join(' · ')}
        trail={own ? e.settledAt ? <StatusChip tone="paid" label="تسوّت" /> : <StatusChip tone="neutral" label="ينتظر التسوية" icon={false} /> : undefined}
      />
    </Press>
  );

  return (
    <Screen onRefresh={() => Promise.all([expenses.refetch(), account.refetch()])} refreshing={expenses.isRefetching}>
      <ScreenHeader title="المصاريف" action={<Button label="سجّل مصروف" icon={Plus} variant="primary" onPress={() => router.push('/new-expense')} />} />

      <Card tone="olive" style={{ gap: space[4] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt v="linkSm">حسابك في {monthName(new Date())}</Txt>
          {acc && (
            <Txt v="small" c="inkMuted">
              التسوية {formatDate(acc.settlementDate)}
            </Txt>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space[2], flexWrap: 'wrap' }} accessible accessibilityLabel={`لك ${riyal(acc?.owedToMe ?? 0)} من الصندوق`}>
          <Txt v="title" c="olive">
            لك
          </Txt>
          <Txt v="amountLg" c="olive">
            {formatNumber(acc?.owedToMe ?? 0)}
          </Txt>
          <Txt v="title" c="olive">
            ريال من الصندوق
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', gap: space[3] }}>
          <Mini label="صرفت من جيبك" value={acc?.spentThisMonth ?? 0} />
          <Mini label="رصيد الصندوق" value={acc?.fundBalance ?? 0} />
        </View>
      </Card>

      {member.role === 'fund_manager' && (
        <Press onPress={() => router.push('/settlement')} accessibilityRole="button" accessibilityLabel="التسوية الشهرية">
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
            <HandCoins size={size.icon} color={c.ink} strokeWidth={2} />
            <Txt v="rowTitle" style={{ flex: 1 }}>
              التسوية الشهرية
            </Txt>
            <ChevronLeft size={size.icon} color={c.inkMuted} strokeWidth={2} />
          </Card>
        </Press>
      )}

      {(expenses.isPending || expenses.error) && <Status loading={expenses.isPending} error={expenses.error} onRetry={() => expenses.refetch()} />}

      {mine.length > 0 && (
        <Section label="طلباتك">
          <ListCard>{mine.map((e) => row(e, true))}</ListCard>
        </Section>
      )}

      {others.length > 0 && (
        <Section label="سجل المخيم">
          <ListCard>{others.map((e) => row(e, false))}</ListCard>
        </Section>
      )}

      {expenses.data && list.length === 0 && <Status empty="ما فيه مصاريف للحين. لو دفعت شي للمخيم سجّله هنا." />}
    </Screen>
  );
}

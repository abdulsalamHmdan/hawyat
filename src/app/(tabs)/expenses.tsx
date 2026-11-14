import { router } from 'expo-router';
import { Flame, Plus, ReceiptText } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { IconTile, ListCard, Row, Screen, ScreenHeader, Section } from '@/components/layout';
import { StatusChip } from '@/components/status-chip';
import { Card } from '@/components/surface';
import { Txt } from '@/components/text';
import { CATEGORY_LABEL } from '@/data/labels';
import { ME, memberName, useMock } from '@/data/mock';
import type { Expense } from '@/data/types';
import { formatDate, formatNumber, monthName, riyal } from '@/lib/format';
import { space } from '@/theme';

function ExpenseRow({ e, showWho }: { e: Expense; showWho?: boolean }) {
  const sub = [formatDate(e.spentAt), showWho ? memberName(e.paidBy) : null, e.hasReceipt ? 'معه فاتورة' : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <Row
      lead={<IconTile icon={e.category === 'firewood' ? Flame : ReceiptText} tone={e.category === 'firewood' ? 'ember' : 'neutral'} />}
      title={`${e.description || CATEGORY_LABEL[e.category]} · ${riyal(e.amount)}`}
      sub={sub}
      trail={e.settled ? <StatusChip tone="paid" label="تسوّت" /> : <StatusChip tone="neutral" label="ينتظر التسوية" icon={false} />}
    />
  );
}

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
  const { expenses, account } = useMock();
  const mine = expenses.filter((e) => e.paidBy === ME);
  const others = expenses.filter((e) => e.paidBy !== ME);
  const month = monthName(new Date());

  return (
    <Screen>
      <ScreenHeader
        title="المصاريف"
        action={<Button label="سجّل مصروف" icon={Plus} variant="primary" onPress={() => router.push('/new-expense')} />}
      />

      <Card tone="olive" style={{ gap: space[4] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt v="linkSm">حسابك في {month}</Txt>
          <Txt v="small" c="inkMuted">
            التسوية {formatDate(account.settlementDate)}
          </Txt>
        </View>
        <View
          style={{ flexDirection: 'row', alignItems: 'baseline', gap: space[2] }}
          accessible
          accessibilityLabel={`لك ${riyal(account.owedToMe)} من الصندوق`}>
          <Txt v="title" c="olive">
            لك
          </Txt>
          <Txt v="amountLg" c="olive">
            {formatNumber(account.owedToMe)}
          </Txt>
          <Txt v="title" c="olive">
            ريال من الصندوق
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', gap: space[3] }}>
          <Mini label="صرفت من جيبك" value={account.spentThisMonth} />
          <Mini label="رصيد الصندوق" value={account.fundBalance} />
        </View>
      </Card>

      {mine.length > 0 && (
        <Section label="طلباتك">
          <ListCard>
            {mine.map((e) => (
              <ExpenseRow key={e.id} e={e} />
            ))}
          </ListCard>
        </Section>
      )}

      {others.length > 0 && (
        <Section label="سجل المخيم">
          <ListCard>
            {others.map((e) => (
              <ExpenseRow key={e.id} e={e} showWho />
            ))}
          </ListCard>
        </Section>
      )}
    </Screen>
  );
}

import { View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ListCard, Row, Screen, ScreenHeader } from '@/components/layout';
import { StatusChip } from '@/components/status-chip';
import { Txt } from '@/components/text';
import { MEMBERS, memberName, useMock } from '@/data/mock';
import { formatTime } from '@/lib/format';

/** الشباب: قائمة الأعضاء. بدون أي شي عن الدفع ولا ترتيب. */
export default function Members() {
  const { presence } = useMock();
  const sorted = [...MEMBERS].sort((a, b) => a.displayName.localeCompare(b.displayName, 'ar'));
  return (
    <Screen>
      <ScreenHeader title="الشباب" sub={`${MEMBERS.length} أعضاء`} />
      <ListCard>
        {sorted.map((m) => {
          const here = presence.find((p) => p.memberId === m.id && !p.leftAt);
          return (
            <Row
              key={m.id}
              lead={<Avatar name={m.displayName} present={!!here} />}
              title={memberName(m.id) === 'أنت' ? `${m.displayName} (أنت)` : m.displayName}
              sub={here ? `بالمخيم من ${formatTime(here.arrivedAt)}` : undefined}
              trail={m.role === 'fund_manager' ? <StatusChip tone="neutral" label="مسؤول الصندوق" icon={false} /> : undefined}
            />
          );
        })}
      </ListCard>
      <View>
        <Txt v="bodySm" c="inkMuted">
          تبي تضيف أحد؟ خذ كود الدعوة من مسؤول الصندوق وأرسله له.
        </Txt>
      </View>
    </Screen>
  );
}

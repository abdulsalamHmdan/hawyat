import { Alert } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ListCard, Row, Screen, ScreenHeader, Status } from '@/components/layout';
import { Press } from '@/components/pressable';
import { StatusChip } from '@/components/status-chip';
import { Txt } from '@/components/text';
import { backend } from '@/data';
import { useAction, useCamp, useLive, useMembers } from '@/data/hooks';
import { formatTime } from '@/lib/format';

/** الشباب: قائمة الأعضاء بالترتيب الأبجدي. بدون أي شي عن الدفع ولا ترتيب بينهم. */
export default function Members() {
  const { member: me } = useCamp();
  const members = useMembers();
  const live = useLive();
  const transfer = useAction((id: string) => backend.transferFundManager(id), [['members'], ['me']]);
  const sorted = [...(members.data ?? [])].sort((a, b) => a.displayName.localeCompare(b.displayName, 'ar'));
  const isFm = me.role === 'fund_manager';

  return (
    <Screen onRefresh={() => members.refetch()} refreshing={members.isRefetching}>
      <ScreenHeader title="الشباب" sub={members.data ? `${members.data.length} أعضاء` : undefined} />
      {(members.isPending || members.error) && <Status loading={members.isPending} error={members.error} onRetry={() => members.refetch()} />}
      {sorted.length > 0 && (
        <ListCard>
          {sorted.map((m) => {
            const here = live.data?.presence.find((p) => p.memberId === m.id);
            const content = (
              <Row
                lead={<Avatar name={m.displayName} uri={m.avatarUrl} present={!!here} />}
                title={m.id === me.id ? `${m.displayName} (أنت)` : m.displayName}
                sub={here ? `بالمخيم من ${formatTime(here.arrivedAt)}` : undefined}
                trail={m.role === 'fund_manager' ? <StatusChip tone="neutral" label="مسؤول الصندوق" icon={false} /> : undefined}
              />
            );
            if (!isFm || m.id === me.id) return <Press key={m.id} disabled dimWhenDisabled={false}>{content}</Press>;
            return (
              <Press
                key={m.id}
                accessibilityHint="اضغط مطوّل تخليه مسؤول الصندوق"
                onLongPress={() =>
                  Alert.alert(`تخلي ${m.displayName} مسؤول الصندوق؟`, 'بتصير عضو عادي، وهو يشوف حالات القطة الشهرية ويسوي التسوية.', [
                    { text: 'لا', style: 'cancel' },
                    { text: 'إيه', onPress: () => transfer.mutate([m.id]) },
                  ])
                }>
                {content}
              </Press>
            );
          })}
        </ListCard>
      )}
      <Txt v="bodySm" c="inkMuted">
        {isFm ? 'تبي تضيف أحد؟ أرسل له كود الدعوة من الإعدادات.' : 'تبي تضيف أحد؟ خذ كود الدعوة من مسؤول الصندوق.'}
      </Txt>
    </Screen>
  );
}

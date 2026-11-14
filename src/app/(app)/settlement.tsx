import { View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { FormError } from '@/components/form-error';
import { ListCard, Row, Screen, ScreenHeader, Status } from '@/components/layout';
import { Txt } from '@/components/text';
import { backend } from '@/data';
import { errorText, useAction, useCamp, useMemberMap, useMemberName, useSettlement } from '@/data/hooks';
import { MONTHS, riyal } from '@/lib/format';
import { space } from '@/theme';

/** التسوية الشهرية (مسؤول الصندوق): لكل عضو كم يستحق من الصندوق، و«تمت التسوية» لكل واحد. */
export default function SettlementScreen() {
  const { camp, member } = useCamp();
  const st = useSettlement();
  const name = useMemberName();
  const members = useMemberMap();
  const KEYS = [['settlement'], ['expenses'], ['account']];
  const create = useAction(() => backend.createSettlement(camp.id), KEYS);
  const mark = useAction((id: string, v: boolean) => backend.markSettled(id, v), KEYS);

  if (member.role !== 'fund_manager') {
    return (
      <Screen>
        <ScreenHeader title="التسوية" back />
        <Status empty="التسوية يسويها مسؤول الصندوق. حسابك تلقاه في المصاريف." />
      </Screen>
    );
  }

  const s = st.data;
  const period = s ? `${MONTHS[Number(s.period.slice(5, 7)) - 1]} ${s.period.slice(0, 4)}` : '';
  const pending = s?.items.filter((i) => !i.settledAt) ?? [];

  return (
    <Screen onRefresh={() => st.refetch()} refreshing={st.isRefetching}>
      <ScreenHeader title="التسوية" sub={s ? `آخر تسوية: ${period}` : 'نهاية كل شهر'} back />
      <Txt v="body" c="inkMuted">
        «طلّع الملخص» يجمع كل المصاريف اللي ما تسوّت، ويحسب لكل واحد كم له من الصندوق. حوّل له، واضغط «تمت التسوية».
      </Txt>
      <Button
        label={create.isPending ? 'لحظة...' : 'طلّع ملخص التسوية'}
        variant="primary"
        large
        block
        disabled={create.isPending}
        onPress={() => create.mutate([])}
      />
      <FormError text={create.error ? errorText(create.error) : mark.error ? errorText(mark.error) : null} />
      {(st.isPending || st.error) && <Status loading={st.isPending} error={st.error} onRetry={() => st.refetch()} />}
      {s && s.items.length === 0 && <Status empty="ما فيه أحد له شي من الصندوق." />}
      {s && s.items.length > 0 && (
        <View style={{ gap: space[2] }}>
          <Txt v="section" c="inkMuted">
            {pending.length ? `باقي ${pending.length}` : 'كلهم تسوّوا'}
          </Txt>
          <ListCard>
            {s.items.map((i) => (
              <Row
                key={i.id}
                lead={<Avatar name={name(i.memberId, { raw: true })} uri={members.get(i.memberId)?.avatarUrl} />}
                title={name(i.memberId)}
                sub={`له ${riyal(i.amount)}`}
                trail={
                  i.settledAt ? (
                    <Button label="تسوّت" variant="quiet" onPress={() => mark.mutate([i.id, false])} accessibilityLabel={`تراجع عن تسوية ${name(i.memberId)}`} />
                  ) : (
                    <Button label="تمت التسوية" variant="primary" onPress={() => mark.mutate([i.id, true])} />
                  )
                }
              />
            ))}
          </ListCard>
        </View>
      )}
    </Screen>
  );
}

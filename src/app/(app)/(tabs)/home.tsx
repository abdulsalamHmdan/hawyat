import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { View } from 'react-native';

import { Person } from '@/components/avatar';
import { IconButton } from '@/components/button';
import { InviteCard, sessionMeta } from '@/components/invite-card';
import { Screen, Status } from '@/components/layout';
import { PresenceButton } from '@/components/presence-button';
import { Press } from '@/components/pressable';
import { Card } from '@/components/surface';
import { Txt } from '@/components/text';
import { backend } from '@/data';
import { useAction, useCamp, useLive, useMemberMap, useMemberName } from '@/data/hooks';
import { REPLY_SHORT } from '@/data/labels';
import type { ReplyKind } from '@/data/types';
import { formatTime } from '@/lib/format';
import { gap, space } from '@/theme';

/** 02 — الرئيسية: الحضور والدعوات فقط. بدون أي شي عن الفلوس. */
export default function Home() {
  const { member, camp } = useCamp();
  const live = useLive();
  const name = useMemberName();
  const members = useMemberMap();
  const leave = useAction(() => backend.leave(camp.id), [['live']]);
  const respond = useAction((sid: string, r: ReplyKind) => backend.respond(sid, r), [['live']]);

  const session = live.data?.session ?? null;
  const here = live.data?.presence ?? [];
  const responses = live.data?.responses ?? [];
  const iAmIn = here.some((p) => p.memberId === member.id);
  const myReply = responses.find((r) => r.memberId === member.id)?.response ?? null;
  const coming = responses.filter((r) => r.response !== 'cant' && !here.some((p) => p.memberId === r.memberId));
  const hostId = session?.hostId ?? session?.startedBy;

  return (
    <Screen gap={gap.form} onRefresh={() => live.refetch()} refreshing={live.isRefetching}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Txt v="bodySm" c="inkMuted">
            مخيم {camp.name}
          </Txt>
          <Txt v="display" accessibilityRole="header">
            هلا {member.displayName}
          </Txt>
        </View>
        <IconButton icon={Bell} label="الإشعارات" onPress={() => router.push('/notifications')} />
      </View>

      <View style={{ alignItems: 'center', gap: space[3], paddingTop: space[2], paddingBottom: space[1] }}>
        <PresenceButton inCamp={iAmIn} onPress={() => (iAmIn ? leave.mutate([]) : router.push('/invite'))} />
        <Txt v="small" c="inkMuted" center>
          {iAmIn
            ? 'الشباب يدرون إنك هنا. لو طلعت اضغط الزر'
            : member.geofenceEnabled
              ? 'أو يبلّغهم التطبيق لحاله أول ما توصل'
              : 'تقدر تخلي التطبيق يبلّغهم لحاله من الإعدادات'}
        </Txt>
      </View>

      {session && hostId && hostId !== member.id && (
        <InviteCard
          session={session}
          starterName={name(hostId)}
          meta={sessionMeta(session, coming.length)}
          myReply={myReply}
          onReply={iAmIn ? undefined : (r) => respond.mutate([session.id, r])}
          onPress={() => router.push('/session')}
        />
      )}

      <View style={{ gap: space[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt v="title" accessibilityRole="header">
            في المخيم الآن
          </Txt>
          {session && (
            <Press onPress={() => router.push('/session')} accessibilityRole="link" accessibilityLabel="الجلسة كاملة">
              <Txt v="linkSm" c="olive">
                الجلسة كاملة
              </Txt>
            </Press>
          )}
        </View>
        <Card
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: here.length + coming.length >= 5 ? 'space-between' : 'flex-start',
            columnGap: here.length + coming.length >= 5 ? 0 : space[3],
            rowGap: space[4],
            paddingHorizontal: space[3],
          }}>
          {live.isPending || live.error ? (
            <Status loading={live.isPending} error={live.error} onRetry={() => live.refetch()} />
          ) : here.length === 0 && coming.length === 0 ? (
            <Txt v="bodySm" c="inkMuted">
              ما فيه أحد بالمخيم الحين
            </Txt>
          ) : (
            <>
              {here.map((p) => (
                <Person key={p.memberId} name={name(p.memberId)} uri={members.get(p.memberId)?.avatarUrl} sub={`من ${formatTime(p.arrivedAt)}`} present />
              ))}
              {coming.map((r) => (
                <Person key={r.memberId} name={name(r.memberId)} uri={members.get(r.memberId)?.avatarUrl} sub={REPLY_SHORT[r.response]} />
              ))}
            </>
          )}
        </Card>
      </View>
    </Screen>
  );
}

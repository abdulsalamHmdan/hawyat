import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { View } from 'react-native';

import { Person } from '@/components/avatar';
import { IconButton } from '@/components/button';
import { InviteCard, sessionMeta } from '@/components/invite-card';
import { Screen } from '@/components/layout';
import { PresenceButton } from '@/components/presence-button';
import { Press } from '@/components/pressable';
import { Card } from '@/components/surface';
import { Txt } from '@/components/text';
import { REPLY_SHORT } from '@/data/labels';
import { CAMP, ME, memberName, useMock } from '@/data/mock';
import { formatTime } from '@/lib/format';
import { gap, space } from '@/theme';

/** 02 — الرئيسية: الحضور والدعوات فقط. بدون أي شي عن الفلوس. */
export default function Home() {
  const { me, session, presence, responses, myResponse, reply, iAmIn, leave } = useMock();

  const here = presence.filter((p) => !p.leftAt);
  const coming = responses.filter((r) => r.response !== 'cant' && !here.some((p) => p.memberId === r.memberId));
  const comingCount = coming.length + (myResponse && myResponse !== 'cant' && !iAmIn ? 1 : 0);

  return (
    <Screen gap={gap.form}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Txt v="bodySm" c="inkMuted">
            مخيم {CAMP.name}
          </Txt>
          <Txt v="display" accessibilityRole="header">
            هلا {me.displayName}
          </Txt>
        </View>
        <IconButton icon={Bell} label="الإشعارات" onPress={() => router.push('/notifications')} />
      </View>

      <View style={{ alignItems: 'center', gap: space[3], paddingTop: space[2], paddingBottom: space[1] }}>
        <PresenceButton inCamp={iAmIn} onPress={() => (iAmIn ? leave() : router.push('/invite'))} />
        <Txt v="small" c="inkMuted">
          {iAmIn ? 'الشباب يدرون إنك هنا' : 'أو يبلّغهم التطبيق لحاله أول ما توصل'}
        </Txt>
      </View>

      {session && session.startedBy !== ME && (
        <InviteCard
          session={session}
          starterName={memberName(session.startedBy)}
          meta={sessionMeta(session, comingCount)}
          myReply={myResponse}
          onReply={iAmIn ? undefined : reply}
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
        <Card style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space[4], paddingHorizontal: space[3] }}>
          {here.length === 0 && coming.length === 0 ? (
            <Txt v="bodySm" c="inkMuted">
              ما فيه أحد بالمخيم الحين
            </Txt>
          ) : (
            <>
              {here.map((p) => (
                <Person key={p.memberId} name={memberName(p.memberId)} sub={`من ${formatTime(p.arrivedAt)}`} present />
              ))}
              {coming.map((r) => (
                <Person key={r.memberId} name={memberName(r.memberId)} sub={REPLY_SHORT[r.response]} />
              ))}
            </>
          )}
        </Card>
      </View>
    </Screen>
  );
}

import { View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { QuickReply } from '@/components/quick-reply';
import { inviteHeadline, replyOptions } from '@/components/invite-card';
import { ListCard, Row, Screen, ScreenHeader, SectionLabel } from '@/components/layout';
import { StatusChip } from '@/components/status-chip';
import { Card } from '@/components/surface';
import { Txt } from '@/components/text';
import { REPLY_LABEL, TREAT_LABEL } from '@/data/labels';
import { ME, memberName, useMock } from '@/data/mock';
import { formatDayDate, formatTime } from '@/lib/format';
import { gap, opacity, radius, size, space, useColors } from '@/theme';

function Stat({ n, label, accent }: { n: number; label: string; accent?: boolean }) {
  const c = useColors();
  return (
    <View
      style={{ flex: 1, backgroundColor: c.nightRaised, borderRadius: radius.sm + 2, paddingVertical: space[3], alignItems: 'center' }}
      accessible
      accessibilityLabel={`${n} ${label}`}>
      <Txt v="stat" c={accent ? 'glow' : 'sand'}>
        {n}
      </Txt>
      <Txt v="small" c="sand" style={{ opacity: opacity.nightMuted }}>
        {label}
      </Txt>
    </View>
  );
}

/** 04 — الجلسة: مين بادر، الموجودين، الجايين، ومين اعتذر. بدون أي إحصائيات عن الأشخاص. */
export default function SessionScreen() {
  const c = useColors();
  const { session, presence, responses, myResponse, reply, iAmIn } = useMock();

  if (!session) {
    return (
      <Screen>
        <ScreenHeader title="جلسة الليلة" back />
        <Txt v="body" c="inkMuted">
          ما فيه جلسة شغّالة الحين.
        </Txt>
      </Screen>
    );
  }

  const here = presence.filter((p) => !p.leftAt).sort((a, b) => a.arrivedAt.getTime() - b.arrivedAt.getTime());
  const all = [
    ...responses.filter((r) => r.memberId !== ME),
    ...(myResponse ? [{ memberId: ME, response: myResponse, respondedAt: new Date() }] : []),
  ].filter((r) => !here.some((p) => p.memberId === r.memberId));
  const coming = all.filter((r) => r.response !== 'cant');
  const cant = all.filter((r) => r.response === 'cant');
  const dinnerCount = session.treat === 'dinner' ? here.length + all.filter((r) => r.response === 'dinner' || r.response === 'coming').length : 0;
  const starter = memberName(session.startedBy);

  const meta = [`${session.kind === 'arrived' ? 'وصل' : 'طلع'} ${formatTime(session.createdAt)}`];
  if (session.treat && session.atTime) meta.push(`ال${TREAT_LABEL[session.treat]} ${formatTime(session.atTime)}`);

  return (
    <Screen
      gap={space[4]}
      footer={
        !iAmIn && session.startedBy !== ME ? (
          <View style={{ backgroundColor: c.surfaceRaised, borderTopWidth: 1, borderTopColor: c.line, padding: space[4], paddingBottom: space[6], gap: space[3] }}>
            <Txt v="linkSm">ردّك</Txt>
            <View style={{ flexDirection: 'row', gap: space[2] }}>
              {replyOptions(session).map((r) => (
                <QuickReply key={r} label={REPLY_LABEL[r]} on={myResponse === r} no={r === 'cant'} grow={r !== 'cant'} onPress={() => reply(r)} />
              ))}
            </View>
          </View>
        ) : null
      }>
      <ScreenHeader title="جلسة الليلة" sub={formatDayDate(session.createdAt)} back />

      <Card tone="night" style={{ gap: space[4] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
          <Avatar name={starter} tone="glow" present dim={size.avatar + space[2]} />
          <View style={{ flex: 1 }}>
            <Txt v="title" c="sand">
              {inviteHeadline(starter, session)}
            </Txt>
            <Txt v="bodySm" c="sand" style={{ opacity: opacity.nightMuted }}>
              {meta.join(' · ')}
            </Txt>
          </View>
        </View>
        {session.message ? (
          <Txt v="body" c="sand">
            «{session.message}»
          </Txt>
        ) : null}
        <View style={{ flexDirection: 'row', gap: space[2] }}>
          <Stat n={here.length} label="موجودين" />
          <Stat n={coming.length} label="جايين" />
          {session.treat === 'dinner' && <Stat n={dinnerCount} label="للعشاء" accent />}
          <Stat n={cant.length} label="ما يقدر" />
        </View>
      </Card>

      {here.length > 0 && (
        <View style={{ gap: space[2] }}>
          <SectionLabel>موجودين بالمخيم</SectionLabel>
          <ListCard>
            {here.map((p, i) => (
              <Row
                key={p.memberId}
                lead={<Avatar name={memberName(p.memberId)} present />}
                title={memberName(p.memberId)}
                sub={`وصل ${formatTime(p.arrivedAt)}`}
                trail={i === 0 ? <FirstBadge /> : undefined}
              />
            ))}
          </ListCard>
        </View>
      )}

      {coming.length > 0 && (
        <View style={{ gap: space[2] }}>
          <SectionLabel>جايين</SectionLabel>
          <ListCard>
            {coming.map((r) => (
              <Row
                key={r.memberId}
                lead={<Avatar name={memberName(r.memberId)} />}
                title={memberName(r.memberId)}
                sub={`رد ${formatTime(r.respondedAt)}`}
                trail={<StatusChip tone="neutral" label={REPLY_LABEL[r.response]} icon={false} />}
              />
            ))}
          </ListCard>
        </View>
      )}

      {cant.length > 0 && (
        <Txt v="bodySm" c="inkMuted" style={{ marginTop: gap.tight }}>
          {cant.map((r) => memberName(r.memberId)).join('، ')} ما {cant.length > 1 ? 'يقدرون' : 'يقدر'} الليلة
        </Txt>
      )}
    </Screen>
  );
}

function FirstBadge() {
  const c = useColors();
  return (
    <View style={{ backgroundColor: c.night, borderRadius: radius.full, paddingHorizontal: space[3], paddingVertical: space[1] }}>
      <Txt v="smallStrong" c="sand">
        أول من وصل
      </Txt>
    </View>
  );
}

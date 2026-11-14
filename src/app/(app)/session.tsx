import { View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { inviteHeadline, replyOptions } from '@/components/invite-card';
import { ListCard, Row, Screen, ScreenHeader, SectionLabel, Status } from '@/components/layout';
import { QuickReply } from '@/components/quick-reply';
import { StatusChip } from '@/components/status-chip';
import { Card } from '@/components/surface';
import { Txt } from '@/components/text';
import { backend } from '@/data';
import { useAction, useCamp, useLive, useMemberMap, useMemberName } from '@/data/hooks';
import { REPLY_LABEL, TREAT_LABEL } from '@/data/labels';
import type { ReplyKind } from '@/data/types';
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
  const { member } = useCamp();
  const live = useLive();
  const name = useMemberName();
  const members = useMemberMap();
  const respond = useAction((sid: string, r: ReplyKind) => backend.respond(sid, r), [['live']]);

  const session = live.data?.session;
  if (!session) {
    return (
      <Screen>
        <ScreenHeader title="جلسة الليلة" back />
        {live.isPending || live.error ? (
          <Status loading={live.isPending} error={live.error} onRetry={() => live.refetch()} />
        ) : (
          <Txt v="body" c="inkMuted">
            ما فيه جلسة شغّالة الحين.
          </Txt>
        )}
      </Screen>
    );
  }

  const here = [...(live.data?.presence ?? [])].sort((a, b) => a.arrivedAt.getTime() - b.arrivedAt.getTime());
  const isHere = (id: string) => here.some((p) => p.memberId === id);
  const all = (live.data?.responses ?? []).filter((r) => !isHere(r.memberId));
  const coming = all.filter((r) => r.response !== 'cant');
  const cant = all.filter((r) => r.response === 'cant');
  const dinnerCount = here.length + all.filter((r) => r.response === 'dinner').length;
  const myReply = live.data?.responses.find((r) => r.memberId === member.id)?.response ?? null;
  const hostId = session.hostId ?? session.startedBy;
  const host = name(hostId, { raw: true });
  const iAmIn = isHere(member.id);

  const meta = [`${session.kind === 'arrived' ? 'وصل' : 'طلع'} ${formatTime(session.createdAt)}`];
  if (session.treat && session.atTime) meta.push(`ال${TREAT_LABEL[session.treat]} ${formatTime(session.atTime)}`);

  return (
    <Screen
      gap={space[4]}
      onRefresh={() => live.refetch()}
      refreshing={live.isRefetching}
      footer={
        !iAmIn && hostId !== member.id ? (
          <View style={{ backgroundColor: c.surfaceRaised, borderTopWidth: 1, borderTopColor: c.line, padding: space[4], paddingBottom: space[6], gap: space[3] }}>
            <Txt v="linkSm">ردّك</Txt>
            <View style={{ flexDirection: 'row', gap: space[2] }}>
              {replyOptions(session).map((r) => (
                <QuickReply
                  key={r}
                  label={REPLY_LABEL[r]}
                  on={myReply === r}
                  no={r === 'cant'}
                  grow={r !== 'cant'}
                  onPress={() => respond.mutate([session.id, r])}
                />
              ))}
            </View>
          </View>
        ) : null
      }>
      <ScreenHeader title="جلسة الليلة" sub={formatDayDate(session.createdAt)} back />

      <Card tone="night" style={{ gap: space[4] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
          <Avatar name={host} uri={members.get(hostId)?.avatarUrl} tone="glow" present={isHere(hostId)} dim={size.avatar + space[2]} />
          <View style={{ flex: 1 }}>
            <Txt v="title" c="sand">
              {inviteHeadline(host, session)}
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
                lead={<Avatar name={name(p.memberId, { raw: true })} uri={members.get(p.memberId)?.avatarUrl} present />}
                title={name(p.memberId)}
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
                lead={<Avatar name={name(r.memberId, { raw: true })} uri={members.get(r.memberId)?.avatarUrl} />}
                title={name(r.memberId)}
                sub={`رد ${formatTime(r.respondedAt)}`}
                trail={<StatusChip tone="neutral" label={REPLY_LABEL[r.response]} icon={false} />}
              />
            ))}
          </ListCard>
        </View>
      )}

      {cant.length > 0 && (
        <Txt v="bodySm" c="inkMuted" style={{ marginTop: gap.tight }}>
          {cant.map((r) => name(r.memberId)).join('، ')} ما {cant.length > 1 ? 'يقدرون' : 'يقدر'} الليلة
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

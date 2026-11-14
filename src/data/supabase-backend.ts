import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Backend } from './backend';
import type {
  Expense,
  ImageFile,
  Member,
  MyContribution,
  NotificationPrefKey,
  NotificationSettings,
  OwnedContribution,
  ReceiptBucket,
} from './types';

const PREF_KEYS: NotificationPrefKey[] = ['monthly_due', 'monthly_reminder', 'event_qatta', 'arrival', 'treat', 'settlement'];

const d = (v: string | null | undefined) => (v ? new Date(v) : null);
/** تاريخ بدون وقت (YYYY-MM-DD) كتاريخ محلي */
const day = (v: string) => {
  const [y, m, dd] = v.split('-').map(Number);
  return new Date(y, m - 1, dd, 12);
};
const ymd = (x: Date) =>
  `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
const num = (v: unknown) => Number(v ?? 0);

function ok<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}
/** مثل ok لكن النتيجة لازم تكون موجودة (قائمة أو صف واحد) */
function need<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  const v = ok(res);
  if (v == null) throw new Error('not_found');
  return v as NonNullable<T>;
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function createSupabaseBackend(url: string, key: string): Backend {
  const sb: SupabaseClient = createClient(url, key, {
    auth: {
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  // تجديد الجلسة لما التطبيق يكون مفتوح فقط
  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (s) => {
      if (s === 'active') sb.auth.startAutoRefresh();
      else sb.auth.stopAutoRefresh();
    });
  }

  let cachedMe: { memberId: string; campId: string } | null = null;

  async function upload(bucket: ReceiptBucket, file: ImageFile, ...segments: string[]) {
    const res = await fetch(file.uri);
    const body = await res.arrayBuffer();
    const type = file.mimeType ?? 'image/jpeg';
    const ext = type.includes('png') ? 'png' : type.includes('heic') ? 'heic' : 'jpg';
    const path = [...segments, `${uuid()}.${ext}`].join('/');
    ok(await sb.storage.from(bucket).upload(path, body, { contentType: type, upsert: false }));
    return path;
  }

  async function me() {
    if (cachedMe) return cachedMe;
    const uid = (await sb.auth.getUser()).data.user?.id;
    if (!uid) throw new Error('not_authenticated');
    const row = ok(await sb.from('members').select('id, camp_id').eq('user_id', uid).maybeSingle());
    if (!row) throw new Error('no_member');
    cachedMe = { memberId: row.id, campId: row.camp_id };
    return cachedMe;
  }

  const backend: Backend = {
    demo: false,

    async getUserId() {
      return (await sb.auth.getSession()).data.session?.user.id ?? null;
    },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_e, session) => {
        cachedMe = null;
        cb(session?.user.id ?? null);
      });
      return () => data.subscription.unsubscribe();
    },
    async sendCode(email) {
      ok(await sb.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } }));
    },
    async verifyCode(email, code) {
      ok(await sb.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code, type: 'email' }));
    },
    async signOut() {
      cachedMe = null;
      const { error } = await sb.auth.signOut();
      if (error) throw new Error(error.message);
    },

    async getMe() {
      const uid = (await sb.auth.getUser()).data.user?.id;
      if (!uid) return null;
      const m = ok(
        await sb
          .from('members')
          .select('id, camp_id, display_name, avatar_url, role, geofence_enabled')
          .eq('user_id', uid)
          .maybeSingle(),
      );
      if (!m) return null;
      cachedMe = { memberId: m.id, campId: m.camp_id };
      const c = need(
        await sb
          .from('camps')
          .select('id, name, monthly_amount, monthly_due_day, center_lat, center_lng, radius_m')
          .eq('id', m.camp_id)
          .single(),
      );
      const avatarUrl = m.avatar_url ? ((await backend.signedUrl('avatars', m.avatar_url)) ?? undefined) : undefined;
      return {
        member: {
          id: m.id,
          displayName: m.display_name,
          avatarPath: m.avatar_url,
          avatarUrl,
          role: m.role,
          geofenceEnabled: m.geofence_enabled,
        },
        camp: {
          id: c.id,
          name: c.name,
          monthlyAmount: num(c.monthly_amount),
          monthlyDueDay: c.monthly_due_day,
          centerLat: c.center_lat,
          centerLng: c.center_lng,
          radiusM: c.radius_m,
        },
      };
    },
    async createCamp(campName, displayName) {
      ok(await sb.rpc('create_camp', { p_name: campName, p_display_name: displayName }));
      cachedMe = null;
    },
    async joinCamp(code, displayName) {
      ok(await sb.rpc('join_camp', { p_code: code, p_display_name: displayName }));
      cachedMe = null;
    },
    async updateProfile({ displayName, avatar }) {
      const { memberId, campId } = await me();
      const patch: Record<string, unknown> = {};
      if (displayName) patch.display_name = displayName.trim();
      if (avatar) patch.avatar_url = await upload('avatars', avatar, campId, memberId);
      if (avatar === null) patch.avatar_url = null;
      if (Object.keys(patch).length) ok(await sb.from('members').update(patch).eq('id', memberId));
    },
    async getMembers(campId) {
      const rows = need(
        await sb.from('members').select('id, display_name, avatar_url, role').eq('camp_id', campId).order('created_at'),
      );
      const paths = rows.map((r) => r.avatar_url).filter(Boolean) as string[];
      const signed = new Map<string, string>();
      if (paths.length) {
        const res = await sb.storage.from('avatars').createSignedUrls(paths, 60 * 60 * 6);
        res.data?.forEach((s) => s.path && s.signedUrl && signed.set(s.path, s.signedUrl));
      }
      return rows.map<Member>((r) => ({
        id: r.id,
        displayName: r.display_name,
        avatarPath: r.avatar_url,
        avatarUrl: r.avatar_url ? signed.get(r.avatar_url) : undefined,
        role: r.role,
      }));
    },
    async setGeofenceEnabled(enabled) {
      const { memberId } = await me();
      ok(await sb.from('members').update({ geofence_enabled: enabled }).eq('id', memberId));
    },

    async getInviteCode(campId) {
      return ok(await sb.rpc('get_invite_code', { p_camp: campId })) as string;
    },
    async regenerateInviteCode(campId) {
      return ok(await sb.rpc('regenerate_invite_code', { p_camp: campId })) as string;
    },
    async updateCamp(campId, p) {
      ok(
        await sb.rpc('update_camp', {
          p_camp: campId,
          p_monthly_amount: p.monthlyAmount ?? null,
          p_monthly_due_day: p.monthlyDueDay ?? null,
          p_center_lat: p.centerLat ?? null,
          p_center_lng: p.centerLng ?? null,
          p_radius_m: p.radiusM ?? null,
        }),
      );
    },
    async transferFundManager(memberId) {
      ok(await sb.rpc('transfer_fund_manager', { p_member: memberId }));
    },

    async getMyContributions() {
      const { memberId } = await me();
      // صفوفي أنا فقط (RLS يضمن هذا أصلًا، والفلتر يمنع صفوف قططي اللي سويتها)
      const rows = need(
        await sb
          .from('contribution_participants')
          .select('paid_at, receipt_url, contributions!inner(id, kind, title, amount_per_person, created_by, due_date, status)')
          .eq('member_id', memberId),
      );
      return rows
        .map((r) => {
          const c = r.contributions as unknown as {
            id: string;
            kind: 'monthly' | 'event';
            title: string;
            amount_per_person: number;
            created_by: string | null;
            due_date: string;
            status: 'open' | 'closed';
          };
          return {
            id: c.id,
            kind: c.kind,
            title: c.title,
            amountPerPerson: num(c.amount_per_person),
            createdBy: c.created_by,
            dueDate: day(c.due_date),
            status: c.status,
            myPaidAt: d(r.paid_at),
            myReceiptPath: r.receipt_url,
          } satisfies MyContribution;
        })
        .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
    },
    async getOwnedContributions(campId) {
      const { memberId } = await me();
      const isFm = need(await sb.from('members').select('role').eq('id', memberId).single()).role === 'fund_manager';
      let q = sb
        .from('contributions')
        .select('id, kind, title, amount_per_person, due_date, status, contribution_participants(member_id, paid_at, receipt_url, last_reminded_at)')
        .eq('camp_id', campId)
        .order('created_at', { ascending: false });
      q = isFm ? q.or(`created_by.eq.${memberId},kind.eq.monthly`) : q.eq('created_by', memberId);
      const rows = need(await q);
      return rows.map<OwnedContribution>((c) => ({
        id: c.id,
        kind: c.kind,
        title: c.title,
        amountPerPerson: num(c.amount_per_person),
        dueDate: day(c.due_date),
        status: c.status,
        participants: (c.contribution_participants ?? []).map((p) => ({
          memberId: p.member_id,
          paidAt: d(p.paid_at),
          receiptPath: p.receipt_url,
          lastRemindedAt: d(p.last_reminded_at),
        })),
      }));
    },
    async setPaid(contributionId, paid, receipt) {
      let path: string | null = null;
      if (paid && receipt) {
        const { memberId, campId } = await me();
        path = await upload('payment-receipts', receipt, campId, memberId, contributionId);
      }
      ok(await sb.rpc('set_my_payment', { p_contribution: contributionId, p_paid: paid, p_receipt_url: path }));
    },
    async createEventContribution(p) {
      return ok(
        await sb.rpc('create_event_contribution', {
          p_camp: p.campId,
          p_title: p.title,
          p_mode: p.mode,
          p_amount: p.amount,
          p_member_ids: p.memberIds,
          p_due_date: ymd(p.dueDate),
          p_include_me: p.includeMe,
        }),
      ) as string;
    },
    async remindUnpaid(id) {
      ok(await sb.rpc('remind_unpaid', { p_contribution: id }));
    },
    async closeContribution(id) {
      ok(await sb.rpc('close_contribution', { p_contribution: id }));
    },

    async getExpenses(campId) {
      const rows = need(
        await sb
          .from('expenses')
          .select('id, paid_by, amount, category, description, receipt_url, spent_at, settlement_items(settled_at)')
          .eq('camp_id', campId)
          .order('spent_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(200),
      );
      return rows.map<Expense>((e) => ({
        id: e.id,
        paidBy: e.paid_by,
        amount: num(e.amount),
        category: e.category,
        description: e.description,
        receiptPath: e.receipt_url,
        spentAt: day(e.spent_at),
        settledAt: d((e.settlement_items as unknown as { settled_at: string | null } | null)?.settled_at),
      }));
    },
    async addExpense(p) {
      const { memberId } = await me();
      const receipt = p.receipt ? await upload('expense-receipts', p.receipt, p.campId, memberId) : null;
      ok(
        await sb.from('expenses').insert({
          camp_id: p.campId,
          paid_by: memberId,
          amount: p.amount,
          category: p.category,
          description: p.description || null,
          receipt_url: receipt,
        }),
      );
    },
    async deleteExpense(id) {
      ok(await sb.from('expenses').delete().eq('id', id));
    },
    async getAccount(campId) {
      const rows = need(await sb.rpc('account_summary', { p_camp: campId })) as {
        spent_this_month: number;
        owed_to_me: number;
        fund_balance: number;
        settlement_date: string;
      }[];
      const r = rows[0];
      return {
        spentThisMonth: num(r?.spent_this_month),
        owedToMe: num(r?.owed_to_me),
        fundBalance: num(r?.fund_balance),
        settlementDate: r ? day(r.settlement_date) : new Date(),
      };
    },
    async getLatestSettlement(campId) {
      const s = ok(
        await sb
          .from('settlements')
          .select('id, period, settlement_items(id, member_id, amount, settled_at)')
          .eq('camp_id', campId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      );
      if (!s) return null;
      return {
        id: s.id,
        period: s.period,
        items: (s.settlement_items ?? []).map((i) => ({
          id: i.id,
          memberId: i.member_id,
          amount: num(i.amount),
          settledAt: d(i.settled_at),
        })),
      };
    },
    async createSettlement(campId) {
      ok(await sb.rpc('create_settlement', { p_camp: campId }));
    },
    async markSettled(itemId, settled) {
      ok(await sb.rpc('mark_settled', { p_item: itemId, p_settled: settled }));
    },

    async getLive(campId) {
      const since = new Date(Date.now() - 12 * 3600_000).toISOString();
      const [s, pres] = await Promise.all([
        sb
          .from('sessions')
          .select('id, started_by, host_id, kind, treat, at_time, message, created_at, session_responses(member_id, response, responded_at)')
          .eq('camp_id', campId)
          .is('ended_at', null)
          .gt('created_at', since)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        sb.from('presence').select('member_id, arrived_at').eq('camp_id', campId).is('left_at', null).order('arrived_at'),
      ]);
      const session = ok(s);
      const presence = need(pres);
      return {
        session: session
          ? {
              id: session.id,
              startedBy: session.started_by,
              hostId: session.host_id,
              kind: session.kind,
              treat: session.treat,
              atTime: d(session.at_time),
              message: session.message,
              createdAt: new Date(session.created_at),
            }
          : null,
        presence: presence.map((p) => ({ memberId: p.member_id, arrivedAt: new Date(p.arrived_at) })),
        responses: (session?.session_responses ?? []).map((r) => ({
          memberId: r.member_id,
          response: r.response,
          respondedAt: new Date(r.responded_at),
        })),
      };
    },
    async announce(p) {
      ok(
        await sb.rpc('announce', {
          p_camp: p.campId,
          p_kind: p.kind,
          p_treat: p.treat,
          p_at_time: p.atTime ? p.atTime.toISOString() : null,
          p_message: p.message ?? null,
        }),
      );
    },
    async respond(sessionId, response) {
      ok(await sb.rpc('respond', { p_session: sessionId, p_response: response }));
    },
    async leave(campId) {
      ok(await sb.rpc('leave_camp', { p_camp: campId }));
    },
    async geofenceEvent(campId, entered) {
      ok(await sb.rpc('geofence_event', { p_camp: campId, p_entered: entered }));
    },

    async getNotificationSettings(memberId) {
      const [s, p] = await Promise.all([
        sb.from('member_settings').select('*').eq('member_id', memberId).maybeSingle(),
        sb.from('notification_prefs').select('*').eq('member_id', memberId),
      ]);
      const st = ok(s);
      const prefs = need(p);
      const map = Object.fromEntries(
        PREF_KEYS.map((k) => {
          const row = prefs.find((r) => r.type === k);
          return [
            k,
            {
              enabled: row ? row.enabled : k !== 'settlement',
              frequency: row?.frequency ?? null,
              onlyMemberIds: row?.only_member_ids ?? null,
            },
          ];
        }),
      ) as NotificationSettings['prefs'];
      return {
        enabled: st?.notifications_enabled ?? true,
        quietEnabled: st?.quiet_enabled ?? true,
        quietStart: (st?.quiet_start ?? '00:00').slice(0, 5),
        quietEnd: (st?.quiet_end ?? '07:00').slice(0, 5),
        prefs: map,
      };
    },
    async saveNotificationSettings(memberId, s) {
      ok(
        await sb.from('member_settings').upsert({
          member_id: memberId,
          notifications_enabled: s.enabled,
          quiet_enabled: s.quietEnabled,
          quiet_start: s.quietStart,
          quiet_end: s.quietEnd,
        }),
      );
      ok(
        await sb.from('notification_prefs').upsert(
          PREF_KEYS.map((k) => ({
            member_id: memberId,
            type: k,
            enabled: s.prefs[k].enabled,
            frequency: s.prefs[k].frequency ?? null,
            only_member_ids: s.prefs[k].onlyMemberIds?.length ? s.prefs[k].onlyMemberIds : null,
          })),
        ),
      );
    },
    async registerPushToken(memberId, token) {
      ok(await sb.from('push_tokens').upsert({ member_id: memberId, token, updated_at: new Date().toISOString() }));
    },

    async signedUrl(bucket, path) {
      const res = await sb.storage.from(bucket).createSignedUrl(path, 60 * 60);
      return res.data?.signedUrl ?? null;
    },
  };
  return backend;
}

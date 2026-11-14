// نسخة تجريبية بدون خادم: تشتغل لما التطبيق مو مربوط بـ Supabase (للمعاينة في Expo Go).
// نفس قواعد الخصوصية: «أنا» أشوف حالتي، وحالات قططي اللي سويتها فقط.
import type { Backend } from './backend';
import type {
  Camp,
  Expense,
  Member,
  MyContribution,
  NotificationSettings,
  OwnedContribution,
  ParticipantStatus,
  Presence,
  Session,
  SessionResponse,
  Settlement,
} from './types';

const at = (h: number, m: number, dayOffset = 0) => {
  const x = new Date();
  x.setDate(x.getDate() + dayOffset);
  x.setHours(h, m, 0, 0);
  return x;
};
const inDays = (n: number) => at(12, 0, n);
const wait = () => new Promise((r) => setTimeout(r, 150));
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

type Contribution = {
  id: string;
  kind: 'monthly' | 'event';
  title: string;
  amountPerPerson: number;
  createdBy: string | null;
  dueDate: Date;
  status: 'open' | 'closed';
  rows: ParticipantStatus[];
};

export function createDemoBackend(): Backend {
  const ME = 'me';
  let loggedIn = false;
  let joined = true;
  let geofence = false;
  const listeners = new Set<(id: string | null) => void>();
  let inviteCode = 'A4C21F';

  const camp: Camp = { id: 'camp', name: 'الحاويات', monthlyAmount: 300, monthlyDueDay: 20, centerLat: null, centerLng: null, radiusM: 150 };
  const members: Member[] = [
    { id: ME, displayName: 'عبدالسلام', role: 'fund_manager' },
    { id: 'm1', displayName: 'محمد', role: 'member' },
    { id: 'm2', displayName: 'فهد', role: 'member' },
    { id: 'm3', displayName: 'خالد', role: 'member' },
    { id: 'm4', displayName: 'سعد', role: 'member' },
    { id: 'm5', displayName: 'نايف', role: 'member' },
    { id: 'm6', displayName: 'بدر', role: 'member' },
    { id: 'm7', displayName: 'عبدالله', role: 'member' },
  ];
  const row = (memberId: string, paidAt: Date | null = null, lastRemindedAt: Date | null = null): ParticipantStatus => ({
    memberId,
    paidAt,
    receiptPath: null,
    lastRemindedAt,
  });

  const now = new Date();
  const monthDue = new Date(now.getFullYear(), now.getMonth(), camp.monthlyDueDay, 12);
  const contributions: Contribution[] = [
    {
      id: 'c-monthly',
      kind: 'monthly',
      title: `قطة ${MONTHS[now.getMonth()]}`,
      amountPerPerson: 300,
      createdBy: null,
      dueDate: monthDue,
      status: 'open',
      rows: members.map((m, i) => row(m.id, m.id !== ME && i % 2 === 0 ? at(10, 0, -2) : null)),
    },
    { id: 'c-dinner', kind: 'event', title: 'عشاء الجمعة', amountPerPerson: 45, createdBy: 'm7', dueDate: inDays(2), status: 'open', rows: [row(ME, at(18, 0, -1)), row('m1')] },
    { id: 'c-wood', kind: 'event', title: 'حطب وفحم', amountPerPerson: 30, createdBy: 'm2', dueDate: inDays(4), status: 'open', rows: [row(ME), row('m3')] },
    {
      id: 'c-sheep',
      kind: 'event',
      title: 'ذبيحة السبت',
      amountPerPerson: 60,
      createdBy: ME,
      dueDate: inDays(3),
      status: 'open',
      rows: [row('m1', at(20, 15, -1)), row('m2', at(13, 40)), row('m3', null, at(9, 0))],
    },
  ];

  let session: Session | null = {
    id: 's1',
    startedBy: 'm1',
    hostId: 'm1',
    kind: 'arrived',
    treat: 'dinner',
    atTime: at(22, 0),
    message: 'النار مشبوبة والذبيحة على الجمر، تعالوا بدري',
    createdAt: at(20, 40),
  };
  let presence: Presence[] = [
    { memberId: 'm1', arrivedAt: at(20, 40) },
    { memberId: 'm2', arrivedAt: at(21, 5) },
  ];
  let responses: SessionResponse[] = [
    { memberId: 'm3', response: 'coming', respondedAt: at(20, 52) },
    { memberId: 'm4', response: 'soon', respondedAt: at(21, 10) },
    { memberId: 'm5', response: 'dinner', respondedAt: at(21, 14) },
    { memberId: 'm6', response: 'cant', respondedAt: at(21, 20) },
  ];

  let expenses: Expense[] = [
    { id: 'e1', paidBy: ME, amount: 150, category: 'firewood', description: 'حطب', receiptPath: 'demo', spentAt: inDays(-2), settledAt: null },
    { id: 'e2', paidBy: ME, amount: 60, category: 'gas', description: 'جرة غاز', receiptPath: null, spentAt: inDays(-5), settledAt: null },
    { id: 'e3', paidBy: ME, amount: 35, category: 'food', description: 'ماء وثلج', receiptPath: null, spentAt: inDays(-17), settledAt: inDays(-15) },
    { id: 'e4', paidBy: 'm2', amount: 120, category: 'maintenance', description: 'لمبات وأسلاك', receiptPath: 'demo', spentAt: inDays(-3), settledAt: null },
    { id: 'e5', paidBy: 'm1', amount: 90, category: 'food', description: 'تمر وقهوة', receiptPath: null, spentAt: inDays(-8), settledAt: null },
  ];
  let settlement: Settlement | null = null;

  let notif: NotificationSettings = {
    enabled: true,
    quietEnabled: true,
    quietStart: '00:00',
    quietEnd: '07:00',
    prefs: {
      monthly_due: { enabled: true },
      monthly_reminder: { enabled: true, frequency: 'every2' },
      event_qatta: { enabled: true, frequency: 'daily' },
      arrival: { enabled: true, onlyMemberIds: null },
      treat: { enabled: true },
      settlement: { enabled: false },
    },
  };

  const emit = () => listeners.forEach((l) => l(loggedIn ? 'demo-user' : null));
  const find = (id: string) => {
    const c = contributions.find((x) => x.id === id);
    if (!c) throw new Error('not_found');
    return c;
  };

  return {
    demo: true,
    async getUserId() {
      return loggedIn ? 'demo-user' : null;
    },
    onAuthChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    async sendCode() {
      await wait();
    },
    async verifyCode(_e, code) {
      await wait();
      if (code.length !== 6) throw new Error('invalid_code');
      loggedIn = true;
      emit();
    },
    async signOut() {
      loggedIn = false;
      emit();
    },

    async getMe() {
      if (!loggedIn || !joined) return null;
      const m = members.find((x) => x.id === ME)!;
      return { member: { ...m, geofenceEnabled: geofence }, camp: { ...camp } };
    },
    async createCamp(name, displayName) {
      camp.name = name;
      members[0].displayName = displayName;
      joined = true;
    },
    async joinCamp(_code, displayName) {
      members[0].displayName = displayName;
      joined = true;
    },
    async updateProfile({ displayName, avatar }) {
      if (displayName) members[0].displayName = displayName;
      if (avatar) members[0].avatarUrl = avatar.uri;
      if (avatar === null) members[0].avatarUrl = undefined;
    },
    async getMembers() {
      return members.map((m) => ({ ...m }));
    },
    async setGeofenceEnabled(v) {
      geofence = v;
    },

    async getInviteCode() {
      return inviteCode;
    },
    async regenerateInviteCode() {
      inviteCode = Math.random().toString(16).slice(2, 8).toUpperCase();
      return inviteCode;
    },
    async updateCamp(_id, p) {
      Object.assign(camp, Object.fromEntries(Object.entries(p).filter(([, v]) => v != null)));
    },
    async transferFundManager(id) {
      members.forEach((m) => (m.role = m.id === id ? 'fund_manager' : 'member'));
    },

    async getMyContributions() {
      await wait();
      return contributions
        .filter((c) => c.rows.some((r) => r.memberId === ME))
        .map<MyContribution>((c) => {
          const mine = c.rows.find((r) => r.memberId === ME)!;
          return {
            id: c.id,
            kind: c.kind,
            title: c.title,
            amountPerPerson: c.amountPerPerson,
            createdBy: c.createdBy,
            dueDate: c.dueDate,
            status: c.status,
            myPaidAt: mine.paidAt,
            myReceiptPath: mine.receiptPath,
          };
        });
    },
    async getOwnedContributions() {
      await wait();
      const fm = members[0].role === 'fund_manager';
      return contributions
        .filter((c) => c.createdBy === ME || (fm && c.kind === 'monthly'))
        .map<OwnedContribution>((c) => ({ ...c, participants: c.rows.map((r) => ({ ...r })) }));
    },
    async setPaid(id, paid, receipt) {
      const r = find(id).rows.find((x) => x.memberId === ME);
      if (!r) throw new Error('not_participant');
      r.paidAt = paid ? new Date() : null;
      r.receiptPath = paid && receipt ? receipt.uri : null;
    },
    async createEventContribution(p) {
      const others = p.memberIds.filter((m) => m !== ME);
      const per = p.mode === 'total' ? Math.round((p.amount / (others.length + (p.includeMe ? 1 : 0))) * 100) / 100 : p.amount;
      const id = `c-${Date.now()}`;
      contributions.unshift({ id, kind: 'event', title: p.title, amountPerPerson: per, createdBy: ME, dueDate: p.dueDate, status: 'open', rows: others.map((m) => row(m)) });
      return id;
    },
    async remindUnpaid(id) {
      find(id).rows.forEach((r) => !r.paidAt && (r.lastRemindedAt = new Date()));
    },
    async closeContribution(id) {
      find(id).status = 'closed';
    },

    async getExpenses() {
      await wait();
      return expenses.map((e) => ({ ...e, settledAt: e.paidBy === ME ? e.settledAt : null }));
    },
    async addExpense(p) {
      expenses = [
        { id: `e-${Date.now()}`, paidBy: ME, amount: p.amount, category: p.category, description: p.description || null, receiptPath: p.receipt?.uri ?? null, spentAt: new Date(), settledAt: null },
        ...expenses,
      ];
    },
    async deleteExpense(id) {
      expenses = expenses.filter((e) => e.id !== id || e.paidBy !== ME);
    },
    async getAccount() {
      const mine = expenses.filter((e) => e.paidBy === ME);
      const m = new Date().getMonth();
      return {
        spentThisMonth: mine.filter((e) => e.spentAt.getMonth() === m).reduce((s, e) => s + e.amount, 0),
        owedToMe: mine.filter((e) => !e.settledAt).reduce((s, e) => s + e.amount, 0),
        fundBalance: 1840,
        settlementDate: new Date(new Date().getFullYear(), m, 30),
      };
    },
    async getLatestSettlement() {
      return settlement;
    },
    async createSettlement() {
      const sums = new Map<string, number>();
      expenses.filter((e) => !e.settledAt).forEach((e) => sums.set(e.paidBy, (sums.get(e.paidBy) ?? 0) + e.amount));
      settlement = {
        id: 'st',
        period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
        items: [...sums].map(([memberId, amount]) => ({ id: `si-${memberId}`, memberId, amount, settledAt: null })),
      };
    },
    async markSettled(itemId, settled) {
      const it = settlement?.items.find((i) => i.id === itemId);
      if (!it) return;
      it.settledAt = settled ? new Date() : null;
      expenses.filter((e) => e.paidBy === it.memberId).forEach((e) => (e.settledAt = it.settledAt));
    },

    async getLive() {
      await wait();
      return { session, presence: [...presence], responses: [...responses] };
    },
    async announce(p) {
      if (!session || (p.treat && session.treat && session.hostId !== ME)) {
        session = { id: `s-${Date.now()}`, startedBy: ME, hostId: p.treat ? ME : null, kind: p.kind, treat: p.treat, atTime: p.atTime, message: p.message, createdAt: new Date() };
        responses = [];
      } else if (p.treat) {
        session = { ...session, treat: p.treat, hostId: ME, atTime: p.atTime, message: p.message ?? session.message };
      }
      if (p.kind === 'arrived' && !presence.some((x) => x.memberId === ME)) presence = [...presence, { memberId: ME, arrivedAt: new Date() }];
    },
    async respond(_sid, r) {
      if (r === 'dinner' && session?.treat !== 'dinner') throw new Error('no_dinner');
      responses = [...responses.filter((x) => x.memberId !== ME), { memberId: ME, response: r, respondedAt: new Date() }];
    },
    async leave() {
      presence = presence.filter((p) => p.memberId !== ME);
      if (!presence.length) session = null;
    },
    async geofenceEvent(_c, entered) {
      if (entered) await this.announce({ campId: camp.id, kind: 'arrived', treat: null, atTime: null });
      else await this.leave(camp.id);
    },

    async getNotificationSettings() {
      return JSON.parse(JSON.stringify(notif)) as NotificationSettings;
    },
    async saveNotificationSettings(_m, s) {
      notif = JSON.parse(JSON.stringify(s)) as NotificationSettings;
    },
    async registerPushToken() {},
    async signedUrl(_b, path) {
      return path === 'demo' ? null : path;
    },
  };
}

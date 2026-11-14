// بيانات تجريبية للمرحلة 1. تنشال في المرحلة 2 لما نربط قاعدة البيانات.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type {
  AccountSummary,
  Expense,
  Member,
  MyContribution,
  OwnedContribution,
  Presence,
  ReplyKind,
  Session,
  SessionResponse,
} from './types';

function today(h: number, m: number, dayOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d;
}
function inDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(12, 0, 0, 0);
  return d;
}

export const ME = 'me';

export const MEMBERS: Member[] = [
  { id: ME, displayName: 'عبدالسلام', role: 'fund_manager' },
  { id: 'm1', displayName: 'محمد', role: 'member' },
  { id: 'm2', displayName: 'فهد', role: 'member' },
  { id: 'm3', displayName: 'خالد', role: 'member' },
  { id: 'm4', displayName: 'سعد', role: 'member' },
  { id: 'm5', displayName: 'نايف', role: 'member' },
  { id: 'm6', displayName: 'بدر', role: 'member' },
  { id: 'm7', displayName: 'عبدالله', role: 'member' },
];

export const CAMP = { name: 'الحاويات', inviteCode: 'HWY-4821', monthlyAmount: 300 };

export function memberName(id: string) {
  if (id === ME) return 'أنت';
  return MEMBERS.find((m) => m.id === id)?.displayName ?? '';
}

const initialSession: Session = {
  id: 's1',
  startedBy: 'm1',
  kind: 'arrived',
  treat: 'dinner',
  atTime: today(22, 0),
  message: 'النار مشبوبة والذبيحة على الجمر، تعالوا بدري',
  createdAt: today(20, 40),
};

const initialPresence: Presence[] = [
  { memberId: 'm1', arrivedAt: today(20, 40) },
  { memberId: 'm2', arrivedAt: today(21, 5) },
];

const initialResponses: SessionResponse[] = [
  { memberId: 'm3', response: 'coming', respondedAt: today(20, 52) },
  { memberId: 'm4', response: 'soon', respondedAt: today(21, 10) },
  { memberId: 'm5', response: 'dinner', respondedAt: today(21, 14) },
  { memberId: 'm6', response: 'cant', respondedAt: today(21, 20) },
];

const initialMine: MyContribution[] = [
  {
    id: 'c-monthly',
    kind: 'monthly',
    title: 'قطة شهر',
    icon: 'other',
    amountPerPerson: 300,
    createdBy: 'system',
    dueDate: inDays(6),
    myPaidAt: null,
  },
  {
    id: 'c-dinner',
    kind: 'event',
    title: 'عشاء الجمعة',
    icon: 'dinner',
    amountPerPerson: 45,
    createdBy: 'm7',
    dueDate: inDays(2),
    myPaidAt: today(18, 0, -1),
  },
  {
    id: 'c-wood',
    kind: 'event',
    title: 'حطب وفحم',
    icon: 'fire',
    amountPerPerson: 30,
    createdBy: 'm2',
    dueDate: inDays(4),
    myPaidAt: null,
  },
];

const initialOwned: OwnedContribution[] = [
  {
    id: 'c-sheep',
    title: 'ذبيحة السبت',
    amountPerPerson: 60,
    dueDate: inDays(3),
    status: 'open',
    participants: [
      { memberId: 'm1', paidAt: today(20, 15, -1), lastRemindedAt: null },
      { memberId: 'm2', paidAt: today(13, 40), lastRemindedAt: null },
      { memberId: 'm3', paidAt: null, lastRemindedAt: today(9, 0) },
    ],
  },
];

const expenses: Expense[] = [
  { id: 'e1', paidBy: ME, amount: 150, category: 'firewood', description: 'حطب', hasReceipt: true, spentAt: inDays(-2), settled: false },
  { id: 'e2', paidBy: ME, amount: 60, category: 'gas', description: 'جرة غاز', hasReceipt: false, spentAt: inDays(-5), settled: false },
  { id: 'e3', paidBy: ME, amount: 35, category: 'food', description: 'ماء وثلج', hasReceipt: false, spentAt: inDays(-17), settled: true },
  { id: 'e4', paidBy: 'm2', amount: 120, category: 'maintenance', description: 'لمبات وأسلاك', hasReceipt: true, spentAt: inDays(-3), settled: false },
  { id: 'e5', paidBy: 'm1', amount: 90, category: 'food', description: 'تمر وقهوة', hasReceipt: false, spentAt: inDays(-8), settled: false },
];

const account: AccountSummary = {
  spentThisMonth: 210,
  owedToMe: 210,
  fundBalance: 1840,
  settlementDate: new Date(new Date().getFullYear(), new Date().getMonth(), 30),
};

// اسم الشهر الحالي لعنوان القطة الشهرية
initialMine[0].title = `قطة شهر ${['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][new Date().getMonth()]}`;

type MockState = {
  me: Member;
  session: Session | null;
  presence: Presence[];
  responses: SessionResponse[];
  myResponse: ReplyKind | null;
  iAmIn: boolean;
  mine: MyContribution[];
  owned: OwnedContribution[];
  expenses: Expense[];
  account: AccountSummary;
  setPaid: (id: string, paid: boolean) => void;
  reply: (r: ReplyKind) => void;
  announce: (s: Omit<Session, 'id' | 'startedBy' | 'createdAt'>) => void;
  leave: () => void;
  addOwned: (c: Omit<OwnedContribution, 'id' | 'status'>) => string;
  closeOwned: (id: string) => void;
  addExpense: (e: Omit<Expense, 'id' | 'paidBy' | 'settled'>) => void;
};

const Ctx = createContext<MockState | null>(null);

export function MockProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const [presence, setPresence] = useState(initialPresence);
  const [responses] = useState(initialResponses);
  const [myResponse, setMyResponse] = useState<ReplyKind | null>(null);
  const [mine, setMine] = useState(initialMine);
  const [owned, setOwned] = useState(initialOwned);
  const [exp, setExp] = useState(expenses);

  const value = useMemo<MockState>(() => {
    const iAmIn = presence.some((p) => p.memberId === ME && !p.leftAt);
    return {
      me: MEMBERS[0],
      session,
      presence,
      responses,
      myResponse,
      iAmIn,
      mine,
      owned,
      expenses: exp,
      account,
      setPaid: (id, paid) =>
        setMine((list) => list.map((c) => (c.id === id ? { ...c, myPaidAt: paid ? new Date() : null } : c))),
      reply: (r) => setMyResponse((cur) => (cur === r ? null : r)),
      announce: (s) => {
        setSession((cur) => cur ?? { ...s, id: 's-new', startedBy: ME, createdAt: new Date() });
        if (s.kind === 'arrived') {
          setPresence((list) => [...list.filter((p) => p.memberId !== ME), { memberId: ME, arrivedAt: new Date() }]);
        }
      },
      leave: () => setPresence((list) => list.filter((p) => p.memberId !== ME)),
      addOwned: (c) => {
        const id = `c-${Date.now()}`;
        setOwned((list) => [{ ...c, id, status: 'open' }, ...list]);
        return id;
      },
      closeOwned: (id) => setOwned((list) => list.map((c) => (c.id === id ? { ...c, status: 'closed' } : c))),
      addExpense: (e) =>
        setExp((list) => [{ ...e, id: `e-${Date.now()}`, paidBy: ME, settled: false }, ...list]),
    };
  }, [session, presence, responses, myResponse, mine, owned, exp]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMock() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMock outside MockProvider');
  return v;
}

// أنواع البيانات حسب docs/SPEC.md القسم 8. المرحلة 1 تستخدمها مع بيانات تجريبية.

export type Role = 'member' | 'fund_manager';
export type Member = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  role: Role;
};

export type Treat = 'tea' | 'coffee' | 'dinner' | 'bbq';
export type SessionKind = 'arrived' | 'going';
export type ReplyKind = 'coming' | 'soon' | 'dinner' | 'cant';

export type Session = {
  id: string;
  startedBy: string;
  kind: SessionKind;
  treat: Treat | null;
  atTime: Date | null; // null = الحين
  message?: string;
  createdAt: Date;
};

export type Presence = { memberId: string; arrivedAt: Date; leftAt?: Date };
export type SessionResponse = { memberId: string; response: ReplyKind; respondedAt: Date };

export type ContributionKind = 'monthly' | 'event';
export type ContributionIcon = 'dinner' | 'fire' | 'bbq' | 'other';

/** القطة كما يشوفها العضو: حالته هو فقط. */
export type MyContribution = {
  id: string;
  kind: ContributionKind;
  title: string;
  icon: ContributionIcon;
  amountPerPerson: number;
  createdBy: string;
  dueDate: Date;
  myPaidAt: Date | null;
};

/** صف دفع يشوفه المنشئ فقط (أو مسؤول الصندوق للشهرية). */
export type ParticipantStatus = {
  memberId: string;
  paidAt: Date | null;
  lastRemindedAt: Date | null;
};

/** القطة كما يشوفها منشئها. */
export type OwnedContribution = {
  id: string;
  title: string;
  amountPerPerson: number;
  dueDate: Date;
  status: 'open' | 'closed';
  participants: ParticipantStatus[];
};

export type ExpenseCategory = 'firewood' | 'food' | 'gas' | 'maintenance' | 'other';
export type Expense = {
  id: string;
  paidBy: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  hasReceipt: boolean;
  spentAt: Date;
  settled: boolean;
};

export type AccountSummary = {
  spentThisMonth: number;
  owedToMe: number;
  fundBalance: number;
  settlementDate: Date;
};

export type NotificationPrefKey =
  | 'monthly_due'
  | 'monthly_reminder'
  | 'event_qatta'
  | 'arrival'
  | 'treat'
  | 'settlement';

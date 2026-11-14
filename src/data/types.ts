// أنواع البيانات في التطبيق (camelCase). تقابل جداول supabase/migrations.

export type Role = 'member' | 'fund_manager';
export type Member = {
  id: string;
  displayName: string;
  avatarUrl?: string; // رابط جاهز للعرض
  avatarPath?: string | null; // المسار في التخزين
  role: Role;
};

export type Camp = {
  id: string;
  name: string;
  monthlyAmount: number;
  monthlyDueDay: number;
  centerLat: number | null;
  centerLng: number | null;
  radiusM: number;
};

export type Me = { member: Member & { geofenceEnabled: boolean }; camp: Camp };

export type Treat = 'tea' | 'coffee' | 'dinner' | 'bbq';
export type SessionKind = 'arrived' | 'going';
export type ReplyKind = 'coming' | 'soon' | 'dinner' | 'cant';

export type Session = {
  id: string;
  startedBy: string;
  hostId: string | null;
  kind: SessionKind;
  treat: Treat | null;
  atTime: Date | null; // null = الحين
  message?: string | null;
  createdAt: Date;
};

export type Presence = { memberId: string; arrivedAt: Date };
export type SessionResponse = { memberId: string; response: ReplyKind; respondedAt: Date };
export type Live = { session: Session | null; presence: Presence[]; responses: SessionResponse[] };

export type ContributionKind = 'monthly' | 'event';
export type ContributionIcon = 'dinner' | 'fire' | 'bbq' | 'other';

/** القطة كما يشوفها العضو: حالته هو فقط. */
export type MyContribution = {
  id: string;
  kind: ContributionKind;
  title: string;
  amountPerPerson: number;
  createdBy: string | null;
  dueDate: Date;
  status: 'open' | 'closed';
  myPaidAt: Date | null;
  myReceiptPath: string | null;
};

/** صف دفع يشوفه المنشئ فقط (أو مسؤول الصندوق للشهرية). */
export type ParticipantStatus = {
  memberId: string;
  paidAt: Date | null;
  receiptPath: string | null;
  lastRemindedAt: Date | null;
};

/** القطة كما يشوفها منشئها (أو مسؤول الصندوق للشهرية). */
export type OwnedContribution = {
  id: string;
  kind: ContributionKind;
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
  description: string | null;
  receiptPath: string | null;
  spentAt: Date;
  /** للمصاريف حقتك فقط: null = ينتظر التسوية */
  settledAt: Date | null;
};

export type AccountSummary = {
  spentThisMonth: number;
  owedToMe: number;
  fundBalance: number;
  settlementDate: Date;
};

export type SettlementItem = { id: string; memberId: string; amount: number; settledAt: Date | null };
export type Settlement = { id: string; period: string; items: SettlementItem[] };

export type NotificationPrefKey = 'monthly_due' | 'monthly_reminder' | 'event_qatta' | 'arrival' | 'treat' | 'settlement';
export type Frequency = 'daily' | 'every2' | 'weekly';
export type NotificationPref = { enabled: boolean; frequency?: Frequency | null; onlyMemberIds?: string[] | null };
export type NotificationSettings = {
  enabled: boolean;
  quietEnabled: boolean;
  quietStart: string; // "00:00"
  quietEnd: string; // "07:00"
  prefs: Record<NotificationPrefKey, NotificationPref>;
};

export type CampPatch = Partial<Pick<Camp, 'monthlyAmount' | 'monthlyDueDay' | 'centerLat' | 'centerLng' | 'radiusM'>>;

export type ImageFile = { uri: string; mimeType?: string | null };
export type ReceiptBucket = 'avatars' | 'expense-receipts' | 'payment-receipts';

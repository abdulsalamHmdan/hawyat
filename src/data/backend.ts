import type {
  AccountSummary,
  CampPatch,
  Expense,
  ExpenseCategory,
  ImageFile,
  Live,
  Me,
  Member,
  MyContribution,
  NotificationSettings,
  OwnedContribution,
  ReceiptBucket,
  ReplyKind,
  SessionKind,
  Settlement,
  Treat,
} from './types';

/** كل اللي يحتاجه التطبيق من الخادم. تطبيقين: Supabase، وتجريبي بدون اتصال. */
export interface Backend {
  readonly demo: boolean;

  // الدخول
  getUserId(): Promise<string | null>;
  onAuthChange(cb: (userId: string | null) => void): () => void;
  sendCode(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<void>;
  signOut(): Promise<void>;

  // العضوية
  getMe(): Promise<Me | null>;
  createCamp(campName: string, displayName: string): Promise<void>;
  joinCamp(code: string, displayName: string): Promise<void>;
  updateProfile(p: { displayName?: string; avatar?: ImageFile | null }): Promise<void>;
  getMembers(campId: string): Promise<Member[]>;
  setGeofenceEnabled(enabled: boolean): Promise<void>;

  // مسؤول الصندوق
  getInviteCode(campId: string): Promise<string>;
  regenerateInviteCode(campId: string): Promise<string>;
  updateCamp(campId: string, patch: CampPatch): Promise<void>;
  transferFundManager(memberId: string): Promise<void>;

  // القطة
  getMyContributions(campId: string): Promise<MyContribution[]>;
  getOwnedContributions(campId: string): Promise<OwnedContribution[]>;
  setPaid(contributionId: string, paid: boolean, receipt?: ImageFile | null): Promise<void>;
  createEventContribution(p: {
    campId: string;
    title: string;
    mode: 'per' | 'total';
    amount: number;
    memberIds: string[];
    dueDate: Date;
    includeMe: boolean;
  }): Promise<string>;
  remindUnpaid(contributionId: string): Promise<void>;
  closeContribution(contributionId: string): Promise<void>;

  // المصاريف والتسوية
  getExpenses(campId: string): Promise<Expense[]>;
  addExpense(p: { campId: string; amount: number; category: ExpenseCategory; description: string; receipt?: ImageFile | null }): Promise<void>;
  deleteExpense(id: string): Promise<void>;
  getAccount(campId: string): Promise<AccountSummary>;
  getLatestSettlement(campId: string): Promise<Settlement | null>;
  createSettlement(campId: string): Promise<void>;
  markSettled(itemId: string, settled: boolean): Promise<void>;

  // الحضور والجلسة
  getLive(campId: string): Promise<Live>;
  announce(p: { campId: string; kind: SessionKind; treat: Treat | null; atTime: Date | null; message?: string }): Promise<void>;
  respond(sessionId: string, response: ReplyKind): Promise<void>;
  leave(campId: string): Promise<void>;
  geofenceEvent(campId: string, entered: boolean): Promise<void>;

  // الإشعارات
  getNotificationSettings(memberId: string): Promise<NotificationSettings>;
  saveNotificationSettings(memberId: string, s: NotificationSettings): Promise<void>;
  registerPushToken(memberId: string, token: string): Promise<void>;

  // الصور
  signedUrl(bucket: ReceiptBucket, path: string): Promise<string | null>;
}

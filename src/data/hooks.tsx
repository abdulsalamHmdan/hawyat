import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { backend } from './index';
import type { Me, Member } from './types';

// ───── الدخول ─────
type AuthState = { ready: boolean; userId: string | null };
const AuthCtx = createContext<AuthState>({ ready: false, userId: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [state, setState] = useState<AuthState>({ ready: false, userId: null });
  useEffect(() => {
    let alive = true;
    backend.getUserId().then((userId) => alive && setState({ ready: true, userId }));
    const off = backend.onAuthChange((userId) => {
      setState({ ready: true, userId });
      qc.clear();
    });
    return () => {
      alive = false;
      off();
    };
  }, [qc]);
  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

// ───── القراءة ─────
export function useMe() {
  const { userId } = useAuth();
  return useQuery({ queryKey: ['me', userId], queryFn: () => backend.getMe(), enabled: !!userId, staleTime: 60_000 });
}

/** العضوية الحالية (للشاشات اللي ما تنفتح إلا بعد الانضمام). */
export function useCamp(): Me {
  const me = useMe().data;
  if (!me) throw new Error('useCamp قبل الانضمام');
  return me;
}

export function useMembers() {
  const { camp } = useCamp();
  return useQuery({ queryKey: ['members', camp.id], queryFn: () => backend.getMembers(camp.id), staleTime: 5 * 60_000 });
}

/** دالة ترجع اسم العضو («أنت» لك). */
export function useMemberName() {
  const { member } = useCamp();
  const members = useMembers().data;
  const map = useMemo(() => new Map((members ?? []).map((m) => [m.id, m])), [members]);
  return useCallback(
    (id: string | null | undefined, opts?: { raw?: boolean }) => {
      if (!id) return '';
      if (id === member.id && !opts?.raw) return 'أنت';
      return map.get(id)?.displayName ?? '';
    },
    [map, member.id],
  );
}

export function useMemberMap(): Map<string, Member> {
  const members = useMembers().data;
  return useMemo(() => new Map((members ?? []).map((m) => [m.id, m])), [members]);
}

export function useMyQatta() {
  const { camp } = useCamp();
  return useQuery({ queryKey: ['qatta', 'mine', camp.id], queryFn: () => backend.getMyContributions(camp.id) });
}

export function useOwnedQatta() {
  const { camp } = useCamp();
  return useQuery({ queryKey: ['qatta', 'owned', camp.id], queryFn: () => backend.getOwnedContributions(camp.id) });
}

export function useExpenses() {
  const { camp } = useCamp();
  return useQuery({ queryKey: ['expenses', camp.id], queryFn: () => backend.getExpenses(camp.id) });
}

export function useAccount() {
  const { camp } = useCamp();
  return useQuery({ queryKey: ['account', camp.id], queryFn: () => backend.getAccount(camp.id) });
}

export function useSettlement() {
  const { camp } = useCamp();
  return useQuery({ queryKey: ['settlement', camp.id], queryFn: () => backend.getLatestSettlement(camp.id) });
}

/** الجلسة والحضور: تتحدث كل 20 ثانية والتطبيق مفتوح. */
export function useLive() {
  const { camp } = useCamp();
  return useQuery({ queryKey: ['live', camp.id], queryFn: () => backend.getLive(camp.id), refetchInterval: 20_000 });
}

export function useNotificationSettings() {
  const { member } = useCamp();
  return useQuery({ queryKey: ['notif', member.id], queryFn: () => backend.getNotificationSettings(member.id) });
}

// ───── الكتابة ─────
/** تنفيذ عملية ثم تحديث البيانات المتأثرة. */
export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>, invalidate: QueryKey[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: A) => fn(...args),
    onSettled: () => Promise.all(invalidate.map((k) => qc.invalidateQueries({ queryKey: k }))),
  });
}

/** يحوّل أخطاء الخادم لكلام مفهوم. */
export function errorText(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (/invalid_code/.test(m)) return 'الكود غلط، تأكد منه';
  if (/Token has expired|otp.*(expired|invalid)|invalid.*token/i.test(m)) return 'الرمز غلط أو انتهى، اطلب رمز جديد';
  if (/rate limit|security purposes/i.test(m)) return 'استنى شوي وجرّب مرة ثانية';
  if (/already_member/.test(m)) return 'أنت عضو في مخيم من قبل';
  if (/no_participants/.test(m)) return 'اختر واحد على الأقل معك';
  if (/forbidden/.test(m)) return 'ما عندك صلاحية لهذا';
  if (/network|fetch/i.test(m)) return 'تأكد من الإنترنت وجرّب مرة ثانية';
  return 'صار خطأ، جرّب مرة ثانية';
}

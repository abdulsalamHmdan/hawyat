// على الويب (المعاينة فقط) ما فيه إشعارات.
export async function registerForPush(): Promise<'unavailable'> {
  return 'unavailable';
}
export function usePush(_memberId: string | undefined) {}

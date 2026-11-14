import { Redirect } from 'expo-router';

import { useAuth, useMe } from '@/data/hooks';

/** يوجّه حسب الحالة: ما دخل ← الترحيب، دخل وما انضم ← الاسم والكود، عضو ← الرئيسية. */
export default function Index() {
  const { userId } = useAuth();
  const me = useMe();
  if (!userId) return <Redirect href="/welcome" />;
  if (me.isPending) return null;
  if (!me.data) return <Redirect href="/profile-setup" />;
  return <Redirect href="/home" />;
}

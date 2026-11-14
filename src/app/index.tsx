import { Redirect } from 'expo-router';

// المرحلة 1: نبدأ بشاشة الترحيب دايمًا. في المرحلة 2 نوجّه حسب حالة الدخول.
export default function Index() {
  return <Redirect href="/welcome" />;
}

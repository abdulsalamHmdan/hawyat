import type { Backend } from './backend';
import { createDemoBackend } from './demo-backend';
import { createSupabaseBackend } from './supabase-backend';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

/** لو مفاتيح Supabase موجودة نتصل فيه، وإلا نشتغل بالنسخة التجريبية. */
export const backend: Backend = url && key ? createSupabaseBackend(url, key) : createDemoBackend();

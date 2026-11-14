// طبقة الثيم للتطبيق. المصدر الأساسي design/theme.ts (لا تكرر قيمه هنا).
// هنا فقط القيم الإضافية المأخوذة من ملفات design/screens/*.html (مقاسات المكونات وأنماط نص صغيرة).
import { useColorScheme } from 'react-native';

import { colors, fonts, type, type ThemeColors } from '../../design/theme';

export { colors, fontFiles, fonts, radius, shadow, space, type } from '../../design/theme';
export type { ThemeColors } from '../../design/theme';

/** ألوان إضافية من التصاميم غير موجودة في الرموز: التعتيم خلف النوافذ، خانات بطاقة الجلسة، لون الظل. */
const extraColors = {
  light: { scrim: 'rgba(30, 26, 21, 0.55)', nightRaised: 'rgba(242, 230, 207, 0.08)', shadow: '#2a2118' },
  dark: { scrim: 'rgba(0, 0, 0, 0.6)', nightRaised: 'rgba(242, 230, 207, 0.08)', shadow: '#000000' },
} as const;

export type AppColors = ThemeColors & { scrim: string; nightRaised: string; shadow: string };

export function useColors(): AppColors {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { ...colors[scheme], ...extraColors[scheme] };
}

export function useIsDark() {
  return useColorScheme() === 'dark';
}

/** مقاسات المكونات كما في التصاميم. */
export const size = {
  touch: 44, // أقل ارتفاع لأي شي ينضغط
  button: 48, // الأزرار الأساسية
  buttonLg: 56, // زر «بلّغ الشباب» و«انشر القطة»
  field: 52,
  fieldLg: 60,
  reply: 40, // أزرار الرد (داخل منطقة لمس 44)
  avatar: 52,
  avatarSm: 44,
  iconButton: 48,
  icon: 20,
  iconSm: 15,
  iconHeader: 22,
  iconTab: 24,
  iconTile: 44,
  presence: 168,
  presenceRing: 8,
  presenceDoor: { width: 44, height: 36 },
  presenceDot: 12,
  tabBar: 64,
  tabDot: 9,
  switch: { width: 52, height: 32, knob: 23 },
  progress: 10,
  sheetHandle: { width: 40, height: 5 },
  choice: 76, // بطاقات اختيار العزيمة
  border: 1.5,
  hairline: 1,
  person: 64,
  welcomeMark: 132,
  welcomeWordmark: 180,
  textMax: 260,
  codeCell: 48,
  profilePhoto: 112,
} as const;

/** مسافات إضافية من التصاميم بين القيم الأساسية. */
export const gap = { tight: 6, form: 20 } as const;

/** أنماط نص إضافية من التصاميم، مبنية على نفس الخطوط. */
export const text = {
  ...type,
  small: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 18 },
  smallStrong: { fontFamily: fonts.sans600, fontSize: 13, lineHeight: 18 },
  section: { fontFamily: fonts.sans700, fontSize: 14, lineHeight: 20 },
  linkSm: { fontFamily: fonts.sans600, fontSize: 14, lineHeight: 20 },
  tab: { fontFamily: fonts.sans600, fontSize: 12, lineHeight: 16 },
  tabActive: { fontFamily: fonts.sans700, fontSize: 12, lineHeight: 16 },
  cardTitle: { fontFamily: fonts.display700, fontSize: 18, lineHeight: 26 },
  presence: { fontFamily: fonts.display700, fontSize: 22, lineHeight: 26 },
  sheetTitle: { fontFamily: fonts.display700, fontSize: 26, lineHeight: 34 },
  amountLg: { fontFamily: fonts.display700, fontSize: 40, lineHeight: 44 },
  stat: { fontFamily: fonts.display700, fontSize: 24, lineHeight: 30 },
  avatar: { fontFamily: fonts.display700, fontSize: 20, lineHeight: 26 },
  rowTitle: { fontFamily: fonts.sans600, fontSize: 16, lineHeight: 24 },
  rowSub: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 20 },
  input: { fontFamily: fonts.sans400, fontSize: 16, lineHeight: 22 },
  code: { fontFamily: fonts.display700, fontSize: 28, lineHeight: 34 },
} as const;

export type TextVariant = keyof typeof text;

/** زوايا إضافية من التصاميم (الحقول والشريط المجزأ). */
export const shape = { field: 14, segment: 11, tile: 9 } as const;

export const opacity = { nightMuted: 0.78, soft: 0.85, pressed: 0.7, disabled: 0.45, off: 0.5 } as const;

